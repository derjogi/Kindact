---
status: planned
created: '2026-05-12'
tags: [token-economy, smart-contracts, evm, economics]
priority: critical
derivation: ported
ports_from: 003-cc-token-core
depends_on:
  - 001-diamond-module-registry
related:
  - 040-bridge-specification
  - 046-reserve-operation-queue
---

# 003 — $CC Token Core (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [003-cc-token-core](../../../implementation/specs/003-cc-token-core/README.md)

## Overview

$CC is the canonical settlement token. It remains an EVM ERC-20 with continuous demurrage via a global decay index. Local mutual-credit balances inside Holochain cells are a *view*; the EVM token is the canonical supply that interfaces with reserve, Hypercerts, and external markets. **Unchanged** from the implementation/ counterpart in token mechanics; this spec records bridge integration.

Read the [implementation/ counterpart](../../../implementation/specs/003-cc-token-core/README.md) for the demurrage model, mint/burn, transfer, and Debt Ledger design.

## Hybrid-architecture deltas

### Mint authorization

`MINTER_ROLE` is granted to a single new actor:

- **`BridgeOperatorFacet`** ([040](../040-bridge-specification/README.md)). All bridge-driven mints go through `mintFromVerifiedWork(workCID, recipient, amount, operationId)`.

The reserve-mint channel (fiat→$CC) is unchanged: `ReserveExchangeFacet` calls mint after the buy premium step.

### Local mutual-credit relationship

Within a Holochain cell, members may exchange $CC at zero cost via a local mutual-credit ledger ([006](../006-deliberation-cell/README.md), [008](../008-work-verification-rewards/README.md)). These local balances:

- Sum to zero within the cell (mutual-credit invariant).
- Are demurrage-decayed at the same rate as canonical $CC.
- Can be reconciled to canonical $CC at boundaries (cell exit, cross-cell transfer, redemption).

The bridge mints canonical $CC only when local balances are reconciled outward. This means a cell with healthy intra-cell circulation imposes no on-chain mint pressure; only outward flow triggers EVM transactions.

### Decay index and oracle witness

The global `currentDecayIndex` is canonical on EVM. Holochain validators reading effective balances inline an oracle-witnessed snapshot of the decay index per [045](../045-oracle-relay-network/README.md). This ensures cell members and EVM compute the same effective balance.

### Clawback (Debt Ledger)

Unchanged from implementation/. The clawback path is: dispute confirmed in [012](../012-dispute-resolution/README.md) → bridge submits `executeClawback(target, amount, debtRef, operationId)` → balance can go negative; debt obligation tracked.

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Add bridge-driven mint path (`mintFromVerifiedWork`) with `operationId` idempotency.
3. [ ] Implement local mutual-credit reconciliation hook (called by Holochain bridge zome on cell exit / cross-cell transfer).
4. [ ] Document the local-credit / canonical-supply relationship in user-facing docs.

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Local mutual-credit cell: 5 members exchange freely; sum = 0; no on-chain mint until one member redeems.
- [ ] Decay index witness: validator's computed effective balance matches EVM `effectiveBalance` view within the oracle staleness tolerance.
- [ ] Idempotent mint: same `operationId` twice — second mint reverts.

## Open questions

- **Cross-cell transfer semantics** — when a user moves $CC from cell A to cell B, is it a local-credit settlement or always a canonical mint/burn at the boundary?
- **Multi-flavor $CC** — Holochain allows different "kinds" of $CC per cell; do these map back to the same canonical supply or are they separate tokens?
- **Demurrage on local balances** — pulling negative balances toward zero discourages debt accumulation but may also penalize cells with valid sustained credit lines; configurable?

## Notes

The mutual-credit-on-Holochain + canonical-supply-on-EVM split is what makes "free social actions" + "recognized fungible token" both achievable. The reconciliation pattern (mint only on outward flow) is borrowed from HoloFuel.
