# Implementation Plan — Kindact Minimal hApp

A **single-DNA, single-cell** Holochain app that lets you and other agents sign up, file issues, comment, browse/filter by tag, second an issue into a voting stage, and run a live approval vote. Deliberately minimal: no registry DNA, no anchors-across-cells, no jurisdictional claims, no bridge, no EVM. It strips the complex multi-cell prototype in [`kindact-hc/`](kindact-hc/) down to the smallest thing that demonstrates the core deliberation loop end-to-end across real, gossiping agents.

This plan reuses the proven toolchain from [`kindact-hc/`](kindact-hc/) (holonix 0.6, `hdk` 0.6.1 / `hdi` 0.7.1, `hc-spin` multi-agent windows, Lit UI) and the working issue+comment+anchor zome patterns in [wind_turbine](kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs), but in a fresh, uncoupled directory.

---

## User Review Required

> [!IMPORTANT]
> **Key decisions baked into this plan — confirm or override before building.**
>
> 1. **New, separate hApp.** Built in a new sibling directory `kindact-minimal/`, leaving the complex `kindact-hc/` prototype untouched. *Alternative: strip down `kindact-hc/` in place (rejected — destroys the multi-cell prototype that answers different questions).*
> 2. **One DNA, one network, one cell.** Every agent installs the same DNA with `network_seed: null`, so everyone shares one DHT and sees the same issues. No `global_registry`, no per-topic cells. This is what "me and other users in one shared space" means at minimum scope.
> 3. **"Sign up" = create a profile.** Holochain identity is the agent's cryptographic keypair; there are no passwords. Signing up means choosing a **nickname** stored as a `Profile` entry bound to your `AgentPubKey`. First launch with no profile shows a nickname gate.
> 4. **Stage and vote status are *derived from links*, not stored on the issue.** The `Issue` entry is immutable; "Deliberating vs. Voting" and "Approved/Declined/Pending" are computed on read by counting distinct link authors. This avoids cross-agent update races and entry-mutation plumbing. *Trade-off: no single authoritative "finalized" record — fine for the prototype; revisit when adding the bridge/currency.*
> 5. **Seconding rule:** an issue enters the **Voting** stage once **2 distinct agents** have pressed "Second for voting". (The original author may be one of the two.)
> 6. **Approval-vote rule:** `Pending` while fewer than **2 distinct voters**; otherwise `Approved` if approvals **>** declines, else `Declined` (a tie counts as Declined). One vote per agent, latest vote wins. These thresholds are constants and easy to tune.
> 7. **Permissive validation** in the integrity zome for now (matches the current prototype). Tightening (one-second-per-agent, vote only after voting stage, etc.) is a follow-up, not in scope.

> [!TIP]
> **How you'll test it:** `npm run start` launches two real Electron windows (Agent #1 and Agent #2), each a genuine conductor gossiping over a local DHT. Agent #1 files an issue; Agent #2 sees it, comments, and seconds it; once both have seconded, the voting panel opens in both windows and the status badge updates live as each casts an approve/decline vote.

---

## Architecture at a glance

```diagram
╭───────────────────────────────────────────────────────────────╮
│ kindact-minimal  (ONE DNA, ONE shared DHT)                     │
│                                                               │
│  integrity zome: kindact_integrity                            │
│    entries:  Profile · Issue · Comment · Vote · Anchor        │
│    links:    AllIssues · AllTags · TagToIssue · IssueToComment │
│              IssueToSecond · IssueToVote · AgentToProfile      │
│              AllProfiles                                       │
│                                                               │
│  coordinator zome: kindact   (the client-facing API)          │
│    profiles · issues · tags · comments · seconding · voting    │
│    get_issue_state()  ← derives stage + vote status on read    │
╰───────────────────────────────────────────────────────────────╯
        ▲                                   ▲
        │ WebSocket (@holochain/client)     │
   ╭────┴─────╮                        ╭────┴─────╮
   │ Window 1 │  hc-spin, real gossip  │ Window 2 │
   │ Agent #1 │◀──────── DHT ─────────▶│ Agent #2 │
   ╰──────────╯                        ╰──────────╯
```

### Stage / vote derivation (the only non-obvious logic)

