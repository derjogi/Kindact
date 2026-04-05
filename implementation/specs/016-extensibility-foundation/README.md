---
status: planned
created: '2026-04-05'
tags:
  - architecture
  - extensibility
  - governance
priority: high
created_at: '2026-04-05T10:10:13.219912528+00:00'
---

# 016 — Extensibility Foundation

> **Status**: planned · **Priority**: high · **Created**: 2026-04-05

## Overview

Define the platform-level extensibility model that lets Kindact stay one global system while supporting different issue experiences in different contexts. This spec owns lenses, canonical geography references, module slots, issue protocol binding, procedural snapshots, and the rules for how module data remains interoperable across the shared platform.

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

- Combined matches (for example location + topic) are more specific than either dimension alone.
- Geographic specificity follows the canonical location taxonomy.
- Topic specificity must come from either a canonical topic taxonomy or an explicit scoring model; free-form tags alone are not enough.

### Module Catalog and Slots

Every approved module declares:

- `key`
- `slot`
- `multiplicity`
- `depends_on`
- `incompatible_with`
- `produces`
- `read_fallback`
- `maturity`

Core slots:

- `deliberation.surface`
- `decision.engine`
- `decision.continuity`
- `decision.modifier`
- `signal.input`
- `verification.evidence`
- `verification.policy`
- `dispute.policy`
- `metrics.dimension_pack`
- `assistive.ai`
- `ui.theme`
- `ui.ranking_default`

### Issue Protocol Binding

When an issue is created, the platform resolves all matching lens overlays into a single issue-centric protocol binding.

- Resolution uses deterministic precedence rules:
  - issue explicit override
  - most specific combined overlay
  - most specific geographic overlay
  - most specific topic/interest overlay
  - platform default
- `single` slots choose one value.
- `multi` slots union all compatible modules.
- If equal-specificity overlays conflict in a `single` slot, the issue falls back to the platform default for that slot.
- The binding is stored with the issue and is authoritative for all viewers.

### Procedural Snapshots

At critical boundaries, the issue snapshots the active procedural rules for that phase.

- Decision snapshot: `decision.engine`, `decision.continuity`, `decision.modifier`, eligibility rules
- Implementation snapshot: `verification.policy`, `verification.evidence`, reward parameters
- Dispute snapshot: dispute rules

Snapshots freeze procedure, not outcome. Votes, delegations, and reversals may still evolve according to the snapshotted rules.

### Read/Write Boundary

- Raw module data must be available through canonical exports for audit and interoperability.
- Data does not need to be equally prominent in every UI.
- Each module must provide a fallback renderer for users or surfaces that do not expose the full module UI.
- Write access is controlled by the issue's protocol binding and participation requirements, not by the current viewer lens.

### Governance Boundaries

- Platform meta-governance approves modules into the global catalog and can promote modules to core.
- Lens governance configures overlays for individual lenses.
- Each lens declares a `governance_policy` describing who can change overlays and through which issue/vote path.
- Identity and optional location hints remain distinct concerns.

### On-Chain vs Off-Chain

- On-chain facets are reserved for modules that affect trust, money, rights, or finality.
- The richer global module catalog, lens overlays, fallback renderers, and read models are primarily off-chain.
- Backend validators may reject or normalize module-specific inputs before commit, but they must not silently change binding outcomes.
- Any normalization must be explicit, auditable, and surfaced to the caller as a transformed payload rather than applied invisibly.

## Plan

- [ ] Define canonical data structures for `Lens`, `LensOverlay`, `ModuleCatalogEntry`, and `IssueProtocolBinding`.
- [ ] Specify overlay precedence and compatibility resolution in enough detail for backend implementation.
- [ ] Define procedural snapshot records and which fields are frozen at each boundary.
- [ ] Specify API/export expectations for raw module data and fallback renderers.
- [ ] Align impacted specs (001, 005, 006, 007, 008, 009, 012, 013, 014, 015) to this foundation.

## Test

- [ ] Two different viewers looking at the same issue resolve to the same active protocol binding.
- [ ] Equal-specificity conflicts in `single` slots resolve deterministically.
- [ ] A decision snapshot prevents mid-phase rule swaps while still allowing vote changes within the active rules.
- [ ] Module data remains exportable and readable even when the full module UI is not shown.

## Notes

- This spec is intentionally foundational and should be read before implementing issue lifecycle, backend hooks, or frontend slots.
- The first implementation can stay first-party and monorepo-based; third-party runtime loading is out of scope.
