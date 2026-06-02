---
status: in-progress
created: 2026-06-02
priority: high
tags:
- holochain
- prototype
- cells
- registry
- clone-cells
- hybrid
created_at: 2026-06-02T22:16:47.728749727Z
updated_at: 2026-06-02T22:16:47.728749727Z
transitions:
- status: in-progress
  at: 2026-06-02T22:16:47.728749727Z
derivation: new
related:
- 030-cell-architecture-and-registry
- 042-anchor-and-subscription-model
- 048-prototype-cross-agent-issue-visibility
- 049-prototype-anchor-subscription-discovery
---

# 050 — Prototype Dynamic Cell Creation and Join

> **Status**: planned · **Derivation**: new · **Scope**: `holochain/kindact-hc/` prototype only. Implements the bare minimum of the [030 Cell Architecture & Registry](../030-cell-architecture-and-registry/README.md) Tier-3 ("user-created cells") lifecycle so the prototype can demonstrate end-to-end cell create → register → discover → join, without standing up the full canonical/uncurated namespace or meta-governance promotion.

## Overview

[048](../048-prototype-cross-agent-issue-visibility/README.md) and [049](../049-prototype-anchor-subscription-discovery/README.md) demonstrated cross-agent visibility and anchor-driven discovery, but every demo cell was **hardcoded** in [`workdir/happ.yaml`](../../kindact-hc/workdir/happ.yaml) (three roles, `clone_limit: 0`, `provisioning.strategy: create`). Every agent has every cell pre-installed at launcher startup.

