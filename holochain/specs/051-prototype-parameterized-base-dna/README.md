---
status: planned
created: '2026-06-04'
tags:
  - holochain
  - prototype
  - base-dna
  - parameterization
  - refactor
priority: high
created_at: '2026-06-04T06:29:20.599745468+00:00'
related:
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
  - 043-jurisdictional-claims
  - 050-prototype-dynamic-cell-creation-and-join
derivation: new
---

# 051 — Prototype Parameterized Base DNA

> **Status**: planned · **Derivation**: new · **Scope**: `holochain/kindact-hc/` prototype only. Collapses the hand-built `manhattan_windturbine` and `housing` DNAs into a single canonical `kindact_cell` DNA whose per-cell behavior is driven entirely by `dna_info().modifiers.properties`. Closes the gap flagged in [the cell-explanation walkthrough](../../cell_explanation.md) and operationalizes the "one Base DNA + property blobs" pattern from [041](../041-base-dna-specification/README.md).

## Overview

The prototype currently fakes the multi-cell story. [`workdir/happ.yaml`](../../kindact-hc/workdir/happ.yaml) provisions three sibling roles — `global_registry`, `manhattan_windturbine`, `housing` — and the latter two are **independently hand-built DNAs** with their own integrity zomes ([`wind_turbine_integrity`](../../kindact-hc/dnas/manhattan_windturbine/zomes/integrity/wind_turbine_integrity/src/lib.rs), [`housing_integrity`](../../kindact-hc/dnas/housing/zomes/integrity/housing_integrity/src/lib.rs)). Even after [050](../050-prototype-dynamic-cell-creation-and-join/README.md) added `clone_limit: 16` to `manhattan_windturbine`, every user-created clone is "a clone of the Manhattan Wind Turbine DNA in particular" — there is no neutral, reusable cell template.

[041](../041-base-dna-specification/README.md) describes the target: one canonical `kindact_base.dna` whose generic zomes are parameterized at clone time via DNA properties. Two cells with different properties yield different DNA hashes — and therefore different DHTs — while running identical WASM. **No Rust compilation per new cell, no new directory under `dnas/`, no developer in the loop.** That's the load-bearing claim of the "no-code cell creation" story ([030 §Cell creation rules](../030-cell-architecture-and-registry/README.md#cell-creation-rules), [042 §3](../042-anchor-and-subscription-model/README.md)).

This spec closes the gap: collapse the two cell-side DNAs into one parameterized `kindact_cell` DNA, route every existing demo through it, and add a Create-Cell modal that ships real DNA properties. After this lands, "Berlin Housing", "Manhattan Wind Turbine", and any user-created "Brooklyn Cyclists" are all the same DNA at different property blobs.

Explicitly deferred (each is the natural next prototype slice): integrity-level enforcement of jurisdictional claims from [043](../043-jurisdictional-claims/README.md), Base-tampering detection against a canonical registry (the second half of [041](../041-base-dna-specification/README.md)), membrane proofs, and identity bridging. "Base" for this prototype means "the shared cell DNA all community cells clone from," not [041](../041-base-dna-specification/README.md)'s full always-on validation chassis.

## Design

### Cell taxonomy after this spec

```diagram
╭──────────────────────────────────────────────────────────────────╮
│ DNAs in the prototype                                            │
│                                                                  │
│   global_registry        provisioned, single instance, unchanged │
│                                                                  │
│   kindact_cell           provisioned (stub) + clone_limit: 32    │
│     ├─ properties: { name: "Manhattan Wind Turbine", ... }       │
│     ├─ properties: { name: "Berlin Housing", ... }               │
│     └─ properties: { name: "<user-created>", ... }               │
│                                                                  │
│ Every cell that is not the registry is a clone of                │
│ kindact_cell. Same WASM, different properties → different DNA    │
│ hash → different DHT.                                            │
╰──────────────────────────────────────────────────────────────────╯
```

The provisioned `kindact_cell` instance is a **bootstrap stub** that exists only so the role is installed at conductor startup (a precondition for `createCloneCell` calls under that role). It carries `properties: { name: "kindact-cell-template", category: "template" }` and is filtered out of every UI list. Real community cells are clones.

