---
status: planned
created: '2026-04-14'
tags: [metrics, core-loop, off-chain, smart-contracts, atproto]
priority: high
depends_on:
  - 004-content-anchoring
  - 014-off-chain-backend
related:
  - 031-core-metrics-framework
---

# 016 — Impact Assessment & Metrics

## Overview

Mandatory impact assessment framework that gates issues before voting. Every issue must demonstrate net-positive projected impact across baseline dimensions before proceeding to decision. Combines AI estimation, expert input, and community review.

> **Relationship to [031](../031-core-metrics-framework/README.md)**: This spec is the *implementation* layer — on-chain `MetricsBundleFacet`, AT Proto storage, net-impact gate enforcement. Spec 031 defines the *framework* — taxonomy, lifecycle, canonical export format. Read 031 first to understand the conceptual model, then this spec for how it's enforced.

## Design

### Baseline Dimensions

Every issue is assessed against mandatory axes:

| Dimension | Examples |
|-----------|----------|
| Social | Health, education, equality, community cohesion |
| Planetary | Emissions, biodiversity, resource use, pollution |
| Economic | Cost, labor hours, materials, ongoing maintenance |
| Time | Implementation timeline, expected duration of impact |

Dimensions that aren't affected are marked as neutral. Confidence levels accompany all estimates.

### MetricsBundleFacet

On-chain facet storing metric bundle hashes per issue:

```
struct MetricsBundle {
    uint256 issueId;
    bytes32 bundleHash;       // CID of AT Proto record(s) containing the full metrics bundle
    uint8   netImpactVerdict; // 0=pending, 1=positive, 2=negative, 3=disputed
    uint64  evaluatedAt;
}
```

Mapping: `issueId → MetricsBundle` in AppStorage.

### Off-chain Metrics Service

Metric data is stored as AT Proto records using Hypercerts lexicons (anchored via 004):

- **AI Estimation**: Initial estimates published as AT Proto records by the AI service's DID, making them attributable and auditable
- **Expert Input**: Contributors submit `org.hypercerts.context.measurement` records (quantitative data points) signed by their DIDs
- **Community Review**: Users publish `org.hypercerts.context.evaluation` records (assessments) signed by their DIDs; disputes and endorsements are attributable to specific reviewers
- **Confidence Levels**: All estimates include uncertainty ranges

### Net-Impact Gate

Issues cannot transition from `Deliberating → VoteReady` until:

1. All relevant dimensions have estimates
2. Net impact verdict is `positive`
3. No unresolved disputes on critical dimensions

The gate is enforced on-chain: `IssueRegistryFacet` (005) checks `MetricsBundleFacet` before allowing the state transition.

### Proportional Scrutiny

- Small, local issues: lower confidence thresholds, fewer dimensions required
- Large, high-reward issues: higher confidence, more dimensions, review expected
- Thresholds scale with `rewardCeiling` from the issue

### Events

- `MetricsBundleSubmitted(uint256 indexed issueId, bytes32 bundleHash)`
- `NetImpactVerdictSet(uint256 indexed issueId, uint8 verdict)`
- `MetricDisputed(uint256 indexed issueId, bytes32 dimensionId, address disputer)`

### Extension Points

- Additional dimension packs (domain-specific: agriculture, healthcare, etc.)
- Prediction market integration for outcome forecasting
- Automated metric validation via external data sources

## Plan

1. Define baseline dimension schema (off-chain JSON format).
2. Implement `MetricsBundleFacet` with on-chain verdict storage.
3. Implement off-chain metrics service (AI estimation + user input API).
4. Integrate net-impact gate with `IssueRegistryFacet` state transition (005).
5. Build metrics UI components (dimension cards, confidence indicators, dispute flow).
6. Tests.

## Test

- Unit: metrics bundle submission and verdict storage.
- Unit: net-impact gate blocks VoteReady transition when verdict is pending/negative.
- Unit: proportional scrutiny thresholds based on reward ceiling.
- Integration: full flow — submit metrics → gate check → issue proceeds to VoteReady.
- Integration: dispute flow — flag dimension → verdict reverts to pending.
- Edge: all dimensions neutral, single negative dimension, disputed then resolved.

## Notes

- Start with simple AI-generated estimates; prediction markets and expert panels are future extensions.
- Metrics are append-only: updated bundles create new records, history preserved.
- The framework draws from Doughnut Economics (social floor + ecological ceiling).
- Prior design work in extensibility strategy thread defined a "core metrics framework" concept — this spec implements it.
