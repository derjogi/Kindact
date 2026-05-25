use hdk::prelude::*;
use housing_integrity::*;
use kindact_base::{validate_jurisdiction, JurisdictionalContext};

#[hdk_extern]
pub fn init() -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
pub fn create_housing_issue(issue: HousingIssue) -> ExternResult<ActionHash> {
    if issue.location == "Berlin" {
        let context = JurisdictionalContext {
            location: Some(issue.location.clone()),
            has_geotagged_evidence: issue.has_geotagged_evidence,
        };

        if let Err(e) = validate_jurisdiction(&context, "geotagged_evidence_required") {
            return Err(wasm_error!(WasmErrorInner::Guest(e)));
        }
    }

    create_entry(EntryTypes::Issue(issue))
}

#[hdk_extern]
pub fn challenge_issue_binding(challenge: BindingChallenge) -> ExternResult<ActionHash> {
    // In a real scenario, this would trigger a status change of the Issue to "Challenged".
    create_entry(EntryTypes::Challenge(challenge))
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Signal {}

#[hdk_extern(infallible)]
pub fn post_commit(_committed_actions: Vec<SignedActionHashed>) {}
