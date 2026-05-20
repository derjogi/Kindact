---
status: in-progress
created: '2026-05-12'
tags: [architecture, skeleton, smart-contracts, evm]
priority: critical
derivation: ported
ports_from: 001-diamond-module-registry
related:
  - 040-bridge-specification
  - 041-base-dna-specification
---

# 001 — Diamond Module Registry (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [001-diamond-module-registry](../../../implementation/specs/001-diamond-module-registry/README.md)

## Overview

The EIP-2535 Diamond proxy is the EVM-side skeleton. All on-chain Kindact functionality (settlement, reserve, Hypercerts, dispute clawbacks, identity, parameter registry) is deployed as facets behind a single Diamond proxy. **Unchanged** from the implementation/ counterpart in design; this spec exists to record bridge-specific additions.

Read the [implementation/ counterpart](../../../implementation/specs/001-diamond-module-registry/README.md) for the full design (proxy, AppStorage, core facets, lifecycle, events, tests). Only deltas are repeated here.

## Hybrid-architecture deltas

### New facets

| Facet | Purpose |
|---|---|
| **BridgeOperatorFacet** | Privileged calls invoked by the System Agent multi-sig ([040](../040-bridge-specification/README.md)): `mintFromVerifiedWork`, `anchorHypercertFromCell`, `executeRedemption`, `executeClawback`, `mirrorParameterChange`. |
| **BaseDNARegistryFacet** | Records canonical Base DNA hashes per major version ([041](../041-base-dna-specification/README.md)). Bridge consults this facet to verify that quorum signatures originate from a Base-conformant cell. |
| **CellRegistryFacet** | Mirror of the Holochain Global Registry's canonical cell list. Records `cellId → dnaHash → status`. Bridge consults this to verify cell entries before submitting bridged operations. |

### Role additions

- `BRIDGE_OPERATOR` — granted exclusively to the System Agent Safe address. Required by `BridgeOperatorFacet` calls.
- `RELAY_OPERATOR` — granted to oracle relay agents ([045](../045-oracle-relay-network/README.md)) for posting on-chain attestations of relay liveness (optional; relays are mostly off-chain).

### Module registry scope

The on-chain `ModuleRegistry` continues to track only modules with on-chain consequences (trust, money, rights, finality). Holochain zomes installed in cells are tracked off-chain in the Global Registry per [030](../030-cell-architecture-and-registry/README.md). The split:

| Module slot | Tracked in EVM ModuleRegistry | Tracked in Holochain Global Registry |
|---|---|---|
| Decision (on-chain tally) | ✓ | (mirror only) |
| Eligibility (on-chain attestation) | ✓ | (mirror only) |
| Verification (on-chain mint trigger) | ✓ | (mirror only) |
| Dispute (on-chain clawback) | ✓ | (mirror only) |
| Deliberation surface (off-chain only) | — | ✓ |
| Presentation overlay (off-chain only) | — | ✓ |
| Metrics pack (off-chain assessment, on-chain bundle hash) | partial: bundle hash facet | ✓ for definition |

### Bridge-callable operations: idempotency

Every bridge-called function accepts an `operationId` parameter and rejects duplicates. This ensures the [040](../040-bridge-specification/README.md) reconciliation pattern works.

## Plan

1. [ ] Inherit the implementation/ Plan items 1–8.
2. [ ] Implement `BridgeOperatorFacet`, `BaseDNARegistryFacet`, `CellRegistryFacet`.
3. [ ] Add `BRIDGE_OPERATOR` and `RELAY_OPERATOR` roles.
4. [ ] Add `operationId` idempotency tests for every bridge-callable function.
5. [ ] Document the EVM ↔ Holochain registry sync protocol (bidirectional).

## Test

- [ ] Inherit implementation/ Test items.
- [ ] BridgeOperatorFacet: only the System Agent Safe can call privileged functions; other callers revert.
- [ ] Idempotency: same `operationId` submitted twice — second call reverts cleanly.
- [ ] BaseDNARegistry: rejects a non-canonical hash; accepts a meta-governance-approved hash.

## Open questions

- **Whether to use a separate Diamond per layer** (settlement vs. governance) or a single large Diamond with role-scoped facets. Implementation/ assumes single Diamond; same default here.
- **CREATE2 deterministic deployment** — preserve from implementation/ for the L2 of choice; verify Optimism/Base behaviors.

## Notes

This port is intentionally short. The settlement-plane EVM design carries over without modification; the bridge integration adds three new facets and one role. Any change here should also be made in the implementation/ counterpart unless it is bridge-specific.
