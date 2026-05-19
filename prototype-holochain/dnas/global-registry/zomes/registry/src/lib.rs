use hdk::prelude::*;

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Cell(CellEntry),
    Anchor(AnchorEntry),
    AnchorLink(AnchorLinkEntry),
    Subscription(SubscriptionEntry),
    JurisdictionalClaim(JurisdictionalClaimEntry),
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct CellEntry {
    pub dna_hash: DnaHash,
    pub status: String,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorEntry {
    pub name: String,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorLinkEntry {
    pub anchor_name: String,
    pub cell_id: ActionHash,
    pub issue_id: ActionHash,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct SubscriptionEntry {
    pub anchor_name: String,
    pub subscriber: AgentPubKey,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct JurisdictionalClaimEntry {
    pub claim_id: String,
    pub scope_geographic: Vec<String>, // e.g., ["h3:881f1d4895fffff"]
    pub topic_tags: Vec<String>,      // e.g., ["#housing"]
    pub decision_engine: String,      // e.g., "consensus_neighbor_agreement"
    pub verification_tier: String,    // e.g., "geotagged_evidence_required"
}

#[hdk_extern]
pub fn register_cell(cell: CellEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Cell(cell))
}

#[hdk_extern]
pub fn publish_anchor_link(link: AnchorLinkEntry) -> ExternResult<ActionHash> {
    let anchor_entry = AnchorEntry { name: link.anchor_name.clone() };
    let anchor_hash = hash_entry(EntryTypes::Anchor(anchor_entry.clone()))?;

    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor_entry))?;
    }

    let action_hash = create_entry(EntryTypes::AnchorLink(link.clone()))?;
    create_link(anchor_hash, link.issue_id, LinkTypes::AnchorToIssue, ())?;

    Ok(action_hash)
}

#[hdk_extern]
pub fn get_issues_for_anchor(anchor_name: String) -> ExternResult<Vec<ActionHash>> {
    let anchor_hash = hash_entry(EntryTypes::Anchor(AnchorEntry { name: anchor_name }))?;
    let links = get_links(GetLinksInputBuilder::try_new(anchor_hash, LinkTypes::AnchorToIssue)?.build())?;

    let issue_hashes = links.into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(issue_hashes)
}

#[hdk_extern]
pub fn create_jurisdictional_claim(claim: JurisdictionalClaimEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::JurisdictionalClaim(claim))
}

#[hdk_extern]
pub fn get_jurisdictional_claims(_: ()) -> ExternResult<Vec<JurisdictionalClaimEntry>> {
    // In a real scenario, we'd query by scope. For the prototype, return all.
    // This is a stub for cross-cell validation.
    Ok(vec![])
}

#[hdk_link_types]
pub enum LinkTypes {
    AnchorToIssue,
}
