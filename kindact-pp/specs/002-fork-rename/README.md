---
status: in-progress
created: 2026-06-06
priority: high
tags:
- fork
- tooling
parent: '001'
created_at: 2026-06-06T21:28:57.134420627Z
updated_at: 2026-06-08T01:44:33.574304370Z
transitions:
- status: in-progress
  at: 2026-06-08T01:44:33.574304370Z
---

# Phase 0 — Fork & Rename ProofPoll to Kindact

> **Status**: planned · **Priority**: high · **Created**: 2026-06-06

## Overview

Phase 0 of [001-proofpoll-fork-mvp](../001-proofpoll-fork-mvp/README.md). Rename every ProofPoll identifier in `kindact-pp/` to Kindact so the app won't collide with an installed ProofPoll on the same machine. **No behavior change** — at the end the app still does polls; this only proves the toolchain builds and runs for us before we touch the data model.

Follow ProofPoll's [Forking Guide → Step 1](https://github.com/derjogi/ProofPoll#forking-guide) verbatim.

## Design

Identifiers that **must** change (collision risk on a shared machine):

| What | Where | → |
|---|---|---|
| Bundle id | `src-tauri/tauri.conf.json` | `com.kindact.app` |
| Product name | `src-tauri/tauri.conf.json` | `Kindact` |
| Sidecars (`externalBin`) | `src-tauri/tauri.conf.json` | `binaries/kindact-{holochain,lair-keystore}` |
| Rust crate | `src-tauri/Cargo.toml` | `kindact` |
| npm package | `package.json` | `kindact` |
| Sidecar resolver | `src-tauri/src/conductor.rs`, `lair.rs` | `sidecar_path("kindact-…")` |
| CI binary names | `.github/workflows/build-release.yml` | `binaries/kindact-…-<triple>` |
| Admin WS port | `src-tauri/src/conductor.rs` | keep `4466` or pick a free one |
| App-id / happ constants | `src-tauri/src/dna.rs` (`APP_ID_*`, `HAPP_FILE_*`, `"proofpoll"` WS origin) | `kindact*` |
| Role name | `src-tauri/src/commands.rs`, `migration.rs` (`ROLE_NAME`) | `kindact` |
| Vault dialog name | `src/routes/layout.tsx`, `identity/index.tsx` (`linkFlowstaIdentity("…")`) | `"Kindact"` |
| Flowsta client id | `.env` (`VITE_FLOWSTA_CLIENT_ID`) | register at dev.flowsta.com |

> DNA `name`/`network_seed`/`happ` names in `dna/*/workdir/*.yaml` are renamed in Phase 1 (where versions are also collapsed), so leave them for now or do them together.

## Plan

- [x] Rename `tauri.conf.json` bundle id (`com.kindact.app`), product name + window title (`Kindact`), sidecars (`binaries/kindact-{holochain,lair-keystore}`)
- [x] Rename Rust crate (`kindact`) + npm package (`kindact`)
- [x] Update sidecar resolver calls (`conductor.rs`, `lair.rs`, `sidecar.rs`) + Windows `SIDECAR_TITLE_MARKERS` (`process_ext.rs`)
- [x] Update WS origin / log-file labels (`Some("kindact")` in `dna.rs`/`commands.rs`/`lib.rs`) + env-var prefix (`KINDACT_*` in `conductor.rs`)
- [x] Update `linkFlowstaIdentity` app name strings + all UI brand text (`layout.tsx`, `identity/index.tsx`)
- [x] Rename brand-namespaced localStorage keys (`kindact.signin.*`)
- [ ] **Deferred to Phase 1** — `APP_ID_V1_x` / `HAPP_FILE_V1_x` constants, the `proofpoll_v1_3_happ.happ` resource, and `ROLE_NAME` (`commands.rs`/`migration.rs`). These are tied to the *built* happ bundle (role id + filename); renaming them now would break against the existing artifact. They move together when Phase 1 collapses versions and reseeds to `kindact_v1_0` with role `kindact`.
- [ ] **External / user action** — register a Flowsta `client_id` at dev.flowsta.com and set `VITE_FLOWSTA_CLIENT_ID` (no `.env` shipped in this copy; create one when wiring identity).

## Test

- [x] `tauri.conf.json` + `package.json` remain valid JSON; `Cargo.toml` parses (`cargo metadata` OK)
- [x] No stray brand `proofpoll` tokens remain except the intentionally-deferred `proofpoll_v1_x` / `ROLE_NAME`
- [ ] `bash build-all.sh` + `cargo tauri dev` — **not runnable in this environment yet**: Tauri Linux GUI system libs (e.g. `libatk1.0-dev`/`libgtk-3-dev`) are missing and the holochain/lair sidecar binaries aren't downloaded into `src-tauri/binaries/`. Per project decision, verify on a machine with the full toolchain.
- [ ] No sidecar/install collision with an installed ProofPoll (distinct bundle id + sidecar names) — verify at install time

## Notes

**What was actually changed:** brand-only, build/identity-independent identifiers (product name, bundle id, crate/npm names, sidecar binary names + their resolver/Windows-marker references, WS origin + log-file labels, `KINDACT_*` env prefix, all `ProofPoll`→`Kindact` UI/comment text, Flowsta `appName`, localStorage namespaces).

**Key decision — deferral split:** anything tied to the *installed happ bundle* (`APP_ID_V1_x`, happ filenames, the `proofpoll_v1_3_happ.happ` resource, and `ROLE_NAME` which must equal the happ.yaml role id) was intentionally **left untouched**. The current built artifact `src-tauri/resources/proofpoll_v1_3_happ.happ` was packaged with role `proofpoll`; the Rust still references it consistently, so the app stays coherent. Phase 1 ([003](../003-single-dna-version/README.md)) renames + reseeds all of these in one move.

**Environment gaps (not blockers, deferred per project call):** Tauri Linux GUI dev libs and the sidecar binaries are absent here, so a full `cargo tauri dev` can't be exercised yet. All edits were pure string/const/comment substitutions (config files re-validated), so compile risk from the rename itself is negligible.

`README.md` (the upstream ProofPoll fork guide) was deliberately **not** rebranded — it's kept as reference documentation.
