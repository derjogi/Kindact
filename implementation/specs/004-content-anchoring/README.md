---
status: planned
created: '2026-04-03'
tags: [infrastructure, skeleton, smart-contracts]
priority: critical
depends_on:
  - 001-diamond-module-registry
---

# 004 — Content Anchoring

## Overview

Bridge between off-chain deliberation content and on-chain integrity. Content (issues, arguments, proposals) is stored off-chain on IPFS; its hash is anchored on-chain so anyone can verify authenticity and detect tampering.

## Design

### ContentAnchorFacet

Diamond facet that stores content hashes and metadata.

```
struct ContentRecord {
    address submitter;
    uint64  timestamp;
    bytes32 objectType;    // e.g., keccak256("issue"), keccak256("proposal")
    bytes32 objectId;      // application-level identifier
}
```

Mapping: `contentHash (bytes32) → ContentRecord` in AppStorage.

### Content-Addressed Storage

- Off-chain blobs are stored on **IPFS** (or a compatible CAS backend).
- The on-chain `contentHash` is the IPFS CID (or SHA-256 hash of the content).
- Verification: retrieve blob from IPFS, hash it, compare to on-chain record.

### Batch Anchoring

To reduce gas costs when anchoring many items at once:

1. Collect N content hashes.
2. Build a Merkle tree with the hashes as leaves.
3. Anchor **only the Merkle root** on-chain via `anchorBatch(bytes32 merkleRoot, uint256 leafCount)`.
4. Individual content can be verified by submitting a Merkle inclusion proof against the on-chain root.

Batch records stored as: `batchRoot (bytes32) → BatchRecord(submitter, timestamp, leafCount)`.

### ContentRegistry

For mutable objects (e.g., an issue description that gets edited):

- Mapping: `(objectType, objectId) → contentHash` — always points to the **latest** version.
- History is preserved because previous `ContentRecord` entries remain in storage.
- Update requires the caller to be the original submitter or have an authorized role.

### Object Types

Initial set (extensible by modules):

`issue`, `comment`, `argument`, `proposal`, `evidence`, `report`, `protocol_snapshot`, `metric_bundle`

New object types are declared when a module registers via `ModuleRegistry`.

### Events

- `ContentAnchored(bytes32 indexed contentHash, address indexed submitter, bytes32 objectType, bytes32 objectId)`
- `BatchAnchored(bytes32 indexed batchRoot, address indexed submitter, uint256 leafCount)`
- `ContentUpdated(bytes32 indexed objectType, bytes32 indexed objectId, bytes32 oldHash, bytes32 newHash)`

### Extension Points

- New object types registered by any module that uses content anchoring.
- Storage backends swappable off-chain (IPFS, Arweave, S3+hash) — the on-chain contract is backend-agnostic.
- Batch size limits and anchoring fees adjustable via governance.

## Plan

1. Implement `ContentAnchorFacet` — single-item anchoring and content registry.
2. Implement Merkle batch anchoring (tree construction off-chain, root + proof verification on-chain).
3. Implement `ContentRegistry` mapping for mutable object tracking.
4. Build off-chain IPFS integration library (pin content, retrieve, verify hash).
5. Write verification utilities (CLI / SDK for hash checking).
6. Write tests.

## Test

- Unit: anchor content, retrieve record, verify hash matches.
- Batch: build Merkle tree, anchor root, verify individual inclusion proofs, reject invalid proofs.
- Registry: update content for mutable objects, verify history preserved.
- Access: only submitter or authorized role can update mutable content.
- Edge: duplicate content hash, empty batch, max batch size.
- Integration: full flow — store on IPFS → anchor hash → retrieve → verify.

## Notes

- Gas cost is the primary concern — batch anchoring amortizes cost across many items.
- The Merkle tree is constructed off-chain; only the root goes on-chain.
- Consider an off-chain indexer that watches `ContentAnchored` events and maintains a queryable database.
- IPFS pinning strategy (self-hosted vs. Pinata/web3.storage) is an operational decision, not a contract concern.
- This facet should be usable by extensibility snapshots and canonical metrics bundles, not just deliberation text content.