```diagram
seconds  = distinct authors of IssueToSecond links on the issue
stage    = if seconds >= 2 then "Voting" else "Deliberating"

votes    = latest Vote per distinct voter (by IssueToVote link author)
voters   = count(votes)
status   = if voters < 2            → "Pending"
           else if approve > decline → "Approved"
           else                      → "Declined"
```

---

## Proposed Changes

### Phase 0 — Scaffold the skeleton

Use the official scaffolder inside the Nix shell so the flake, workspace, Lit UI, and run scripts are generated correctly, then hand-edit. Run from `holochain/`:

```bash
nix develop ./kindact-hc#default --command hc scaffold web-app kindact-minimal
# choose: Lit, "Vanilla" (no holo-host), and the default network setup
```

This produces `kindact-minimal/` with `flake.nix`, `Cargo.toml` workspace, `dnas/`, `ui/`, `workdir/happ.yaml`, and the same `npm run start` / `build:happ` scripts seen in [kindact-hc/package.json](kindact-hc/package.json). If the scaffolder version drifts, copy [flake.nix](kindact-hc/flake.nix), [Cargo.toml](kindact-hc/Cargo.toml) (trimmed to one DNA), and [ui/package.json](kindact-hc/ui/package.json) from `kindact-hc/` as known-good references.

Then scaffold one DNA and zome pair:

```bash
cd kindact-minimal
nix develop --command hc scaffold dna kindact
nix develop --command hc scaffold zome kindact   # integrity + coordinator pair
```

**Pin versions** in the root `Cargo.toml` to match the working prototype: `hdi = "=0.7.1"`, `hdk = "=0.6.1"`, `holochain 0.6.1`, holonix `main-0.6`.

