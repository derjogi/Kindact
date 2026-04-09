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

### Module Catalog and Slots

Every approved module declares:

| Field | Description |
|-------|-------------|
| `key` | Unique module identifier |
| `slot` | Which slot it fills |
| `multiplicity` | `single` or `multi` |
| `depends_on` | Other modules required |
| `incompatible_with` | Conflicting modules |
| `produces` | Data exports |
| `read_fallback` | Minimal renderer for non-native viewers |
| `maturity` | `experimental`, `stable`, `core` |

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
- If equal-specificity overlays conflict in a `single` slot, the issue falls back to the platform default for that slot.
- The binding is stored with the issue and is authoritative for all viewers.

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

## Plan

1. Define canonical data structures for `Lens`, `LensOverlay`, `ModuleCatalogEntry`, and `IssueProtocolBinding`.
2. Specify overlay precedence and compatibility resolution for backend implementation.
3. Define procedural snapshot records and which fields are frozen at each boundary.
4. Specify API/export expectations for raw module data and fallback renderers.
5. Align impacted specs (005, 006, 007, 008, 009, 012, 014, 015) to this foundation.

## Test

- Two different viewers looking at the same issue resolve to the same active protocol binding.
- Equal-specificity conflicts in `single` slots resolve deterministically to platform default.
- A decision snapshot prevents mid-phase rule swaps while still allowing vote changes within the snapshotted rules.
- Module data remains exportable and readable even when the full module UI is not shown.
- Fallback renderers render correctly for modules not natively supported by the viewer.

## Notes

- This spec is foundational and should be read before implementing issue lifecycle, backend hooks, or frontend slots.
- First implementation stays first-party and monorepo-based; third-party runtime loading is out of scope.
- Originally created as spec 016 in the extensibility strategy thread (2026-04-05); renumbered to 030 to avoid conflict with 016 (Impact Metrics) and the UI spec series at 018-027.
