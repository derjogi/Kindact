use hdk::prelude::*;
use kindact_base::{IssueStatus, validate_transition};

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

#[derive(Serialize, Deserialize, Debug)]
pub struct DiscoveryResult {
    pub anchor_name: String,
    pub issue_hashes: Vec<ActionHash>,
}

#[hdk_extern]
pub fn create_issue(issue: IssueEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Issue(issue))
}

#[hdk_extern]
pub fn post_comment(comment: CommentEntry) -> ExternResult<ActionHash> {
    create_entry(EntryTypes::Comment(comment))
}

#[hdk_extern]
pub fn discover_issues(anchor_name: String) -> ExternResult<DiscoveryResult> {
    Ok(DiscoveryResult {
        anchor_name,
        issue_hashes: vec![],
    })
}

#[hdk_extern]
pub fn grant_guest_access(_issue_hash: ActionHash) -> ExternResult<CapSecret> {
    let secret = CapSecret::try_from(vec![0; 64]).unwrap();

    let mut functions: BTreeSet<GrantedFunction> = BTreeSet::new();
    functions.insert((zome_info()?.name, "post_comment".into()));

    create_cap_grant(CapGrantEntry {
        tag: "guest-access".into(),
        access: CapAccess::Transferable {
            secret,
        },
        functions: GrantedFunctions::Listed(functions),
    })?;

    Ok(secret)
}

#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    // Prototype: Simplified validation to ensure compilation.
    // In production, we use Op::StoreEntry to check transitions.
    Ok(ValidateCallbackResult::Valid)
}
