use hdk::prelude::*;
use registry_integrity::*;

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
pub fn register_cell(cell: CellEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Cell(cell))
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
        issue_id: input.issue_id.clone(),
    };
    let action_hash = create_entry(EntryTypes::AnchorLink(link_entry))?;

    // Encode the cell_role into the link tag so consumers can route the
    // dereference without an extra `get` per link.
    create_link(
        anchor_hash,
        input.issue_id,
        LinkTypes::AnchorToIssue,
        LinkTag::new(input.cell_role.as_bytes().to_vec()),
    )?;

    Ok(action_hash)
}

/// Return every `AnchorLink` filed under the given anchor name.
/// Each entry tells the caller which cell role to dereference into.
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
        let Ok(issue_id) = ActionHash::try_from(link.target) else {
            continue;
        };
        // Decode the cell_role from the link tag (cheap path).
        let Ok(cell_role) = String::from_utf8(link.tag.0) else {
            continue;
        };
        if cell_role.is_empty() {
            continue;
        }
        out.push(AnchorLinkEntry {
            anchor_name: anchor_name.clone(),
            cell_role,
            issue_id,
        });
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
