---
status: planned
created: '2026-05-12'
tags: [bridge, reserve, eventual-consistency, redemption]
priority: high
derivation: new
depends_on:
  - 040-bridge-specification
  - 045-oracle-relay-network
related:
  - 010-reserve-exchange
---

# 046 — Reserve Operation Queue

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: synchronous redemption logic in [010-reserve-exchange](../../../implementation/specs/010-reserve-exchange/README.md).

## Overview

For social actions, Holochain's eventual consistency is fine. For reserve-touching operations (redemption, daily caps, confidence-curve recalculation), eventual consistency creates exploit windows: 50 actors racing redemptions in a 10-second window before DHT propagation can blow the daily cap. This spec defines the **countersigned redemption queue** that asymmetrically trades redemption latency (seconds to minutes) for correctness.

UX rule of thumb: users will accept "your redemption processes within 5 minutes." Users will not accept "your comment appears in 5 minutes." The asymmetric trade-off is the design.

## Design

### Operation lifecycle

```diagram
  ╭──────────────╮      ╭─────────────╮       ╭──────────────╮
  │ user submits │      │  queued in  │       │ countersigned │
  │  redemption  │─────▶│ Holochain   │──────▶│ by System    │
  │   request    │      │   queue     │       │    Agent     │
  ╰──────────────╯      ╰──────┬──────╯       ╰──────┬───────╯
                                │ rejected               │ accepted
                                ▼                        ▼
                         ╭────────────╮          ╭──────────────╮
                         │ user told  │          │ bridge       │
                         │ cap-blown  │          │ submits EVM  │
                         │ retry-later│          │ tx           │
                         ╰────────────╯          ╰──────┬───────╯
                                                        ▼
                                                 ╭─────────────╮
                                                 │ EVM finality │
                                                 │  + receipt   │
                                                 │  back to DHT │
                                                 ╰─────────────╯
```

### Queue entry

```json
{
  "type": "reserve_operation_request",
  "operationKind": "redemption",
  "requester": "uhCAk...",
  "amountCC": 100,
  "destinationEvmAddress": "0xabc...",
  "oracleReadings": [
    {"snapshotHash": "uhCAk...", "oracleId": "chainlink:USDC-USD", "value": "1.0001"}
  ],
  "submittedAt": 1715000000,
  "expiresAt": 1715000600,
  "operationId": "redemption:requester:nonce"
}
```

### Countersignature step

Each System Agent signer independently:
1. Reads the current daily-redemption-aggregate from the latest agreed snapshot (anchored periodically by the bridge).
2. Computes whether this request, plus all queued requests with earlier `submittedAt`, fits within the daily cap.
3. Verifies the oracle readings per [045](../045-oracle-relay-network/README.md).
4. Signs an `accept` or `reject` countersignature.

A 5-of-7 quorum on `accept` releases the operation to the bridge. A 3-of-7 quorum on `reject` returns the request as cap-blown. Mixed signals trigger re-evaluation in the next queue cycle (default: 60 seconds).

### Daily cap enforcement

The daily cap is canonical on EVM. The bridge mirrors `dailyRedeemed` and `dailyResetAt` into a periodically-anchored DHT entry. System Agents always reference the latest mirrored snapshot during countersignature, plus all queued-but-not-yet-finalized operations.

If two snapshots disagree (rare, due to bridge in-flight), signers wait for the next mirror tick rather than racing.

### Operation expiration

If a queued operation cannot be countersigned within `expiresAt` (typically 5–10 minutes), it is dropped from the queue and the user is notified. Users can resubmit; resubmissions get a new `operationId`.

### Per-operation latency targets

| Operation | Target latency | Rationale |
|---|---|---|
| Redemption (CC → fiat) | < 5 minutes | Acceptable trade for cap correctness |
| Reserve deposit detection (fiat → CC) | < 10 minutes | Bank settlement is slower anyway |
| Confidence-curve recalculation | Per L2 block + bridge sync | Read-only on Holochain side |
| Hypercert anchor | < 30 minutes | Not user-blocking; can batch |
| $CC mint from verified work | < 30 minutes | Not user-blocking; user already has DHT acknowledgement |

The mint and anchor operations don't strictly need the queue — they are not subject to a global cap — but they share the bridge submission path so they share the latency profile.

### Bank-run scenario

If thousands of simultaneous redemption requests arrive (e.g., panic-driven), the queue degrades gracefully:
- All requests enter the queue with timestamps.
- System Agents process FIFO, accepting until cap exhausted.
- All subsequent requests get `cap-blown; retry tomorrow`.
- No request is silently dropped. Cap is never exceeded.

This bounded-loss-of-availability behavior is preferable to either (a) exceeded-cap reserve drain or (b) reserve unavailability during normal hours.

## Plan

1. [ ] Define `reserve_operation_request` and `countersignature` entry types in the bridge zome.
2. [ ] Implement System Agent countersigner reference process.
3. [ ] Implement queue scheduler (FIFO; aware of EVM-side `dailyRedeemed` snapshot).
4. [ ] Implement bridge-side cap-mirror anchoring (every L2 minute by default).
5. [ ] Define expiration and notification UX flow ([015](../015-frontend/README.md)).
6. [ ] Author user-facing copy explaining the latency for redemption vs. instant social actions.

## Test

- [ ] 50 simultaneous requests for amounts that together would blow the cap: only the FIFO subset that fits is accepted; the remainder rejected with cap-blown.
- [ ] Bank-run simulation: 10000 requests in 10 seconds, cap exhausted in FIFO order, no over-redemption.
- [ ] Stale snapshot: oracle reading older than tolerance triggers re-quote and resubmission.
- [ ] Expiration: an operation that cannot be countersigned in 5 minutes is dropped; user notified within 1 minute.
- [ ] System Agent signer offline: a 4-of-7 with one offline signer still proceeds via the remaining 3 attempts; if 3 reach quorum on next cycle, accepted.

## Open questions

- **§8.4.13 Reserve operation latency** — accept the queue model? complexity to keep redemption synchronous?
- **Cap snapshot frequency** — every L2 block, every minute, every 5 minutes? Higher frequency = more bridge load.
- **Priority queue** — should certain users (long-tenured contributors, low-balance accounts) jump the queue during contention? Risks gameability.
- **Refund-on-expiration UX** — does a queued $CC amount get reserved (locked) at submission? Risk of UX where balance shows reduced but redemption fails.
- **Cross-cell redemption** — does the requester's home cell matter, or are all redemptions handled by the global queue?

## Notes

This is the spec where the substrate trade-off is most visible. EVM with synchronous redemption needs no queue. Holochain coordination forces this design because the cap is global state that can't be atomically read/written across the DHT. The 5-minute redemption latency is acceptable for community currency UX. It would be unacceptable for a high-frequency trading product — which Kindact is not.
