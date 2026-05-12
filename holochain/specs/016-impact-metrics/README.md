---
status: planned
created: '2026-05-12'
tags: [metrics, core-loop, holochain, smart-contracts]
priority: high
derivation: changed
counterpart: 016-impact-metrics
depends_on:
  - 004-content-anchoring
  - 005-issue-lifecycle
  - 014-conductor-and-bridge-service
  - 041-base-dna-specification
related:
  - 031-core-metrics-framework
---

# 016 — Impact Assessment & Metrics

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [016-impact-metrics](../../../implementation/specs/016-impact-metrics/README.md). Metrics bundles move from AT Proto records to DHT entries; on-chain anchoring of the bundle hash and net-impact gate is unchanged.

## Overview

Mandatory impact assessment that gates issues before voting (via the net-impact gate enforced by Base DNA per [041](../041-base-dna-specification/README.md)). Every issue is assessed against baseline dimensions (Social, Planetary, Economic, Time). The framework is unchanged ([031 in implementation/](../../../implementation/specs/031-core-metrics-framework/README.md)); the substrate underneath shifts to DHT.

Read the [implementation/ counterpart](../../../implementation/specs/016-impact-metrics/README.md) for baseline dimensions, AI estimation flow, expert input, and net-impact verdict computation.

## What changes

### Metrics bundle as DHT entry

```json
{
  "type": "metrics_bundle",
  "issueRef": {"cellId": "...", "issueHash": "..."},
  "dimensions": {
    "social": {"value": 7.2, "confidence": 0.6, "estimator": "ai", "estimatorAgent": "uhCAk..."},
    "planetary": {"value": -2.1, "confidence": 0.4, "estimator": "expert", "estimatorAgent": "uhCAk..."},
    "economic": {"value": -10000, "confidence": 0.8, "estimator": "human", "estimatorAgent": "uhCAk..."},
    "time": {"implementationMonths": 4, "expectedImpactYears": 20}
  },
  "netImpactVerdict": "positive",
  "framework": {"version": "1.2.0", "metricsPackId": "kindact:base:v1"},
  "evaluatedAt": 1715000000,
  "supersedes": null
}
```

Bundles are committed by:
- The AI estimation service (signed by its registered agent key).
- Experts assigned via the issue's binding (signed by their agent keys).
- Cell-internal review process (community ratification entry signed by quorum).

The most recent ratified bundle is the canonical one. Bundle hash is anchored on EVM at `Deliberating → VoteReady` transition.

### MetricsBundleFacet

```solidity
struct MetricsBundle {
    uint256 issueId;
    bytes32 bundleHash;        // CID of canonical metrics_bundle DHT entry
    bytes32 cellId;            // home cell
    uint8   netImpactVerdict;  // 0=pending, 1=positive, 2=negative, 3=disputed
    bytes32 quorumProofHash;   // signatures backing the canonical bundle
    uint64  evaluatedAt;
}
```

Set via bridge call `anchorMetricsBundle(issueId, bundleHash, cellId, verdict, quorumProofHash, operationId)`.

### Net-impact gate

Enforced in two places:

1. **EVM**: `IssueRegistryFacet.setStatus(Deliberating → VoteReady)` rejects the transition if `MetricsBundle.netImpactVerdict != positive` (or explicit override per issue's binding).
2. **Holochain**: Base DNA validators reject the same transition entry in the cell.

Two-layer enforcement: a hostile cell that tries to skip the gate is caught at bridge anchoring; a hostile bridge submission with a forged verdict is caught by EVM facet validation against the bundle hash.

### AI service agent

The AI estimation service runs as a registered agent (per [002](../002-identity-primitive/README.md), [006](../006-deliberation-cell/README.md)):
- Reads the issue's deliberation entries via conductor.
- Generates dimension estimates with confidence intervals.
- Commits a `metrics_bundle` entry signed by its agent key.
- Updates as new deliberation arrives; old bundles remain in source chain.

Multiple AI services may compete (per cell binding); cells may require human ratification before any bundle becomes canonical.

### Expert assignment

Experts are agents with declared expertise registered in the cell (or via the cross-cell `expert_attest` policy from [008](../008-work-verification-rewards/README.md)). When an issue's binding requires expert input:
- Expert is notified.
- Expert commits dimension entries with their estimates and confidence.
- Aggregation: per-dimension weighted average of expert + AI + community estimates per the metrics framework.

### Dispute over bundle

If a community member believes a canonical bundle is incorrect:
- They flag the bundle via [012](../012-dispute-resolution/README.md) (`metrics_bundle_dispute`).
- Bundle status becomes `disputed`; issue cannot transition further until resolved.
- Resolution: cell quorum or external arbitration produces a corrected bundle; new bundle replaces the disputed one.

## Plan

1. [ ] Implement `kindact_metrics` zome with bundle, dimension, ratification, and dispute entry types.
2. [ ] Implement AI service agent integration (read deliberation, write bundle).
3. [ ] Implement bridge `anchorMetricsBundle` flow; on-chain `MetricsBundleFacet`.
4. [ ] Implement two-layer net-impact gate enforcement.
5. [ ] Implement expert assignment and aggregation per the framework.
6. [ ] Implement dispute path on the bundle.

## Test

- [ ] Issue cannot transition to `VoteReady` without a positive bundle: enforced on both substrates.
- [ ] AI service agent updates bundle as deliberation evolves; old versions remain in source chain.
- [ ] Expert estimates aggregated per the framework; weighted average matches expectation.
- [ ] Disputed bundle: issue freezes; resolution unfreezes with corrected bundle.
- [ ] Bridge with falsified verdict (verdict ≠ bundle's actual verdict): EVM rejects on hash check.

## Open questions

- **Multi-AI service competition** — cells choose one AI service per binding, or aggregate across services?
- **Expert role registration** — central registry or per-cell? How is expertise verified?
- **Confidence threshold for canonical** — what minimum weighted confidence is required for a bundle to be `positive`?
- **Backporting framework versions** — when the metrics framework is updated, what happens to existing bundles?
- **Metrics pack extensibility** — Permaculture cell wants biodiversity-credit dimension; how does it add to the bundle without breaking aggregation?

## Notes

The framework definition (taxonomy, dimensions, lifecycle, canonical export format) lives in [031 Core Metrics Framework](../../../implementation/specs/031-core-metrics-framework/README.md) and is unchanged in the hybrid. This spec is the implementation layer that puts the framework on the actual substrate. The two-layer gate (Holochain Base + EVM facet) is a defense-in-depth pattern that reuses the cross-cell challenge mechanism for accountability.
