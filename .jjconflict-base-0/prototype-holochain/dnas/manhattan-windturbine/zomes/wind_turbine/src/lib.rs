use hdk::prelude::*;
use kindact_base::IssueStatus;

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Issue(IssueEntry),
    Comment(CommentEntry),
}

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

#[hdk_extern]
pub fn create_issue(issue: IssueEntry) -> ExternResult<ActionHash> {
    let action_hash = create_entry(EntryTypes::Issue(issue))?;

    // Stub: Publish anchor link to global registry would go here
    // In a real scenario, this would be a call_remote or similar mechanism

    Ok(action_hash)
}

#[hdk_extern]
pub fn post_comment(comment: CommentEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Comment(comment))
}
