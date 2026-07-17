//! Kindact issues coordinator zome (kindact_v1_0).
//!
//! Exposes the issue + comment data model and community moderation:
//!   - issues: `create_issue` / `get_issue` / `get_all_issues` / `delete_issue`
//!   - comments: `post_comment` / `get_comments`
//!   - flagging: `flag_issue` / `get_issue_flags` / `remove_flag` / `get_flag_threshold`
//!   - encrypted private entries + migration helpers (infrastructure, carried
//!     forward from the ProofPoll fork)
//!
//! Voting (`Vote` entries, seconding, tallies) is defined in the integrity
//! schema but wired up in a later phase — no vote function lives here yet.

use hdk::prelude::*;
use issues_integrity::*;

#[hdk_dependent_entry_types]
enum EntryZomes {
    Integrity(issues_integrity::EntryTypes),
}

// ── Configuration ─────────────────────────────────────────────────────

/// Minimum flags from unique agents before the UI hides an issue.
///
/// Forking developers: change this to suit your community size.
pub const FLAG_HIDE_THRESHOLD: u32 = 3;

// ── Input types ───────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateIssueInput {
    pub title: String,
    pub description: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateCommentInput {
    pub issue_action_hash: ActionHash,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FlagIssueInput {
    pub issue_action_hash: ActionHash,
    pub reason: FlagReason,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterMigratedPollInput {
    pub old_action_hash: ActionHash,
    pub new_action_hash: ActionHash,
}

// ── Issue functions ────────────────────────────────────────────────────

fn ensure_issue_entry_type(entry: EntryTypes) -> ExternResult<Issue> {
    match entry {
        EntryTypes::Issue(issue) => Ok(issue),
        _ => Err(wasm_error!("Target is not an issue")),
    }
}

fn ensure_issue_record(record: &Record) -> ExternResult<Issue> {
    ensure_issue_entry_type(decode_entry_types(record)?)
}

#[hdk_extern]
pub fn create_issue(input: CreateIssueInput) -> ExternResult<ActionHash> {
    let now = sys_time()?.as_seconds_and_nanos().0;

    let issue = Issue {
        title: input.title,
        description: input.description,
        tags: input.tags,
        created_at: now,
    };

    let action_hash = create_entry(&EntryZomes::Integrity(EntryTypes::Issue(issue)))?;

    let anchor = all_issues_anchor()?;
    create_link(anchor, action_hash.clone(), LinkTypes::AllIssues, ())?;

    Ok(action_hash)
}

#[hdk_extern]
pub fn get_issue(action_hash: ActionHash) -> ExternResult<Option<Record>> {
    let record = get(action_hash, GetOptions::default())?;
    if let Some(record) = &record {
        ensure_issue_record(record)?;
    }
    Ok(record)
}

#[hdk_extern]
pub fn get_all_issues(_: ()) -> ExternResult<Vec<Record>> {
    let anchor = all_issues_anchor()?;
    let links = get_links(
        LinkQuery::try_new(anchor, LinkTypes::AllIssues)?,
        GetStrategy::default(),
    )?;

    let mut records = Vec::new();
    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid issue link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            records.push(record);
        }
    }

    Ok(records)
}

#[hdk_extern]
pub fn delete_issue(action_hash: ActionHash) -> ExternResult<ActionHash> {
    let record =
        get(action_hash.clone(), GetOptions::default())?.ok_or(wasm_error!("Issue not found"))?;
    ensure_issue_record(&record)?;
    let my_agent = agent_info()?.agent_initial_pubkey;
    if *record.action().author() != my_agent {
        return Err(wasm_error!("Only the issue creator can delete it"));
    }

    let anchor = all_issues_anchor()?;
    let links = get_links(
        LinkQuery::try_new(anchor, LinkTypes::AllIssues)?,
        GetStrategy::default(),
    )?;
    for link in links {
        if let Ok(target) = ActionHash::try_from(link.target) {
            if target == action_hash {
                delete_link(link.create_link_hash, GetOptions::default())?;
            }
        }
    }

    delete_entry(action_hash)
}

// ── Comment functions ──────────────────────────────────────────────────

#[hdk_extern]
pub fn post_comment(input: CreateCommentInput) -> ExternResult<ActionHash> {
    // Ensure the target is a real Issue — comments cannot be attached to
    // arbitrary action hashes.
    let issue_record = get(input.issue_action_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!("Issue not found"))?;
    ensure_issue_record(&issue_record)?;

    let now = sys_time()?.as_seconds_and_nanos().0;
    let comment = Comment {
        issue_action_hash: input.issue_action_hash.clone(),
        content: input.content,
        created_at: now,
    };

    let comment_hash = create_entry(&EntryZomes::Integrity(EntryTypes::Comment(comment)))?;

    create_link(
        input.issue_action_hash,
        comment_hash.clone(),
        LinkTypes::IssueToComment,
        (),
    )?;

    Ok(comment_hash)
}

