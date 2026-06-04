use hdi::prelude::*;
use kindact_base::IssueStatus;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct HousingIssue {
    pub title: String,
    pub location: String,
    pub status: IssueStatus,
    pub has_geotagged_evidence: bool,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct BindingChallenge {
    pub issue_hash: ActionHash,
    pub reason: String,
}

/// Lightweight anchor entry used as the link base for `AllIssues`.
/// Mirrors the `AnchorEntry` pattern from `registry_integrity`.
#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorEntry {
    pub name: String,
}

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Issue(HousingIssue),
    Challenge(BindingChallenge),
    Anchor(AnchorEntry),
}

#[hdk_link_types]
pub enum LinkTypes {
    /// Anchor → housing issue. Lets any agent enumerate all housing issues.
    AllIssues,
    /// Issue → binding challenge. Lets the UI derive "Challenged" status
    /// from the existence of any challenge link.
    IssueToChallenge,
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

// Prototype: permissive validation. Jurisdictional checks happen in the
// coordinator extern for now; tighten here once the port is stable.
#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
