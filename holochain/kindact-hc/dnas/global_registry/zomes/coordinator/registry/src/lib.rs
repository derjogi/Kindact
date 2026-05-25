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

#[hdk_extern]
pub fn publish_anchor_link(link: AnchorLinkEntry) -> ExternResult<ActionHash> {
    let anchor_entry = AnchorEntry {
        name: link.anchor_name.clone(),
    };
    let anchor_hash = hash_entry(EntryTypes::Anchor(anchor_entry.clone()))?;

    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor_entry))?;
    }

    let action_hash = create_entry(EntryTypes::AnchorLink(link.clone()))?;
    create_link(
        anchor_hash,
        link.issue_id,
        LinkTypes::AnchorToIssue,
        (),
    )?;

    Ok(action_hash)
}

#[hdk_extern]
pub fn get_issues_for_anchor(anchor_name: String) -> ExternResult<Vec<ActionHash>> {
    let anchor_hash = hash_entry(EntryTypes::Anchor(AnchorEntry { name: anchor_name }))?;
    let links = get_links(
        LinkQuery::try_new(anchor_hash, LinkTypes::AnchorToIssue)?,
        GetStrategy::Network,
    )?;

    let issue_hashes = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(issue_hashes)
}

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
