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

pub fn validate_transition(from: &IssueStatus, to: &IssueStatus) -> bool {
    match (from, to) {
        (IssueStatus::Draft, IssueStatus::Deliberating) => true,
        (IssueStatus::Deliberating, IssueStatus::VoteReady) => true,
        (IssueStatus::VoteReady, IssueStatus::Adopted) => true,
        (IssueStatus::Adopted, IssueStatus::Implementing) => true,
        (IssueStatus::Implementing, IssueStatus::Completed) => true,
        (IssueStatus::Completed, IssueStatus::Archived) => true,
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transitions() {
        assert!(validate_transition(&IssueStatus::Draft, &IssueStatus::Deliberating));
        assert!(validate_transition(&IssueStatus::Deliberating, &IssueStatus::VoteReady));
        assert!(!validate_transition(&IssueStatus::Draft, &IssueStatus::VoteReady));
    }
}