#### [NEW] `kindact-minimal/workdir/happ.yaml`
- Single role `kindact`, `provisioning.strategy: create`, `network_seed: null`, `clone_limit: 0`. (Contrast with [kindact-hc's three-role happ.yaml](kindact-hc/workdir/happ.yaml).)

---

### Phase 1 — Sign-up (profiles)

#### [NEW] `dnas/kindact/zomes/integrity/kindact_integrity/src/lib.rs`
Define all entry & link types up front (so later phases only touch the coordinator). Model on the existing [wind_turbine_integrity](kindact-hc/dnas/manhattan_windturbine/zomes/integrity/wind_turbine_integrity/src/lib.rs):

```rust
#[hdk_entry_helper] #[derive(Clone)]
pub struct Profile { pub nickname: String }

#[hdk_entry_helper] #[derive(Clone)]
pub struct Issue { pub title: String, pub description: String, pub tags: Vec<String> }

#[hdk_entry_helper] #[derive(Clone)]
pub struct Comment { pub issue_hash: ActionHash, pub content: String }

#[hdk_entry_helper] #[derive(Clone)]
pub struct Vote { pub issue_hash: ActionHash, pub approve: bool }

// Reused anchor pattern: deterministic link base every agent can re-hash to.
#[hdk_entry_helper] #[derive(Clone)]
pub struct Anchor { pub name: String }

#[hdk_entry_types] #[unit_enum(UnitEntryTypes)]
pub enum EntryTypes { Profile(Profile), Issue(Issue), Comment(Comment), Vote(Vote), Anchor(Anchor) }

#[hdk_link_types]
pub enum LinkTypes {
    AllProfiles, AgentToProfile,         // sign-up
    AllIssues,                           // issue list
    AllTags, TagToIssue,                 // tag sidebar + filter
    IssueToComment,                      // comments
    IssueToSecond,                       // transition to voting
    IssueToVote,                         // approval vote
}
```
- Keep `validate` permissive (`Ok(ValidateCallbackResult::Valid)`) and `genesis_self_check`/`validate_agent_joining` as in the prototype.

#### [NEW] `dnas/kindact/zomes/coordinator/kindact/src/lib.rs` (profiles section)
- `create_profile(nickname: String) -> ExternResult<ActionHash>`: create `Profile`, link `AgentToProfile` from `agent_info()?.agent_initial_pubkey` → profile, and link an `all_profiles` anchor → profile.
- `get_my_profile() -> ExternResult<Option<Profile>>`: read via `AgentToProfile` from caller's pubkey.
- `get_profile(agent: AgentPubKey) -> ExternResult<Option<Profile>>`: used to render comment/vote author names.
- Helper `ensure_anchor(name)` (lifted from [`ensure_all_issues_anchor`](kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs)) reused by all anchors.

---

### Phase 2 — Issues + tags (sidebar & filter)

#### [MODIFY] coordinator `src/lib.rs` (issues + tags section)
- `CreateIssueInput { title, description, tags: Vec<String> }`.
- `create_issue(input) -> ActionHash`:
  - create `Issue`; link `all_issues` anchor → issue (`AllIssues`).
  - for each non-empty trimmed tag: `ensure_anchor(format!("tag:{tag}"))`, link tag-anchor → issue (`TagToIssue`), and link `all_tags` anchor → tag-anchor (`AllTags`, dedup so the sidebar lists each tag once).
- `get_all_issues() -> Vec<(ActionHash, Issue)>` — copy the link-walk from the prototype's [`get_all_issues`](kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs).
- `get_all_tags() -> Vec<String>` — walk `AllTags`, deref each `Anchor`, strip the `tag:` prefix, dedup, sort.
- `get_issues_by_tag(tag: String) -> Vec<(ActionHash, Issue)>` — re-hash `Anchor{ name: "tag:{tag}" }`, walk `TagToIssue`.

---

### Phase 3 — Comments

#### [MODIFY] coordinator `src/lib.rs` (comments section)
- `PostCommentInput { issue_hash, content }`; `post_comment(input) -> ActionHash`: create `Comment`, link issue → comment (`IssueToComment`). Mirrors prototype [`post_comment`](kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs).
- `get_comments_for_issue(issue_hash) -> Vec<CommentView>` where `CommentView { hash, content, author: AgentPubKey, nickname: Option<String> }`. Use each link's `author` field for attribution (resolve nickname via `get_profile`).

---

### Phase 4 — Transition to voting (2-agent second)

#### [MODIFY] coordinator `src/lib.rs` (seconding section)
- `second_for_voting(issue_hash) -> ActionHash`: `create_link(issue_hash, agent_pubkey, IssueToSecond, ())`. The link's `author` identifies the seconder, so distinct authors = distinct seconds. (Optional, deferred: reject a duplicate second by the same agent — left permissive for now.)
- Counting happens in `get_issue_state` (Phase 5): `seconds = unique link.author over IssueToSecond`; `stage = if seconds >= 2 { Voting } else { Deliberating }`.

---

### Phase 5 — Approval vote with live status

#### [MODIFY] coordinator `src/lib.rs` (voting + derived state)
- `CastVoteInput { issue_hash, approve: bool }`; `cast_vote(input) -> ActionHash`: create a `Vote` entry, link issue → vote (`IssueToVote`).
- `get_issue_state(issue_hash) -> IssueState`, the single read the UI polls per issue:

```rust
#[derive(Serialize, Deserialize, Debug)]
pub struct IssueState {
    pub stage: String,          // "Deliberating" | "Voting"
    pub second_count: u32,
    pub seconded_by_me: bool,
    pub voting_status: String,  // "Pending" | "Approved" | "Declined"
    pub approve_count: u32,
    pub decline_count: u32,
    pub total_votes: u32,
    pub my_vote: Option<bool>,
}
```
  - `me = agent_info()?.agent_initial_pubkey`.
  - **Seconds:** walk `IssueToSecond`, collect distinct `link.author` → `second_count`, `seconded_by_me`; `stage = "Voting"` iff `>= 2`.
  - **Votes:** walk `IssueToVote`; for each link deref the `Vote` entry and key by `link.author`, keeping the latest by `link.timestamp` (last vote wins). Tally `approve_count`/`decline_count`; `total_votes = distinct voters`; `my_vote` from `me`'s latest.
  - **Status:** `if total_votes < 2 { "Pending" } else if approve_count > decline_count { "Approved" } else { "Declined" }`.
- Thresholds (`SECONDS_REQUIRED = 2`, `MIN_VOTERS = 2`) as named constants.

---

### Phase 6 — UI (Lit single-page app)

Replace the scaffolded boilerplate. Keep it one component tree; reuse the connection bootstrap and 3-second polling pattern from the prototype's [holochain-app.ts](kindact-hc/ui/src/holochain-app.ts) (connect via `AppWebsocket`, read agent pubkey from `appInfo()`, poll + refresh-after-write so cross-agent changes surface).

#### [NEW] `ui/src/types.ts`
- TS mirrors of `Profile`, `Issue`, `CommentView`, `IssueState`, and the input structs.

#### [MODIFY] `ui/src/holochain-app.ts`
- **Sign-up gate:** on load call `get_my_profile`; if `null`, render a nickname form → `create_profile`. Display the active agent's nickname + short pubkey in the header (so Window 1 vs Window 2 are distinguishable, like the prototype).
- **Sidebar:** `get_all_tags` → list of tags plus an "All issues" entry; selecting one sets a filter and switches the feed to `get_issues_by_tag` (vs `get_all_issues`).
- **Issue feed:** create-issue form (title, description, comma-separated tags) + list of issue cards. Each card polls `get_issue_state` and shows:
  - comments list + comment box (`get_comments_for_issue` / `post_comment`),
  - a **"Second for voting (n/2)"** button (`second_for_voting`); disabled-with-check once `seconded_by_me`,
  - once `stage === "Voting"`: an **Approve / Decline** pair (`cast_vote`) and a live badge: **`Voting: Pending` / `Approved` / `Declined`**, plus the `approve/decline` tallies and the user's own current vote.
- **Polling:** every ~3s plus immediately after any write, identical cadence to the prototype, so seconds/votes from the other window appear without reload.

---

## Out of scope now (designed-for, built later)

These are intentionally excluded but the data model leaves room for them:

| Future feature | How it slots in later |
|---|---|
| **Implementation Status + proof of work** | Add a `WorkProof { issue_hash, evidence_uri, note }` entry + `IssueToWork` link and an `implementation` stage in the derived state, reachable after `Approved`. No schema changes to existing entries. |
| **Fake currency distribution** | Add a `LedgerEntry`/transfer zome that mints fake balance on `Completed` issues, keyed off agent pubkeys — mirrors how the current prototype treats $CC as non-real. Stays entirely in-cell; no bridge/EVM. |

Keeping these out now is what makes the first build small and shippable.

---

## Verification Plan

### Automated
Run inside the Nix shell from `kindact-minimal/`:
```bash
nix develop --command npm install
nix develop --command npm run build:happ      # zomes compile to wasm + happ packs
nix develop --command npm run build --workspace ui   # UI type-checks & builds
```
- Add a lightweight Rust integration test (Sweettest, following the existing [registry tests](kindact-hc/dnas/global_registry/zomes/coordinator/registry/tests/cell_directory.rs)) covering the derivation logic:
  - one second → `stage == "Deliberating"`; second second by a *different* agent → `stage == "Voting"`;
  - `< 2` voters → `"Pending"`; 2 votes approve-majority → `"Approved"`; decline-majority/tie → `"Declined"`;
  - re-vote by the same agent flips the tally (last-wins), doesn't double-count.
  ```bash
  nix develop --command npm test
  ```

### Manual (two-agent demo)
```bash
nix develop --command npm run start    # opens Agent #1 and Agent #2 windows
```
1. Each window: sign up with a nickname ("Alice", "Bob"). Header shows the right identity.
2. **Alice** creates an issue with tags `infra, energy`; **Bob's** feed shows it within one poll tick; both tags appear in Bob's sidebar.
3. Bob filters by `energy` → only the tagged issue shows; "All issues" clears the filter.
4. Bob comments; Alice sees the comment attributed to "Bob".
5. Bob presses **Second for voting** → badge shows `1/2`, stage still Deliberating. Alice presses Second → both windows flip to **Voting** stage; status badge reads **`Voting: Pending`**.
6. Alice votes **Approve** → still `Pending` (1 voter). Bob votes **Approve** → both windows show **`Voting: Approved`** live. Flip Bob to **Decline** → tie → badge updates to **`Voting: Declined`**.
7. Restart both conductors (`Ctrl-C`, re-run `npm run start` *without* `hc sandbox clean`) and confirm issues/comments/votes replay from source chains + DHT.

If steps 5–6 don't reflect the other agent's actions within a few seconds on a single machine, the derivation or the poll/refresh wiring is the place to look first.
