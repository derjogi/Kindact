---
status: planned
created: '2026-04-05'
tags: [architecture, extensibility, governance]
priority: high
depends_on:
  - 001-diamond-module-registry
  - 013-meta-governance
---

# 030 — Extensibility Foundation

## Overview

Platform-level extensibility model that lets Kindact stay one global system while supporting different issue experiences in different contexts. Owns lenses, canonical geography references, module slots, issue protocol binding, procedural snapshots, and the rules for how module data remains interoperable across the shared platform.

## Design

### Lenses

Lenses are discovery and configuration layers, not territorial jurisdictions.

- A lens selects issues using canonical location refs, topic tags, scope level, and optional interest keywords.
- A lens can auto-subscribe users for discovery if they choose to provide a coarse location hint.
- Lenses can also be followed explicitly by interest.
- Lens governance only changes lens overlays and defaults; it does not create governance rights by itself.

#### Lens Ownership and Portability

Every lens declares an owner so deplatforming or forking is well-defined.

| Field | Type | Description |
|-------|------|-------------|
| `owner_did` | DID | Primary owner. AT Proto DID; lens content is signed by this DID and can be re-hosted in any AT Proto PDS. |
| `controller_address` | EVM address (optional) | Used only when a lens needs to take on-chain governance actions; otherwise blank. |
| `forked_from` | Lens id (nullable) | If this lens was created by copying another, the source lens id. |
| `name` | string | Display name. First-creator wins the name slot; subsequent claimants must pick a different name or fork. |

A lens is **portable**: its canonical JSON form (see *Exportable Lens Format* below) can be re-hosted in any AT Proto repo. The off-chain backend caches lenses for fast resolution but is not the source of truth.

#### Exportable Lens Format

A lens has a canonical serialization that is what gets signed, hashed, and synced:

```json
{
  "id": "lens:kreuzberg-housing",
  "name": "Kreuzberg Housing",
  "owner_did": "did:plc:...",
  "controller_address": null,
  "forked_from": null,
  "selector": { /* canonical scope vector */ },
  "subscription_mode": "auto_location",
  "overlays": [ /* see LensOverlay */ ],
  "governance_policy": { /* how overlays can be changed */ }
}
```

The backend MUST be able to produce this canonical form for any lens via an export endpoint. Lens definitions are stored in this shape in the backend's database; they are not free-form rows whose schema is the database table.

### Canonical Geographic Taxonomy

Issues, user profiles, and lenses reference the same location identifiers.

- Geography is stored as canonical refs, not free-form labels.
- A location ref may represent a neighborhood, city, region, or country.
- Specificity is derived from this shared taxonomy and used during overlay resolution.

### Selector Specificity

Overlay resolution depends on deterministic specificity scoring.

- Combined matches (e.g., location + topic) are more specific than either dimension alone.
- Geographic specificity follows the canonical location taxonomy.
- Topic specificity must come from either a canonical topic taxonomy or an explicit scoring model; free-form tags alone are not enough.

### Module Identity and Versioning

Every module has a globally unique, versioned identifier of the form:

```
<namespace>/<key>@<semver>
```

- `<namespace>` is reserved per registry: `kindact/` for first-party modules shipped in the monorepo. v2 may admit additional namespaces (DIDs, third-party publishers).
- `<key>` is the module short name (e.g. `consensus-decision`).
- `<semver>` follows standard semver. Breaking changes MUST bump the major version.

Examples: `kindact/approval-voting@1.0.0`, `kindact/consensus-decision@1.2.0`, `kindact/photo-evidence@0.4.1`.

Module identifiers are treated as opaque strings everywhere they appear — in lens overlays, in issue protocol bindings, in procedural snapshots, in on-chain `ModuleRegistry` records, and in catalog APIs. The platform does not parse them beyond extracting the `(namespace, key, version)` triple.

#### Module Version Pinning

When an issue's protocol binding is resolved (and at every procedural snapshot), it pins the **exact module version**, not just the module key.

- A new version of a module never retroactively affects an existing issue. An issue running `kindact/consensus-decision@1.2.0` continues to run that version until completion.
- New issues created after a version bump pick up the new version on next binding resolution.
- A module's manifest MAY declare `migrations` describing how (or whether) state from older major versions maps forward. v1 modules can declare `migrations: none` and require new bindings to migrate; the field merely reserves the surface.

### Module Catalog and Slots

Every approved module declares:

