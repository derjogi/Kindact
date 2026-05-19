---
status: implemented-pending-verification
created: '2026-05-12'
tags: [infrastructure, smart-contracts, holochain, dht]
priority: critical
derivation: changed
counterpart: 004-content-anchoring
depends_on:
  - 001-diamond-module-registry
  - 040-bridge-specification
  - 041-base-dna-specification
---

# 004 — Content Anchoring (DHT)

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [004-content-anchoring](../../../implementation/specs/004-content-anchoring/README.md)

## Overview

Bridge between off-chain deliberation content and on-chain integrity. **The role is unchanged: anchor CIDs / entry hashes on EVM so anyone can verify authenticity and detect tampering.** The substrate underneath shifts from AT Protocol PDS records to Holochain DHT entries. The on-chain `ContentAnchorFacet` holds entry hashes from cells instead of AT-URIs from PDSes.

Read the [implementation/ counterpart](../../../implementation/specs/004-content-anchoring/README.md) for the AT-Proto-anchored design this replaces.

## Design

### Holochain entries replace AT Proto records

Each piece of content (issue, comment, argument, proposal, evidence, work report) is a **DHT entry** in a cell, signed by the author's agent key. Properties carried over:

- Signed by author (tamper evidence + authorship proof) — by Holochain agent key, not AT DID.
- Content-addressed (entry hash) — Holochain entry hashes are self-authenticating.
- Portable across conductors — source chain replicates, entries live in the DHT.

Binary attachments (images, documents) live as Holochain entries with size-aware sharding, or pointers to IPFS CIDs for large blobs.

### Entry types

The implementation/ lexicons port to entry types in cell-installed zomes:

| Implementation/ lexicon | Holochain entry type | Resident zome |
|---|---|---|
| `org.kindact.issue` | `Issue` | `kindact_base_lifecycle` |
| `org.kindact.comment` | `Comment` | `kindact_deliberation` |
| `org.kindact.argument` | `ArgumentNode` | `kindact_deliberation` |
| `org.kindact.proposal` | `ProposalDocument` | `kindact_deliberation` |
| `org.kindact.evidence` | `Evidence` | `kindact_base_lifecycle` |
| `org.kindact.report` | `ModerationReport` | `kindact_base_lifecycle` |
| `org.kindact.work.report` | `WorkReport` | `kindact_work` |
| `org.kindact.metrics.bundle` | `MetricsBundle` | `kindact_metrics` |

Hypercerts records remain on AT Proto (per [011](../011-hypercerts-bridge/README.md)) for ecosystem compatibility.

### ContentAnchorFacet

```solidity
struct ContentRecord {
    address submitter;        // EVM wallet of the bridging caller (System Agent)
    uint64  timestamp;
    bytes32 objectType;        // keccak256("issue"), keccak256("proposal"), ...
    bytes32 objectId;          // application-level identifier
    bytes32 cellId;            // home cell identifier hash
    bytes32 cellDnaHash;       // proves cell was Base-conformant at anchor time
    bytes32 entryHash;         // Holochain entry hash
    bytes32 quorumProofHash;   // hash of quorum signatures used to bridge
}
```

Mapping: `(objectType, objectId) → ContentRecord` in AppStorage.

### When entries are anchored

Not every entry is anchored. Anchoring carries gas cost and is reserved for entries with cross-substrate consequence:

| Entry | Anchored? |
|---|---|
| Issue (Draft, Deliberating) | No (cell-only) |
| Issue (transitions to VoteReady, Adopted, Implementing, Completed) | **Yes** at each transition |
| Comment / argument | No |
| Proposal document | **Yes** at vote close (canonical version) |
| Vote tally finalization | **Yes** |
| Work claim creation | No |
| Work claim verification | **Yes** (triggers mint) |
| Hypercert record (AT Proto) | **Yes** per [011](../011-hypercerts-bridge/README.md) |
| Metrics bundle finalization | **Yes** |
| Dispute opening / resolution | **Yes** |

Bridge ([040](../040-bridge-specification/README.md)) gates anchoring.

### Verification

A third party verifies content integrity by:
1. Reading the on-chain `ContentRecord`.
2. Querying the Global Registry for the cell record (cell DNA hash, member roster snapshot).
3. Querying the cell's DHT (or a Holo-hosted gateway) for the entry by hash.
4. Verifying the entry's signature against the cell's roster at `timestamp`.
5. Verifying the quorum proof hash matches the recorded value.

This verification is doable without joining the cell or running a full conductor — a public gateway service can serve content reads given an entry hash.

### Non-anchored content trust

Comments, drafts, and other non-anchored entries are signed by the author and validated by cell members. Their integrity is internal to the cell. External parties relying on non-anchored content do so at the level of trust they place in the cell — which is bounded by the cell being Base-conformant and registered.

## Plan

1. [ ] Define the entry-type-to-zome mapping table and freeze the canonical anchored entry set.
2. [ ] Implement `ContentAnchorFacet` with the bridge-extended fields.
3. [ ] Implement bridge zome anchoring helpers (called when an entry transitions to an anchor-required state).
4. [ ] Build a public DHT gateway service for verification by non-conductor users.
5. [ ] Document the verification procedure for third parties.

## Test

- [ ] Issue transition to `Adopted`: anchor record appears on-chain within bridge SLA; entry resolvable via DHT.
- [ ] Tampering: a modified entry has a different hash; on-chain anchor's `entryHash` no longer matches; tampering visible.
- [ ] Verification by a non-cell-member: public gateway returns the entry; signature verifies against the snapshotted roster.
- [ ] Non-anchored comment: never bridged; cell members validate; no on-chain footprint.

## Open questions

- **Anchor batching** — to save gas, multiple anchors can be merkle-rooted and one root anchored per epoch. Implementation/ already considers this; same trade-off here.
- **Hypercerts on AT Proto vs. Holochain mirror** — keep AT Proto canonical (per [011](../011-hypercerts-bridge/README.md)) but mirror to Holochain for in-cell visibility?
- **Long-term DHT availability** — what's the persistence guarantee for a Holochain entry? Cell with no active members may shed data; is a "preservation pin" service needed for archival?
- **Public gateway operation** — Kindact-operated, community-operated, or a sidecar?
- **Migration of existing AT Proto Kindact records** — is migration in-scope, or is the alternative architecture a clean start?

## Notes

The role of ContentAnchoring (CIDs on chain for tamper detection) carries over verbatim. The substrate substitution (DHT entry hash for AT Proto AT-URI) is mechanical. The bigger conceptual shift is that non-anchored content (comments, drafts) is now validated by cell members, not indexed by an AppView — which is the change captured in [006](../006-deliberation-cell/README.md).
