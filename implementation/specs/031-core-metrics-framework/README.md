---
status: planned
created: '2026-04-05'
tags: [metrics, architecture, governance]
priority: high
depends_on:
  - 030-extensibility-foundation
related:
  - 016-impact-metrics
---

# 031 — Core Metrics Framework

## Overview

Define the shared, binding metrics framework used by every Kindact issue. Makes metrics a core platform primitive rather than an optional signal, while allowing communities to extend the shared taxonomy with domain-specific dimension packs. This spec defines the *framework and taxonomy*; spec 016 implements the on-chain gating and AT Proto storage.

## Design

### Core Baseline

Every issue carries a baseline metrics bundle with at least:

| Dimension | Description |
|-----------|-------------|
| Social impact | Health, education, equality, community cohesion |
| Planetary impact | Emissions, biodiversity, resource use, pollution |
| Economic/resource cost | Budget, labor, materials, ongoing maintenance |
| Time/feasibility | Implementation timeline, duration of impact |
| Uncertainty/confidence | Confidence in estimates, known unknowns |

Each dimension can be positive, negative, neutral, or not applicable, but every issue must explicitly model the baseline set before decision-making can proceed.

### Dimension Packs

Communities and modules can extend the baseline with additional subdimensions via the `metrics.dimension_pack` module slot (018):

- `soil_health`, `biodiversity` (under Planetary)
- `housing_quality`, `public_health` (under Social)
- `accessibility`, `ai_safety` (cross-cutting)

Dimension packs extend the shared taxonomy; they do not replace the baseline categories. All issues remain comparable on baseline dimensions regardless of which packs are active.

### Metrics Lifecycle

The framework distinguishes three metric states:

| State | When | Purpose |
|-------|------|---------|
| Deliberation metrics | During issue formation | Evolving estimates, open for refinement |
| Decision-time snapshot | At `Deliberating → VoteReady` gate | Frozen for gating and voter reference |
| Realized outcomes | During and after implementation | Actual results vs. projections |

Metrics remain adjustable during deliberation. The issue cannot open decision-making until required metrics are present and the net-impact gate is satisfied (016).

### Sources and Confidence

Metrics can be informed by multiple sources:

- AI estimation (published by AI service DID)
- Prediction markets (future)
- Expert/user input (signed attestations)
- Structured implementation data (ValueFlows)

Every estimate records **provenance** and **confidence** so downstream consumers can distinguish firm evidence from soft forecasts.

### Net-Impact Gate

The framework provides a shared gate for deciding whether an issue is allowed to proceed:

- Large or clearly harmful issues must be blocked.
- Thresholds for acceptable downside are governable via 013, but the existence of the gate is constitutional.
- The gate must be explainable and auditable, not a black-box score.

Every gate evaluation produces an auditable artifact recording:
- Input metrics bundle used
- Threshold version applied
- Pass/block verdict
- Explanatory reasons suitable for export and UI display

Implementation of the gate is in 016 (MetricsBundleFacet).

### Canonical Export

Metrics bundles have a canonical export format reusable by:
- Issue detail views (015)
- Ranking and discovery (014)
- Verification flows (008)
- Hypercert metadata (011)
- Analytics and auditing

The canonical export supports gate evaluation records and versioned metric snapshots.

## Plan

1. Define the baseline metrics schema and canonical serialization format.
2. Define how dimension packs extend the baseline taxonomy without breaking comparability.
3. Specify the net-impact gate thresholds — which are governable vs. constitutional.
4. Define provenance, confidence, and update semantics for metric values.
5. Align with 016 (on-chain implementation) and 030 (module slot integration).

## Test

- An issue without baseline metrics cannot enter the decision phase.
- Two issues in different domains still share comparable baseline metrics.
- Domain-specific dimension packs extend, rather than replace, the baseline export.
- Realized implementation metrics can be mapped back to the same issue-level metric schema.
- Gate evaluation artifacts are complete and auditable.

## Notes

- The framework makes room for uncertainty and disagreement rather than forcing false precision.
- Stays independent from any single estimation method so AI, prediction markets, and human review can coexist.
- Originally created as spec 017 in the extensibility strategy thread (2026-04-05); renumbered to 031 to avoid conflict with 017 (Work Planning) and the UI spec series at 018-027.
- Significant overlap with 016 (Impact Metrics) is intentional: 031 defines the *what and why* (framework, taxonomy, lifecycle); 016 defines the *how* (on-chain facet, AT Proto storage, gating logic).