| Field | Description |
|-------|-------------|
| `id` | Namespaced versioned identifier (`<namespace>/<key>@<semver>`) |
| `slot` | Which slot it fills |
| `multiplicity` | `single` or `multi` |
| `depends_on` | Other modules required, expressed as `<namespace>/<key>` (any compatible version) or fully pinned `id` |
| `incompatible_with` | Conflicting modules |
| `produces` | Data exports (data type keys) |
| `read_fallback` | Minimal renderer for non-native viewers |
| `maturity` | `experimental`, `beta`, `stable`, `core` |
| `permissions` | Declared capabilities the module needs (see *Capability-Based Hook APIs* in 014) |
| `migrations` | How state from older major versions maps forward (or `none`) |

Maturity tiers:

| Tier | Meaning | Who can enable |
|------|---------|----------------|
| `experimental` | New, lightly tested | Reserved data tier. v1 does not yet define the lightweight enablement path; modules in this tier may exist in the catalog but cannot be enabled by lenses until that path is added. |
| `beta` | Functionally complete, gathering feedback | Any lens, with a beta badge |
| `stable` | Production-ready, well-tested | Any lens |
| `core` | Part of the always-on protocol | Everyone (not disableable) |

Core slots:

| Slot | Multiplicity |
|------|-------------|
| `deliberation.surface` | multi |
| `decision.engine` | single |
| `decision.continuity` | single |
| `decision.modifier` | multi |
| `signal.input` | multi |
| `verification.evidence` | multi |
| `verification.policy` | single |
| `dispute.policy` | single |
| `metrics.dimension_pack` | multi |
| `assistive.ai` | multi |
| `ui.theme` | single |
| `ui.ranking_default` | single |

### Issue Protocol Binding

When an issue is created, the platform resolves all matching lens overlays into a single issue-centric protocol binding.

Deterministic precedence rules:
1. Issue explicit override
2. Most specific combined overlay
3. Most specific geographic overlay
4. Most specific topic/interest overlay
5. Platform default

- `single` slots choose one value.
- `multi` slots union all compatible modules.
- Each entry in the binding is a fully pinned module id (`<namespace>/<key>@<semver>`).
- If equal-specificity overlays conflict in a `single` slot, the issue falls back to the platform default for that slot.
- The binding is stored with the issue and is authoritative for all viewers.

#### On-Chain Binding Hash

The full resolved binding lives off-chain (cheap, expressive). A **canonical hash** of the binding (`bytes32 protocolBindingHash`) is written into the on-chain issue record at issue creation via 005.

- The hash MUST be computed over the canonical JSON form of the binding (sorted keys, stable ordering of multi-slot entries by module id).
- Once written, the hash is immutable for that issue's deliberation phase. Phase snapshots (decision, implementation, dispute) record their own hashes alongside.
- Two AppViews indexing the same chain MUST resolve to the same `protocolBindingHash`. If they disagree, at least one is wrong and the discrepancy is detectable without trusting either operator.

This is the cheapest piece of decentralization insurance available: it costs a `bytes32` per issue and removes the off-chain backend's ability to silently substitute a different protocol for an issue.

### Procedural Snapshots

At critical phase boundaries, the issue snapshots active procedural rules:

| Snapshot | Frozen fields |
|----------|---------------|
| Decision | `decision.engine`, `decision.continuity`, `decision.modifier`, eligibility rules |
| Implementation | `verification.policy`, `verification.evidence`, reward parameters |
| Dispute | `dispute.policy` |

Snapshots freeze *procedure*, not *outcome*. Votes, delegations, and reversals may still evolve according to the snapshotted rules.

### Read/Write Boundary

- Raw module data must be available through canonical exports for audit and interoperability.
- Data does not need to be equally prominent in every UI.
- Each module must provide a fallback renderer for users or surfaces that do not expose the full module UI.
- Write access is controlled by the issue's protocol binding, not by the current viewer's lens.

### Governance Boundaries

- Platform meta-governance (013) approves modules into the global catalog and can promote modules to `core`.
- Lens governance configures overlays for individual lenses.
- Each lens declares a `governance_policy` describing who can change overlays and through which vote path.
- Identity and optional location hints remain distinct concerns.

### On-Chain vs Off-Chain

- On-chain facets are reserved for modules that affect trust, money, rights, or finality.
- The module catalog, lens overlays, fallback renderers, and read models are primarily off-chain (managed by 014).
- Backend validators may reject or normalize module-specific inputs before commit, but must not silently change binding outcomes.
- Any normalization must produce an audit record and return the transformed payload to the caller.

### Manifests as Data

Every module ships a `manifest.json` (or `manifest.yaml`) sitting next to its code. The manifest is the source of truth for the module catalog entry; the code is *implementation* of what the manifest declares.