#[hdk_extern]
pub fn get_comments(issue_action_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(
        LinkQuery::try_new(issue_action_hash, LinkTypes::IssueToComment)?,
        GetStrategy::default(),
    )?;

    let mut records = Vec::new();
    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid comment link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            records.push(record);
        }
    }

    Ok(records)
}

// ── Flag functions ─────────────────────────────────────────────────────

#[hdk_extern]
pub fn flag_issue(input: FlagIssueInput) -> ExternResult<ActionHash> {
    let issue_record = get(input.issue_action_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!("Issue not found"))?;
    ensure_issue_record(&issue_record)?;

    let my_agent = agent_info()?.agent_initial_pubkey;
    let existing_flags = get_links(
        LinkQuery::try_new(input.issue_action_hash.clone(), LinkTypes::IssueToFlags)?,
        GetStrategy::default(),
    )?;
    for link in &existing_flags {
        if link.author == my_agent {
            return Err(wasm_error!("You have already flagged this issue"));
        }
    }

    let now = sys_time()?.as_seconds_and_nanos().0;
    let flag = Flag {
        issue_action_hash: input.issue_action_hash.clone(),
        reason: input.reason,
        created_at: now,
    };

    let flag_hash = create_entry(&EntryZomes::Integrity(EntryTypes::Flag(flag)))?;

    create_link(
        input.issue_action_hash,
        flag_hash.clone(),
        LinkTypes::IssueToFlags,
        (),
    )?;

    Ok(flag_hash)
}

#[hdk_extern]
pub fn get_issue_flags(issue_action_hash: ActionHash) -> ExternResult<Vec<Record>> {
    let links = get_links(
        LinkQuery::try_new(issue_action_hash, LinkTypes::IssueToFlags)?,
        GetStrategy::default(),
    )?;

    let mut records = Vec::new();
    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid flag link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            records.push(record);
        }
    }

    Ok(records)
}

#[hdk_extern]
pub fn remove_flag(flag_action_hash: ActionHash) -> ExternResult<ActionHash> {
    let record = get(flag_action_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!("Flag not found"))?;

    let my_agent = agent_info()?.agent_initial_pubkey;
    if *record.action().author() != my_agent {
        return Err(wasm_error!("Only the flag author can remove it"));
    }

    let flag: Flag = record
        .entry()
        .to_app_option()
        .map_err(|_| wasm_error!("Could not deserialize flag"))?
        .ok_or(wasm_error!("Flag entry is None"))?;

    let links = get_links(
        LinkQuery::try_new(flag.issue_action_hash, LinkTypes::IssueToFlags)?,
        GetStrategy::default(),
    )?;
    for link in links {
        if let Ok(target) = ActionHash::try_from(link.target) {
            if target == flag_action_hash {
                delete_link(link.create_link_hash, GetOptions::default())?;
            }
        }
    }

    delete_entry(flag_action_hash)
}

#[hdk_extern]
pub fn get_flag_threshold(_: ()) -> ExternResult<u32> {
    Ok(FLAG_HIDE_THRESHOLD)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn issue_commands_reject_comment_entries() {
        let result = ensure_issue_entry_type(EntryTypes::Comment(Comment {
            issue_action_hash: ActionHash::from_raw_36(vec![1; 36]),
            content: "comment".into(),
            created_at: 0,
        }));
        assert!(result.is_err());
    }
}

// ── Encrypted entry functions (infrastructure) ────────────────────────

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateEncryptedEntryInput {
    pub cipher: Vec<u8>,
    pub nonce: Vec<u8>,
    /// How to link this entry. "vote_rationale" or "draft_poll".
    /// NOT stored on the DHT — only used for routing.
    pub link_as: String,
    pub related_hash: Option<ActionHash>,
}

/// Store an encrypted entry on the DHT with appropriate links.
#[hdk_extern]
pub fn create_encrypted_entry(input: CreateEncryptedEntryInput) -> ExternResult<ActionHash> {
    let entry = EncryptedEntry {
        cipher: input.cipher,
        nonce: input.nonce,
        entry_type_hint: "private".to_string(),
        related_hash: input.related_hash.clone(),
    };
    let action_hash = create_entry(&EntryZomes::Integrity(EntryTypes::EncryptedEntry(entry)))?;

    match input.link_as.as_str() {
        "vote_rationale" => {
            if let Some(vote_hash) = input.related_hash {
                create_link(
                    vote_hash,
                    action_hash.clone(),
                    LinkTypes::VoteToRationale,
                    (),
                )?;
            }
        }
        "draft_poll" => {
            let agent = agent_info()?.agent_initial_pubkey;
            let anchor = agent_drafts_anchor(&agent)?;
            create_link(anchor, action_hash.clone(), LinkTypes::AgentDrafts, ())?;
        }
        _ => {}
    }

    Ok(action_hash)
}

