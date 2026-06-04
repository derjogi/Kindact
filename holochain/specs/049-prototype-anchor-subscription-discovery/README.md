---
status: complete
created: 2026-05-30
priority: high
tags:
- holochain
- prototype
- dht
- ui
- zomes
- hybrid
- registry
- subscriptions
created_at: 2026-05-30T21:43:57.975489951Z
updated_at: 2026-06-01T03:35:02.926029400Z
completed_at: 2026-06-01T03:35:02.926029400Z
transitions:
- status: complete
  at: 2026-06-01T03:35:02.926029400Z
related:
- 042-anchor-and-subscription-model
- 048-prototype-cross-agent-issue-visibility
- 030-cell-architecture-and-registry
derivation: new
---
# 049 — Prototype Anchor Subscription Discovery

> **Status**: in-progress · **Derivation**: new · **Scope**: `holochain/kindact-hc/` prototype only — implements a thin slice of [042-anchor-and-subscription-model](../042-anchor-and-subscription-model/README.md) on top of the [048](../048-prototype-cross-agent-issue-visibility/README.md) baseline. Not a production architecture spec.

## Overview

[048](../048-prototype-cross-agent-issue-visibility/README.md) made cells round-trip through the DHT, but it cheated on architecture:

- Each cell stored its own `all_issues` anchor and the UI directly enumerated every issue in every cell the agent had joined.
- The `global_registry` cell exists, exposes `Anchor` / `AnchorLink` / `Subscription` entry types, and a `publish_anchor_link` extern — but **no cell ever calls it**, and **no UI element produces or consumes subscriptions**.
- The "lens manager" in the UI was pure client-side filtering against the `activeLenses` string array.

That means the load-bearing claim of the hybrid — *"cells are bounded; anchors are global; users subscribe to anchors without joining cells"* (see [042 §Overview](../042-anchor-and-subscription-model/README.md)) — has not been demonstrated end-to-end. The discovery feed is a per-cell enumeration, not an anchor-driven query.

This spec promotes the anchor pattern from dead registry infrastructure into the actual discovery path:

1. When a cell creates an issue, it cross-cell-calls `global_registry::publish_anchor_link` for each tag on the issue.
2. The user's subscriptions live as `SubscriptionEntry`s on their own source chain in `global_registry`.
3. The UI lens manager *is* the subscription manager: toggling a lens writes/deletes a `SubscriptionEntry`.
4. The discovery feed is rebuilt from `(get_subscriptions ∘ get_anchor_links_for_anchor)` and dereferenced into the owning cell — replacing the per-cell `get_all_*` source of truth from 048.

## Design

### Backend: registry additions

**`global_registry` integrity** ([`registry_integrity/src/lib.rs`](../../kindact-hc/dnas/global_registry/zomes/integrity/registry_integrity/src/lib.rs)):

- Change `AnchorLinkEntry.cell_id: ActionHash` → `cell_role: String`. The UI needs to know which cell role to call into when dereferencing a discovered issue; an `ActionHash` doesn't encode that. `cell_role` matches the role name in [`workdir/happ.yaml`](../../kindact-hc/workdir/happ.yaml) (`"manhattan_windturbine"`, `"housing"`).
- No new entry types — `SubscriptionEntry` already exists and is unused.

**`global_registry` coordinator** ([`registry/src/lib.rs`](../../kindact-hc/dnas/global_registry/zomes/coordinator/registry/src/lib.rs)):

- `publish_anchor_link(PublishAnchorLinkInput { anchor_name, cell_role, issue_id }) -> ActionHash`
  - Idempotently ensures the named `AnchorEntry` exists, writes an `AnchorLinkEntry`, links anchor → issue.
- `get_anchor_links_for_anchor(anchor_name: String) -> Vec<AnchorLinkEntry>`
  - Returns full entries (not just issue hashes) so the UI can route to the right cell.
- `subscribe(anchor_name: String) -> ActionHash` (idempotent — query own chain first)
- `unsubscribe(anchor_name: String) -> ()`
  - `query()` own source chain for matching `SubscriptionEntry`, `delete_entry` each match.
- `get_subscriptions(()) -> Vec<String>`
  - `query()` own source chain for active (non-deleted) `SubscriptionEntry`s.

### Backend: cell additions

Both cells cross-cell-call into `global_registry` after each create.

**`wind_turbine` coordinator** ([`wind_turbine/src/lib.rs`](../../kindact-hc/dnas/manhattan_windturbine/zomes/coordinator/wind_turbine/src/lib.rs)):

- Change `create_issue(IssueEntry)` → `create_issue(CreateIssueInput { issue, tags: Vec<String> })`.
- After the local create + local anchor-link, for each tag in `tags`, `call(CallTargetCell::OtherRole("global_registry"), "registry", "publish_anchor_link", ...)`. The cell's authoring agent provenance carries through — no cap secret needed for same-agent cross-cell calls (see [`p2p.rs`](file:///home/jonas/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/hdk-0.6.1/src/p2p.rs)).
- If the registry call fails, surface the error — the issue is undiscoverable without it.

**`housing` coordinator** ([`housing/src/lib.rs`](../../kindact-hc/dnas/housing/zomes/coordinator/housing/src/lib.rs)):

- Same pattern: `create_housing_issue(CreateHousingIssueInput { issue, tags: Vec<String> })`.
- After the existing jurisdictional check + local create + local anchor-link, publish anchor links for each tag.

### Backend: keep the 048 local anchors

The local `all_issues` / `all_housing_issues` anchors stay. They are useful as the cell's own enumeration (e.g. for a "full inventory" admin view) and they keep 048's manual two-agent test paths working. The change is which path drives the UI feed.

### Frontend: subscriptions become real

