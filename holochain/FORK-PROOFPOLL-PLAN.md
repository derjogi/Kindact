# Implementation Plan — Fork ProofPoll into Kindact

Build the minimal Kindact app (sign up · issues with title/description/tags · comments · tag sidebar & filter · 2-agent transition to voting · live approval vote) by **forking [ProofPoll](https://github.com/derjogi/ProofPoll)** rather than starting greenfield or extending the `kindact-hc/` prototype.

ProofPoll is a production-grade, fork-ready Tauri desktop hApp (Holochain 0.6.1) that already solves the brutal-but-boring foundation: bundled conductor + lair sidecars, conductor lifecycle, **sybil-resistant identity** (Flowsta), **DNA migration**, client-side encryption, cross-device recovery, one-vote-per-*human* dedup, and a CI/CD release pipeline. Its author explicitly designed it to be forked ("swap polls for reviews, proposals, a task tracker"). We keep all of that wiring, throw out the poll-specific data model, and — crucially — **reuse its vote engine for Kindact's approval vote**.

Local fork source: `~/dev/kindact/holochain-proofpoll/ProofPoll` (git `git@github.com:derjogi/ProofPoll.git`). This plan refers to files by their path *inside that repo*.

---

## User Review Required

> [!IMPORTANT]
> **Decisions baked into this plan — confirm or override before building.**
>
> 1. **ProofPoll becomes the Kindact codebase.** Fork it into a new repo/dir (e.g. `kindact-app/`). `kindact-hc/` is demoted to a *reference* we mine later for the multi-cell/lens architecture; `MINIMAL-APP-PLAN.md` is superseded by this plan.
> 2. **Identity = Flowsta = "Sign up".** Holochain identity is the agent keypair; ProofPoll links it to a verified Flowsta Vault identity. For Kindact this is a *feature*: sybil-resistant voting and (later) fair currency distribution genuinely need one-human-one-identity. We keep the existing linking flow and call it "Sign up". **Accepting this means accepting the Flowsta dependency** (users install Flowsta Vault; we register a `client_id` at dev.flowsta.com; the `../flowsta-agent-linking` crate stays in the DNA).
> 3. **Reset to a single DNA version, keep the migration *machinery*.** We collapse ProofPoll's `v1.0–v1.3` into one fresh `kindact_v1_0` (new name + new `network_seed` ⇒ a clean DHT, no ProofPoll data). We **keep** the `MigratedPoll`/`MigrationIndex` plumbing and `migration.rs` dormant, so adding Implementation Status (`v1.1`) and Currency (`v1.2`) later is a clean additive migration.
> 4. **The approval vote reuses ProofPoll's vote engine.** A Kindact issue's vote is a binary `Vote { issue_action_hash, approve: bool }`, deduped against the voter's full **linked-agent set** (ProofPoll's `my_identity_agents`) so it counts distinct *humans*, not agent keys. "Live status" is the tally read; "Pending" = fewer than 2 distinct human voters.
> 5. **Stage is derived, not stored.** "Deliberating → Voting" is computed from seconding links (≥ 2 distinct humans), same derive-on-read approach as the votes. The `Issue` entry stays immutable.
> 6. **Single-cell to start.** No multi-cell lenses yet — that's a later increment ported from `kindact-hc/`. All requested features work single-cell.

> [!NOTE]
> **Known wrinkles we accept now and resolve when hit (per your call):**
> - **Multi-agent dev loop is harder than `hc-spin`.** ProofPoll is one conductor per machine. To test 2 agents locally you run a second instance with a separate app-data dir (or a second machine), relying on the public test bootstrap. There's no built-in two-window mode like `hc-spin`. See Verification.
> - **Flowsta client_id** must be registered at dev.flowsta.com before the full sign-up flow works end-to-end; until then the app runs but linking is stubbed/unavailable.

---

## Concept mapping (ProofPoll → Kindact)

