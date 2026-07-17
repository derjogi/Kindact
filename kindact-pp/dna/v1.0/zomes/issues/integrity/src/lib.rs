//! Kindact issues integrity zome (kindact_v1_0).
//!
//! Defines the Kindact data model and validation:
//!   - `Issue`   — a deliberation item with tags
//!   - `Comment` — a comment attached to an issue
//!   - `Vote`    — a binary approval vote (schema only in this phase; the
//!                 coordinator/vote flow is wired up in a later phase)
//!   - `Flag`    — community moderation flag on an issue
//!   - `MigratedPoll` / `EncryptedEntry` — infrastructure carried forward
//!     from the ProofPoll fork (migration + encrypted private data). Kept so
//!     the schema stays stable for future additive DNA versions.
//!
//! ## For forking developers
//!
//! When creating a new DNA version:
//!   1. Copy this directory to the new version
//!   2. Add new entry types to the `EntryTypes` enum (append — never reorder,
//!      the canonical backup classifier depends on the entry index order)
//!   3. Keep `MigratedPoll` and `MigrationIndex` — they power the migration system
//!   4. Update `network_seed` in `dna.yaml` to create a new DHT

use hdi::prelude::*;

// ── Entry types ────────────────────────────────────────────────────────

/// A deliberation item: a titled, described topic with optional tags.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Issue {
    pub title: String,
    pub description: String,
    pub tags: Vec<String>,
    pub created_at: i64,
}

/// A comment attached to an issue.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Comment {
    pub issue_action_hash: ActionHash,
    pub content: String,
    pub created_at: i64,
}

/// A binary approval vote on an issue.
///
/// Defined here so the integrity schema stays stable across Phases 4–5 (which
/// wire up seconding + voting) without forcing another DNA-hash change. No
/// coordinator function creates a `Vote` in this phase.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Vote {
    pub issue_action_hash: ActionHash,
    pub approve: bool,
}

/// A flag on an issue, indicating community concern.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Flag {
    pub issue_action_hash: ActionHash,
    pub reason: FlagReason,
    pub created_at: i64,
}

/// Why an issue was flagged.
///
/// Forking developers: add or rename variants to suit your community.
#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub enum FlagReason {
    Spam,
    Misleading,
    OffTopic,
    Inappropriate,
}

/// Records an entry that was migrated from the previous DNA version.
///
/// Dormant in kindact_v1_0 (no prior version to migrate from). Kept so the
/// migration machinery activates cleanly when a second version ships.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct MigratedPoll {
    /// The entry's ActionHash on the previous DHT.
    pub old_action_hash: ActionHash,
    /// The entry's ActionHash on this DHT (after re-creation).
    pub new_action_hash: ActionHash,
    /// Unix timestamp when the migration happened.
    pub migrated_at: i64,
}

/// An encrypted blob stored on the public DHT.
///
/// Only the author can decrypt the contents using their lair-managed
/// x25519 key (derived from their Ed25519 signing key). The DHT
/// replicates the ciphertext for backup, but peers cannot read it.
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct EncryptedEntry {
    /// Ciphertext (xsalsa20poly1305 via lair crypto_box).
    pub cipher: Vec<u8>,
    /// 24-byte nonce used in encryption.
    pub nonce: Vec<u8>,
    /// Routing hint so the client knows how to deserialize after decryption.
    pub entry_type_hint: String,
    /// Optional reference to a related entry.
    pub related_hash: Option<ActionHash>,
}

// ── Entry type enum ───────────────────────────────────────────────────
//
// ⚠️ ORDER IS LOAD-BEARING. The canonical backup classifier
// (`classify_dump_record` in src-tauri/src/commands.rs) maps entry types by
// their numeric index in this enum: Issue=0, Comment=1, Vote=2, Flag=3,
// MigratedPoll=4, EncryptedEntry=5. Append new types; never reorder.

#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EntryTypes {
    Issue(Issue),
    Comment(Comment),
    Vote(Vote),
    Flag(Flag),
    MigratedPoll(MigratedPoll),
    EncryptedEntry(EncryptedEntry),
}

