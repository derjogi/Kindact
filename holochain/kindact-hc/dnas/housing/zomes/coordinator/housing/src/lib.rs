use hdk::prelude::*;
use housing_integrity::*;
use kindact_base::{validate_jurisdiction, JurisdictionalContext};

const ALL_ISSUES_ANCHOR: &str = "all_housing_issues";
const REGISTRY_ROLE: &str = "global_registry";
const REGISTRY_ZOME: &str = "registry";
const REGISTRY_PUBLISH_FN: &str = "publish_anchor_link";
const CELL_ROLE: &str = "housing";

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

/// Wrapper input that lets the UI attach discovery tags at create time.
/// Tags become `AnchorLinkEntry`s in `global_registry`.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateHousingIssueInput {
    pub issue: HousingIssue,
    pub tags: Vec<String>,
}

/// Mirror of `registry::PublishAnchorLinkInput`. The serde shape must
/// stay in sync.
#[derive(Serialize, Deserialize, Debug, Clone)]
struct PublishAnchorLinkInput {
    anchor_name: String,
    cell_role: String,
    cell_dna_hash: DnaHash,
    issue_id: ActionHash,
}

/// Ensure the "all_housing_issues" anchor exists and return its EntryHash.
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

/// Cross-cell call into `global_registry::publish_anchor_link` for each tag.
fn publish_to_registry(tags: &[String], issue_hash: &ActionHash) -> ExternResult<()> {
    // Stamp the cell's DNA hash so UI subscribers can route the dereference
    // back to the correct local cell (spec 050).
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
pub fn create_housing_issue(input: CreateHousingIssueInput) -> ExternResult<ActionHash> {
    let issue = input.issue;
    if issue.location == "Berlin" {
        let context = JurisdictionalContext {
            location: Some(issue.location.clone()),
            has_geotagged_evidence: issue.has_geotagged_evidence,
        };

        if let Err(e) = validate_jurisdiction(&context, "geotagged_evidence_required") {
            return Err(wasm_error!(WasmErrorInner::Guest(e)));
        }
    }

    let issue_hash = create_entry(EntryTypes::Issue(issue))?;
    let anchor_hash = ensure_all_issues_anchor()?;
    create_link(anchor_hash, issue_hash.clone(), LinkTypes::AllIssues, ())?;
    publish_to_registry(&input.tags, &issue_hash)?;
    Ok(issue_hash)
}

#[hdk_extern]
pub fn challenge_issue_binding(challenge: BindingChallenge) -> ExternResult<ActionHash> {
    let issue_hash = challenge.issue_hash.clone();
    let challenge_hash = create_entry(EntryTypes::Challenge(challenge))?;
    create_link(
        issue_hash,
        challenge_hash.clone(),
        LinkTypes::IssueToChallenge,
        (),
    )?;
    Ok(challenge_hash)
}

/// Return every housing issue published under the cell-wide anchor.
#[hdk_extern]
pub fn get_all_housing_issues(_: ()) -> ExternResult<Vec<(ActionHash, HousingIssue)>> {
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
        let Ok(Some(issue)) = record.entry().to_app_option::<HousingIssue>() else {
            continue;
        };
        out.push((action_hash, issue));
    }
    Ok(out)
}

/// Return every BindingChallenge filed against the given housing issue.
#[hdk_extern]
pub fn get_challenges_for_issue(
    issue_hash: ActionHash,
) -> ExternResult<Vec<(ActionHash, BindingChallenge)>> {
    let links = get_links(
        LinkQuery::try_new(issue_hash, LinkTypes::IssueToChallenge)?,
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
        let Ok(Some(challenge)) = record.entry().to_app_option::<BindingChallenge>() else {
            continue;
        };
        out.push((action_hash, challenge));
    }
    Ok(out)
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {}

#[hdk_extern(infallible)]
pub fn post_commit(_committed_actions: Vec<SignedActionHashed>) {}
