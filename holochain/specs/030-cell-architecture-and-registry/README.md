---
status: planned
created: '2026-05-12'
tags: [holochain, cells, registry, lens-replacement, foundational]
priority: critical
derivation: replaces
replaces:
  - 030-extensibility-foundation
depends_on:
  - 000-substrate-architecture-decision-record
  - 041-base-dna-specification
related:
  - 042-anchor-and-subscription-model
  - 043-jurisdictional-claims
  - 044-cross-cell-validation-and-trust
---

# 030 — Cell Architecture & Registry

> **Status**: Exploratory · **Derivation**: replaces · **Counterpart in implementation/**: [030-extensibility-foundation](../../../implementation/specs/030-extensibility-foundation/README.md) (lens model and module catalog).

## Overview

Replaces the lens-as-config-overlay model with a **multi-cell architecture**. A cell is a Holochain DNA instance with its own membership, validators, and DHT. Cells are bounded; **anchors** ([042](../042-anchor-and-subscription-model/README.md)) provide global discovery without forcing membership. The contradictions in the current lens model (lenses-are-not-entities vs. lenses-have-governance) are resolved by making cells *be* entities while preserving anti-territoriality through free overlap, anchor-based subscription, and the jurisdictional-claims escape hatch ([043](../043-jurisdictional-claims/README.md)).

The module-slot conceptual model from the current spec is preserved but binds to Holochain zomes installed in cells rather than to overlay configuration rows.

## Design

### Three-tier registry

```diagram
╭─────────────────────────────────────────────────────────────────╮
│ Tier 1: Global Registry "We" (single canonical instance)         │
│   • Cell directory: name → DNA hash → selector predicate         │
│   • Anchor index                                                 │
│   • Bridge signers, jurisdictional claims, parameter mirror      │
│   • Meta-governance approves Base DNA versions and promotions    │
├─────────────────────────────────────────────────────────────────┤
│ Tier 2: Promoted public cells (curated)                          │
│   • Berlin, Housing, Green-Energy, Climate, Permaculture, ...    │
│   • Created via meta-governance proposal                         │
│   • Their cell governance is itself a sub-We                     │
│   • Carry jurisdictional claims if applicable                    │
├─────────────────────────────────────────────────────────────────┤
│ Tier 3: User-created cells (uncurated namespace)                 │
│   • Project cells, working groups, custom interest lenses        │
│   • Anyone humanity-verified clones Base DNA + registers         │
│   • Visible in Global Registry under `uncurated/<did>/<name>`    │
│   • Promoted to canonical only via meta-governance               │
╰─────────────────────────────────────────────────────────────────╯
```

### Cell taxonomy

| Cell type | Examples | Creation | Membrane |
|---|---|---|---|
| **Global Registry "We"** | Single canonical instance | Genesis | Read-public; write-via-meta-governance |
| **Promoted public cells** | Berlin, Housing, Green-Energy | Meta-governance proposal | Read-public; opt-in-write with scope verification |
| **User-created cells** | "Manhattan Wind Turbine Q3 2026", custom interest groups | Anyone humanity-verified | Configurable by creator (default: read-public, scope-verified-write) |
| **Project / ephemeral cells** | Per-issue working groups | Issue authors at scope assignment | Default open; dissolved after completion |

### Cell record (in Global Registry)

```json
{
  "cellId": "kindact:berlin",
  "namespace": "canonical",
  "dnaHash": "uhCkk...",
  "baseDnaVersion": "1.4.2",
  "creator": "did:plc:...",
  "selector": {
    "scopeLevel": "city",
    "locationRefs": ["h3:88283082..."],
    "topicTags": [],
    "interestKeywords": []
  },
  "membrane": {
    "read": "public",
    "write": "scope_verified",
    "scopeProofTypes": ["geotagged_evidence", "neighbor_invite"]
  },
  "jurisdictionalClaims": ["jc:berlin-housing-rules-v2"],
  "governance": {
    "decisionEngine": "consensus_with_neighbor_agreement",
    "fallbackEngine": "approval_voting"
  },
  "lifecycle": {
    "createdAt": 1715000000,
    "lastActivityAt": 1716000000,
    "status": "active"
  },
  "forkedFrom": null
}
```

### Cell creation rules

- **Anyone humanity-verified** can clone the Base DNA and create a cell. Mechanical step.
- **Registration is free** and lands in `uncurated/<creator-did>/<cell-name>`. No naming collisions in the canonical namespace.
- **Promotion to canonical** (e.g., `kindact:berlin`) requires meta-governance ([013](../013-meta-governance/README.md)). Prevents squatting on community-relevant names.
- **Membrane proofs default to public-read, scope-verified-write**. Anyone reads; writing requires demonstrating scope (geotagged location attestation, invite from N existing members, or other declared proof type).
- **Forking**: anyone forks a cell (clone with a different governance ruleset). Fork lives in `uncurated` until promoted. Preserves exit rights without canonical-namespace chaos.
- **Cell sunset**: cells with zero qualifying activity for N months flagged in the registry; final dispute window; then archived (entries remain readable, no new writes). Mirrors module sunset policy.

### Subscription vs. membership

This distinction is what makes broad-interest users tractable on commodity hardware.

| | Subscription (anchor watch) | Membership (cell join) |
|---|---|---|
| Cost | Cheap; just a watch on an anchor | Has gossip, storage, and validation cost |
| Read | Read-only of anchored entries | Full read of cell data |
| Write | Cannot write | Can write (subject to membrane) |
| Validation duties | None | Optional; cell members are potential validators |
| Practical limit | Hundreds | Single-digit to low double digits per device |

A user with broad interests subscribes to many anchors and only joins cells they actively contribute to. See [042](../042-anchor-and-subscription-model/README.md).

### Module slot model (preserved from current 030)

A module is a registered zome (or zome group) installed in a cell. Each module declares:

| Field | Type | Description |
|---|---|---|
| `moduleId` | `<namespace>/<key>` | Unique identifier |
| `version` | semver triple | Pinned at install time |
| `slot` | enum | `decision`, `eligibility`, `participation`, `metrics`, `verification`, `dispute`, `deliberation`, `presentation` |
| `multiplicity` | `single` \| `multi` | Whether multiple instances of the slot can be active |
| `dependencies` | `[moduleId]` | Other modules required |
| `manifestHash` | bytes32 | Pins the off-chain manifest |
| `maturity` | enum | `experimental`, `beta`, `stable`, `deprecated` |

Modules whose `slot` is in the always-on core (decision-fallback, dispute, eligibility-humanity) are governed by the EVM `ModuleRegistryFacet` ([001](../001-diamond-module-registry/README.md)) since they have on-chain consequences. Modules whose slot is purely off-chain (deliberation surfaces, presentation overlays, metrics packs) are governed by cell-level vote.

### Cross-substrate registry sync

The Global Registry's canonical state is mirrored to the EVM `BridgeRegistry` facet so the bridge ([040](../040-bridge-specification/README.md)) knows which cell DNA hashes are accepted as quorum sources for bridged operations. Sync direction:

- **Holochain → EVM**: cell promotions, demotions, sunsets, jurisdictional-claim updates.
- **EVM → Holochain**: meta-governance parameter updates, Base DNA version changes, identity registry updates.

The bridge handles both directions per [040](../040-bridge-specification/README.md).

## Plan

1. [ ] Implement Global Registry DNA (single canonical instance).
2. [ ] Implement cell-creation tooling (`kindact cell new <name>`).
3. [ ] Implement cell-registration zome calls (uncurated tier).
4. [ ] Implement the EVM `BridgeRegistry` facet mirroring canonical cell records.
5. [ ] Implement cell-sunset detection and flagging.
6. [ ] Define cell-fork procedure and divergence-tracking.
7. [ ] Author seed cell set: Global, Berlin, Housing, Green-Energy, Climate, Permaculture.

## Test

- [ ] An uncurated user-created cell appears in the Registry within N seconds; can be queried by anchor.
- [ ] Promotion changes namespace from `uncurated/...` to `canonical:...` and is mirrored to EVM within bridge SLA.
- [ ] A cell with a tampered Base DNA hash is rejected at registration.
- [ ] A subscription to an anchor surfaces issues created in cells the user does not belong to.
- [ ] A user joins a foreign cell to contribute on one issue (guest contributor flow per [044](../044-cross-cell-validation-and-trust/README.md)).
- [ ] Cell sunset: a cell with no activity for N months enters dispute window then archived.

## Open questions

- **§8.3.7 Cell promotion governance** — threshold votes? reputation-weighted? curator role?
- **§8.3.8 Cell membrane defaults** — public-everything, scope-verified-write, or invite-only by default?
- **§8.3.9 Guest contributor model** — first-class status separate from "member"?
- **§8.3.10 Cell sunset trigger** — what counts as activity, threshold months, who challenges sunset?
- **Naming collisions in `uncurated`** — first-creator wins per (DID, name) pair, but what about case-insensitive collisions or homoglyph attacks?
- **Cell-internal governance** — promoted cells are sub-Wes; do they inherit meta-governance constitutional rules or have their own constitutional layer?

## Notes

The fractal "We of Wes" pattern from [Neighbourhoods](https://neighbourhoods.network/) is the closest existing analog. The recommended pre-spec exercise is to install Neighbourhoods locally, create a We, install applets, and create a sub-We — the texture of cell governance becomes obvious in a way text descriptions don't capture.

The substantive architectural shift vs. the current spec set is **discovery-via-anchor + join-to-write** instead of **shared-substrate + filter-overlay**. Anti-territoriality is preserved because anchors are global and free, and cells overlap freely. Territorial drift is checked by jurisdictional claims being a separate first-class concept ([043](../043-jurisdictional-claims/README.md)) rather than implicit in cell ownership.
