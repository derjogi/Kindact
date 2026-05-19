use hdk::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub enum IssueStatus {
    Draft,
    Deliberating,
    VoteReady,
    Adopted,
    Implementing,
    Completed,
    Archived,
    Challenged, // Phase 2: Added Challenged state
}

#[hdk_entry_helper]
#[derive(Clone)]
pub struct ModuleSlot(pub String);

#[hdk_entry_helper]
#[derive(Clone)]
pub struct ModuleManifest {
    pub slot: ModuleSlot,
    pub zome_name: String,
    pub contract_address: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JurisdictionalContext {
    pub location: Option<String>,
    pub has_geotagged_evidence: bool,
}

pub fn validate_transition(from: &IssueStatus, to: &IssueStatus) -> bool {
    match (from, to) {
        (IssueStatus::Draft, IssueStatus::Deliberating) => true,
        (IssueStatus::Deliberating, IssueStatus::VoteReady) => true,
        (IssueStatus::VoteReady, IssueStatus::Adopted) => true,
        (IssueStatus::Adopted, IssueStatus::Implementing) => true,
        (IssueStatus::Implementing, IssueStatus::Completed) => true,
        (IssueStatus::Completed, IssueStatus::Archived) => true,
        (_, IssueStatus::Challenged) => true, // Any state can be challenged
        (IssueStatus::Challenged, _) => true, // Can transition out of challenged if resolved
        _ => false,
    }
}

/// Phase 2: Jurisdictional validation logic
pub fn validate_jurisdiction(
    context: &JurisdictionalContext,
    required_tier: &str,
) -> Result<(), String> {
    if required_tier == "geotagged_evidence_required" && !context.has_geotagged_evidence {
        return Err("Geotagged evidence required for this jurisdiction".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transitions() {
        assert!(validate_transition(&IssueStatus::Draft, &IssueStatus::Deliberating));
        assert!(validate_transition(&IssueStatus::Deliberating, &IssueStatus::Challenged));
    }
}