// ── Link types ────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    /// From a well-known anchor hash to each Issue's action hash.
    AllIssues,
    /// From an Issue's action hash to each Comment's action hash.
    IssueToComment,
    /// From an Issue's action hash to each seconding agent's link (Phase 4).
    IssueToSeconds,
    /// From an Issue's action hash to each Vote's action hash (Phase 5).
    IssueToVotes,
    /// From an Issue's action hash to each Flag's action hash.
    IssueToFlags,
    /// From a well-known anchor to each tag anchor (Phase 3).
    AllTags,
    /// From a tag anchor to each Issue's action hash (Phase 3).
    TagToIssue,
    /// From the migration anchor to each MigratedPoll's action hash.
    MigrationIndex,
    /// From a Vote's action hash to its encrypted rationale.
    VoteToRationale,
    /// From an agent-specific anchor to their encrypted draft entries.
    AgentDrafts,
}

#[derive(Clone, Copy)]
enum LinkedEntryKind {
    Issue,
    Comment,
    Flag,
}

// ── Anchors ───────────────────────────────────────────────────────────

/// Returns a deterministic hash to use as the base for AllIssues links.
pub fn all_issues_anchor() -> ExternResult<EntryHash> {
    hash_entry(&Issue {
        title: "ALL_ISSUES_ANCHOR".to_string(),
        description: String::new(),
        tags: vec![],
        created_at: 0,
    })
}

/// Returns a deterministic hash to use as the base for MigrationIndex links.
pub fn migration_anchor() -> ExternResult<EntryHash> {
    hash_entry(&Issue {
        title: "MIGRATION_ANCHOR".to_string(),
        description: String::new(),
        tags: vec![],
        created_at: 0,
    })
}

/// Returns a deterministic hash for an agent's encrypted drafts anchor.
pub fn agent_drafts_anchor(agent: &AgentPubKey) -> ExternResult<EntryHash> {
    hash_entry(&Issue {
        title: format!("AGENT_DRAFTS_{}", agent),
        description: String::new(),
        tags: vec![],
        created_at: 0,
    })
}

// ── Validation ────────────────────────────────────────────────────────

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, .. } | OpEntry::UpdateEntry { app_entry, .. } => {
                match app_entry {
                    EntryTypes::Issue(issue) => validate_issue(&issue),
                    EntryTypes::Comment(comment) => validate_comment(&comment),
                    EntryTypes::Vote(vote) => validate_vote(&vote),
                    EntryTypes::Flag(flag) => validate_flag(&flag),
                    EntryTypes::MigratedPoll(_) => Ok(ValidateCallbackResult::Valid),
                    EntryTypes::EncryptedEntry(ee) => validate_encrypted_entry(&ee),
                }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag: _,
            action: _,
        } => match link_type {
            LinkTypes::AllIssues => {
                let anchor = all_issues_anchor()?;
                if base_address != AnyLinkableHash::from(anchor) {
                    return Ok(ValidateCallbackResult::Invalid(
                        "AllIssues link must originate from the issues anchor".to_string(),
                    ));
                }
                validate_link_target(LinkedEntryKind::Issue, target_address, None)
            }
            LinkTypes::IssueToComment => {
                validate_issue_child_link(LinkedEntryKind::Comment, base_address, target_address)
            }
            LinkTypes::IssueToSeconds => Ok(ValidateCallbackResult::Valid),
            LinkTypes::IssueToVotes => Ok(ValidateCallbackResult::Valid),
            LinkTypes::IssueToFlags => {
                validate_issue_child_link(LinkedEntryKind::Flag, base_address, target_address)
            }
            LinkTypes::AllTags => Ok(ValidateCallbackResult::Valid),
            LinkTypes::TagToIssue => Ok(ValidateCallbackResult::Valid),
            LinkTypes::VoteToRationale => Ok(ValidateCallbackResult::Valid),
            LinkTypes::AgentDrafts => Ok(ValidateCallbackResult::Valid),
            LinkTypes::MigrationIndex => {
                let anchor = migration_anchor()?;
                if base_address != AnyLinkableHash::from(anchor) {
                    return Ok(ValidateCallbackResult::Invalid(
                        "MigrationIndex link must originate from the migration anchor".to_string(),
                    ));
                }
                Ok(ValidateCallbackResult::Valid)
            }
        },
        FlatOp::RegisterDeleteLink {
            link_type,
            original_action,
            action,
            ..
        } => match link_type {
            LinkTypes::AllIssues | LinkTypes::IssueToComment | LinkTypes::IssueToFlags => Ok(
                validate_link_delete_auth(&original_action.author, &action.author),
            ),
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterDelete(delete) => {
            let original = must_get_valid_record(delete.action.deletes_address.clone())?;
            if matches!(decode_entry_types(&original)?, EntryTypes::Issue(_)) {
                Ok(validate_issue_delete_auth(
                    original.action().author(),
                    &delete.action.author,
                ))
            } else {
                Ok(ValidateCallbackResult::Valid)
            }
        }
        _ => Ok(ValidateCallbackResult::Valid),
    }
}

