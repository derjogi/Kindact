/**
 * Holochain zome call helpers for Kindact.
 *
 * Thin wrappers around Tauri invoke() — all zome calls go through the Rust
 * backend. No @holochain/client in the frontend.
 *
 * ## For forking developers
 *
 * This file has four sections:
 *   1. **App types + functions** (top) — Issue, Comment, and Flag types and
 *      their invoke() wrappers.
 *   2. **Identity linking** — Flowsta integration. Keep as-is.
 *   3. **Flagging** — Community moderation. Keep or adapt.
 *   4. **Migration status** — DNA version upgrade tracking. Keep as-is.
 *
 * Each function is a one-liner that calls the matching Tauri command in
 * `src-tauri/src/commands.rs`. Add/remove functions as you add/remove commands.
 */

import { invoke } from "@tauri-apps/api/core";

// ── App-specific types (replace with your data model) ─────────────────

export interface Issue {
  title: string;
  description: string;
  tags: string[];
  created_at: number;
}

export interface IssueListItem {
  hash: string;
  issue: Issue;
  author: string;
}

export interface IssueDetail {
  issue: Issue;
  author: string;
}

export interface CommentData {
  hash: string;
  comment: {
    issue_action_hash: string;
    content: string;
    created_at: number;
  };
  author: string;
}

// ── App-specific operations (replace with your invoke() wrappers) ─────

export async function createIssue(input: {
  title: string;
  description: string;
  tags: string[];
}): Promise<string> {
  return invoke<string>("create_issue", {
    title: input.title,
    description: input.description,
    tags: input.tags,
  });
}

export async function getIssue(
  actionHash: string,
): Promise<IssueDetail | null> {
  return invoke<IssueDetail | null>("get_issue", { actionHash });
}

export async function getAllIssues(): Promise<IssueListItem[]> {
  return invoke<IssueListItem[]>("get_all_issues");
}

export async function deleteIssue(actionHash: string): Promise<string> {
  return invoke<string>("delete_issue", { actionHash });
}

export async function postComment(
  issueActionHash: string,
  content: string,
): Promise<string> {
  return invoke<string>("post_comment", { issueActionHash, content });
}

export async function getComments(
  issueActionHash: string,
): Promise<CommentData[]> {
  return invoke<CommentData[]>("get_comments", { issueActionHash });
}

// ── Profile cache (Flowsta infrastructure — keep as-is) ───────────────
//
// Caches the user's display name and profile picture locally so the app
// works without the Flowsta Vault running. The Vault is only needed for
// the initial identity linking ceremony. See layout.tsx for the load/save flow.

export interface CachedProfile {
  display_name: string | null;
  profile_picture: string | null;
}

export async function getCachedProfile(): Promise<CachedProfile | null> {
  return invoke<CachedProfile | null>("get_cached_profile");
}

export async function saveProfileCache(
  displayName: string | null,
  profilePicture: string | null,
): Promise<void> {
  return invoke<void>("save_profile_cache", {
    displayName,
    profilePicture,
  });
}

// ── Identity linking (Flowsta infrastructure — keep as-is) ────────────

export interface IdentityLinkData {
  vault_agent_pub_key: string;
  entry_action_hash: string;
  linked_at: number;
}

export async function commitIdentityLink(
  vaultAgentPubKey: string,
  vaultSignature: string,
): Promise<string> {
  return invoke<string>("commit_identity_link", {
    vaultAgentPubKey,
    vaultSignature,
  });
}

export async function getLinkedAgents(agentPubKey: string): Promise<string[]> {
  return invoke<string[]>("get_linked_agents", {
    agentPubKey,
  });
}

export async function getIdentityLink(): Promise<IdentityLinkData | null> {
  return invoke<IdentityLinkData | null>("get_identity_link");
}

/**
 * The set of Holochain agent keys that all belong to THIS user — used to
 * recognise the user's own polls/votes/flags regardless of which device or
 * install authored them.
 *
 * Why a set, not a single key: Kindact generates a fresh conductor agent
 * key on every install. The user's stable identity is their Flowsta Vault
 * agent; each install links its local agent to that Vault agent via an
 * IsSamePerson attestation. `get_linked_agents(vaultAgent)` therefore returns
 * every Kindact agent the user has ever linked (this is a designed-in query
 * — the agent-linking zome indexes the link from the Vault agent's pubkey too).
 *
 * IMPORTANT: this is for RECOGNITION (read) only. Mutating an entry
 * (delete a poll, remove a flag) is still bound to the CURRENT local agent —
 * Holochain only lets the original author update/delete, so a different linked
 * agent cannot. Use the local agent directly for those gates, not this set.
 *
 * Best-effort: if the user has never linked (fresh, not signed in) or the
 * Vault link isn't available, the set is just the local agent.
 */
export async function loadMyAgentSet(
  localAgent: string | null,
): Promise<Set<string>> {
  try {
    // Single Rust round-trip: local agent ∪ agents linked to our Vault
    // identity. The whole lookup (and its result) is logged to kindact.log
    // by the `get_my_agent_set` command, so recognition is verifiable.
    const agents = await invoke<string[]>("get_my_agent_set", { localAgent });
    return new Set(agents);
  } catch {
    // Conductor not ready / offline — fall back to the local agent only.
    return new Set(localAgent ? [localAgent] : []);
  }
}

export async function revokeIdentityLink(): Promise<void> {
  return invoke<void>("revoke_identity_link");
}

// ── Flagging (community moderation — keep or adapt) ───────────────────

export type FlagReason = "Spam" | "Misleading" | "OffTopic" | "Inappropriate";

export interface FlagData {
  hash: string;
  flag: { issue_action_hash: string; reason: string; created_at: number };
  author: string;
}

export async function flagIssue(
  issueActionHash: string,
  reason: FlagReason,
): Promise<string> {
  return invoke<string>("flag_issue", { issueActionHash, reason });
}

export async function getIssueFlags(
  issueActionHash: string,
): Promise<FlagData[]> {
  return invoke<FlagData[]>("get_issue_flags", { issueActionHash });
}

export async function removeFlag(flagActionHash: string): Promise<string> {
  return invoke<string>("remove_flag", { flagActionHash });
}

export async function getFlagThreshold(): Promise<number> {
  return invoke<number>("get_flag_threshold");
}

// ── Migration status (infrastructure — keep as-is) ────────────────────

export interface MigrationState {
  status: "NotStarted" | "InProgress" | "Complete" | { Error: string };
  polls_migrated: { old_hash: string; new_hash: string; title: string }[];
  votes_pending: {
    v1_0_poll_hash: string;
    option_index: number;
    poll_title: string;
    retry_count: number;
  }[];
  votes_migrated: {
    old_poll_hash: string;
    new_poll_hash: string;
    option_index: number;
  }[];
}

export async function getMigrationStatus(): Promise<MigrationState> {
  return invoke<MigrationState>("get_migration_status");
}

export async function abandonPendingVotes(): Promise<void> {
  return invoke<void>("abandon_pending_votes");
}

// ── Encrypted entries (v1.3) ──────────────────────────────────────────

export interface DraftPollItem {
  hash: string;
  title: string;
  description: string;
  options: string[];
  closes_at: number | null;
  poll_type: string;
  created_at: number;
}

export async function getMyDrafts(): Promise<DraftPollItem[]> {
  return invoke<DraftPollItem[]>("get_my_drafts");
}

export async function deleteDraft(draftActionHash: string): Promise<string> {
  return invoke<string>("delete_draft", { draftActionHash });
}