That leaves a load-bearing claim of the hybrid undemonstrated: that **a user can create a new community cell, register it in the global registry, and have a second user discover and join it** without redeploying the hApp. Without this, the [030 §Cell creation rules](../030-cell-architecture-and-registry/README.md#cell-creation-rules) story is paper-only. [049 §Open questions](../049-prototype-anchor-subscription-discovery/README.md#open-questions) explicitly flags this as the next gap.

This spec wires Holochain's [clone-cell mechanism](https://developer.holochain.org/concepts/8_app_modules/#clone-cells) into the prototype:

1. The `manhattan_windturbine` role becomes clone-able (`clone_limit > 0`). Each clone is a new "community cell" — same zomes, different DHT (different `network_seed` → different DNA hash).
2. The global registry is upgraded from a stub "register a CellEntry" to a real Tier-3-style **cell directory**: a single `all_cells` anchor links to every registered cell, with the full descriptor (name, role, seed, dna hash, creator) on the entry.
3. The UI grows a Communities panel: list all registered cells, badge the ones this agent has already cloned, and per-row "Join" and per-panel "+ Create Community" buttons.
4. The Create-Issue modal grows a target-cell dropdown so the user can post into any joined clone.
5. Discovery (anchor → issue dereference) routes by DNA hash, not role name, so issues authored in clones are reachable from subscribers.

This spec deliberately does **not** implement Tier-1/Tier-2 promotion, naming-namespace governance, membrane proofs, or cell sunset — those belong to the production [030 spec](../030-cell-architecture-and-registry/README.md). The prototype just needs to prove the create/discover/join loop is real.

## Design

### Cell taxonomy in the prototype

```diagram
╭─────────────────────────────────────────────────────────────╮
│ Roles in workdir/happ.yaml                                  │
│                                                             │
│   global_registry         provisioned, single instance      │
│   manhattan_windturbine   provisioned + clone_limit: 16     │
│   housing                 provisioned, single instance      │
│                                                             │
│ Every clone of manhattan_windturbine =                      │
│   a Tier-3 user-created community cell.                     │
│   Distinct DHT (unique network_seed → unique DNA hash).     │
│   Shares zome code with the provisioned Manhattan cell.     │
╰─────────────────────────────────────────────────────────────╯
```

Why reuse `manhattan_windturbine` as the clone template instead of introducing a new "community" DNA:

- It already exposes `create_issue`, `post_comment`, anchor links, and the cross-cell call into `global_registry::publish_anchor_link` (from 049). A fresh DNA would duplicate all of that for no validation gain.
- Each clone is conceptually a "community" — the Manhattan-Wind-Turbine name on the original is incidental at the prototype layer.
- Keeps the scope of this spec tight: bump one config field, no new DNA crate.

Housing stays provisioned-only — the Berlin jurisdictional claim path (Phase 2 in [PROTOTYPE-PLAN.md](../../PROTOTYPE-PLAN.md)) is the right place to teach housing about clones, not this spec.

### Backend: registry — cell directory

**[`registry_integrity/src/lib.rs`](../../kindact-hc/dnas/global_registry/zomes/integrity/registry_integrity/src/lib.rs)** — extend `CellEntry`:

```rust
pub struct CellEntry {
    pub name: String,                // human label, e.g. "Berlin Cyclists"
    pub role_name: String,           // role to clone under, e.g. "manhattan_windturbine"
    pub network_seed: String,        // disambiguator handed to createCloneCell
    pub dna_hash: DnaHash,           // stable cross-agent identifier
    pub creator: AgentPubKey,
    pub status: String,              // "active" | "archived" — prototype only writes "active"
}
```

Add link type `LinkTypes::AllCells` (anchor → cell entry).

**[`registry/src/lib.rs`](../../kindact-hc/dnas/global_registry/zomes/coordinator/registry/src/lib.rs)** — replace the trivial `register_cell` and add a lister:

- `register_cell(RegisterCellInput { name, role_name, network_seed, dna_hash }) -> ActionHash`
  - Idempotently ensures the `"all_cells"` `AnchorEntry` exists.
  - Stamps `creator = agent_info()?.agent_initial_pubkey` and `status = "active"`.
  - Writes the `CellEntry` and a `LinkTypes::AllCells` link from the `all_cells` anchor to the cell-entry action hash.
- `get_all_cells(()) -> Vec<(ActionHash, CellEntry)>`
  - `get_links` over `AllCells`, `get` each target, decode, return.

### Backend: anchor links route by DNA hash

**Why.** With clones, multiple cells share the same `role_name`. The UI needs to know which specific local cell ID to call into for a discovered issue. The stable cross-agent identifier is the DNA hash (network_seed bakes into it).

**[`registry_integrity`](../../kindact-hc/dnas/global_registry/zomes/integrity/registry_integrity/src/lib.rs)** — extend `AnchorLinkEntry`:

```rust
pub struct AnchorLinkEntry {
    pub anchor_name: String,
    pub cell_role: String,           // routing hint, unchanged
    pub cell_dna_hash: DnaHash,      // NEW — disambiguates clones
    pub issue_id: ActionHash,
}
```

**[`registry/src/lib.rs`](../../kindact-hc/dnas/global_registry/zomes/coordinator/registry/src/lib.rs)** — `publish_anchor_link` accepts and stores `cell_dna_hash`. The link tag stays as `cell_role.as_bytes()` (cheap routing-hint filter); the full entry carries the hash.

**[`wind_turbine/src/lib.rs`](../../kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs)** — when calling `publish_anchor_link`, read `dna_info()?.hash` and include it. This works identically for the provisioned cell and every clone — each one knows its own DNA hash.

**[`housing/src/lib.rs`](../../kindact-hc/dnas/housing/zomes/coordinator/housing/src/lib.rs)** — same one-line `dna_info()?.hash` addition for the housing publish path, so the wire shape stays consistent across cells.

### Frontend: Communities panel

In [`holochain-app.ts`](../../kindact-hc/ui/src/holochain-app.ts):

1. **Discovery state.** Add `@state() registeredCells: Array<{ actionHash, name, role_name, network_seed, dna_hash, creator }>` populated from `registry::get_all_cells` on connect and on every 3s poll tick.
2. **Joined-clone state.** After each `appInfo` refresh, build `joinedDnaHashes: Set<string>` by enumerating `cell_info[role][i]` for every role and collecting each cell's DNA hash (base64). The Communities panel uses this to badge each registered cell as joined / not joined.
3. **"+ Create Community" modal.** Single text input (cell name). On submit:
   - Generate `network_seed = "kindact-community-" + crypto.randomUUID()`.
   - Call `client.createCloneCell({ role_name: "manhattan_windturbine", modifiers: { network_seed }, name })`.
   - Use the returned `ClonedCell.cell_id[0]` (DNA hash) to call `registry::register_cell` with the descriptor.
   - Refresh `appInfo` (so the new clone appears in `joinedDnaHashes`) and `registeredCells`.
4. **Per-cell "Join" button.** For each registered cell whose `dna_hash` is not in `joinedDnaHashes`:
   - Call `client.createCloneCell({ role_name, modifiers: { network_seed }, name })` — joins the existing DHT (same seed → same DNA hash).
   - Refresh `appInfo` + `registeredCells`.
5. **Create-Issue modal.** Replace the location-only dropdown with a **target cell** dropdown that lists every joined manhattan_windturbine cell (provisioned + clones) by its display name, plus a "Housing (Berlin)" option that routes to the existing housing cell. The selected cell's `CellId` is used directly in `callZome` — no role-name lookup.
6. **`fetchAllPerCell` / `extractCellId`.** Generalize to iterate every cell in `cell_info["manhattan_windturbine"]` instead of taking only `[0]`. Each issue's `UIIssue` includes its origin `CellId` so the cards render with the cell name and so `submitComment` calls into the right clone.
7. **Discovery dereference.** When `discoverViaSubscriptions` returns an issue ID, look up its source via `cell_dna_hash` from the matching `AnchorLinkEntry` and resolve to the local `CellId` via the appInfo enumeration. Issues whose cell the agent hasn't joined are surfaced with a "Join to view details" affordance instead of being dropped.

### What this prototype does NOT do

- **Tier-1/Tier-2 promotion / namespace governance.** Every cell created here lives in a flat list. Promotion to canonical `kindact:berlin` belongs to [013 meta-governance](../013-meta-governance/README.md) and [030](../030-cell-architecture-and-registry/README.md).
- **Membrane proofs.** Joining a cell only requires knowing the network seed. The membrane is permissive. Real scope-verified-write is out of scope (tracked in [044](../044-cross-cell-validation-and-trust/README.md)).
- **Cell sunset / archival lifecycle.** `status = "active"` is the only value written.
- **Housing cell cloning.** Housing stays single-instance; cloning the jurisdictional-claim path interacts with [043](../043-jurisdictional-claims/README.md) and is the natural follow-up.
- **Cap-secret bootstrapping across clones.** The existing `grant_guest_access` flow on a per-clone basis already works because each clone runs the same zome; no new cap plumbing here.
- **Subscribing to anchors of unjoined cells without joining.** Discovery surfaces the issue but full deref still needs the local clone — same trade-off as 049 §"What this prototype does NOT do".

## Plan

- [x] **happ.yaml**
  - [x] Bump `clone_limit: 16` on the `manhattan_windturbine` role
- [x] **Registry — integrity**
  - [x] Extend `CellEntry` with `name`, `role_name`, `network_seed`, `dna_hash`, `creator`, `status`
  - [x] Add `LinkTypes::AllCells`
  - [x] Extend `AnchorLinkEntry` with `cell_dna_hash: DnaHash`
- [x] **Registry — coordinator**
  - [x] Replace `register_cell` with the new `RegisterCellInput` signature, stamping creator + status, writing the `AllCells` link
  - [x] Add `get_all_cells(()) -> Vec<(ActionHash, CellEntry)>` (with read-side dedupe by `dna_hash`)
  - [x] Update `PublishAnchorLinkInput` + `publish_anchor_link` to carry `cell_dna_hash` (and switch the link target to the AnchorLinkEntry's action hash so the full descriptor is recoverable with one `get`)
  - [x] Update `get_anchor_links_for_anchor` to return the new field
- [x] **wind_turbine + housing coordinators**
  - [x] Pull `dna_info()?.hash` and include it in the `PublishAnchorLinkInput` payload
  - [x] Update local mirrors of the wire struct
- [x] **UI — types**
  - [x] Mirror the registry struct changes in [`global_registry/registry/types.ts`](../../kindact-hc/ui/src/global_registry/registry/types.ts)
- [x] **UI — communities panel**
  - [x] `fetchRegisteredCells()` calling `registry::get_all_cells`, polled with the existing 3s tick
  - [x] `joinedCells` list built from `cell_info` enumeration with each cell's DNA hash
  - [x] Render the Communities panel in the left column under the lens manager
  - [x] "+ Create Community" modal (name input) → `createCloneCell` + `register_cell`
  - [x] Per-row "Join" button → `createCloneCell` with the registered seed, with a DNA-hash sanity assertion afterwards
- [x] **UI — create issue**
  - [x] Target-cell dropdown listing all joined `manhattan_windturbine` cells (provisioned + clones); Berlin-housing routing preserved on the location dropdown
  - [x] Use the selected `CellId` directly when calling `create_issue`
- [x] **UI — feed + dereference**
  - [x] `fetchAllPerCell` iterates every cell in `cell_info["manhattan_windturbine"]`
  - [x] `UIIssue` carries its origin `cellDnaB64` + `cellName` so `submitComment` calls the right clone
  - [x] `discoverViaSubscriptions` returns full `AnchorLinkEntry`s and the feed dereferences via `cell_dna_hash`
  - [x] Unjoined-cell issues render with a "(issue from … — join to view)" placeholder instead of being dropped
- [x] **Cargo test**
  - [x] Add a `SweetConductor` test that round-trips `register_cell` + `get_all_cells` across a conductor restart and checks idempotency by DNA hash
- [x] **Build**
  - [x] `npm run build:happ` clean
  - [x] `npm run test` passes (existing `subscriptions_survive_conductor_restart` plus new `cells_round_trip_across_restart`)
- [x] **Docs**
  - [x] Update [PROTOTYPE-PLAN.md](../../PROTOTYPE-PLAN.md) Phase 1 with a status note for 050
  - [x] Close the matching "Cell installation per persona" open question in [049](../049-prototype-anchor-subscription-discovery/README.md) (in the cell-create direction)

## Test

Manual two-agent validation (`AGENTS=2 npm run start`, choose different personas in each window):

- [ ] Elena (window 1) clicks the ＋ on the Communities panel, names the cell "Brooklyn Cyclists", submits. The cell appears in her Communities panel badged "Joined".
- [ ] Within one poll tick (≤3s) Marcus (window 2) sees "Brooklyn Cyclists" in his Communities panel, badged "Not joined", with a "Join" button.
- [ ] Marcus clicks Join. Badge flips to "Joined" without a page reload.
- [ ] Elena opens "+ New Issue", picks "Brooklyn Cyclists" as the target cell, leaves the location as "Manhattan" (so the housing path is skipped), tags `#wind-power` (a lens both agents can toggle from the sidebar), publishes.
- [ ] Marcus toggles `#wind-power` on. The issue appears in his discovery feed within one poll tick. The issue card identifies "Brooklyn Cyclists" via the 🛰️ pill.
- [ ] Marcus expands the issue and posts a comment. Elena sees the comment within one poll tick.
- [ ] Amina (third persona, if `AGENTS=3 npm run start`) subscribes to `#wind-power` but does **not** click Join on "Brooklyn Cyclists". She sees the issue rendered as a "(issue from "Brooklyn Cyclists" — join to view)" placeholder; clicking Join then fetches the full content within one poll tick.
- [ ] Restart `hc-spin` (`AGENTS=2 npm run start` again). The registry's `Brooklyn Cyclists` entry is **not** expected to persist (`hc-spin` rebuilds storage each run); document this as a known limitation rather than a regression.

Automated:

- [ ] `cargo test -p registry` passes the existing `subscriptions_survive_conductor_restart` plus a new `cells_round_trip_across_restart` (writes via `register_cell`, restarts conductor, reads via `get_all_cells`, asserts the same descriptor survives).
- [ ] `npm run build:happ` produces a clean `kindact-hc.happ`.

## Notes

- **Why `network_seed` and not `properties`.** Both modifiers change the DNA hash, but `network_seed` is opaque-by-design and doesn't require defining a typed properties schema for the prototype.
- **`crypto.randomUUID()` is fine for the seed.** The threat model here is "two agents that don't share a seed shouldn't land on the same DHT," not adversarial collision resistance. A random UUID is comfortably more than enough.
- **Why route by `cell_dna_hash` rather than `clone_id`.** Clone IDs (`role.N`) are local to each conductor — each agent's local instance of the same shared DHT might be `manhattan_windturbine.0` on one and `manhattan_windturbine.3` on another. The DNA hash is the only identifier all agents agree on.
- **What this leaves for production.** The Tier-3 → Tier-2 → Tier-1 promotion lifecycle, name-collision handling, cell sunset, membrane proofs, and cross-substrate registry mirroring all stay in [030](../030-cell-architecture-and-registry/README.md). This spec just retires the "cells are hardcoded in happ.yaml" assumption.

## Open questions

- **Provisioned cell as a member of the registry?** Should the existing provisioned Manhattan and housing cells auto-register themselves on init so they show up in the Communities panel alongside dynamic clones? Probably yes, for UX coherence, but the bootstrap order (registry init vs. self-registration) is fiddly. Prototype option: have the UI seed two well-known descriptors for the provisioned cells on first connect.
- **Communities panel as the new "lens" surface?** Long-term, anchors and cells are different first-class concepts (see [042](../042-anchor-and-subscription-model/README.md)). For this prototype they live side by side. Whether to fold them visually is a design question, not blocking here.
- **Cap-token sharing across clones.** Each clone has its own grant store. Joining a clone gives full member access; the "guest contributor" flow from 044 is per-clone. Worth a follow-up when 044 enters the prototype.
