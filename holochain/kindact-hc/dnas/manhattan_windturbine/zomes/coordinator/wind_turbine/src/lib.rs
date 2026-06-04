use hdk::prelude::*;
use wind_turbine_integrity::*;

const ALL_ISSUES_ANCHOR: &str = "all_issues";
const REGISTRY_ROLE: &str = "global_registry";
const REGISTRY_ZOME: &str = "registry";
const REGISTRY_PUBLISH_FN: &str = "publish_anchor_link";
const CELL_ROLE: &str = "manhattan_windturbine";

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DiscoveryResult {
    pub anchor_name: String,
    pub issue_hashes: Vec<ActionHash>,
}

/// Wrapper input that lets the UI attach discovery tags at create time.
/// Tags become `AnchorLinkEntry`s in `global_registry`, so other agents
/// subscribed to any of these tags will discover the new issue.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateIssueInput {
    pub issue: IssueEntry,
    pub tags: Vec<String>,
}

/// Mirror of `registry::PublishAnchorLinkInput`. Duplicated here to avoid
/// cross-DNA Rust dependency. The serde shape must stay in sync.
#[derive(Serialize, Deserialize, Debug, Clone)]
struct PublishAnchorLinkInput {
    anchor_name: String,
    cell_role: String,
    cell_dna_hash: DnaHash,
    issue_id: ActionHash,
}

/// Ensure the "all_issues" anchor exists and return its EntryHash.
fn ensure_all_issues_anchor() -> ExternResult<EntryHash> {
    let anchor = AnchorEntry {
        name: ALL_ISSUES_ANCHOR.to_string(),
    };
    let anchor_hash = hash_entry(&anchor)?;
    if get(anchor_hash.clone(), GetOptions::default())?.is_none() {
        create_entry(EntryTypes::Anchor(anchor))?;
    }
    Ok(anchor_hash)
}

/// Cross-cell call into `global_registry::publish_anchor_link` for each tag,
/// so subscribers to any of those anchors will discover the issue.
fn publish_to_registry(tags: &[String], issue_hash: &ActionHash) -> ExternResult<()> {
    // `dna_info().hash` is stable across every agent that joined this clone
    // (same DNA + same modifiers ⇒ same hash). The UI uses it to route the
    // dereference to the correct local cell.
    let cell_dna_hash = dna_info()?.hash;
    for tag in tags {
        let trimmed = tag.trim();
        if trimmed.is_empty() {
            continue;
        }
        let payload = PublishAnchorLinkInput {
            anchor_name: trimmed.to_string(),
            cell_role: CELL_ROLE.to_string(),
            cell_dna_hash: cell_dna_hash.clone(),
            issue_id: issue_hash.clone(),
        };
        let response = call(
            CallTargetCell::OtherRole(REGISTRY_ROLE.to_string()),
            REGISTRY_ZOME,
            REGISTRY_PUBLISH_FN.into(),
            None,
            payload,
        )?;
        if !matches!(response, ZomeCallResponse::Ok(_)) {
            return Err(wasm_error!(WasmErrorInner::Guest(format!(
                "publish_anchor_link rejected for tag {trimmed}: {response:?}"
            ))));
        }
    }
    Ok(())
}

#[hdk_extern]
pub fn create_issue(input: CreateIssueInput) -> ExternResult<ActionHash> {
    let issue_hash = create_entry(EntryTypes::Issue(input.issue))?;
    let anchor_hash = ensure_all_issues_anchor()?;
    create_link(anchor_hash, issue_hash.clone(), LinkTypes::AllIssues, ())?;
    publish_to_registry(&input.tags, &issue_hash)?;
    Ok(issue_hash)
}

#[hdk_extern]
pub fn post_comment(comment: CommentEntry) -> ExternResult<ActionHash> {
    let issue_id = comment.issue_id.clone();
    let comment_hash = create_entry(EntryTypes::Comment(comment))?;
    create_link(
        issue_id,
        comment_hash.clone(),
        LinkTypes::IssueToComment,
        (),
    )?;
    Ok(comment_hash)
}

/// Return every issue published under the cell-wide "all_issues" anchor.
#[hdk_extern]
pub fn get_all_issues(_: ()) -> ExternResult<Vec<(ActionHash, IssueEntry)>> {
    let anchor_hash = hash_entry(&AnchorEntry {
        name: ALL_ISSUES_ANCHOR.to_string(),
    })?;
    let links = get_links(
        LinkQuery::try_new(anchor_hash, LinkTypes::AllIssues)?,
        GetStrategy::Network,
    )?;

    let mut out = Vec::with_capacity(links.len());
    for link in links {
        let Ok(action_hash) = ActionHash::try_from(link.target) else {
            continue;
        };
        let Some(record) = get(action_hash.clone(), GetOptions::default())? else {
            continue;
        };
        let Ok(Some(issue)) = record.entry().to_app_option::<IssueEntry>() else {
            continue;
        };
        out.push((action_hash, issue));
    }
    Ok(out)
}

/// Return every comment for a given issue (by ActionHash of the Issue).
#[hdk_extern]
pub fn get_comments_for_issue(
    issue_hash: ActionHash,
) -> ExternResult<Vec<(ActionHash, CommentEntry)>> {
    let links = get_links(
        LinkQuery::try_new(issue_hash, LinkTypes::IssueToComment)?,
        GetStrategy::Network,
    )?;

    let mut out = Vec::with_capacity(links.len());
    for link in links {
        let Ok(action_hash) = ActionHash::try_from(link.target) else {
            continue;
        };
        let Some(record) = get(action_hash.clone(), GetOptions::default())? else {
            continue;
        };
        let Ok(Some(comment)) = record.entry().to_app_option::<CommentEntry>() else {
            continue;
        };
        out.push((action_hash, comment));
    }
    Ok(out)
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
