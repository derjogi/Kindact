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

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Issue(HousingIssue),
    Challenge(BindingChallenge),
}

#[hdk_link_types]
pub enum LinkTypes {
    // Placeholder for future link types
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
