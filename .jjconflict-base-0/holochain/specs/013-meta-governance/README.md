---
status: planned
created: '2026-05-12'
tags: [governance, platform, smart-contracts, evm]
priority: high
derivation: ported
ports_from: 013-meta-governance
depends_on:
  - 001-diamond-module-registry
  - 007-voting-engine
related:
  - 030-cell-architecture-and-registry
  - 040-bridge-specification
  - 041-base-dna-specification
  - 045-oracle-relay-network
---

# 013 — Meta-Governance (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [013-meta-governance](../../../implementation/specs/013-meta-governance/README.md)

## Overview

Two-tier parameter governance, DiamondCut control, timelocks, and emergency brake. **Unchanged** from implementation/ in mechanics. The hybrid expands the scope of governable artifacts to include Holochain Base DNA versions, canonical cell registry, bridge multi-sig membership, oracle relay roster, and jurisdictional-claim authority recognition.

Read the [implementation/ counterpart](../../../implementation/specs/013-meta-governance/README.md) for the tier definitions, parameter registry, change proposal flow, timelocks, and emergency brake.

## Hybrid-architecture deltas

### Expanded governable artifacts

| Artifact | Tier | Notes |
|---|---|---|
| Demurrage rate | Normal | Unchanged |
| Quorum thresholds | Normal | Unchanged |
| Reward caps | Normal | Unchanged |
| One-person-one-vote | Constitutional | Unchanged |
| Open-source requirement | Constitutional | Unchanged |
| Identity rules | Constitutional | Unchanged |
| **Base DNA major version** | **Constitutional** | New — reshapes platform |
| **Base DNA minor/patch version** | **Normal** | New |
| **Cell promotion to canonical namespace** | **Normal** | New ([030](../030-cell-architecture-and-registry/README.md)) |
| **Cell demotion / sunset finalization** | **Normal** | New |
| **Bridge multi-sig membership** | **Constitutional** (member changes); **Normal** (rotation within approved roster) | New ([040](../040-bridge-specification/README.md)) |
| **Bridge threshold (e.g., 5-of-7)** | **Constitutional** | New |
| **Oracle relay roster** | **Normal** | New ([045](../045-oracle-relay-network/README.md)) |
| **Jurisdictional-claim authority recognition** | **Constitutional** (granting); **Normal** (overlay updates within recognized authority) | New ([043](../043-jurisdictional-claims/README.md)) |
| **Reserve operation queue parameters** (cap, latency target) | **Normal** | New ([046](../046-reserve-operation-queue/README.md)) |

### Cross-substrate parameter mirror

Approved parameter changes on EVM are mirrored into the Holochain Global Registry by the bridge ([040](../040-bridge-specification/README.md)) within the SLA. Cells consume parameters from the latest mirrored snapshot.

This means a parameter change has effect:
- Immediately on EVM after the timelock expires.
- After the bridge mirror tick on Holochain (typically minutes).

The lag is acceptable for parameter changes. For emergency brake, the bridge has an immediate-mirror path (priority lane) to halt new bridged operations within seconds.

### Voting

Constitutional and normal votes both run on the EVM `VotingEngineFacet`, but vote *casting* may originate on Holochain ([007](../007-voting-engine/README.md)). The bridge submits the canonical tally to EVM at vote close. This means meta-governance benefits from free Holochain voting UX while finality remains on chain.

### Emergency brake

The brake (per implementation/) halts all DiamondCut and parameter changes. The hybrid extends it to:
- Halt all bridge operations (no new mints, redemptions, anchors).
- Notify all cells via priority-mirror entry.
- Cells render a banner indicating the platform is paused.

Brake is triggered by a constitutional supermajority or a 7-of-7 bridge signer emergency action (latter requires within-N-days ratification by constitutional vote).

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Add new governable parameters to the registry.
3. [ ] Implement bridge mirror priority lane for emergency brake.
4. [ ] Implement cell promotion / demotion meta-governance procedures.
5. [ ] Implement bridge multi-sig rotation procedure.

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Constitutional change to Base DNA major version: requires supermajority, takes effect after timelock + bridge mirror.
- [ ] Cell promotion: normal vote; canonical-namespace cell appears in Registry within bridge SLA.
- [ ] Emergency brake: bridge halts; cells render banner; constitutional ratification within N days lifts or extends.

## Open questions

- **§8.3.7 Cell promotion governance** — threshold votes? reputation-weighted? curator role?
- **§8.2.5 Bridge multi-sig composition** governance — exactly how is rotation triggered, and who proposes?
- **Constitutional vote on Holochain** — voting UX is on Holochain but tally is on EVM; the constitutional 67%-vote-75%-approve threshold must be measurable from EVM. Mirror step needed for cell-by-cell aggregate.
- **Sub-cell governance vs. platform meta-governance** — do promoted cells have their own constitutional layer, and how do they interact with platform-level constitutional changes?

## Notes

The single largest governance addition is governance of the bridge itself. In the current architecture, the AppView is operated by a (typically single) entity; in the hybrid, the bridge is a multi-sig DAO whose membership and threshold are constitutional matters. Getting the bridge governance right is as important as getting the bridge security right.