### `kindact_cell` DNA — one shared integrity + coordinator zome

A new pair of zomes replaces both today's hand-built pairs:

- `kindact_cell_integrity` — entry types unified from the union of `IssueEntry`, `HousingIssue`, `CommentEntry`, `BindingChallenge`, `AnchorEntry`. The `Issue` entry is the union of the wind-turbine and housing shapes:

  ```rust
  pub struct IssueEntry {
      pub title: String,
      pub description: String,
      pub status: IssueStatus,             // from kindact_base crate
      pub location: Option<String>,        // optional H3 cell label or "global"
      pub has_geotagged_evidence: bool,    // default false; ignored if cell doesn't require it
      pub tags: Vec<String>,               // user-supplied lens tags
  }
  ```

  The shape is permissive on purpose: the cell's DNA properties decide which fields matter. A wind-turbine cell ignores `has_geotagged_evidence`; a Berlin-housing cell rejects an issue at coordinator-level if it's false.

- `kindact_cell` — coordinator that exposes `create_issue`, `post_comment`, `create_binding_challenge`, `get_all_issues`, `get_comments_for_issue`, `get_challenges_for_issue`, `grant_guest_access`, and `get_cell_properties`. Each extern reads `dna_info()?.modifiers.properties` at entry to apply the cell's policy.

### DNA properties — the parameterization surface

```rust
#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct CellProperties {
    pub name: String,                          // human label e.g. "Berlin Housing"
    pub category: String,                      // "community" | "housing" | "template"
    pub location_scope: Option<String>,        // optional jurisdiction tag, e.g. "h3:..." or "Berlin"
    pub requires_geotagged_evidence: bool,     // gate on issue creation
    pub default_tags: Vec<String>,             // suggested tags to surface in the UI
    pub challenge_enabled: bool,               // exposes the BindingChallenge flow
}
```

Properties are serialized into the DNA manifest at `createCloneCell` time via `modifiers.properties` (a `SerializedBytes` blob). The coordinator decodes them in a `cell_props()` helper:

```rust
fn cell_props() -> ExternResult<CellProperties> {
    let info = dna_info()?;
    let bytes = info.modifiers.properties
        .ok_or(wasm_error!("cell properties missing"))?;
    CellProperties::try_from(bytes).map_err(|e| wasm_error!(e))
}
```

Coordinator-level policy this spec enforces (deliberately at coordinator, not integrity, for prototype velocity — promoting to integrity is the 052 follow-up):

| Policy | Implementation |
|---|---|
| `requires_geotagged_evidence` | `create_issue` rejects with `WasmError` if `props.requires_geotagged_evidence && !payload.has_geotagged_evidence`. |
| `challenge_enabled` | `create_binding_challenge` rejects unconditionally when false. |
| `default_tags` | Returned by `get_cell_properties` for the UI to seed the Create-Issue tag input. |
| `category`, `location_scope` | Returned by `get_cell_properties`, displayed in the UI but not validated. |

A new `get_cell_properties(()) -> CellProperties` extern lets the UI render cell-specific affordances (e.g., show a 📍 geotag-required badge, hide the Challenge button when disabled) without round-tripping the registry.

### Registry — carry properties alongside descriptor

[`registry_integrity`](../../kindact-hc/dnas/global_registry/zomes/integrity/registry_integrity/src/lib.rs) `CellEntry` gains one field:

```rust
pub struct CellEntry {
    pub name: String,
    pub role_name: String,
    pub network_seed: String,
    pub dna_hash: DnaHash,
    pub creator: AgentPubKey,
    pub status: String,
    pub properties_json: String,   // NEW — JSON-encoded CellProperties
}
```

Why `properties_json: String` instead of nested `SerializedBytes`: simpler over the wire, trivially readable from the UI, and the registry is not enforcing the schema — it's a directory entry. The cell itself is the source of truth; the registry copy is for discovery UX.

`RegisterCellInput` gains the same `properties_json` field. The UI computes the JSON once when it submits both `createCloneCell` (as serialized bytes) and `register_cell` (as a string).

### `happ.yaml` — one cell role replaces two

