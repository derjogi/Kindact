---
status: in-progress
created: 2026-06-06
priority: high
tags:
- zomes
- ui
depends_on:
- '003'
parent: '001'
created_at: 2026-06-06T21:28:57.228996727Z
updated_at: 2026-07-17T22:51:35+12:00
transitions:
- status: in-progress
  at: 2026-07-16T10:29:58.533424377Z
---

# Phase 2 — Issues + Comments (replace polls)

> **Status**: implementation complete; runtime verification pending · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 2 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). Replace ProofPoll's poll data model with Kindact issues + comments, reusing the exact anchor/link/query patterns already in the `polls` zome. Delivers features **#2 (create issues)** and **#3 (comment)**. Tags ride along on the `Issue` entry but the sidebar/filter UI is Phase 3.

## Design

Rename the zome `polls` → `issues` (`dna/v1.0/zomes/issues/{integrity,coordinator}`).

### Entry types (integrity zome)
```rust
#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Issue { pub title: String, pub description: String,
                   pub tags: Vec<String>, pub created_at: i64 }

#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Comment { pub issue_action_hash: ActionHash,
                     pub content: String, pub created_at: i64 }

// Repurposed for the Phase 5 approval vote:
#[hdk_entry_helper] #[derive(Clone, PartialEq)]
pub struct Vote { pub issue_action_hash: ActionHash, pub approve: bool }
```
- `EntryTypes`: `Issue`, `Comment`, `Vote`, `Flag`, `MigratedPoll`, `EncryptedEntry`.
- `LinkTypes`: `AllIssues`, `IssueToComment`, `IssueToSeconds`, `IssueToVotes` (+ kept `AllTags`/`TagToIssue` for Phase 3, `MigrationIndex`, `VoteToRationale`, `AgentDrafts`).
- Rename the sentinel-anchor helpers: `all_polls_anchor` → `all_issues_anchor`; keep `migration_anchor`.
- `validate_poll` → `validate_issue` (title non-empty; tags optional). Keep `validate_encrypted_entry` etc. verbatim.

### Coordinator
- `create_poll` → `create_issue` (same `create_entry` + `AllIssues` link shape).
- `get_all_polls` → `get_all_issues`; `get_poll` → `get_issue`; `delete_poll` → `delete_issue` (keep author-only guard).
- **New**: `post_comment(CreateCommentInput)` + `get_comments(issue_action_hash)` — copy the `PollToVotes` link/query pattern into `IssueToComment`.

### Tauri + frontend
- `src-tauri/src/commands.rs`: rename poll/vote commands, add comment commands; register in `src-tauri/src/lib.rs` `invoke_handler![…]`. Add a `match` arm per new entry type in `build_canonical_backup` + `decode_record_for_export`.
- `src/lib/holochain.ts`: replace `Poll*` types/wrappers with `Issue`/`Comment`; keep identity, migration, encrypted-entry wrappers.
- Routes: `src/routes/index.tsx` → issue list; `create/index.tsx` → issue form (title, description, comma-separated tags); `poll/index.tsx` → issue detail with comments + comment box. Keep `layout.tsx` + `identity/index.tsx` (rename labels).

## Plan

- [x] Rename zome dir `polls` → `issues`; update `dna.yaml` zome names
- [x] Replace `Poll`→`Issue` (+tags), add `Comment`, repurpose `Vote`; update `EntryTypes`/`LinkTypes`/anchors/validation
- [x] Coordinator: `create_issue`/`get_all_issues`/`get_issue`/`delete_issue` + `post_comment`/`get_comments`
- [x] Tauri commands + `invoke_handler` + backup `match` arms
- [x] `holochain.ts` types/wrappers
- [x] Issue list / create / detail routes

## Test

- [ ] Create an issue with tags → appears in the list
- [ ] Open the issue, post a comment → shows attributed to your Flowsta display name
- [ ] Author-only `delete_issue` enforced
- [ ] Zome unit test: create issue + comment round-trips via anchor/link queries

## Notes

`Vote` is defined here but only wired up in Phase 5; defining it now keeps the integrity schema stable so Phases 4–5 don't force another DNA-hash change.

---

## Implementation record

