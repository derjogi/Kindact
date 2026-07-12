---
status: complete
created: 2026-06-06
priority: high
tags:
- dna
- migration
depends_on:
- '002'
parent: '001'
created_at: 2026-06-06T21:28:57.179048796Z
updated_at: 2026-07-09T09:41:00.773574525Z
completed_at: 2026-07-09T09:41:00.773574525Z
transitions:
- status: in-progress
  at: 2026-07-09T09:28:53.989842287Z
- status: complete
  at: 2026-07-09T09:41:00.773574525Z
---

# Phase 1 — Reset to a Single Kindact DNA Version

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 1 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). ProofPoll ships four DNA versions (`v1.0`–`v1.3`) with a live migration chain. Kindact starts fresh: **collapse to one version** `kindact_v1_0` on a new `network_seed` (a clean DHT with no ProofPoll data), while **keeping the migration machinery dormant** so future additive versions (Implementation Status `v1.1`, Currency `v1.2`) are clean Tier-2 migrations.

## Design

- A new integrity/coordinator DNA hash is created whenever integrity zomes or `network_seed` change ⇒ new DHT. By renaming + reseeding once now, we avoid inheriting ProofPoll's poll history and version sprawl.
- **Keep** the migration plumbing (`MigratedPoll`/`MigrationIndex` entry+link types, `migration_anchor()`, `src-tauri/src/migration.rs`) even though there is nothing to migrate *from* yet. It activates the first time we ship `v1.1`. This is the single most valuable piece of ProofPoll infra to preserve.
- Keep both zomes the cell needs: `agent_linking` (Flowsta identity) + the app zome (renamed `polls` → `issues` in Phase 2).

## Plan

- [x] Delete `dna/v1.1`, `dna/v1.2`, and old `dna/v1.0` poll content; create a single `dna/v1.0` (promoted from the full-featured v1.3 base — see Notes)
- [x] `dna/v1.0/workdir/dna.yaml`: `name: kindact_v1_0`, `network_seed: "kindact-network-v1.0"`
- [x] `dna/v1.0/workdir/happ.yaml`: `name: kindact_v1_0_happ`, role `kindact`
- [x] `build-all.sh` builds just the one version into `src-tauri/resources/`
- [x] `src-tauri/src/dna.rs` / `migration.rs`: point `ACTIVE_APP_ID` at `kindact_v1_0`; keep `MigratedPoll`/`MigrationIndex` intact but dormant
- [x] Confirm `agent_linking` zome still present in the new `dna.yaml`
- [x] **Resolved Phase 0 deferrals** — renamed `APP_ID`/`HAPP_FILE` constants to `kindact_v1_0`, `ROLE_NAME` → `kindact` (`commands.rs` + `migration.rs`), and `tauri.conf.json` resource → `kindact_v1_0_happ.happ`

## Test

- [x] `hc dna pack` + `hc app pack` emit exactly one `kindact_v1_0.dna` + `kindact_v1_0_happ.happ`, copied into `src-tauri/resources/` (the full `bash build-all.sh` also rebuilds the `agent_linking` zome, which needs the external `flowsta-agent-linking` repo — not present here; repacked from the existing agent-linking wasm instead)
- [x] Kindact `polls` zome compiles cleanly to `wasm32-unknown-unknown`
- [ ] `cargo tauri dev` launches against the new single-version DHT — **env-blocked** (GTK/webkit dev libs absent, no passwordless sudo; same gap as Phase 0). Verify on a full-toolchain machine.
- [ ] Flowsta identity linking still works after the reseed — requires runtime + a Flowsta `client_id`; verify with `cargo tauri dev`
- [x] `get_migration_status` returns a clean/no-op state — verified by code review: single version ⇒ `needs_migration=false`, all legacy clients `None`, `should_migrate` is `false`, and `run_migration` early-returns since no source client exists (oracle-reviewed)

## Notes

Decision: we deliberately **do not** carry over ProofPoll poll data — Kindact is a different app on a different network. The migration system's value here is *forward* (shipping our own v1.1/v1.2 safely), not *backward*.

**Base version chosen — v1.3, not the old root v1.0.** The single `kindact_v1_0` was promoted from ProofPoll's v1.3 (`git mv dna/v1.3 dna/v1.0`), because v1.3 carries the full feature set the Rust side already depends on (`Flag`, `MigratedPoll`, `EncryptedEntry`, `MigrationIndex`, all link types) — the old root `dna/` v1.0 had only `Poll`+`Vote`. `dna/v1.1`, `dna/v1.2`, and the old root v1.0 zomes/workdir/Cargo were deleted.

**Migration kept dormant, not removed.** `install_dnas()` now installs only `kindact_v1_0`; `setup_app_interface()` connects only the active client and returns `None` for the three legacy client slots. The `InstallResult` legacy flags, `AppState` legacy client fields, `conductor.rs` `StartupResult` fields, and all of `migration.rs` are retained (compiled, wired, inert). They light up the first time a second DNA version ships.

**Known cosmetic item deferred to Phase 2:** `get_poll`/`get_all_polls` still report `dna_version: "1.3"`, which the vote-routing code (`cast_vote`/`get_poll_votes`) treats as the "active client" sentinel (anything not `"1.0"/"1.1"/"1.2"` → active). It's functionally correct but the string is stale; Phase 2 rewrites these poll commands (polls → issues) and will clean up the routing then.

**Commit hygiene:** `dna/v1.0/` and `src-tauri/resources/kindact_v1_0_happ.happ` are new/untracked; the packed `*.dna`/`*.happ`/`*.wasm` under `workdir/` are build artifacts (kept untracked as before — only the yaml/build.sh/zome source should be committed). `dna/v1.0/target/` is gitignored.
