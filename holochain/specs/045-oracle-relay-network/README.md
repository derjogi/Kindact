---
status: planned
created: '2026-05-12'
tags: [oracles, bridge, holochain, infrastructure]
priority: high
derivation: new
depends_on:
  - 040-bridge-specification
  - 041-base-dna-specification
related:
  - 010-reserve-exchange
  - 046-reserve-operation-queue
---

# 045 — Oracle Relay Network

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: oracle integration in [010-reserve-exchange](../../../implementation/specs/010-reserve-exchange/README.md) (direct EVM consumption).

## Overview

EVM oracle networks (Chainlink, Pyth, RedStone, Open-Banking-PoR) are the canonical source for FX rates, reserve attestations, and other off-chain data. Holochain validators need to see the *same* oracle snapshot the original transaction author saw, otherwise validation diverges. This spec defines the **Oracle Relay Network**: a permissioned set of relay agents that read oracle state from EVM and commit signed snapshots to the DHT for Holochain validators to consume.

## Design

### Architecture (Pattern A — relay agents)

Pattern A is recommended for v1. Pattern B (light-client / inclusion proofs) is acknowledged but deferred.

```diagram
EVM oracle (Chainlink, Pyth, RedStone)
        │
        │ read
        ▼
Relay agent 1   Relay agent 2   Relay agent 3   ...   Relay agent N
        │              │              │                       │
        │ sign         │ sign         │ sign                  │ sign
        ▼              ▼              ▼                       ▼
        ╰────── DHT entry: oracle_snapshot ──────────────────╯
                            │
                            │ consumed by
                            ▼
        Cell validators when validating reserve-touching transactions
```

### Oracle snapshot entry

```json
{
  "type": "oracle_snapshot",
  "oracleId": "chainlink:USDC-USD",
  "value": "1.0001",
  "decimals": 8,
  "evmBlockNumber": 1234567,
  "evmBlockHash": "0xabc...",
  "evmTimestamp": 1715000000,
  "witnesses": [
    {"relayId": "relay:alpha", "signature": "..."},
    {"relayId": "relay:beta",  "signature": "..."},
    {"relayId": "relay:gamma", "signature": "..."}
  ],
  "committedAt": 1715000060
}
```

### Witnessed reads in transactions

When a transaction depends on oracle data (e.g., a redemption that uses the current FX rate to compute USDC payout), the transaction author inlines the oracle reading they used:

```json
{
  "type": "redemption_request",
  "amountCC": 100,
  "oracleReadings": [
    {
      "snapshotHash": "uhCAk...",
      "oracleId": "chainlink:USDC-USD",
      "value": "1.0001"
    }
  ]
}
```

Validators check:
1. Each `snapshotHash` resolves to a valid `oracle_snapshot` entry.
2. The snapshot is signed by ≥ M-of-N relays where N is the relay roster size and M is the configured threshold (default M=3, N=7).
3. The snapshot's `committedAt` is within the configured staleness tolerance (default: 5 minutes for FX, 1 hour for slowly-changing reserve attestations).
4. The transaction's quoted `value` matches the snapshot's `value`.

If any check fails, the transaction is invalid. The same check is performed by the bridge before submission to EVM.

### Relay roster governance

| Property | Value |
|---|---|
| Initial size | 7 |
| Floor threshold | 3 (any snapshot below 3 witnesses is invalid) |
| Roster source | Meta-governance ([013](../013-meta-governance/README.md)) |
| Rotation | Members rotated by meta-governance proposal; geographic and operator diversity required |
| Slashing | Relays caught publishing snapshots inconsistent with EVM ground truth lose roster seat and stake |

Relay operators are not anonymous; they are accountable entities (community-elected, or established Web3 infrastructure providers). The relay role is a paid responsibility funded by a slice of bridge fees.

### Relay redundancy and source diversity

For each oracle reading, multiple independent oracle providers are queried:

| Oracle data | Primary | Secondary | Tertiary |
|---|---|---|---|
| USDC / USD | Chainlink | Pyth | RedStone |
| Reserve PoR (custodian attestation) | Chainlink Proof-of-Reserve | Open Banking webhook (if available) | Quarterly audit attestation |
| Generic FX | Chainlink | Pyth | n/a |

Snapshots include the source. Validators may require multi-source agreement for high-stakes operations (e.g., redemption requires both Chainlink and Pyth within a 0.5% band).

### Snapshot lifecycle

- Snapshots are short-lived; they expire from the DHT after a configurable retention window (default 7 days).
- A snapshot referenced by an in-flight transaction or a finalized commitment cannot be garbage-collected until the referring entry is itself out of dispute window.
- Historical snapshots needed for audit can be archived by any party (cell, bridge member, third-party watcher).

## Plan

1. [ ] Define `oracle_snapshot` entry type and validation rules in Base DNA.
2. [ ] Implement relay agent reference implementation (off-chain process pulling from EVM oracles, signing, committing).
3. [ ] Implement bridge-side check that bridged transactions carry valid witnessed readings.
4. [ ] Define relay roster meta-governance procedure and initial 7-member roster.
5. [ ] Implement multi-source agreement enforcement for high-stakes categories.
6. [ ] Define slashing flow for misbehaving relays.

## Test

- [ ] Snapshot signed by 2-of-7 relays: rejected by validators.
- [ ] Snapshot signed by 3-of-7 relays: accepted for general use.
- [ ] Redemption transaction with stale snapshot (older than tolerance): rejected.
- [ ] Multi-source disagreement (Chainlink and Pyth differ by 1%): rejected for high-stakes operations.
- [ ] Relay misbehavior: relay seat slashed and removed within meta-governance SLA.

## Open questions

- **§8.4.14 Oracle relay set** — permissionless? permissioned? N-of-M threshold default?
- **Funding for relays** — slice of bridge fees, slice of redemption fees, platform grant?
- **Latency budget** — how stale can a snapshot be for low-stakes deliberation entries vs. reserve operations?
- **Pattern B (light client)** path — when does this become viable; what's the migration plan?
- **Cross-substrate replay** — a snapshot from EVM block N stays valid after a deep reorg; mitigation is bridge waits for L2 finality before snapshotting.
- **Privacy** — relay identities are public for accountability; is there a way to preserve operator-level privacy while keeping accountability?

## Notes

The subtle requirement here is the **same-snapshot-as-author** property. Without it, a redemption author could exploit a stale validator view to claim a better FX rate than the chain currently offers, or vice versa. Inlining the snapshot reference in the transaction makes validation deterministic.

This spec is heavily informed by the patterns described in HoloFuel's exchange-rate handling and by the standard "oracle snapshot witnessed by N parties" pattern seen in cross-chain bridge designs.
