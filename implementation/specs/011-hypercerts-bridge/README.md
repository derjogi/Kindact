---
status: planned
created: '2026-04-03'
tags: [impact, economics, smart-contracts, hypercerts]
priority: medium
depends_on:
  - 008-work-verification-rewards
  - 010-reserve-exchange
---

# 011 — Hypercerts Bridge

## Overview

Mint impact credentials (Hypercerts) on work verification, sell them to external buyers, and route proceeds into the $CC reserve.

## Design

### HypercertsBridgeFacet

Bridges Kindact work verification to the Hypercerts protocol (ERC-1155-based standard from hypercerts.org).

**Auto-mint on verification**: when work is verified (via 008), automatically mint a Hypercert recording:

```
struct HypercertRecord {
    uint256 id;
    uint256 issueId;
    uint256 claimId;
    bytes32 workDescriptionHash;
    bytes32 impactMetricsHash;
    uint256 mintedAt;
}
```

- Includes: who did what, when, verified results, issue reference, community size
- Hypercerts held by Kindact platform treasury (on-chain multisig)

### Marketplace

- Hypercerts listed for sale to external buyers (corporations, impact funds, governments)
- **Fiat purchases**: proceeds flow into reserve (010), improving $CC backing
- **$CC purchases**: $CC used to buy Hypercerts is **burned**, creating deflationary pressure

### Integration

- Uses Hypercerts protocol SDK for minting (ERC-1155 compatible)
- Impact metadata stored on IPFS, hash recorded on-chain

### Events

- `HypercertMinted(hypercertId, issueId, claimId, minter)`
- `HypercertListed(hypercertId, price, currency)`
- `HypercertSold(hypercertId, buyer, price, currency)`
- `ProceedsDeposited(hypercertId, fiatAmount, reserveAddress)`

### Extension Points

- Integration with Verra/Gold Standard certifications
- Retroactive funding round participation (RetroPGF)
- Domain-specific impact schemas (climate, education, health)

## Plan

1. Implement `HypercertsBridgeFacet` with auto-mint on verification
2. Integrate Hypercerts SDK for ERC-1155 minting
3. Implement marketplace contract (list, buy, delist)
4. Implement revenue routing: fiat→reserve, $CC→burn
5. Tests

## Test

- Verified work triggers Hypercert mint with correct metadata
- Unverified/disputed work does not mint
- Marketplace listing and purchase (fiat path → reserve deposit)
- Marketplace purchase ($CC path → token burn)
- Duplicate mint prevention (one Hypercert per verified claim)
- Correct impact data hashes on-chain

## Notes

- Hypercerts protocol is live on Optimism — same L2 target as Kindact
- Impact metrics schema should be standardized across issue categories
