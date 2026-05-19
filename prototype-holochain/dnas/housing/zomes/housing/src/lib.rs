use hdk::prelude::*;
use kindact_base::{IssueStatus, JurisdictionalContext, validate_jurisdiction};

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Issue(HousingIssue),
    Challenge(BindingChallenge),
}

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
    // In a real scenario, this would trigger a status change of the Issue to "Challenged"
    create_entry(EntryTypes::Challenge(challenge))
}

#[hdk_extern]
pub fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
