use hdk::prelude::*;
use registry_integrity::*;

const ALL_CELLS_ANCHOR: &str = "all_cells";

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

// -----------------------------------------------------------------------------
// Cell directory (spec 050)
//
// Every clone of a Kindact role registers itself here so other agents can
// discover and join it.
// -----------------------------------------------------------------------------

/// Wire format for `register_cell`. The coordinator stamps `creator` and
/// `status` itself so callers can't lie about either.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RegisterCellInput {
    pub name: String,
    pub role_name: String,
    pub network_seed: String,
    pub dna_hash: DnaHash,
}

/// Ensure the `all_cells` directory anchor exists and return its EntryHash.
fn ensure_all_cells_anchor() -> ExternResult<EntryHash> {
    let anchor = AnchorEntry {
        name: ALL_CELLS_ANCHOR.to_string(),
    };
    let anchor_hash = hash_entry(&anchor)?;
    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor))?;
    }
    Ok(anchor_hash)
}

/// Register a (newly-created or already-joined) cell in the global cell
/// directory. Idempotent: if a cell with the same DNA hash is already in
/// the directory, returns its existing action hash.
#[hdk_extern]
pub fn register_cell(input: RegisterCellInput) -> ExternResult<ActionHash> {
    let anchor_hash = ensure_all_cells_anchor()?;

    // Idempotency: scan existing entries for a matching DNA hash.
    for (existing_hash, cell) in list_all_cells(&anchor_hash)? {
        if cell.dna_hash == input.dna_hash {
            return Ok(existing_hash);
        }
    }

    let creator = agent_info()?.agent_initial_pubkey;
    let cell = CellEntry {
        name: input.name,
        role_name: input.role_name,
        network_seed: input.network_seed,
        dna_hash: input.dna_hash,
        creator,
        status: "active".to_string(),
    };
    let action_hash = create_entry(EntryTypes::Cell(cell))?;
    create_link(anchor_hash, action_hash.clone(), LinkTypes::AllCells, ())?;
    Ok(action_hash)
}

fn list_all_cells(
    anchor_hash: &EntryHash,
) -> ExternResult<Vec<(ActionHash, CellEntry)>> {
    let links = get_links(
        LinkQuery::try_new(anchor_hash.clone(), LinkTypes::AllCells)?,
        GetStrategy::Network,
    )?;
    let mut out = Vec::with_capacity(links.len());
    // Holochain doesn't give us global write-uniqueness, so two agents that
    // independently register the same clone before seeing each other can
    // produce duplicate `CellEntry`s. Read-side dedupe by `dna_hash` keeps
    // the UI honest. First-seen wins (links are returned in deterministic
    // DHT order).
    let mut seen: std::collections::HashSet<DnaHash> =
        std::collections::HashSet::new();
    for link in links {
        let Ok(action_hash) = ActionHash::try_from(link.target) else {
            continue;
        };
        let Some(record) = get(action_hash.clone(), GetOptions::default())? else {
            continue;
        };
        let Ok(Some(cell)) = record.entry().to_app_option::<CellEntry>() else {
            continue;
        };
        if seen.insert(cell.dna_hash.clone()) {
            out.push((action_hash, cell));
        }
    }
    Ok(out)
}

/// Return every registered cell in the directory.
#[hdk_extern]
pub fn get_all_cells(_: ()) -> ExternResult<Vec<(ActionHash, CellEntry)>> {
    let anchor_hash = ensure_all_cells_anchor()?;
    list_all_cells(&anchor_hash)
}

// -----------------------------------------------------------------------------
// Anchors & anchor links
// -----------------------------------------------------------------------------

/// Wire format for `publish_anchor_link`. Lets cells construct the payload
/// without depending on this DNA's integrity-zome types directly.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PublishAnchorLinkInput {
    pub anchor_name: String,
    pub cell_role: String,
    pub cell_dna_hash: DnaHash,
    pub issue_id: ActionHash,
}

#[hdk_extern]
pub fn publish_anchor_link(input: PublishAnchorLinkInput) -> ExternResult<ActionHash> {
    let anchor_entry = AnchorEntry {
        name: input.anchor_name.clone(),
    };
    let anchor_hash = hash_entry(EntryTypes::Anchor(anchor_entry.clone()))?;

    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor_entry))?;
    }

    let link_entry = AnchorLinkEntry {
        anchor_name: input.anchor_name.clone(),
        cell_role: input.cell_role.clone(),
        cell_dna_hash: input.cell_dna_hash,
        issue_id: input.issue_id,
    };
    let action_hash = create_entry(EntryTypes::AnchorLink(link_entry))?;

    // Link target is the AnchorLinkEntry's own action hash so consumers can
    // recover the full entry (including `cell_dna_hash`) with one `get`.
    // Tag carries the cell_role as a cheap routing-hint filter.
    create_link(
        anchor_hash,
        action_hash.clone(),
        LinkTypes::AnchorToIssue,
        LinkTag::new(input.cell_role.as_bytes().to_vec()),
    )?;

    Ok(action_hash)
}