```yaml
- name: global_registry
  provisioning: { strategy: create, deferred: false }
  dna: { path: ../dnas/global_registry/workdir/global_registry.dna, clone_limit: 0 }

- name: kindact_cell
  provisioning: { strategy: create, deferred: false }
  dna:
    path: ../dnas/kindact_cell/workdir/kindact_cell.dna
    modifiers:
      network_seed: "kindact-cell-template"
      properties: { name: "kindact-cell-template", category: "template", ... }
    clone_limit: 32
```

The `manhattan_windturbine` and `housing` roles are deleted. Their provisioned instances stop existing; today's demo content (the "Manhattan Wind Turbine" cell, the "Berlin Housing" cell) is re-created as **seeded clones** the UI auto-creates on first connect if absent:

- Seed clone A: `name = "Manhattan Wind Turbine"`, `category = "community"`, `location_scope = None`, `requires_geotagged_evidence = false`.
- Seed clone B: `name = "Berlin Housing"`, `category = "housing"`, `location_scope = Some("Berlin")`, `requires_geotagged_evidence = true`, `challenge_enabled = true`.

Both seeds register themselves in `global_registry::register_cell` on creation so they appear in the Communities panel for every agent. Deterministic `network_seed` values (`"kindact-seed-manhattan-wind-turbine"`, `"kindact-seed-berlin-housing"`) mean every agent's auto-seeded clones land on the same two DHTs — no coordination required.

### UI — Create-Cell modal grows property fields

[`holochain-app.ts`](../../kindact-hc/ui/src/holochain-app.ts) Communities panel changes:

1. **Create-Cell modal** grows fields: name (text), category (Community / Housing / General), location scope (free-form text — H3 cell in production), require-geotagged-evidence (checkbox, defaults on for Housing), enable-binding-challenges (checkbox, defaults on for Housing), default tags (comma-separated). On submit, build `CellProperties`, generate `network_seed = "kindact-cell-" + crypto.randomUUID()`, `createCloneCell({ role_name: "kindact_cell", modifiers: { network_seed, properties: encode(props) }, name })`, then `register_cell` with the matching `properties_json`.
2. **Communities panel** renders badges from `properties_json` (📍 if `location_scope` set, 🏘️ for housing category) and filters the template stub out of every list.
3. **Create-Issue modal** calls `get_cell_properties` on cell-select, seeds the tag input from `default_tags`, and enforces a non-removable geotag toggle when `requires_geotagged_evidence`. The coordinator rejects mismatches.
4. **Discovery feed** routes by DNA hash as in [050](../050-prototype-dynamic-cell-creation-and-join/README.md), but every call now targets the `kindact_cell` zome name. `fetchAllPerCell` iterates `cell_info["kindact_cell"]` uniformly — the role-name branch collapses.
5. **Binding-challenge sandbox button** calls `kindact_cell::create_binding_challenge` against the Berlin-housing seed cell; hidden for cells with `challenge_enabled = false`.

### What collapses, what stays

| Before | After |
|---|---|
| `dnas/manhattan_windturbine/` | deleted |
| `dnas/housing/` | deleted |
| `dnas/kindact_cell/` (new) | one DNA, shared zomes |
| `wind_turbine_integrity`, `housing_integrity` zomes | replaced by `kindact_cell_integrity` |
| `wind_turbine`, `housing` coordinators | replaced by `kindact_cell` coordinator |
| `IssueEntry` (wind_turbine), `HousingIssue` (housing) | unified `IssueEntry` |
| `BindingChallenge` (housing only) | unified, gated by `challenge_enabled` property |
| Three roles in `happ.yaml` | two roles (`global_registry`, `kindact_cell`) |
| UI branches on role name | UI iterates all cells under `kindact_cell` |
| Registry `CellEntry` carries `role_name`-keyed routing | Still carries `role_name` (always `"kindact_cell"` in this prototype), plus `properties_json` |

### What this prototype does NOT do

