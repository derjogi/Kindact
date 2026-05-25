use hdk::prelude::*;
use wind_turbine_integrity::*;

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
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
    // Stub: a real implementation would `call` into the registry cell.
    Ok(DiscoveryResult {
        anchor_name,
        issue_hashes: vec![],
    })
}

#[hdk_extern]
pub fn grant_guest_access(_issue_hash: ActionHash) -> ExternResult<CapSecret> {
    let secret = generate_cap_secret()?;

    let mut functions: HashSet<GrantedFunction> = HashSet::new();
    functions.insert((zome_info()?.name, "post_comment".into()));

    create_cap_grant(CapGrantEntry {
        tag: "guest-access".into(),
        access: CapAccess::Transferable { secret },
        functions: GrantedFunctions::Listed(functions),
    })?;

    Ok(secret)
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {}

#[hdk_extern(infallible)]
pub fn post_commit(_committed_actions: Vec<SignedActionHashed>) {}