| ProofPoll | Kindact | Change |
|---|---|---|
| `Poll { title, description, options[], poll_type, closes_at }` | `Issue { title, description, tags[], created_at }` | replace |
| `Vote { poll_action_hash, option_index, … }` | `Vote { issue_action_hash, approve }` | adapt (keep dedup engine) |
| `Flag` (community flagging) | *(keep as-is, optional moderation)* | keep |
| — | `Comment { issue_action_hash, content, created_at }` | **new** |
| — | seconding link `IssueToSeconds` | **new** |
| `AllPolls` anchor + links | `AllIssues` + `AllTags` + `TagToIssue` | extend |
| `EncryptedEntry`, `MigratedPoll`, migration, identity, backups | *(infrastructure — keep verbatim)* | keep |

```diagram
KINDACT ISSUE LIFECYCLE  (single cell, derived stages)

  create_issue ──▶ ╭───────────────╮  second_issue ×2 humans  ╭──────────╮
                   │ Deliberating  │ ───────────────────────▶ │  Voting  │
                   │  • comments   │                           │ • Approve│
                   │  • seconding  │                           │ • Decline│
                   ╰───────────────╯                           ╰────┬─────╯
                                                                    │ derive
                                              ╭─────────────────────┴────────────────╮
                                              │ <2 voters → Pending                   │
                                              │ approve > decline → Approved          │
                                              │ else → Declined   (live, always shown)│
                                              ╰───────────────────────────────────────╯
```

---

## Increment ladder

Each phase leaves a **runnable app**. The MVP (all six requested features) is done at the end of Phase 5.

### Phase 0 — Fork & rename (toolchain proof)

Follow ProofPoll's [Forking Guide → Step 1](https://github.com/derjogi/ProofPoll#forking-guide) verbatim. Copy the repo to `kindact-app/`, then rename every identifier so it won't collide with ProofPoll on a machine:

- `src-tauri/tauri.conf.json` — bundle id `com.kindact.app`, product name `Kindact`, `externalBin` sidecars `binaries/kindact-{holochain,lair-keystore}`.
- `src-tauri/Cargo.toml` crate → `kindact`; `package.json` name → `kindact`.
- `src-tauri/src/conductor.rs` + `lair.rs` — `sidecar_path("kindact-…")`; admin WS port (keep `4466` or pick a free one).
- `.github/workflows/build-release.yml` — sidecar download names.
- `dna/*/workdir/{dna,happ}.yaml` — names/seeds/roles (handled fully in Phase 1).
- `src-tauri/src/dna.rs` (`APP_ID_*`, `HAPP_FILE_*`, the `"proofpoll"` WS origin), `commands.rs` & `migration.rs` (`ROLE_NAME`).
- App-name strings shown to the user: `linkFlowstaIdentity("Kindact")` in `src/routes/layout.tsx` and `src/routes/identity/index.tsx`.
- `.env` — `VITE_FLOWSTA_CLIENT_ID` (register at dev.flowsta.com).

**Verify:** `bash build-all.sh && npm install && cargo tauri dev` launches a renamed app that still does polls. This is purely to prove the toolchain runs for you before we touch the data model.

### Phase 1 — Reset to a single Kindact DNA version

- Delete `dna/v1.1`, `dna/v1.2`, and the old `dna/v1.0` poll content; create **one** version `dna/v1.0` named `kindact_v1_0` with `network_seed: "kindact-network-v1.0"` (fresh DHT, no ProofPoll data). Keep both zomes the DNA needs: `agent_linking` (Flowsta) + the app zome (renamed `issues`).
- `build-all.sh` builds just the one version into `src-tauri/resources/`.
- `src-tauri/src/dna.rs` / `migration.rs` — point `ACTIVE_APP_ID` at `kindact_v1_0`. **Keep** `MigratedPoll`/`MigrationIndex` types and `migration.rs` intact but dormant (no prior version to migrate from yet). They light up when we ship `v1.1`.

**Verify:** app builds and runs against the new single-version DHT; identity linking still works.

### Phase 2 — Issues + comments (replace polls)

#### [MODIFY] `dna/v1.0/zomes/issues/integrity/src/lib.rs` (was `polls/integrity`)
- Replace `Poll` with:
  ```rust
  #[hdk_entry_helper] #[derive(Clone, PartialEq)]
  pub struct Issue { pub title: String, pub description: String,
                     pub tags: Vec<String>, pub created_at: i64 }
  ```
