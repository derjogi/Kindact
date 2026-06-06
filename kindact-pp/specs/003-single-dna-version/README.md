---
status: planned
created: 2026-06-06
priority: high
tags:
- dna
- migration
depends_on:
- '002'
parent: '001'
created_at: 2026-06-06T21:28:57.179048796Z
updated_at: 2026-06-06T21:32:05.342078915Z
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

- [ ] Delete `dna/v1.1`, `dna/v1.2`, and old `dna/v1.0` poll content; create a single `dna/v1.0`
- [ ] `dna/v1.0/workdir/dna.yaml`: `name: kindact_v1_0`, `network_seed: "kindact-network-v1.0"`
- [ ] `dna/v1.0/workdir/happ.yaml`: `name: kindact_v1_0_happ`, role `kindact`
- [ ] `build-all.sh` builds just the one version into `src-tauri/resources/`
- [ ] `src-tauri/src/dna.rs` / `migration.rs`: point `ACTIVE_APP_ID` at `kindact_v1_0`; keep `MigratedPoll`/`MigrationIndex` intact but dormant
- [ ] Confirm `agent_linking` zome still present in the new `dna.yaml`

## Test

- [ ] `bash build-all.sh` emits exactly one `kindact_v1_0*.happ`
- [ ] `cargo tauri dev` launches against the new single-version DHT
- [ ] Flowsta identity linking still works after the reseed
- [ ] `get_migration_status` returns a clean/no-op state (nothing to migrate)

## Notes

Decision: we deliberately **do not** carry over ProofPoll poll data — Kindact is a different app on a different network. The migration system's value here is *forward* (shipping our own v1.1/v1.2 safely), not *backward*.