- **No integrity-level enforcement** of property-driven policy. The geotag check and challenge gating happen in coordinator externs; a malicious agent rebuilding their own conductor could bypass them. Promoting these checks into `validate()` is intentionally deferred.
- **No canonical Base hash registry.** A tampered `kindact_cell` build produces a different DNA hash, but nothing validates that the hash is on a recognized canonical list. That's the [041](../041-base-dna-specification/README.md) `BaseDNARegistry` story.
- **No properties schema versioning.** Adding a field requires a coordinated UI + zome update; existing cells without the new field decode with the field default. The prototype accepts that.
- **No DNA properties manipulation post-creation.** Properties are baked into the DNA hash at clone time; changing them = new cell. This matches Holochain's actual semantics.
- **No identity primitive or humanity check.** Validation stays permissive, same as 050.
- **No teardown of the registry's existing data shapes** beyond the one `properties_json` field on `CellEntry`. `AnchorLinkEntry`, `SubscriptionEntry`, `JurisdictionalClaimEntry` are untouched.

## Plan

- [ ] **`kindact_base` crate** — add `CellProperties` struct with `Serialize/Deserialize/SerializedBytes` derives
- [ ] **`dnas/kindact_cell/` skeleton** — workspace registration, `kindact_cell_integrity` + `kindact_cell` crates, `workdir/dna.yaml`
- [ ] **`kindact_cell_integrity`** — unified `IssueEntry`, `CommentEntry`, `AnchorEntry`, `BindingChallenge`; `LinkTypes` (`AllIssues`, `IssueToComment`, `IssueToChallenge`); permissive `validate`, `genesis_self_check`
- [ ] **`kindact_cell` coordinator** — `cell_props()` helper, `get_cell_properties`, `create_issue` (honoring `requires_geotagged_evidence`), `post_comment` / `get_comments_for_issue`, `create_binding_challenge` (gated by `challenge_enabled`) / `get_challenges_for_issue`, `get_all_issues`, cross-cell `publish_anchor_link` stamped with `dna_info()?.hash`, `grant_guest_access` ported from wind-turbine
- [ ] **Registry** — add `properties_json: String` to `CellEntry`, extend `RegisterCellInput` / `register_cell` / `get_all_cells`
- [ ] **`workdir/happ.yaml`** — delete `manhattan_windturbine` + `housing` roles; add `kindact_cell` with `clone_limit: 32`, deterministic stub `network_seed`, template `properties`
- [ ] **Delete** `dnas/manhattan_windturbine/`, `dnas/housing/`, and matching `ui/src/{manhattan_windturbine,housing}/` modules
- [ ] **UI — types** — mirror `CellProperties` in a new `ui/src/kindact_cell/types.ts`; add `properties_json` to the registry types
- [ ] **UI — seed clones** — `ensureSeedClones()` on first connect creates "Manhattan Wind Turbine" + "Berlin Housing" with deterministic seeds and registers them
- [ ] **UI — Create-Cell modal** — name / category / location / geotag / challenge / default-tags fields; wires `createCloneCell` + `register_cell` together
- [ ] **UI — Create-Issue modal** — fetch `get_cell_properties` on cell-select, seed tags from `default_tags`, enforce geotag toggle when required
- [ ] **UI — Communities panel + discovery** — iterate `cell_info["kindact_cell"]` uniformly, render `properties_json`-driven badges, filter the template stub
- [ ] **Tests (Rust)** — extend `cell_directory.rs` for `properties_json` round-trip; new `kindact_cell` test asserting two clones with different `requires_geotagged_evidence` accept/reject the same payload differently
- [ ] **Build & smoke** — `npm run build:happ`, `cargo test -p registry -p kindact_cell`, `AGENTS=2 npm run start` walks the 050 demo against the new DNA
- [ ] **Docs** — update [PROTOTYPE-PLAN.md](../../PROTOTYPE-PLAN.md) Phase 1 with a 051 status note; refresh [cell_explanation.md](../../cell_explanation.md) "PROTOTYPE TODAY → TARGET" diagram; cross-reference this spec from [041](../041-base-dna-specification/README.md)

## Test

Manual (two agents, `AGENTS=2 npm run start`):

