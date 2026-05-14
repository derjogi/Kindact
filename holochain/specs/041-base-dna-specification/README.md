---
status: in-progress
created: '2026-05-12'
tags: [holochain, dna, validation, foundational]
priority: critical
derivation: new
depends_on:
  - 000-substrate-architecture-decision-record
related:
  - 030-cell-architecture-and-registry
  - 044-cross-cell-validation-and-trust
---

# 041 — Base DNA Specification

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: portions of [extensibility-strategy §2 Layer A](../../../implementation/extensibility-strategy.md#L74-L93) (always-on core).

## Overview

The **Base DNA** is the always-on Holochain DNA included by every Kindact-conformant cell. It enforces the cross-platform invariants that no cell may opt out of — humanity-verified identity, issue-lifecycle states, net-impact gate, jurisdictional claims, dispute hooks. Cells that don't include the current Base DNA are not visible in the Global Registry and cannot bridge to the EVM settlement layer.

The analogy: Base DNA is to a Kindact cell as an EU directive is to a member-state implementation. Cells extend the Base, they do not replace it.

## Design

### What Base DNA enforces (always-on core)

- **Identity**: every authoring agent's public key MUST link to a humanity-verified EVM address via the Identity Primitive ([002](../002-identity-primitive/README.md)). Agents lacking a current humanity attestation cannot author entries beyond a trivial onboarding allowance.
- **Issue lifecycle states**: `Draft → Deliberating → VoteReady → Adopted → Implementing → Completed → Archived` plus amend/reverse, as in [005](../005-issue-lifecycle/README.md). State transitions validated against entry contents and the issue's protocol binding.
- **Net-impact gate**: an issue cannot transition to `VoteReady` without a metrics bundle ([016](../016-impact-metrics/README.md)) whose net-impact verdict is `positive` (or `disputed` with explicit override per the issue's binding).
- **Approval voting always available**: even when a cell uses a custom decision engine, approval voting MUST remain selectable as a fallback so that a cell cannot be locked out of decision-making by a broken extension.
- **Jurisdictional claims honored**: any issue whose canonical scope vector falls within a registered jurisdictional claim ([043](../043-jurisdictional-claims/README.md)) inherits that claim's overlay regardless of the home cell. Validators check this at issue creation and reject non-conforming entries.
- **Dispute hooks**: every issue MUST expose a dispute entry point that maps to [012](../012-dispute-resolution/README.md). Cells may extend dispute logic but cannot remove the entry point.
- **Meta-governance hooks**: parameter changes from the EVM Parameter Registry ([013](../013-meta-governance/README.md)) MUST be honored within N blocks of the bridge mirroring them into the DHT.
- **Module manifest validation**: any extension zome installed in the cell MUST declare `slot`, `multiplicity`, `dependencies`, and `manifestHash` as in the module model from [030](../030-cell-architecture-and-registry/README.md).

### Composition mechanism

Holochain does not have formal DNA inheritance. Composition is via **shared zomes imported at build time**. The Base DNA is published as a versioned set of zome libraries (`kindact_base_identity`, `kindact_base_lifecycle`, `kindact_base_dispute`, `kindact_base_jurisdictional`, `kindact_base_governance`, `kindact_base_module_manifest`).

Cells claiming Base-conformance must:

1. Import the canonical Base zome libraries at the pinned semver.
2. Build a DNA whose hash includes those libraries plus any cell-specific zomes.
3. Register the resulting DNA hash with the Global Registry, which compares it against the canonical Base hash plus any whitelisted extension space.

The build-pipeline tool `kindact-base-conform <cell-dir>` produces and verifies the canonical hash. The Global Registry's validator verifies the same hash before accepting the cell.

> **Tooling caveat**: the Holochain Foundation is moving toward a "zomes-as-libraries" model that helps. As of 2026, the verification step is mechanical but needs first-party tooling. See open questions.

### Versioning

| Version axis | Rule |
|---|---|
| **MAJOR** | Breaking changes to validation rules; cells must rebuild and re-register. Migration window of N months announced via meta-governance. |
| **MINOR** | Additive validation rules; existing cells continue to validate but new entries may include new fields. |
| **PATCH** | Bug fixes that do not change accepted-entry semantics. Auto-adopted by all cells on next conductor restart. |

Major versions are governed by the constitutional tier of [013](../013-meta-governance/README.md) since they reshape the platform.

### Layered cell DNA

Cell-specific DNAs layer on top of Base:

| Cell extension | Examples |
|---|---|
| Stricter verification policies | Berlin requires consensus + neighbor agreement for housing |
| Custom decision engines | Ranked-choice, score, quadratic — invoked through a registered engine zome |
| Community-specific metrics packs | Permaculture cell adds biodiversity-credit fields to the metrics bundle |
| Local language defaults | UI label dictionaries default per cell |
| UI theme defaults | Cell-specific color / typography presets |

Extensions cannot weaken Base validation rules; the Base zomes' validation functions run before any cell-extension validation function.

### Identity bridging

Base DNA includes a `kindact_base_identity` zome that:

- Stores `(holochainAgentKey, evmAddress, humanityScoreSnapshot)` linkage.
- Verifies a signature from the EVM address over the agent's public key (one-time link establishment).
- Caches the latest humanity score from the EVM Identity Registry via the bridge.
- Enforces the humanity-required validation rule on all author actions.

See [002](../002-identity-primitive/README.md) for the cross-substrate binding details.

## Plan

1. [ ] Author canonical Base zome libraries (six zomes listed above).
2. [ ] Define the canonical Base DNA composition manifest.
3. [ ] Build the `kindact-base-conform` CLI tool.
4. [ ] Define the on-chain `BaseDNARegistry` facet recording canonical Base hashes per major version.
5. [ ] Write upgrade migration guide template.
6. [ ] Set up versioned release process tied to meta-governance.

## Test

- [ ] A cell built from Base v1 + identity-only extension produces a hash the Global Registry accepts.
- [ ] A cell built with a tampered Base zome (e.g., humanity check removed) is rejected.
- [ ] Major version migration: cells on v1 receive a migration deadline; after deadline, v1-only cells are flagged in the Registry as non-canonical.
- [ ] Validation: an entry that bypasses jurisdictional claims (issue tagged `global` but scope clearly Berlin) is rejected by Base validators in any cell.
- [ ] Round-trip: a humanity score updated on EVM is reflected in DHT validation within the bridge SLA.

## Open questions

- **§6.3 DNA composition tooling maturity** — first-party tooling required; how much can be punted to the Holochain Foundation's roadmap vs. owned in-house.
- **Migration UX** — a v1-cell user sees what when v2 launches? Forced rebuild? Transparent? Holo hosting handles?
- **What counts as "Base"** — should approval voting be Base-mandatory, or only Base-recommended? The current draft says mandatory; Open question §8.3.7 (cell promotion governance) interacts.
- **Onboarding allowance** for not-yet-humanity-verified agents — magnitude, scope, anti-Sybil controls.
- **Constitutional change to remove a Base rule** — does any rule become removable, or are some Base rules outside even constitutional governance?

## Notes

The "Kindact-conformant cell ⇔ DNA hash on the canonical list" pattern sounds bureaucratic but is the only way validators in one cell can trust quorum signatures from another cell without re-validating every entry. Without it, the multi-cell architecture devolves into per-cell silos with no cross-cell discoverability or bridgeable value.
