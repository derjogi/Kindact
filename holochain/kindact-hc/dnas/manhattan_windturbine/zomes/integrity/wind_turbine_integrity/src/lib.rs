use hdi::prelude::*;
use kindact_base::IssueStatus;

#[hdk_entry_helper]
#[derive(Clone)]
pub struct IssueEntry {
    pub title: String,
    pub description: String,
    pub status: IssueStatus,
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct CommentEntry {
    pub issue_id: ActionHash,
    pub author: AgentPubKey,
    pub content: String,
}

/// Lightweight anchor entry used as the link base for `AllIssues`.
/// Mirrors the `AnchorEntry` pattern from `registry_integrity` so all agents
/// can deterministically hash to the same DHT location.
#[hdk_entry_helper]
#[derive(Clone)]
pub struct AnchorEntry {
    pub name: String,
}

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Issue(IssueEntry),
    Comment(CommentEntry),
    Anchor(AnchorEntry),
}

#[hdk_link_types]
pub enum LinkTypes {
    /// Anchor → issue. Lets any agent enumerate every issue in the cell.
    AllIssues,
    /// Issue → comment. Lets the UI fetch all comments for one issue.
    IssueToComment,
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

// Prototype: permissive validation. Tighten when porting state-transition checks.
#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