fn validate_issue_child_link(
    child_kind: LinkedEntryKind,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
) -> ExternResult<ValidateCallbackResult> {
    let base_hash = match ActionHash::try_from(base_address) {
        Ok(hash) => hash,
        Err(_) => {
            return Ok(ValidateCallbackResult::Invalid(
                "Issue child link base must be an action hash".to_string(),
            ))
        }
    };
    let base_result = validate_link_target(
        LinkedEntryKind::Issue,
        AnyLinkableHash::from(base_hash.clone()),
        None,
    )?;
    if base_result != ValidateCallbackResult::Valid {
        return Ok(base_result);
    }
    validate_link_target(child_kind, target_address, Some(&base_hash))
}

fn validate_link_target(
    expected: LinkedEntryKind,
    target_address: AnyLinkableHash,
    issue_base: Option<&ActionHash>,
) -> ExternResult<ValidateCallbackResult> {
    let target_hash = match ActionHash::try_from(target_address) {
        Ok(hash) => hash,
        Err(_) => {
            return Ok(ValidateCallbackResult::Invalid(
                "Link target must be an action hash".to_string(),
            ))
        }
    };
    let record = must_get_valid_record(target_hash)?;
    let entry = decode_entry_types(&record)?;
    Ok(validate_linked_entry(expected, entry, issue_base))
}

pub fn decode_entry_types(record: &Record) -> ExternResult<EntryTypes> {
    let entry = record
        .entry()
        .as_option()
        .ok_or(wasm_error!("Record has no entry"))?;
    let app_def = match record.action().entry_type() {
        Some(EntryType::App(app_def)) => app_def,
        _ => return Err(wasm_error!("Record is not an app entry")),
    };
    let unit = UnitEntryTypes::try_from(ScopedZomeType {
        zome_index: app_def.zome_index,
        zome_type: app_def.entry_index,
    })
    .map_err(|_| wasm_error!("Unknown issues entry type"))?;
    EntryTypes::try_from((unit, entry)).map_err(|_| wasm_error!("Could not decode issues entry"))
}

fn validate_linked_entry(
    expected: LinkedEntryKind,
    entry: EntryTypes,
    issue_base: Option<&ActionHash>,
) -> ValidateCallbackResult {
    let valid = match (expected, entry) {
        (LinkedEntryKind::Issue, EntryTypes::Issue(_)) => true,
        (LinkedEntryKind::Comment, EntryTypes::Comment(comment)) => {
            issue_base == Some(&comment.issue_action_hash)
        }
        (LinkedEntryKind::Flag, EntryTypes::Flag(flag)) => {
            issue_base == Some(&flag.issue_action_hash)
        }
        _ => false,
    };
    if valid {
        ValidateCallbackResult::Valid
    } else {
        ValidateCallbackResult::Invalid("Link endpoints do not match the link type".to_string())
    }
}

