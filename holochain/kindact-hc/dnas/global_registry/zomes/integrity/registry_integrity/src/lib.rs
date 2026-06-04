use hdi::prelude::*;

/// Directory record for a Kindact cell. In the prototype every entry is a
/// Tier-3 user-created community cell (see spec 050); production tiers from
/// spec 030 are not modelled yet.
#[hdk_entry_helper]
#[derive(Clone)]
pub struct CellEntry {
    /// Human-readable label, e.g. `"Brooklyn Cyclists"`.
    pub name: String,
    /// Role to clone under in `workdir/happ.yaml`, e.g. `"manhattan_windturbine"`.
    pub role_name: String,
    /// Disambiguator handed to `createCloneCell` — peers that pick the same
    /// seed end up on the same DHT.
    pub network_seed: String,
    /// Stable cross-agent identifier. Equal to the cloned cell's DNA hash.
    pub dna_hash: DnaHash,
    /// Who first registered the cell.
    pub creator: AgentPubKey,
    /// Lifecycle marker. The prototype only writes `"active"`.
    pub status: String,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorEntry {
    pub name: String,
}

/// A cross-cell discovery pointer: "this issue, in this cell role, in this
/// specific DHT, is filed under this anchor."
///
/// `cell_role` is the role-name routing hint (matches `happ.yaml`).
/// `cell_dna_hash` disambiguates clones — multiple cells share a role but
/// each clone has a unique DNA hash.
#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorLinkEntry {
    pub anchor_name: String,
    pub cell_role: String,
    pub cell_dna_hash: DnaHash,
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
    pub topic_tags: Vec<String>,       // e.g., ["#housing"]
    pub decision_engine: String,       // e.g., "consensus_neighbor_agreement"
    pub verification_tier: String,     // e.g., "geotagged_evidence_required"
}

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Cell(CellEntry),
    Anchor(AnchorEntry),
    AnchorLink(AnchorLinkEntry),
    Subscription(SubscriptionEntry),
    JurisdictionalClaim(JurisdictionalClaimEntry),
}

#[hdk_link_types]
pub enum LinkTypes {
    AnchorToIssue,
    /// Anchor → CellEntry. Lets every agent enumerate the cell directory.
    AllCells,
}

#[hdk_extern]
pub fn genesis_self_check(
    _data: GenesisSelfCheckData,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}

// Prototype: permissive validation. Tighten when porting validation logic.
#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
