---
status: planned
created: '2026-04-05'
tags:
  - metrics
  - architecture
  - governance
priority: high
created_at: '2026-04-05T10:10:13.298105938+00:00'
---

# 017 — Core Metrics Framework

> **Status**: planned · **Priority**: high · **Created**: 2026-04-05

## Overview

Define the shared, binding metrics framework used by every Kindact issue. This spec makes metrics a core platform primitive rather than an optional signal, while still allowing communities to extend the shared taxonomy with domain-specific dimension packs.

## Design

### Core Baseline

Every issue carries a baseline metrics bundle with at least:

- social impact
- planetary impact
- economic/resource cost
- time / feasibility
- uncertainty / confidence

Each dimension can be positive, negative, neutral, or not applicable, but every issue must explicitly model the baseline set before decision-making can proceed.

### Dimension Packs

Communities and modules can extend the baseline with additional subdimensions.

Examples:

- `soil_health`
- `biodiversity`
- `housing_quality`
- `public_health`
- `accessibility`
- `ai_safety`

Dimension packs extend the shared taxonomy; they do not replace the baseline categories.

### Metrics Lifecycle

- Metrics are created during issue formation and deliberation.
- Metrics remain adjustable while an issue is being refined.
- The issue cannot open decision-making until required metrics are present and the net-impact gate is satisfied.
- Implementation reports can update realized outcomes against the expected metrics model.

The framework should distinguish between:

- a current deliberation metrics bundle
- a decision-time metrics snapshot used for gating
- a realized outcomes bundle recorded during and after implementation

### Net-Impact Gate

The framework provides a shared gate for deciding whether an issue is allowed to proceed.

- Large or clearly harmful issues must be blocked.
- Thresholds for acceptable downside remain governable, but the existence of the gate is core.
- The gate should be explainable and auditable, not a black-box AI score.

Every gate evaluation must produce an auditable artifact that records:

- the input metrics bundle used
- the threshold version applied
- the resulting pass/block verdict
- explanatory reasons suitable for export and UI display

### Sources and Confidence

Metrics can be informed by multiple sources:

- AI estimation
- prediction markets
- expert/user input
- structured implementation data

Every estimate records provenance and confidence so downstream consumers can distinguish firm evidence from soft forecasts.

### Canonical Export

Metrics bundles must have a canonical export format that can be reused by:

- issue detail views
- ranking and discovery
- verification flows
- hypercert metadata
- analytics and auditing

The canonical export should also support gate evaluation records and versioned metric snapshots.

### Relationship to Other Specs

- Issue lifecycle depends on this spec for decision gating.
- Verification and rewards depend on this spec for realized outcome reporting.
- Hypercerts depend on this spec for standardized impact metadata.

## Plan

- [ ] Define the baseline metrics schema and canonical serialization format.
- [ ] Define how dimension packs extend the baseline taxonomy without breaking comparability.
- [ ] Specify the net-impact gate and which thresholds are governable vs constitutional.
- [ ] Define provenance, confidence, and update semantics for metric values.
- [ ] Align impacted specs (005, 007, 008, 011, 014, 015) to this framework.

## Test

- [ ] An issue without baseline metrics cannot enter the decision phase.
- [ ] Two issues in different domains still share comparable baseline metrics.
- [ ] Domain-specific dimension packs extend, rather than replace, the baseline export.
- [ ] Realized implementation metrics can be mapped back to the same issue-level metric schema.

## Notes

- The framework should make room for uncertainty and disagreement rather than forcing false precision.
- This spec should stay independent from any single estimation method so AI, prediction markets, and human review can coexist.