- v1 modules live first-party in the monorepo. The manifest is read at build time and registered into the catalog.
- The manifest schema is the same one v2 will use for content-addressed, signed, dynamically-loaded modules. The loader changes; the manifest contract does not.
- Loading a module's code without its manifest is forbidden: the runtime MUST refuse to invoke a module hook unless a manifest is registered for that exact module id.

This means the catalog is data the platform consumes, not code the platform builds itself into. v1 doesn't need dynamic loading; it just needs to not foreclose it.

### Capability-Based Hook APIs (pattern)

Backend module hooks (defined in detail by 014) and on-chain facets do not get ambient access to platform infrastructure. They receive a **`ctx`** object containing only the capabilities declared in the module's manifest `permissions` field. Anything not declared is unavailable.

- A module declaring `permissions: ["issues.read", "moduleData.writeOwn", "notify.emit"]` gets `ctx.issues.read`, `ctx.moduleData.writeOwn`, `ctx.notify.emit` and nothing else.
- v1 does NOT sandbox modules (code lives in the monorepo and is trusted). The runtime hands `ctx` to every hook by convention; nothing physically prevents a module from reaching ambient state, but doing so is grounds for code-review rejection.
- In v2, `ctx` is replaced with a proxy that bridges into a sandboxed runtime (iframe / Worker / WASM). Module code continues to compile against the same surface.

The point of doing this in v1 is to lock in the shape of the API the moment any module is written, so v2's sandboxing is a runtime swap, not a rewrite.

### Module-Scoped Storage

Modules never write directly into core tables. Module-specific off-chain state lives in a dedicated `module_data` table (managed by 014) keyed by `(module_namespace, module_key, entity_type, entity_id)`. The capability `moduleData.writeOwn` grants write access only to rows scoped to the calling module.

This is the storage-layer counterpart to capability `ctx`: in v1 it is a discipline enforced by code review; in v2 the runtime can enforce it physically because every module write goes through a single typed surface.

### Constrained Frontend Slot Contracts (pattern)

Frontend plugin slots (defined in detail by 015) are typed contracts, not "any React component goes here":

- Each slot declares a typed `props` interface (what the shell will pass in) and a typed `events` interface (what the module can emit back to the shell).
- Modules contribute components conforming to that contract; the shell never hands the module raw DOM, raw network, or raw store access.
- v1 modules can technically reach outside the contract (they run in the same bundle). v2 can serve the same component from an iframe / Web Worker because the wire is already a typed message contract.

## Plan

1. Define canonical data structures for `Lens`, `LensOverlay`, `ModuleCatalogEntry`, and `IssueProtocolBinding`, including namespaced+versioned module ids and lens owner/forked_from fields.
2. Specify overlay precedence and compatibility resolution for backend implementation.
3. Define procedural snapshot records and which fields are frozen at each boundary; specify canonical-JSON binding hash computation.
4. Specify the manifest schema (data fields, permissions, migrations) and the build-time loader for v1.
5. Specify the capability `ctx` surface and the initial capability set (`issues.read`, `moduleData.readOwn`, `moduleData.writeOwn`, `notify.emit`, `events.subscribe`); document that v1 enforces by convention, v2 by runtime.
6. Specify the module-scoped storage shape (`module_data` table) and the read/write capability boundary.
7. Specify API/export expectations for raw module data, fallback renderers, and lens canonical form.
8. Align impacted specs (005, 006, 007, 008, 009, 012, 014, 015) to this foundation.

## Test

- Two different viewers looking at the same issue resolve to the same active protocol binding and the same `protocolBindingHash`.
- The on-chain binding hash matches the off-chain canonical JSON hash deterministically.
- Equal-specificity conflicts in `single` slots resolve deterministically to platform default.
- A decision snapshot prevents mid-phase rule swaps while still allowing vote changes within the snapshotted rules.
- Bumping a module version does not change the binding of any pre-existing issue; new issues pick up the new version.
- Module data remains exportable and readable even when the full module UI is not shown.
- Fallback renderers render correctly for modules not natively supported by the viewer.
- A module without a registered manifest cannot be invoked by the runtime.
- A lens exports its canonical JSON form via the catalog API and round-trips losslessly.

## Notes

- This spec is foundational and should be read before implementing issue lifecycle, backend hooks, or frontend slots.
- First implementation stays first-party and monorepo-based; third-party runtime loading is out of scope. However, the manifest schema, capability `ctx`, slot contracts, and lens canonical form are the v2-facing surfaces — v1 should not deviate from them even though enforcement is informal.
- Originally created as spec 016 in the extensibility strategy thread (2026-04-05); renumbered to 030 to avoid conflict with 016 (Impact Metrics) and the UI spec series at 018-027.
