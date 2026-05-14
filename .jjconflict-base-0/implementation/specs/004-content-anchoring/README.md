---
status: planned
created: '2026-04-03'
tags: [infrastructure, skeleton, smart-contracts, atproto]
priority: critical
depends_on:
  - 001-diamond-module-registry
---

# 004 — Content Anchoring

## Overview

Bridge between off-chain deliberation content and on-chain integrity. Content (issues, arguments, proposals) lives in **AT Protocol signed data repositories** — each piece is a record in the author's PDS, cryptographically signed by their DID. The on-chain `ContentAnchorFacet` anchors AT-URI references and CIDs from these records so anyone can verify authenticity and detect tampering.

## Design

### AT Protocol Data Model

Content is stored as records in AT Proto repos using **Kindact lexicons** (`org.kindact.*`). Each record is:

- Signed by the author's DID (tamper evidence + authorship proof).
- Content-addressed via CID (self-authenticating by default).
- Portable — the user's PDS can migrate without breaking references.

Binary attachments (images, documents) are stored as AT Proto blobs, which use IPFS-compatible CIDs under the hood.

### Kindact Lexicons

Kindact defines its own lexicon namespace for deliberation record types:

- `org.kindact.issue` — issue descriptions
- `org.kindact.comment` — comments on any object
- `org.kindact.argument` — structured arguments (pro/con)
- `org.kindact.proposal` — governance proposals
- `org.kindact.evidence` — supporting evidence
- `org.kindact.report` — moderation reports

These complement the Hypercerts lexicons (`org.hypercerts.*`). New record types are added by extending the namespace.

### ContentAnchorFacet

Diamond facet that anchors AT Proto record references on-chain.

```
struct ContentRecord {
    address submitter;
    uint64  timestamp;
    bytes32 objectType;    // e.g., keccak256("issue"), keccak256("proposal")
    bytes32 objectId;      // application-level identifier
    string  atUri;         // AT-URI of the source record (e.g., at://did:plc:xxx/org.kindact.issue/tid)
}
```

Mapping: `contentCid (bytes32) → ContentRecord` in AppStorage. The `contentCid` is derived from the AT Proto record's CID.

### Batch Anchoring

To reduce gas costs when anchoring many items at once:

1. Collect N content CIDs from AT Proto records.
2. Build a Merkle tree with the CIDs as leaves.
3. Anchor **only the Merkle root** on-chain via `anchorBatch(bytes32 merkleRoot, uint256 leafCount)`.
4. Individual content can be verified by submitting a Merkle inclusion proof against the on-chain root.

Batch records stored as: `batchRoot (bytes32) → BatchRecord(submitter, timestamp, leafCount)`.

### ContentRegistry

For mutable objects (e.g., an issue description that gets edited):

- Mapping: `(objectType, objectId) → contentCid + atUri` — always points to the **latest** AT Proto record version.
- History is preserved in the AT Proto repo (commit history) and on-chain (previous `ContentRecord` entries remain).
- Update requires the caller to be the original submitter or have an authorized role.

### Verification

To verify any piece of content:

`issue`, `comment`, `argument`, `proposal`, `evidence`, `report`, `protocol_snapshot`, `metric_bundle`

This provides end-to-end integrity without trusting any single server.

### Events

- `ContentAnchored(bytes32 indexed contentCid, address indexed submitter, bytes32 objectType, bytes32 objectId, string atUri)`
- `BatchAnchored(bytes32 indexed batchRoot, address indexed submitter, uint256 leafCount)`
- `ContentUpdated(bytes32 indexed objectType, bytes32 indexed objectId, bytes32 oldCid, bytes32 newCid)`

### Extension Points

- New record types added by defining new Kindact lexicons.
- AT Proto relay/PDS selection is an operational decision — the on-chain contract is backend-agnostic.
- Batch size limits and anchoring fees adjustable via governance.

## Plan

1. Define Kindact lexicon schemas (`org.kindact.*` record types).
2. Implement `ContentAnchorFacet` — single-item anchoring with AT-URI + CID references.
3. Implement Merkle batch anchoring (tree construction off-chain, root + proof verification on-chain).
4. Implement `ContentRegistry` mapping for mutable object tracking.
5. Build AT Proto integration library (create records, resolve AT-URIs, verify DID signatures, compare CIDs).
6. Write verification utilities (CLI / SDK for end-to-end checking).
7. Write tests.

## Test

- Unit: anchor content CID + AT-URI, retrieve record, verify CID matches.
- Batch: build Merkle tree from CIDs, anchor root, verify individual inclusion proofs, reject invalid proofs.
- Registry: update content for mutable objects, verify history preserved in both AT Proto repo and on-chain.
- Verification: full DID signature verification → CID comparison → on-chain anchor check.
- Access: only submitter or authorized role can update mutable content.
- Edge: duplicate CID, empty batch, max batch size.
- Integration: full flow — create AT Proto record → anchor CID on-chain → retrieve from PDS → verify signature → verify CID.

## Notes

- AT Proto provides content-addressed, self-authenticating data by default — the separate "content-addressed storage" concern is largely handled by the protocol itself.
- Gas cost is the primary concern for on-chain anchoring — batch anchoring amortizes cost across many items.
- The Merkle tree is constructed off-chain; only the root goes on-chain.
- IPFS is still used under the hood for AT Proto blob storage, but Kindact interacts with the AT Proto layer, not raw IPFS.
- Consider an off-chain indexer that watches `ContentAnchored` events and maintains a queryable database.
- IPFS pinning strategy (self-hosted vs. Pinata/web3.storage) is an operational decision, not a contract concern.
- This facet should be usable by extensibility snapshots and canonical metrics bundles, not just deliberation text content.