/// Return every `AnchorLink` filed under the given anchor name. Each entry
/// carries the `cell_dna_hash` the caller should route to.
#[hdk_extern]
pub fn get_anchor_links_for_anchor(
    anchor_name: String,
) -> ExternResult<Vec<AnchorLinkEntry>> {
    let anchor_hash = hash_entry(EntryTypes::Anchor(AnchorEntry {
        name: anchor_name.clone(),
    }))?;
    let links = get_links(
        LinkQuery::try_new(anchor_hash, LinkTypes::AnchorToIssue)?,
        GetStrategy::Network,
    )?;

    let mut out = Vec::with_capacity(links.len());
    for link in links {
        let Ok(action_hash) = ActionHash::try_from(link.target) else {
            continue;
        };
        let Some(record) = get(action_hash, GetOptions::default())? else {
            continue;
        };
        let Ok(Some(entry)) = record.entry().to_app_option::<AnchorLinkEntry>() else {
            continue;
        };
        out.push(entry);
    }

    Ok(out)
}

/// Legacy / 048-compatible shortcut: only returns the issue action hashes.
#[hdk_extern]
pub fn get_issues_for_anchor(anchor_name: String) -> ExternResult<Vec<ActionHash>> {
    Ok(get_anchor_links_for_anchor(anchor_name)?
        .into_iter()
        .map(|l| l.issue_id)
        .collect())
}

// -----------------------------------------------------------------------------
// Subscriptions (per-agent, stored on the agent's own source chain)
//
// We deliberately query the whole chain and filter in app code — keeps the
// implementation small and avoids hand-rolling the `ScopedEntryDefIndex` for
// `ChainQueryFilter::entry_type`. The prototype chain stays small enough.
// -----------------------------------------------------------------------------

fn current_agent_subscriptions() -> ExternResult<Vec<(ActionHash, SubscriptionEntry)>> {
    let agent = agent_info()?.agent_initial_pubkey;
    let records = query(ChainQueryFilter::new().include_entries(true))?;

    // Collect every Delete action's `deletes_address` so we can filter out
    // create actions whose entries have since been deleted. `query()` returns
    // the local source chain so we have the full delete history to hand.
    let mut deleted_actions: std::collections::HashSet<ActionHash> =
        std::collections::HashSet::new();
    for record in records.iter() {
        if let Action::Delete(delete) = record.action() {
            deleted_actions.insert(delete.deletes_address.clone());
        }
    }

    let mut out = Vec::new();
    for record in records {
        let action_hash = record.action_address().clone();
        if deleted_actions.contains(&action_hash) {
            continue;
        }
        let Ok(Some(sub)) = record.entry().to_app_option::<SubscriptionEntry>() else {
            continue;
        };
        if sub.subscriber != agent {
            continue;
        }
        out.push((action_hash, sub));
    }
    Ok(out)
}

/// Return every active (non-deleted) subscription anchor name for the
/// current agent.
#[hdk_extern]
pub fn get_subscriptions(_: ()) -> ExternResult<Vec<String>> {
    let mut out = Vec::new();
    for (_, sub) in current_agent_subscriptions()? {
        if !out.contains(&sub.anchor_name) {
            out.push(sub.anchor_name);
        }
    }
    Ok(out)
}

/// Idempotently record a subscription on the current agent's source chain.
/// If the agent is already subscribed to `anchor_name`, this is a no-op and
/// returns the existing action hash.
#[hdk_extern]
pub fn subscribe(anchor_name: String) -> ExternResult<ActionHash> {
    for (existing_hash, sub) in current_agent_subscriptions()? {
        if sub.anchor_name == anchor_name {
            return Ok(existing_hash);
        }
    }

    let agent = agent_info()?.agent_initial_pubkey;
    create_entry(EntryTypes::Subscription(SubscriptionEntry {
        anchor_name,
        subscriber: agent,
    }))
}

/// Delete every subscription entry for the given anchor on the current
/// agent's source chain.
#[hdk_extern]
pub fn unsubscribe(anchor_name: String) -> ExternResult<()> {
    for (action_hash, sub) in current_agent_subscriptions()? {
        if sub.anchor_name == anchor_name {
            delete_entry(action_hash)?;
        }
    }
    Ok(())
}

// -----------------------------------------------------------------------------
// Jurisdictional claims (unchanged from 048)
// -----------------------------------------------------------------------------

#[hdk_extern]
pub fn create_jurisdictional_claim(
    claim: JurisdictionalClaimEntry,
) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::JurisdictionalClaim(claim))
}

#[hdk_extern]
pub fn get_jurisdictional_claims(_: ()) -> ExternResult<Vec<JurisdictionalClaimEntry>> {
    // Stub: in production we'd query by scope. For the prototype, return empty.
    Ok(vec![])
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {}

#[hdk_extern(infallible)]
pub fn post_commit(_committed_actions: Vec<SignedActionHashed>) {}
