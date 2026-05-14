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
    pub cell_id: EntryHash,
    pub issue_id: EntryHash,
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
    create_entry(EntryTypes::AnchorLink(link))
}