fn validate_issue_delete_auth(
    original_author: &AgentPubKey,
    delete_author: &AgentPubKey,
) -> ValidateCallbackResult {
    if original_author == delete_author {
        ValidateCallbackResult::Valid
    } else {
        ValidateCallbackResult::Invalid("Only the issue author can delete it".to_string())
    }
}

fn validate_link_delete_auth(
    original_author: &AgentPubKey,
    delete_author: &AgentPubKey,
) -> ValidateCallbackResult {
    if original_author == delete_author {
        ValidateCallbackResult::Valid
    } else {
        ValidateCallbackResult::Invalid("Only the link author can delete it".to_string())
    }
}

fn validate_issue(issue: &Issue) -> ExternResult<ValidateCallbackResult> {
    if issue.title.trim().is_empty() {
        return Ok(ValidateCallbackResult::Invalid(
            "Issue title cannot be empty".to_string(),
        ));
    }
    Ok(ValidateCallbackResult::Valid)
}

fn validate_comment(comment: &Comment) -> ExternResult<ValidateCallbackResult> {
    if comment.content.trim().is_empty() {
        return Ok(ValidateCallbackResult::Invalid(
            "Comment cannot be empty".to_string(),
        ));
    }
    Ok(ValidateCallbackResult::Valid)
}

fn validate_vote(vote: &Vote) -> ExternResult<ValidateCallbackResult> {
    let _ = vote;
    Ok(ValidateCallbackResult::Valid)
}

fn validate_flag(flag: &Flag) -> ExternResult<ValidateCallbackResult> {
    let _ = flag;
    Ok(ValidateCallbackResult::Valid)
}

fn validate_encrypted_entry(ee: &EncryptedEntry) -> ExternResult<ValidateCallbackResult> {
    if ee.cipher.is_empty() {
        return Ok(ValidateCallbackResult::Invalid(
            "Cipher cannot be empty".to_string(),
        ));
    }
    if ee.nonce.len() != 24 {
        return Ok(ValidateCallbackResult::Invalid(
            "Nonce must be 24 bytes".to_string(),
        ));
    }
    if ee.entry_type_hint != "private" {
        return Ok(ValidateCallbackResult::Invalid(
            "entry_type_hint must be 'private'".to_string(),
        ));
    }
    Ok(ValidateCallbackResult::Valid)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hash(byte: u8) -> ActionHash {
        ActionHash::from_raw_36(vec![byte; 36])
    }

    #[test]
    fn all_issues_target_must_be_an_issue() {
        let result = validate_linked_entry(
            LinkedEntryKind::Issue,
            EntryTypes::Comment(Comment {
                issue_action_hash: hash(1),
                content: "comment".into(),
                created_at: 0,
            }),
            None,
        );
        assert!(matches!(result, ValidateCallbackResult::Invalid(_)));
    }

    #[test]
    fn comment_link_must_match_its_issue_base() {
        let result = validate_linked_entry(
            LinkedEntryKind::Comment,
            EntryTypes::Comment(Comment {
                issue_action_hash: hash(2),
                content: "comment".into(),
                created_at: 0,
            }),
            Some(&hash(1)),
        );
        assert!(matches!(result, ValidateCallbackResult::Invalid(_)));
    }

    #[test]
    fn flag_link_accepts_matching_issue_base() {
        let issue_hash = hash(3);
        let result = validate_linked_entry(
            LinkedEntryKind::Flag,
            EntryTypes::Flag(Flag {
                issue_action_hash: issue_hash.clone(),
                reason: FlagReason::Spam,
                created_at: 0,
            }),
            Some(&issue_hash),
        );
        assert_eq!(result, ValidateCallbackResult::Valid);
    }

    #[test]
    fn only_original_author_can_delete_an_issue() {
        let original = AgentPubKey::from_raw_36(vec![1; 36]);
        let other = AgentPubKey::from_raw_36(vec![2; 36]);
        assert!(matches!(
            validate_issue_delete_auth(&original, &other),
            ValidateCallbackResult::Invalid(_)
        ));
        assert_eq!(
            validate_issue_delete_auth(&original, &original),
            ValidateCallbackResult::Valid
        );
    }
}
