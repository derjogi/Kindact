---
status: planned
created: 2026-05-01
priority: high
derivation: ported
ports_from: 035-governance-data-visualization
tags:
- frontend
- design
- dataviz
depends_on:
- '032'
related:
- 018-015a-ui-dashboard
- 020-015c-ui-deliberation
- 021-015d-ui-voting
- 022-015e-ui-implementation
- 024-015g-ui-token-wallet
- 016-impact-metrics
- 029-decision-continuity
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 035 — Governance Data Visualization Patterns

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [035-governance-data-visualization](../../../implementation/specs/035-governance-data-visualization/README.md)

## Hybrid notes

Visualization port — substrate-agnostic. New views: bridge multi-sig dashboard, oracle relay liveness, cell registry tier breakdown.


## Overview

Kindact surfaces concepts that are unintuitive without good visualization: token demurrage, conviction accumulation, opinion clustering, voter-scaled reward caps, multi-dimensional impact metrics with confidence ranges, and ValueFlows resource flows. This spec defines the **chart vocabulary, encoding rules, and accessibility contract** used everywhere data is shown.

## Design

### Principles

- **Encoding consistency** — the same dimension always maps to the same channel. Time → x-axis. Magnitude → length / area. Uncertainty → opacity or band.
- **Source labeling is mandatory** — every estimate carries a chip (`AI`, `prediction-market`, `expert`, `user`) per [ui-features.md](../../ui-features.md) §3.
- **Confidence is first-class** — never display a point estimate without its uncertainty (band, error bar, or explicit "low confidence" tag).
- **Color is never the only channel** — pattern, shape, label, or position always co-encode (a11y).
- **Interaction is optional, never required** — every chart has a static reading; tooltips reveal precision.

### Chart Vocabulary

**Demurrage / token decay**
- `DemurrageRing` (component) — radial countdown around a balance number, sweeping clockwise as decay accrues toward the next demurrage tick.
- `DemurrageTimeline` — projected balance line over 12 months (and configurable horizon) with annotations for expected earn / spend events.

**Voting & tallies**
- `ApprovalTally` — horizontal stacked bar (yes / no / abstain) with live update.
- `RankedChoiceFlow` — Sankey of round-by-round elimination.
- `ScoreVoting` — distribution histogram per option.
- `QuadraticTally` — credit-spent visualization with diminishing-returns curve overlay.
- All voting charts include a **voter-scaled reward cap** indicator showing what reward magnitude this turnout can unlock and the asymmetric objection effect.

**Decision continuity**
- `ConvictionMeter` — fill bar that grows over time the decision stands; reverse-ability cost is shown as an opposing fill.
- `ReconsiderationWindow` — calendar-strip indicator showing when reconsideration becomes cheap / expensive.

**Deliberation**
- `OpinionMap` — 2-D scatter (UMAP / PCA projection) of opinion vectors, with cluster hulls, colored by cluster. Used in Pol.is-style clustering.
- `ArgumentTree` — Kialo-style branching pro/con tree with weight encoded by node size.
- `ConsensusPulse` — radial chart per round showing %-objected, %-modified, %-accepted across consensus iterations.

**Impact metrics**
- `MetricsRadar` — radar chart across the four dimensions (social / planetary / economic / time) with confidence bands as translucent rings.
- `MetricComparison` — side-by-side bar comparison when multiple proposals exist for one issue.
- `ConfidenceBar` (component) — paired with any single metric: solid bar = point estimate, faded extension = uncertainty range, source chip on the right.

**Resource flows (ValueFlows)**
- `ResourceFlowSankey` — inputs → process → outputs, with quantities labeled. Required on every implementation report.
- `FlowConsistencyBadge` — green / amber / red indicator of automated consistency check result.

**Prediction markets**
- `PredictionMarketCurve` — time-series of market-implied probability with volume bars below and a "current consensus" callout.

**Network & delegation**
- `DelegationChain` — directed graph showing how a vote flows through delegates; current user highlighted.
- `LensActivity` — small-multiples sparkline grid of activity per subscribed lens.

### Encoding Rules

| Dimension | Channel |
|---|---|
| Time | x-axis (left → right past → future) |
| Magnitude (counts, balance) | length / area |
| Categorical (phase, intent) | hue (governance-phase tokens) |
| Uncertainty | translucent band, dashed stroke, or `±` label |
| Source attribution | chip / label, never color alone |
| Self / "you" | accent ring + ARIA `aria-current="true"` |

### Accessibility Contract

- Every chart ships an accessible table fallback (`<details><summary>Show data</summary><table>…`).
- Color palettes are deuteranopia-safe (verified with `colorblindly`).
- Patterns or shape co-encode all categorical hues.
- Keyboard-navigable data points where interaction exists; focused datum is announced (label + value + unit).
- Charts with motion (live tally) honor `prefers-reduced-motion`.

### Implementation

- Library: **Visx** (D3 primitives, React composability) for custom charts; **Recharts** discouraged because of styling rigidity.
- All charts consume tokens from [032](../032-design-system-foundations/README.md). No raw colors in chart code.
- Charts are pure functions of props; data fetching lives outside.
- Every chart exported from `@kindact/charts` workspace package.

## Plan

- [ ] Set up `@kindact/charts` workspace + Storybook stories
- [ ] Implement `DemurrageRing`, `DemurrageTimeline`
- [ ] Implement voting tally family (Approval, Ranked-Choice Sankey, Score, Quadratic)
- [ ] Implement `ConvictionMeter`, `ReconsiderationWindow`
- [ ] Implement `OpinionMap`, `ArgumentTree`, `ConsensusPulse`
- [ ] Implement `MetricsRadar`, `MetricComparison`, `ConfidenceBar`
- [ ] Implement `ResourceFlowSankey`, `FlowConsistencyBadge`
- [ ] Implement `PredictionMarketCurve`, `DelegationChain`, `LensActivity`
- [ ] Add accessible-table fallback to every chart
- [ ] Verify colorblind-safety + `prefers-reduced-motion` for all charts

## Test

- [ ] Every chart renders with mock data in Storybook (light + dark)
- [ ] Every chart has an accessible-table fallback (verified by axe)
- [ ] Confidence bands present on all metric charts
- [ ] Source chip present on all estimate displays
- [ ] Reduced-motion variant for live-update charts
- [ ] Visual regression snapshots for chart edge cases (zero data, single datum, max range)

## Notes

- The most novel chart is `DemurrageRing` — it has to make a token economic property feel emotionally tangible without alarming users into spending recklessly. Iterate on copy + animation timing with users.
- `OpinionMap` reuses Pol.is's mental model; respect their visual idioms users already know.
- ValueFlows-compatible structured flow data ([ui-features.md §5](../../ui-features.md)) is what makes `ResourceFlowSankey` possible — coordinate with [008-work-verification-rewards](../008-work-verification-rewards/README.md) on the data shape.