/// Get the encrypted rationale for a vote (if one exists).
#[hdk_extern]
pub fn get_vote_rationale(vote_action_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(
        LinkQuery::try_new(vote_action_hash, LinkTypes::VoteToRationale)?,
        GetStrategy::default(),
    )?;
    if let Some(link) = links.first() {
        let hash = ActionHash::try_from(link.target.clone())
            .map_err(|_| wasm_error!("Invalid rationale link target"))?;
        return get(hash, GetOptions::default());
    }
    Ok(None)
}

/// Get all encrypted draft entries for the current agent.
#[hdk_extern]
pub fn get_my_drafts(_: ()) -> ExternResult<Vec<Record>> {
    let agent = agent_info()?.agent_initial_pubkey;
    let anchor = agent_drafts_anchor(&agent)?;
    let links = get_links(
        LinkQuery::try_new(anchor, LinkTypes::AgentDrafts)?,
        GetStrategy::default(),
    )?;
    let mut records = Vec::new();
    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid draft link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            records.push(record);
        }
    }
    Ok(records)
}

/// Delete an encrypted entry (author-only) and clean up its links.
/// Uses `related_hash` to determine link type:
///   Some(hash) → vote rationale (linked from vote via VoteToRationale)
///   None → draft (linked from agent anchor via AgentDrafts)
#[hdk_extern]
pub fn delete_encrypted_entry(action_hash: ActionHash) -> ExternResult<ActionHash> {
    let record = get(action_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!("Encrypted entry not found"))?;
    let my_agent = agent_info()?.agent_initial_pubkey;
    if *record.action().author() != my_agent {
        return Err(wasm_error!("Only the author can delete encrypted entries"));
    }

    let ee: EncryptedEntry = record
        .entry()
        .to_app_option()
        .map_err(|_| wasm_error!("Could not deserialize encrypted entry"))?
        .ok_or(wasm_error!("Entry is None"))?;

    if let Some(vote_hash) = ee.related_hash {
        // Vote rationale — clean up VoteToRationale link
        let links = get_links(
            LinkQuery::try_new(vote_hash, LinkTypes::VoteToRationale)?,
            GetStrategy::default(),
        )?;
        for link in links {
            if let Ok(target) = ActionHash::try_from(link.target) {
                if target == action_hash {
                    delete_link(link.create_link_hash, GetOptions::default())?;
                }
            }
        }
    } else {
        // Draft — clean up AgentDrafts link
        let anchor = agent_drafts_anchor(&my_agent)?;
        let links = get_links(
            LinkQuery::try_new(anchor, LinkTypes::AgentDrafts)?,
            GetStrategy::default(),
        )?;
        for link in links {
            if let Ok(target) = ActionHash::try_from(link.target) {
                if target == action_hash {
                    delete_link(link.create_link_hash, GetOptions::default())?;
                }
            }
        }
    }

    delete_entry(action_hash)
}

// ── Migration functions (dormant infrastructure) ──────────────────────

#[hdk_extern]
pub fn register_migrated_poll(input: RegisterMigratedPollInput) -> ExternResult<ActionHash> {
    if input.old_action_hash == input.new_action_hash {
        return Err(wasm_error!("Old and new action hashes must be different"));
    }

    let now = sys_time()?.as_seconds_and_nanos().0;
    let migrated = MigratedPoll {
        old_action_hash: input.old_action_hash,
        new_action_hash: input.new_action_hash,
        migrated_at: now,
    };

    let action_hash = create_entry(&EntryZomes::Integrity(EntryTypes::MigratedPoll(migrated)))?;

    let anchor = migration_anchor()?;
    create_link(anchor, action_hash.clone(), LinkTypes::MigrationIndex, ())?;

    Ok(action_hash)
}

#[hdk_extern]
pub fn get_migration_mapping(old_action_hash: ActionHash) -> ExternResult<Option<ActionHash>> {
    let anchor = migration_anchor()?;
    let links = get_links(
        LinkQuery::try_new(anchor, LinkTypes::MigrationIndex)?,
        GetStrategy::default(),
    )?;

    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid migration link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            let migrated: MigratedPoll = record
                .entry()
                .to_app_option()
                .map_err(|_| wasm_error!("Could not deserialize MigratedPoll"))?
                .ok_or(wasm_error!("MigratedPoll entry is None"))?;

            if migrated.old_action_hash == old_action_hash {
                return Ok(Some(migrated.new_action_hash));
            }
        }
    }

    Ok(None)
}

#[hdk_extern]
pub fn get_all_migration_mappings(_: ()) -> ExternResult<Vec<Record>> {
    let anchor = migration_anchor()?;
    let links = get_links(
        LinkQuery::try_new(anchor, LinkTypes::MigrationIndex)?,
        GetStrategy::default(),
    )?;

    let mut records = Vec::new();
    for link in links {
        let hash = ActionHash::try_from(link.target)
            .map_err(|_| wasm_error!("Invalid migration link target"))?;
        if let Some(record) = get(hash, GetOptions::default())? {
            records.push(record);
        }
    }

    Ok(records)
}
