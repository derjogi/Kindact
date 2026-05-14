---
status: planned
created: 2026-04-03
priority: medium
tags:
- governance
- platform
- smart-contracts
depends_on:
- 001-diamond-module-registry
- 007-voting-engine
- 030-extensibility-foundation
created_at: 2026-04-05T10:28:37.209443370Z
updated_at: 2026-04-05T10:28:37.209443370Z
---

# 013 — Meta-Governance

## Overview

The platform governs itself through its own mechanisms. Two-tier parameter governance, DiamondCut control, timelocks, and an emergency brake.

## Design

### MetaGovernanceFacet

Manages changes to the platform's own rules and parameters.

**Two tiers of changes**:

| Tier | Examples | Requirements |
|------|----------|-------------|
| Normal | Demurrage rate, quorum thresholds, reward caps | Standard voting via 007, regular majority |
| Constitutional | One-person-one-vote, open-source requirement, identity rules | Supermajority of TOTAL registered users: 67% must vote, 75% must approve |

### Parameter Registry

On-chain key-value store of all governable parameters:

```
struct Parameter {
    bytes32 key;
    bytes32 value;
    Tier tier;              // NORMAL or CONSTITUTIONAL
    uint256 lastChanged;
}
```

### Change Proposals

Special issue type referencing a parameter change:

```
struct ParameterProposal {
    bytes32 parameterId;
    bytes32 currentValue;
    bytes32 proposedValue;
    Tier tier;
    bytes32 rationaleHash;
}
```

### DiamondCut Governance

Adding/removing facets (modules) requires meta-governance approval — prevents hostile module injection. DiamondCut calls can only originate from this facet after a successful vote.

### Module Catalog Governance

Meta-governance also approves the global module catalog entries that affect trust, money, rights, or finality and can promote mature optional modules into core platform behavior.

Approval is per **versioned module id** (`<namespace>/<key>@<semver>`, see 030). A new version of an already-approved module is treated as a new catalog entry and must be approved separately. Existing issues continue running the version pinned in their protocol binding; meta-governance approval of a new version only affects bindings resolved after the approval takes effect (plus its timelock).

Each catalog entry stores the manifest hash (off-chain manifest) and, for on-chain modules, the corresponding `ModuleRegistry` record (001). Approval flow:

1. Propose: submit module id + manifest hash (+ facet bytecode for on-chain modules).
2. Vote: normal-tier vote unless the module is being promoted to `core` (constitutional tier).
3. Timelock: 48h (normal) / 7d (constitutional / `core` promotion).
4. Activate: catalog entry becomes available for lens overlays.

Lens-level overlay choices remain outside this spec; 030-extensibility-foundation owns the distinction between platform governance and lens governance.

### Timelock

Approved changes have a mandatory delay before taking effect:

- **Normal**: 48h delay
- **Constitutional**: 7d delay

Allows community review and emergency intervention before changes activate.

### Emergency Brake

- Multisig of trusted guardians can pause the system on critical vulnerability
- **Temporary**: must be ratified by community vote within 72h
- If not ratified → auto-reverts, guardian privileges reviewed

### Events

- `ParameterChangeProposed(proposalId, parameterId, proposedValue, tier)`
- `ParameterChangeApproved(proposalId, parameterId)`
- `ParameterChanged(parameterId, oldValue, newValue)`
- `EmergencyPause(guardian, reason)`
- `EmergencyResolved(ratified, resumedAt)`

### Extension Points

- Community-defined parameter tiers (beyond normal/constitutional)
- Module-specific governance rules (per-facet voting thresholds)
- Module maturity promotion paths (experimental → beta → stable → core)

## Plan

1. Implement `MetaGovernanceFacet`
2. Implement parameter registry (on-chain key-value store)
3. Implement tiered voting thresholds (normal vs constitutional)
4. Implement timelock (48h / 7d delays)
5. Implement emergency brake (multisig pause + ratification)
6. Integrate with DiamondCut and VotingEngine
7. Tests

## Test

- Normal parameter change: standard majority passes, 48h delay, then applied
- Constitutional change: requires 67% turnout of ALL users, 75% approval, 7d delay
- Constitutional change fails with simple majority
- DiamondCut blocked without meta-governance approval
- Timelock: change reverted if emergency brake pulled during delay
- Emergency pause: system halts, auto-reverts after 72h without ratification
- Emergency pause: community ratifies, system stays paused until resolved
- Parameter registry: read current values, historical changes

## Notes

- Constitutional quorum based on total users (not just active voters) is intentionally high — these are foundational rules
- Guardian multisig should be a diverse set (geographic, demographic) to prevent capture
