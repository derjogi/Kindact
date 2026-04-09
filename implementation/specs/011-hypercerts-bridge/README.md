---
status: planned
created: 2026-04-03
priority: medium
tags:
- impact
- economics
- smart-contracts
- hypercerts
depends_on:
- 008-work-verification-rewards
- 010-reserve-exchange
- '017'
created_at: 2026-04-05T10:28:37.131239513Z
updated_at: 2026-04-05T10:28:37.131239513Z
---

# 011 — Hypercerts Bridge

## Overview

Mint impact credentials (Hypercerts) as AT Protocol records when work is verified, anchor them on-chain for funding and settlement, and route proceeds into the $CC reserve. Hypercerts v2 is built on AT Protocol — impact records use the `org.hypercerts.*` lexicon namespace. On-chain anchoring is reserved for funding and settlement only.

## Design

### HypercertsBridgeFacet

Bridges Kindact work verification to the Hypercerts protocol on AT Proto.

**Auto-create on verification**: when work is verified (via 008), Kindact creates a `org.hypercerts.claim.activity` record in the AT Proto network recording:

- Contribution (`org.hypercerts.claim.contribution`) — who did what, verified results
- Work scope (`org.hypercerts.claim.scope`) — issue reference, community size
- Rights (`org.hypercerts.claim.rights`) — ownership and distribution terms
- Evidence attached via `org.hypercerts.context.attachment`
- Metrics attached via `org.hypercerts.context.measurement`

**On-chain anchoring**: the facet anchors the AT-URI + CID of the hypercert activity record on-chain and manages the funding/settlement layer. The `app.certified.link.evm` lexicon bridges AT Proto DIDs to EVM wallets for on-chain settlement.

- Hypercerts held by Kindact platform treasury (on-chain multisig)

### On-Chain Data

```solidity
struct HypercertAnchor {
    uint256 issueId;
    uint256 claimId;
    string  atUri;          // AT Proto record URI
    bytes32 cid;            // Content hash for integrity
    uint48  anchoredAt;
    bool    listed;         // Currently on marketplace
    uint256 price;          // If listed, price in wei or fiat-equivalent
}
```

### Ownership Model

**Open design question**: AT Protocol records are owned by their creators. Kindact's design holds Hypercerts as platform assets to back the reserve. Options under consideration:
1. Kindact DID as creator account (platform creates the records)
2. Custodial model with contributor attribution
3. Contributor-owned records with platform licensing rights

The chosen model must reconcile AT Proto record ownership with on-chain settlement authority.

### Marketplace

- Hypercerts listed for sale to external buyers (corporations, impact funds, governments)
- **Fiat purchases**: funding uses `org.hypercerts.funding.receipt` records; proceeds flow into reserve (010), improving $CC backing
- **$CC purchases**: $CC used to buy Hypercerts is **burned**, creating deflationary pressure

**Marketplace details** (to be refined):
- Listing/delisting access control (platform operators or governance-gated)
- Pricing model: fixed price, auction, or reserve-rate floor
- ValueFlows vocabulary (`work`, `consume`, `produce`) for mapping implementation reports to Hypercert dimensions (Work Scope, Contributor Scope, Time Scope, Impact Scope)

### Integration

- Uses Hypercerts protocol SDK for minting (ERC-1155 compatible)
- Impact metadata stored on IPFS, hash recorded on-chain
- Impact metadata must reference the canonical metrics bundle defined by 017-core-metrics-framework so baseline dimensions remain comparable across issue types

### Events

- `HypercertAnchored(atUri, cid, issueId, claimId)`
- `HypercertListed(atUri, price, currency)`
- `HypercertSold(atUri, buyer, price, currency)`
- `ProceedsDeposited(atUri, fiatAmount, reserveAddress)`

### Extension Points

- Integration with Verra/Gold Standard certifications
- Retroactive funding round participation (RetroPGF)
- Domain-specific dimension packs layered on top of the shared metrics baseline

## Plan

1. Implement `HypercertsBridgeFacet` with auto-create AT Proto records on verification
2. Integrate `@hypercerts-org/lexicon` for record creation and validation
3. Implement on-chain anchoring (AT-URI + CID) and EVM wallet linking via `app.certified.link.evm`
4. Implement marketplace contract (list, buy, delist) with `org.hypercerts.funding.receipt`
5. Implement revenue routing: fiat→reserve, $CC→burn
6. Tests

## Test

- Verified work triggers `org.hypercerts.claim.activity` record with correct metadata
- Unverified/disputed work does not create records
- AT-URI + CID correctly anchored on-chain
- Marketplace listing and purchase (fiat path → reserve deposit)
- Marketplace purchase ($CC path → token burn)
- Duplicate record prevention (one Hypercert per verified claim)
- AT Proto DID to EVM wallet linking via `app.certified.link.evm`

## Notes

- Hypercerts protocol is live on Optimism — same L2 target as Kindact
- Impact metrics schema should be standardized across issue categories, with extensible packs rather than incompatible domain schemas.
