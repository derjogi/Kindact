---
status: in-progress
created: '2026-05-12'
tags: [bridge, security, architecture, multi-sig, cross-chain]
priority: critical
derivation: new
depends_on:
  - 000-substrate-architecture-decision-record
  - 001-diamond-module-registry
  - 041-base-dna-specification
---

# 040 — Bridge Specification

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: none. Content anchoring (004) was the closest analog under the old architecture.

## Overview

The bridge is the load-bearing security boundary of the hybrid. It is the single trust surface where Holochain quorum signatures are translated into EVM-signing authority and where EVM state is mirrored back into the DHT for Holochain validators. Cross-chain bridges are historically the most-attacked surface in crypto (Wormhole, Ronin, Nomad, Multichain). This spec exists primarily because the bridge needs first-class threat modeling, not as an implementation manual.

## Design

### Topology

```diagram
╭──────────────────────────╮     ╭────────────────────────╮     ╭──────────────────╮
│ Holochain                 │     │ Bridge / System Agent  │     │ EVM L2           │
│  • Verified work entry    │────▶│  • Multi-sig (5-of-7)  │────▶│  • Hypercert     │
│  • Quorum signatures      │     │  • Verify quorum sigs  │     │    minted        │
│  • Anchored to global     │     │  • Submit EVM tx       │     │  • $CC minted    │
│    registry               │     │  • Wait for finality   │     │  • Anchor CID    │
│                           │◀────│  • Anchor receipt back │◀────│    on chain      │
╰──────────────────────────╯     ╰────────────────────────╯     ╰──────────────────╯
```

### System Agent (multi-sig)

