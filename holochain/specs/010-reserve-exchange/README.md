---
status: planned
created: '2026-05-12'
tags: [economics, token-economy, smart-contracts, evm]
priority: high
derivation: ported
ports_from: 010-reserve-exchange
depends_on:
  - 003-cc-token-core
related:
  - 040-bridge-specification
  - 045-oracle-relay-network
  - 046-reserve-operation-queue
---

# 010 — Reserve Exchange (EVM)

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [010-reserve-exchange](../../../implementation/specs/010-reserve-exchange/README.md)

## Overview

Fiat-backed reserve for $CC with phased exchange rates, buy premium, daily flow controls, and confidence curve. **Unchanged** from implementation/ in the EVM mechanics — the reserve, its target, and the confidence curve all live on EVM as before. The only deltas are how redemption requests arrive (via the bridge's countersigned queue [046](../046-reserve-operation-queue/README.md)) and how oracle data is consumed (via [045](../045-oracle-relay-network/README.md) for cross-substrate consistency).

Read the [implementation/ counterpart](../../../implementation/specs/010-reserve-exchange/README.md) for phases, confidence curve formula, buy premium, and reserve minting.

## Hybrid-architecture deltas

### Redemption invocation

Direct on-chain `redeem(amount)` is replaced by a privileged path:

- Users submit redemption requests on Holochain ([046](../046-reserve-operation-queue/README.md)).
- After countersignature, the bridge submits `executeRedemption(redeemer, amount, oracleSnapshotRef, operationId)` to `ReserveExchangeFacet`.
- `executeRedemption` is callable only by `BRIDGE_OPERATOR`. The on-chain logic checks the oracle snapshot, decrements `dailyRedeemed`, transfers USDC.

The implementation/ direct-call path is removed. There is no synchronous on-chain redemption in the hybrid; the queue is the only path.

### Buy path (fiat → $CC)

Two options:

| Path | Mechanics |
|---|---|
| **Direct EVM purchase** (preserved) | User sends USDC + `buyCC()` on EVM; mint executed; bridged into Holochain as a deposit notification |
| **Holochain-initiated purchase** | User indicates intent on Holochain; bridge debits user's escrowed USDC; mint executed; canonical $CC reflected on EVM, mirrored into the user's source chain |

Both paths converge at the same `mintFromReserveBuy` facet call; only the trigger differs.

### Daily cap mirroring

`dailyRedeemed` and `dailyResetAt` are read by the bridge every L2 block and mirrored to a periodically-anchored DHT entry that the queue's countersigners consult. See [046](../046-reserve-operation-queue/README.md) for cap-snapshot frequency and tolerance.

### Phase transitions

Phase transitions (Bootstrap → Growth → Maturity) are EVM-side as before. The bridge mirrors phase changes to a Global Registry entry so cell UIs can render correct redemption / exchange affordances.

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Replace direct redeem path with `executeRedemption(BRIDGE_OPERATOR-only)`.
3. [ ] Implement DHT-side cap mirror anchored by bridge.
4. [ ] Document the queue latency in user-facing copy ([015](../015-frontend/README.md)).

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Direct user `redeem()` call: reverts because role-gated.
- [ ] Bridge `executeRedemption` with stale oracle snapshot: reverts.
- [ ] Cap exhausted in EVM mid-day: queue reflects this within mirror tick; subsequent countersignatures reject until reset.

## Open questions

- **Direct EVM buy preserved?** — keeping it lets sophisticated users skip the bridge for purchases, but adds a parallel path. Default: keep but de-emphasize.
- **Reserve PoR (proof-of-reserve)** — Chainlink PoR vs. quarterly audit attestation vs. Open Banking webhook; default mix per [045](../045-oracle-relay-network/README.md).
- **Cross-cell access to redemption** — does each cell have a local cap, or is the cap purely global?

## Notes

The reserve is the part of the design that demonstrably needs EVM. The hybrid changes the *trigger* for reserve operations but not the *substance* of reserve mechanics. The countersigned queue is the "tax" Holochain pays for not having global atomic state — a tax that is acceptable because reserve operations are user-tolerant of minutes-scale latency.
