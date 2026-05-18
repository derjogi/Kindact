---
status: complete
created: '2026-05-12'
tags: [holochain, anchors, discovery, foundational]
priority: high
derivation: new
depends_on:
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
---

# 042 — Anchor & Subscription Model

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: tag-handling in [028-tag-registry](../../../implementation/specs/028-tag-registry/README.md) and discovery defaults in [030-extensibility-foundation](../../../implementation/specs/030-extensibility-foundation/README.md).

## Overview

Anchors are the global discovery primitive that makes cells useful. **Cells are bounded; anchors are global.** When an issue is created in any cell, it publishes references to all relevant anchors (`#wind-power`, `#new-york`, `#green-energy`, `#housing`). Users subscribe to anchors *without* joining the underlying cells. When a subscriber sees an anchored issue they want to engage with, *then* they join the cell that owns it.

This separation is what keeps a user with broad interests from drowning in conductor load.

## Design

### Anchor entry

Anchors live in the Global Registry DNA.

```json
{
  "anchorId": "anchor:#green-energy",
  "kind": "topic",
  "displayName": "Green Energy",
  "synonyms": ["renewable-energy", "clean-energy"],
  "parentAnchors": ["anchor:#energy", "anchor:#climate"],
  "lifecycle": {
    "createdAt": 1715000000,
    "createdBy": "did:plc:...",
    "status": "active"
  },
  "moderation": {
    "deprecatedReason": null,
    "mergedInto": null
  }
}
```

Anchor kinds:

| Kind | Examples |
|---|---|
| `topic` | `#wind-power`, `#housing`, `#permaculture` |
| `location` | H3 cell identifiers, S2 cells, named places |
| `event` | One-off campaigns, e.g. `event:cop34-2026` |
| `cell` | Reverse pointer to a specific cell, used in cross-cell linkage |

### Anchor link entry (issues → anchors)

Issues attach themselves to anchors via lightweight link entries committed to the Global Registry by the issue's home cell:

```json
{
  "type": "anchor_link",
  "anchorId": "anchor:#wind-power",
  "issueRef": {
    "cellId": "uncurated/did:plc:.../manhattan-wind-turbine",
    "issueHash": "uhCAk..."
  },
  "scopeVector": {
    "scopeLevel": "neighborhood",
    "locationRefs": ["h3:88283082..."],
    "topicTags": ["#wind-power", "#new-york", "#green-energy"]
  },
  "createdAt": 1715000000
}
```

Validators in the Global Registry check:
- The signing cell is a Kindact-conformant DNA hash.
- The anchor exists and is `active`.
- The issue's `scopeVector` matches at least one anchor selector criterion.

### Subscription

Users subscribe to anchors via a local-only entry in their own source chain (no DHT cost beyond a watch):

```json
{
  "type": "subscription",
  "anchorId": "anchor:#wind-power",
  "filters": {
    "scopeLevels": ["neighborhood", "city", "region"],
    "minRewardAmount": null,
    "languages": ["en", "de"]
  },
  "subscribedAt": 1715000000
}
```

The conductor opens long-poll gossip on the Global Registry, filtered by the subscribed anchor IDs. New `anchor_link` entries flow into the user's notification stream.

### Subscription scaling

| Hardware | Practical subscription budget | Practical membership budget |
|---|---|---|
| Mobile (Holo-hosted conductor) | hundreds | low single digits |
| Mobile (local conductor) | dozens | 1–3 |
| Desktop (local conductor) | hundreds | low double digits |
| Server / always-on conductor | thousands | dozens |

These numbers are guidance, not contracts. They follow from documented Holochain DHT sharding and gossip patterns; production hApps today operate in this range.

### Anchor governance

Anchors are intentionally cheap to create — anyone humanity-verified can create one. Quality is preserved by:

- **Synonym merge**: anchors can be merged via meta-governance, redirecting subscriptions and links to the canonical anchor.
- **Deprecation**: stale or duplicate anchors are flagged with `deprecatedReason`.
- **Hierarchy**: child anchors propagate matches up the parent chain, so subscribing to `#energy` surfaces issues anchored to `#wind-power` or `#solar`.
- **Spam mitigation**: anchors with no link entries for N months auto-deprecate.

### Cross-cell discovery flow (worked example)

```diagram
Manhattan-WindTurbine cell publishes issue X.
  │
  │ home cell publishes anchor_link entries to Global Registry:
  │   • anchor:#wind-power
  │   • anchor:#new-york
  │   • anchor:#green-energy
  ▼
Global Registry validators accept (cell DNA conformant, anchors valid, scope matches).
  │
  │ Subscribers wake up:
  ▼
   Manhattan resident      NYC resident         Nairobi engineer
   (joined home cell)      (subscribes #ny)     (subscribes #wind)
        │                       │                    │
        │ direct read           │ read via anchor    │ read via anchor
        │ + write               │ link               │ link
        │                       │                    │
        │                       │ joins cell to      │ joins cell as
        │                       │ vote                │ guest contributor
        ▼                       ▼                    ▼
        — full member —     — full member —     — guest contributor —
                                                 (per 044)
```

## Plan

1. [ ] Implement `anchor` and `anchor_link` entry types in Global Registry DNA.
2. [ ] Implement subscription source-chain entries and conductor-side gossip filter.
3. [ ] Implement anchor hierarchy walking for subscription matching.
4. [ ] Implement merge and deprecation flows (governed by meta-governance).
5. [ ] Author seed anchor set covering common Kindact topics and admin levels.
6. [ ] Build conductor performance test harness measuring memory/CPU per N anchors subscribed.

## Test

- [ ] A subscriber to `#wind-power` receives a notification when an issue in any cell publishes an `anchor_link` to that anchor within gossip SLA.
- [ ] A subscriber to `#energy` receives a notification for `#wind-power`-anchored issues via hierarchy.
- [ ] Mobile device with 100 anchor subscriptions remains responsive (RAM/battery within target).
- [ ] Anchor merge: subscriptions and links to a deprecated anchor redirect to its merge target.
- [ ] Spam: an anchor created with no usage auto-deprecates after the configured threshold.

## Open questions

- **Spam threshold for anchor creation** — humanity-verification is enough, or add a small $CC stake?
- **Anchor naming collisions** — first-creator wins, or case-folding + homoglyph normalization?
- **Hierarchy depth limit** — practical cap to avoid pathological notification fan-out.
- **Subscription privacy** — subscriptions are local-only entries today; do we want optional opt-in advertising of subscriptions for community-discovery features?
- **Cross-substrate anchor mirroring** — should canonical anchors be mirrored to EVM for use by oracle reports / Hypercerts, or kept Holochain-only?

## Notes

Anchors are the part of the architecture that makes "join the conversation about Berlin housing without becoming a Berlin member" tractable. They also give the lens model a clean home: a "lens" is now operationally just a saved anchor query plus a presentation overlay. The presentation overlay is a personal source-chain entry (or a published, signed presentation entry that other users can adopt).