- **Composition**: 5-of-7 default. Members are community-elected signers; rotation via meta-governance ([013](../013-meta-governance/README.md)).
- **EVM side**: deployed as a [Safe](https://safe.global/) (Gnosis Safe) wallet that holds `BRIDGE_OPERATOR` role on the Diamond. The Safe is the only address authorized to call privileged bridge functions: `mintFromVerifiedWork(...)`, `anchorHypercertFromCell(...)`, `executeRedemption(...)`, `executeClawback(...)`.
- **Holochain side**: a designated agent group whose public keys are recorded in the Global Registry's `bridge_signers` anchor. Capability tokens grant this group exclusive right to commit `currency-to-fiat-exchange`, `global-hypercert-anchor`, and `clawback` entries.
- **Member rotation**: meta-governance proposal updates both sides atomically (EVM `addOwner` / `removeOwner`; Holochain Registry update). A grace period of N days lets in-flight signatures complete before old members are removed.

### Bridged operations

| Trigger (Holochain DHT event) | Bridge action | EVM result |
|---|---|---|
| Work claim verified by quorum | Verify N-of-M validator signatures, submit `mintFromVerifiedWork(workCID, amount)` | Mint $CC + Hypercert |
| Reserve deposit detected (oracle relay) | Update reserve balance | Confidence-curve recalculation |
| Redemption queued + countersigned ([046](../046-reserve-operation-queue/README.md)) | Submit `executeRedemption(redeemer, amount)` | Debit reserve, transfer USDC |
| Dispute confirmed by [012](../012-dispute-resolution/README.md) flow | Submit `executeClawback(target, amount, debtRef)` | Update Debt Ledger |
| Oracle data update (EVM → Holochain) | Bridge fetches signed oracle reading, commits as DHT snapshot | n/a (Holochain validators consume) |
| Meta-governance parameter change | Bridge mirrors parameter into the DHT registry | n/a |
| Cell promotion / Base DNA version update | Register new canonical DNA hash on EVM `BridgeRegistry` facet | Bridge accepts entries from new canonical cells |

### Critical properties

- **Idempotent retries.** Every bridge submission carries a deterministic `operationId` derived from the Holochain entry hash. EVM facets reject duplicate `operationId` calls. Both sides handle "tried once, unsure if it landed" gracefully.
- **No cross-substrate atomicity.** A Holochain "verified" record may exist with no EVM mint, or vice versa. Failure modes use explicit `pending` state that resolves to `complete` or `rolled_back` after reconciliation.
- **Reconciliation worker.** Periodic job (run by every System Agent member independently) scans both sides for orphaned events and produces signed reconciliation proposals.
- **Capability-token controlled on Holochain.** No agent other than the System Agent can commit bridge-marker entries. Validators reject such entries from non-System-Agent agents.
- **Slow finality preferred.** Bridge waits for L2 finality (or a configurable confirmation depth) before anchoring receipts back to Holochain. Latency budget: minutes, not seconds.

### Threat model

| Attack | Mitigation |
|---|---|
| Multi-sig key compromise (3-of-7 stolen) | 5-of-7 threshold + rotation + activity monitoring + emergency pause via [013](../013-meta-governance/README.md) constitutional vote |
| Forged quorum signatures from a fake cell | Bridge verifies cell DNA hash matches a canonical Base-DNA-conformant build before accepting (see [044](../044-cross-cell-validation-and-trust/README.md)) |
| Replay attacks (same proof submitted twice) | `operationId` uniqueness on both sides |
| Oracle relay collusion poisoning Holochain validators | M-of-N relay requirement; validators reject snapshots with insufficient witnesses ([045](../045-oracle-relay-network/README.md)) |
| Reserve drain via DHT eventual-consistency race | Countersigned redemption queue ([046](../046-reserve-operation-queue/README.md)) |
| Bridge censorship (signers refuse to sign) | Censorship is observable; emergency rotation procedure in [013](../013-meta-governance/README.md); long-term mitigation is heterogeneous signer geography |
| Front-running between quorum signature collection and EVM submission | Operations of monetary consequence carry expiration timestamps; expired ops require re-quorum |
| Long-range attack on Holochain history | Periodic Merkle anchor of DHT state hash committed to EVM; old anchors unfalsifiable |

### Failure & reconciliation

State machine for any bridged operation:

```diagram
  ╭──────────╮    quorum sigs collected    ╭───────────╮
  │ proposed │──────────────────────────▶ │  signed   │
  ╰──────────╯                             ╰─────┬─────╯
                                                 │ tx submitted
                                                 ▼
  ╭───────────╮  reorg / revert  ╭───────────╮   ╭─────────────╮
  │  failed   │◀─────────────────│ pending   │──▶│  finalized  │
  ╰─────┬─────╯                  ╰─────┬─────╯   ╰─────┬───────╯
        │ reconciliation                │ timeout            │ receipt
        ▼                               ▼                    ▼
  ╭────────────╮               ╭──────────────╮       ╭───────────╮
  │ rolled_back│               │  reconciling │       │ anchored  │
  ╰────────────╯               ╰──────────────╯       ╰───────────╯
```

- Operations stuck in `pending` past the timeout enter `reconciling`.
- Reconciliation worker independently verifies EVM state, then either replays the tx or rolls back the Holochain-side entry.
- Every state transition is gossiped on the Holochain side so the UI can show users accurate progress.

## Plan

1. [ ] Stand up a Safe on the chosen L2 with bootstrap signers (founders).
2. [ ] Implement `BridgeOperatorFacet` on the Diamond exposing the privileged calls listed above.
3. [ ] Implement Holochain `bridge` zome — capability tokens, marker entries, validation rules.
4. [ ] Build the bridge service (off-chain process run by each System Agent member): listens to DHT, collects quorum signatures, submits EVM txs, gossips status.
5. [ ] Implement the reconciliation worker.
6. [ ] Threat-model review with at least one external security firm before any non-toy deployment.
7. [ ] Bug bounty program before mainnet.

## Test

- [ ] Replay attack: same `operationId` rejected on both sides.
- [ ] Reorg: tx survives in EVM mempool then drops; `pending` → `reconciling` → re-submit.
- [ ] Multi-sig threshold: 4-of-7 fails, 5-of-7 succeeds, 7-of-7 succeeds.
- [ ] Capability-token revocation: removed signer's signature is rejected.
- [ ] Reconciliation under partial-network conditions (Holochain side sees event, EVM side does not, vice versa).

## Open questions

- **§8.2.5 Bridge multi-sig composition** — who, how rotated, threshold, emergency authority.
- **§8.5.17 Bridge audit & bug bounty** — when/how validated; budget; insurance fund.
- **Pre-launch audit firm choice** — should be specialized in cross-chain bridges (e.g., Trail of Bits, OpenZeppelin, Spearbit).
- **Whether to use a Safe Module rather than vanilla Safe** for stricter operation patterns.
- **Long-term migration** to a trust-minimized bridge (light client, ZK rollup of DHT state) once tooling matures.

## Notes

Required reading before any implementation work: [Wormhole post-mortem](https://wormholecrypto.medium.com/wormhole-incident-report-02-02-22-ad9b8f21eec6), [Ronin post-mortem](https://roninblockchain.substack.com/p/community-alert-ronin-validators), [Nomad post-mortem](https://medium.com/nomad-xyz-blog/nomad-bridge-hack-root-cause-analysis-875ad2e5aacd), [Multichain post-mortem](https://medium.com/multichainorg/multichain-suspended-services-statement-d3ab9f1b25c9). The pattern across these is: small multi-sigs, signature-verification bugs, replay flaws, or trusted-relay compromise. The 5-of-7 + rotation + capability-token model here is informed by these failures.