In [`holochain-app.ts`](../../kindact-hc/ui/src/holochain-app.ts):

1. On live-mode connect (`firstUpdated → loadRealData`), reconcile `activeLenses` with `registry::get_subscriptions(())`: any lens in `activeLenses` missing on chain → `subscribe`; nothing on chain → seed from `activeLenses` default. (Mock mode unchanged.)
2. `toggleLens(lens)` in live mode calls `registry::subscribe` / `registry::unsubscribe` before updating local state.
3. `refreshFromDht()` rewritten:
   - Read `registry::get_subscriptions(())` → `subscribedAnchors: string[]`.
   - For each anchor, call `registry::get_anchor_links_for_anchor` → flat list of `AnchorLinkEntry`.
   - Group target hashes by `cell_role`.
   - For each group, fetch issues from that cell (still via existing `get_all_*` externs, then filter by hash set — fine for prototype size; a `get_issues_by_hash` extern is a follow-up).
   - Dedupe by action-hash, build the `UIIssue[]` exactly as today.
4. Create-issue submit derives `tags` from the existing `newIssueTags` form field (split by whitespace/comma) plus a location-derived tag (e.g. `Berlin`). Wind-turbine issues default to `["#wind-power", "#new-york"]` if the user clears the field; housing defaults to `["#housing", location]`.
5. The "no subscriptions" empty-state copy already exists ("No active issues resolved under subscribed lenses") — no copy changes needed.

### What this prototype does NOT do

- **Anchor hierarchy.** Subscribing to `#energy` does not surface `#wind-power` issues. Listed as a follow-up in [042 §Plan item 3](../042-anchor-and-subscription-model/README.md).
- **Anchor governance / merge / deprecation.** Plan items 4 and 5 in 042.
- **Subscription privacy.** Subscriptions are visible to anyone who can read the agent's source chain — same as the 042 design intent.
- **Cells the agent has not joined.** With `hc-spin -n 2`, every agent has all three cells provisioned, so the cell-deref always works. The "subscribe to `#wind-power` *without joining* the wind-turbine cell" property of [042](../042-anchor-and-subscription-model/README.md) is partially demonstrated — discovery happens via the registry anchor, but the dereference still uses the locally-installed cell. Removing the always-provisioned wind-turbine cell from non-Manhattan agents is its own conductor-config exercise; see open question below.

## Plan

- [x] **Registry — integrity**
  - [x] Rename `AnchorLinkEntry.cell_id` → `cell_role: String`.
- [x] **Registry — coordinator**
  - [x] Update `publish_anchor_link` to take `PublishAnchorLinkInput` matching the new shape.
  - [x] Add `get_anchor_links_for_anchor` returning full entries.
  - [x] Add `subscribe` / `unsubscribe` / `get_subscriptions` source-chain externs.
- [x] **Cells — wind_turbine**
  - [x] Change `create_issue` signature to `CreateIssueInput { issue, tags }`.
  - [x] After local create, cross-cell-call `registry::publish_anchor_link` for each tag.
- [x] **Cells — housing**
  - [x] Change `create_housing_issue` signature to `CreateHousingIssueInput { issue, tags }`.
  - [x] After local create, cross-cell-call `registry::publish_anchor_link` for each tag.
- [x] **Build**
  - [x] `npm run build:happ` clean
  - [x] Fix any cross-zome serialization mismatches
- [x] **UI**
  - [x] Mirror `AnchorLinkEntry` rename in `global_registry/registry/types.ts`.
  - [x] On live-mode connect, reconcile `activeLenses` with `registry::get_subscriptions`.
  - [x] Wire `toggleLens` to `subscribe` / `unsubscribe` in live mode.
  - [x] Rewrite `refreshFromDht` to drive feed from subscribed anchors via the registry.
  - [x] Pass `tags` through `createIssueSubmit` into the cell payload.
- [x] **Cleanup**
  - [x] Update [`PROTOTYPE-PLAN.md`](../../PROTOTYPE-PLAN.md) Phase 1 status note to mark anchor-driven discovery wired.
  - [x] Tick the relevant Plan checkboxes in [042](../042-anchor-and-subscription-model/README.md).

## Test

Manual two-agent validation (`AGENTS=2 npm run start`):

- [x] Elena (Manhattan) creates a wind-turbine issue with default tags. Amina (subscribed to `#wind-power`) sees it in her feed within one poll tick (≤3s).
- [x] Amina toggles off `#wind-power`. Within one poll tick her feed no longer includes the wind-turbine issue. Elena's feed (subscribed to `#new-york`) still does.
- [x] Elena creates a Berlin housing issue tagged `#housing,Berlin`. Marcus (subscribed to `#housing`) sees it; Amina (not subscribed) does not.
- [x] Subscriptions persist across restart: stop both agents, restart, verify each agent's subscription set survives via `registry::get_subscriptions`.
- [x] Existing 048 tests still pass — comments round-trip, observer challenge flips status to `Challenged`.
- [x] `npm run test` (existing cargo tests) still passes.

## Open questions

- **Cell installation per persona.** To honestly demonstrate "subscribe without joining," non-Manhattan agents shouldn't have the `manhattan_windturbine` cell provisioned. Today `hc-spin` provisions every role for every agent. Switching to `deferred: true` plus per-agent join logic is a follow-up; tracking in [041](../041-base-dna-specification/README.md) / [047](../047-holo-hosting-strategy/README.md) for the production story.
- **Tag input UX.** The current `newIssueTags` field is a single string; comma/whitespace split is fine for a prototype but a real UI wants tag chips with autocomplete against registry anchors.
- **Anchor hierarchy timing.** When to introduce parent-anchor walking — needed before the hybrid claim about "subscribe to `#energy`, get `#wind-power`" can be tested.