- Repurpose `Vote` for the approval vote (Phase 5): `Vote { issue_action_hash: ActionHash, approve: bool }`.
- **Add** `Comment { issue_action_hash: ActionHash, content: String, created_at: i64 }`.
- Update `EntryTypes` (`Issue`, `Comment`, `Vote`, `Flag`, `MigratedPoll`, `EncryptedEntry`) and `LinkTypes` (`AllIssues`, `IssueToComment`, `IssueToSeconds`, `IssueToVotes`, plus the kept `AllTags`/`TagToIssue`, `MigrationIndex`, `VoteToRationale`, `AgentDrafts`).
- Rename the sentinel-anchor helpers (the `hash_entry` of a sentinel pattern at [integrity L160–195](file:///home/jonas/dev/kindact/holochain-proofpoll/ProofPoll/dna/v1.3/zomes/polls/integrity/src/lib.rs)): `all_issues_anchor()`, `migration_anchor()` (keep), and add `tag_anchor(name)` + `all_tags_anchor()`.
- `validate_poll` → `validate_issue` (title non-empty; tags optional). Keep `validate_encrypted_entry` etc. verbatim.

#### [MODIFY] `dna/v1.0/zomes/issues/coordinator/src/lib.rs`
- `create_poll` → `create_issue` (same anchor+link shape as [coordinator L64–89](file:///home/jonas/dev/kindact/holochain-proofpoll/ProofPoll/dna/v1.3/zomes/polls/coordinator/src/lib.rs)); also link each tag (Phase 3).
- `get_all_polls` → `get_all_issues`; `get_poll` → `get_issue`; `delete_poll` → `delete_issue` (keep author-only check).
- **Add** `post_comment(CreateCommentInput)` + `get_comments(issue_action_hash)` — copy the `PollToVotes` link/query pattern into `IssueToComment`.

#### [MODIFY] Tauri + frontend
- `src-tauri/src/commands.rs` — rename poll/vote commands, add comment commands; register them in `src-tauri/src/lib.rs` `invoke_handler![…]`. Add a `match` arm per new entry type in `build_canonical_backup` + `decode_record_for_export` (backup stays in sync).
- `src/lib/holochain.ts` — replace `Poll*` types/wrappers with `Issue`/`Comment`; **keep** identity, migration, encrypted-entry wrappers.
- `src/routes/index.tsx` → issue list; `src/routes/create/index.tsx` → issue form (title, description, comma-separated tags); `src/routes/poll/index.tsx` → issue detail with comments + comment box. Keep `layout.tsx` (startup/header/migration banner) and `identity/index.tsx` as-is (rename labels).

**Verify:** create an issue, see it in the list, open it, post a comment — all attributed to your Flowsta display name.

### Phase 3 — Tag sidebar & filter

- Coordinator: in `create_issue`, for each non-empty tag `ensure` a `tag_anchor("tag:{t}")`, link tag→issue (`TagToIssue`) and `all_tags_anchor`→tag-anchor (`AllTags`, dedup). Add `get_all_tags()` and `get_issues_by_tag(tag)`.
- Tauri commands + `holochain.ts` wrappers for both.
- `src/routes/index.tsx`: a sidebar listing tags (+ "All issues"); selecting one switches the feed to `get_issues_by_tag`.

**Verify:** tags created on issues appear in the sidebar across agents; filtering narrows the list; "All issues" clears it.

### Phase 4 — Transition to voting (2 distinct humans)

- Coordinator `second_issue(issue_action_hash)`: `create_link(issue, my_agent, IssueToSeconds, ())`. Count distinct **humans** by reusing ProofPoll's `my_identity_agents` set ([coordinator L174–253](file:///home/jonas/dev/kindact/holochain-proofpoll/ProofPoll/dna/v1.3/zomes/polls/coordinator/src/lib.rs)) so one person can't second twice across devices — same guard ProofPoll already uses for votes/flags.
- Stage derivation lives in `get_issue_state` (Phase 5): `seconds = distinct identity-groups among IssueToSeconds authors`; `stage = Voting if seconds >= 2 else Deliberating`.
- UI: a "Second for voting (n/2)" button on the issue detail; disabled once you've seconded.

**Verify:** two different signed-in humans second an issue → it flips to Voting in both apps.

### Phase 5 — Approval vote with live status (MVP complete)

- Coordinator `cast_vote(CastVoteInput { issue_action_hash, approve })`: reuse the existing dedup-against-`my_identity_agents` body verbatim, swapping `PollToVotes`→`IssueToVotes` and storing `approve: bool`.
- **Add** the single read the UI polls:
  ```rust
  #[derive(Serialize, Deserialize, Debug)]
  pub struct IssueState {
      pub stage: String,          // "Deliberating" | "Voting"
      pub second_count: u32, pub seconded_by_me: bool,
      pub voting_status: String,  // "Pending" | "Approved" | "Declined"
      pub approve_count: u32, pub decline_count: u32, pub total_voters: u32,
      pub my_vote: Option<bool>,
  }
  ```
  Derivation: collapse `IssueToSeconds` / `IssueToVotes` link authors into identity-groups (via `my_identity_agents`-style grouping) before counting, so thresholds count humans. `stage = Voting iff seconds >= 2`. `voting_status = Pending if total_voters < 2 else (approve > decline ? Approved : Declined)` (tie ⇒ Declined). Constants `SECONDS_REQUIRED = 2`, `MIN_VOTERS = 2`.
- Tauri command + `holochain.ts` wrapper for `get_issue_state`.
- UI: when `stage === "Voting"`, show **Approve / Decline** and a live badge **`Voting: Pending / Approved / Declined`** with tallies and your current vote. Poll `get_issue_state` on an interval (+ refresh after writes), mirroring ProofPoll's existing refresh pattern.

**Verify (the demo):** Phase-5 MVP end-to-end — sign up two humans, file an issue with tags, comment, filter by tag, both second it → Voting, then watch the badge move Pending → Approved/Declined live as each votes.

---

## Out of scope now (the migration system makes these clean later)

| Future | How it slots in |
|---|---|
| **Implementation Status + proof of work** | Ship as DNA **`v1.1`** (additive integrity → new entry `WorkProof`, optionally private via the existing `EncryptedEntry`). `migration.rs` carries issues/votes forward — exactly the Tier-2 flow ProofPoll demonstrates. |
| **Fake currency distribution** | DNA **`v1.2`** — a ledger zome minting fake balance on `Completed` issues, keyed to Flowsta-verified identities (sybil resistance already solved). In-cell, no bridge/EVM. |
| **Multi-cell lenses / cross-cell discovery** | Port from `kindact-hc/` (specs 042/049/050) once the product foundation is solid. |

---

## Verification Plan

### Per-phase build
```bash
cd kindact-app
bash build-all.sh        # builds the kindact_v1_0 happ into src-tauri/resources/
npm install
cargo tauri dev          # launches the desktop app
npm run lint
```
- Port the existing zome tests (ProofPoll ships Rust zome logic worth a Sweettest harness): assert `second_issue` ×2 distinct agents ⇒ `stage == "Voting"`; `<2` voters ⇒ `Pending`; approve-majority ⇒ `Approved`; tie/decline-majority ⇒ `Declined`; and that a re-vote by the *same identity* is rejected (the `my_identity_agents` guard).

### Two-agent manual test (note the wrinkle)
ProofPoll is one conductor per machine, so there's no `hc-spin` multi-window. Options, easiest first:
1. **Two app-data dirs on one machine** — launch a second `cargo tauri dev` with a distinct app identifier/data dir so it spins a second conductor + agent; both find each other via the public test bootstrap.
2. **Two machines / VMs** — most faithful; what real users do.

Walk the Phase-5 demo across the two instances. If issues/comments/seconds/votes don't propagate within gossip latency, check the bootstrap/signal config in `src-tauri/src/conductor.rs` and `.env` first.

> If the multi-agent dev loop proves painful, a fallback is to keep a tiny `hc-spin` harness around the *zome* (data layer only) for fast iteration, and use the full Tauri app for integration/identity testing.