- [ ] On first launch both windows auto-seed the two well-known clones ("Manhattan Wind Turbine", "Berlin Housing") and they appear in both Communities panels badged "Joined".
- [ ] Elena creates a new community "Brooklyn Cyclists" with `category = community`, no geotag requirement. Marcus sees it within one poll tick and Joins.
- [ ] Elena creates a new community "Munich Housing" with `category = housing`, `requires_geotagged_evidence = true`. Marcus sees the 📍 badge and Joins.
- [ ] In "Munich Housing", Elena tries to create an issue without checking the geotag box; the coordinator rejects with a visible UI error.
- [ ] In "Munich Housing", Elena creates an issue with the geotag box checked; it appears in Marcus's discovery feed when he subscribes to a matching tag.
- [ ] In "Brooklyn Cyclists" (no geotag requirement), Elena creates an issue without geotag; it accepts and shows up for Marcus.
- [ ] The existing "Trigger Observer Binding Challenge" sandbox button works against the Berlin-Housing seed cell (challenge_enabled = true). Repeat on a community-category cell with challenges disabled: button is hidden.
- [ ] Discovery via subscriptions works identically to 050 — switching tags, joining unjoined cells from the placeholder card, posting comments — all backed by one DNA.

Automated:

- [ ] `cargo test -p registry::cell_directory` — `register_cell` with `properties_json` round-trips through `get_all_cells`.
- [ ] `cargo test -p kindact_cell` — two `SweetConductor` cells of the same `kindact_cell` DNA, one with `requires_geotagged_evidence = true` and one with `false`, accept the same payload differently.
- [ ] `npm run build:happ` produces a clean `kindact-hc.happ`.
- [ ] `cargo test -p registry::persistence` (the existing subscription / cell-directory round-trip-across-restart test) still passes unchanged.

## Notes

- **Coordinator-level policy, not integrity.** Integrity must be deterministic and self-contained; `dna_info()` is supported in `validate()` but extending integrity policy is the right hammer once it's the security boundary, which it isn't in this prototype. Cheaper to iterate at the coordinator.
- **Why one "template" cell.** Holochain requires a role to be provisioned at install for `createCloneCell` to work under it. The stub satisfies that without changing app-install semantics; the UI filters it everywhere.
- **`properties_json` vs. `SerializedBytes`.** The DNA layer must use `SerializedBytes` (Holochain hashes it). The registry layer is UI-facing, so JSON is friendlier. The UI sends both at clone-creation time.
- **Deterministic seeds for the seed clones.** Hardcoded seeds for the two demo cells make every agent auto-rendezvous on the same DHT — without them, each agent's "Berlin Housing" would land on a different network.
- **Forward-compat with 052.** Adding a `jurisdictional_claim` entry type and validator hook is purely additive: the validator reads `cell_props().location_scope` and consults the registry.

## Open questions

- **Should the prototype keep auto-seeding the two well-known cells, or have the user create them manually each run?** Auto-seeding preserves the existing demo UX but hides the create flow. Manual creation is closer to real usage but adds friction on every `hc-spin` restart (which doesn't persist storage). Lean: auto-seed for now; revisit when persistence lands.
- **Should `CellProperties` go in `kindact_base` or in `kindact_cell_integrity`?** Putting it in `kindact_base` lets the registry's UI re-use the type cleanly without depending on the cell integrity zome. Putting it in `kindact_cell_integrity` keeps it co-located with the validators that consume it. Lean: `kindact_base` for the prototype.
- **What about the registry's `role_name` field on `CellEntry` once everything is `"kindact_cell"`?** It becomes dead weight. Could be dropped in a follow-up, or repurposed when (if) the prototype grows a second cell-style DNA (e.g. a `service_cell` for oracle relays). Lean: leave it for now.
- **Should `register_cell` validate that `properties_json` parses as a `CellProperties`?** Doing so couples the registry integrity zome to the cell schema — undesirable for a directory. The trade-off is silent corruption if the UI sends garbage. Lean: don't validate in the registry; let the UI's `get_cell_properties` call (which goes to the cell, the source of truth) catch real divergence.
- **Migration story for the existing `hc-spin` storage.** Not a real issue because `hc-spin` rebuilds storage each run, but worth documenting that any persisted state from the deleted `manhattan_windturbine` / `housing` DNAs is gone on the next launch.