> Status: **implemented; runtime smoke test pending.** The original plan was
> oracle-reviewed in thread [T-019f3c3d](https://ampcode.com/threads/T-019f3c3d-8cfa-74cd-8c62-6b645c4e97d8).

### Verification prerequisites (what to install before implementing)

Phase 2 rewrites the Rust-Tauri layer (`commands.rs`/`lib.rs`) and all routes (TS). Both now compile in this environment. A full desktop runtime smoke test still needs the GTK/WebKit packages below:

1. **Frontend type-check/build:** dependencies are installed; use `bun run build`.
2. **Rust-Tauri compile-check** (needs sudo — GTK/webkit dev libs absent):
   ```bash
   sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libatk1.0-dev \
     libsoup-3.0-dev librsvg2-dev libssl-dev libayatana-appindicator3-dev \
     libxdo-dev build-essential file
   ```
- **Not needed for Phase 2:** the `flowsta-agent-linking` repo (prebuilt `agent_linking_*.wasm` already in `dna/v1.0/workdir/` — the zome repacks without it); sidecar binaries + Flowsta `client_id` (only for a full `cargo tauri dev` runtime, already deferred to a full-toolchain machine).
- The DNA **zome (wasm) builds & packs fully in this env** (`hc` 0.6.1 + cargo + wasm32 present).

### Key boundary decisions (oracle-reviewed)

1. **Vote = schema only.** Add `Vote{issue_action_hash,approve}` + `IssueToVotes` to integrity for schema stability, but **remove** the old `cast_vote`/`get_poll_votes` coordinator fns, Tauri commands, TS wrappers, and voting UI. All voting behavior (dedup, tally, status) is **deferred to Phase 5**. Keep a plain `Vote` mirror in `commands.rs` for backup decoding only.
2. **Collapse dead multi-version routing.** Remove all `dna_version` "1.0"/"1.1"/"1.2"/"1.3" branches from issue reads/writes → single active client. Remove `dna_version` from Rust + TS response types. (Do **not** remove `AppState.app_client_v1_*` / `InstallResult` fields / `migration.rs` — those stay dormant.)
3. **Entry-index hazard.** New integrity `EntryTypes` order is fixed: `Issue(0), Comment(1), Vote(2), Flag(3), MigratedPoll(4), EncryptedEntry(5)`. `classify_dump_record()` in `commands.rs` (~L2204) hardcodes these `(zome=1, entry_idx)` mappings — must update to the new order + rename `decode_record_for_export` arms ("Issue"/"Comment"/"Vote"). Also change canonical-backup cell `role_name` "polls" → "kindact". **Never reorder these six after updating the classifier.**
4. **Drafts = freeze, don't convert.** Drafts are poll-shaped `EncryptedEntry` blobs. Keep them opaque/read-delete only; **remove** `publish_draft` (it calls removed `get_poll`/`create_poll`) + its Publish UI + drafts nav. Don't map poll-draft fields to issues. A real `DraftIssue` flow is a later change.
5. **Remove `get_export_data`** (deprecated; decodes old Poll/options/Vote) — the layout already uses `build_canonical_backup`.
6. **`migration.rs`: leave unchanged.** Compiles as-is (its Poll/Vote structs + "polls" zome strings are self-contained/dormant). Rewrite only when a real 2nd Kindact DNA version ships.
7. **Comment identity limitation:** `Comment` carries only the author agent key, not a Flowsta display name. Phase 2 shows "You" for the local linked-agent set + abbreviated key for others; real per-commenter names need a separate authoritative profile lookup (not invented here).

### Naming (rename `polls` → `issues`)
- Dir `dna/v1.0/zomes/issues/`; crates `issues_integrity` / `issues_coordinator` (drop stale `_v1_3` suffix); dna.yaml integrity zome `issues_integrity`, coordinator zome `issues`; wasm `issues_{integrity,coordinator}.wasm`; `commands.rs` const `ISSUES_ZOME = "issues"`; coordinator `use issues_integrity`.
- LinkTypes: `AllIssues, IssueToComment, IssueToSeconds, IssueToVotes, IssueToFlags, AllTags, TagToIssue, MigrationIndex, VoteToRationale, AgentDrafts` (`PollToFlags`→`IssueToFlags`; seconds/votes/tags are schema-only until later phases). Anchor `all_polls_anchor`→`all_issues_anchor`; keep `migration_anchor`.

### Ordered checklist (resume here)
1. Integrity: rename dir; new entry model (order above) + `Flag.issue_action_hash`; new LinkTypes; `all_issues_anchor` (+ Issue-backed sentinels); `validate_issue`/`validate_comment` + exhaustive validate arms.
2. Coordinator: `use issues_integrity`; `create_issue`/`get_issue`/`get_all_issues`/`delete_issue` (author-only); `post_comment` (decode target as Issue) + `get_comments`; remove `cast_vote`/`get_poll_votes` (+ `linked_agents`/`my_identity_agents` if unused); adapt flag fns → `flag_issue`/`get_issue_flags` + `IssueToFlags`; keep encrypted/migration externs.
3. `dna/v1.0/Cargo.toml` members; crate `Cargo.toml`s; `dna.yaml` zome names/wasm (keep integrity order: agent_linking=0, issues=1); `build.sh` wasm names.
4. Rebuild + repack → replace `src-tauri/resources/kindact_v1_0_happ.happ`; confirm manifest has `issues`. (Runtime note: an already-installed enabled `kindact_v1_0` won't auto-adopt the repacked DNA — reset dev app data before smoke test.)
5. `commands.rs`: new mirrors (`Issue`/`Comment`/`Vote`) + inputs + responses (`IssueListItem`/`IssueDetail`/`CommentData`); `ISSUES_ZOME`; issue CRUD + comment cmds (single client, Flowsta gate on create/comment); remove vote cmds; adapt flag cmds; remove `get_export_data`; update `classify_dump_record`/`decode_record_for_export` (index map + role_name); freeze `publish_draft`.
6. `lib.rs` `invoke_handler`: register issue/comment/flag cmds; remove poll/vote/`get_export_data`/`publish_draft`.
7. `holochain.ts`: Issue/Comment types + `createIssue`/`getIssue`/`getAllIssues`/`deleteIssue`/`postComment`/`getComments`; rename flag wrappers; remove poll/vote/`publishDraft`.
8. Routes: `index.tsx` issue list (All + Created only, no expiry/voted filters); `create/index.tsx` title+description+comma-tags (no options/expiry/type/draft); rename `routes/poll/` → `routes/issue/` detail (issue + comments + comment box + flag; no voting/tally/rationale; update all `/poll/#` → `/issue/#`); `drafts/index.tsx` read/delete only or drop nav; `layout.tsx`/identity copy Polls→Issues.

### Verify
- wasm: both issue crates compile; DNA/hApp pack; manifest coordinator zome `issues`.
- TS: type-check; no imports of removed poll/vote commands.
- Rust static: no `POLLS_ZOME`, no removed cmds in `invoke_handler`, 6-entry backup map.
- Runtime (GTK machine): reset dev data → create issue w/ tags → comment → non-author delete blocked → flag by issue hash → backup classifies Issue/Comment.
