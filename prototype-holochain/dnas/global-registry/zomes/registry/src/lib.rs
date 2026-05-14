use hdk::prelude::*;

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Cell(CellEntry),
    Anchor(AnchorEntry),
    AnchorLink(AnchorLinkEntry),
    Subscription(SubscriptionEntry),
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct CellEntry {
    pub dna_hash: DnaHash,
    pub status: String, // e.g., "active", "archived"
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorEntry {
    pub name: String, // e.g., "#wind-power"
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

#[hdk_extern]
pub fn register_cell(cell: CellEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Cell(cell))
}

#[hdk_extern]
pub fn publish_anchor_link(link: AnchorLinkEntry) -> ExternResult<ActionHash> {
    let anchor_entry = AnchorEntry { name: link.anchor_name.clone() };
    let anchor_hash = hash_entry(EntryTypes::Anchor(anchor_entry.clone()))?;

    // 1. Ensure anchor exists (create if not)
    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor_entry))?;
    }

    // 2. Create the AnchorLink entry
    let action_hash = create_entry(EntryTypes::AnchorLink(link.clone()))?;

    // 3. Link from Anchor to the specific Issue for discovery
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

#[hdk_link_types]
pub enum LinkTypes {
    AnchorToIssue,
}
