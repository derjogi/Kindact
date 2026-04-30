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

**Decision**: **Kindact-as-creator with contributor attribution.** The platform DID creates and signs every `org.hypercerts.claim.activity` record. Hypercerts are platform assets that back the reserve and are sold on the marketplace; contributors are *attributed* in the record but do **not** own the hypercert. Contributors are compensated entirely in $CC at verification time (via 008). No revenue share on hypercert sales accrues to contributors — the $CC reward is the contribution payment, in full.

This model trades AT Proto's "creator owns the record" default for a clean custody and settlement story. It avoids fiduciary/custodial entanglements, keeps marketplace operations simple (one signer), and matches the platform-as-impact-aggregator role.

#### Implications and required mitigations

The decision creates four operational concerns that must be addressed elsewhere in the design:

**1. Contributor portability lives in the work report, not the hypercert.**
Because the hypercert is signed by the platform DID, it stays in the platform's repo. If a contributor migrates PDS — or if Kindact is sunset — they cannot take the hypercert with them. The portable, contributor-owned record of their work is the `org.kindact.work.report` (008), which is signed by the contributor's DID and lives in their own PDS. Every hypercert MUST embed an AT-URI reference to the underlying work report so that the contributor's signed record remains the canonical proof of who did the work. Spec 008 owns the work-report lexicon and its persistence guarantees.

**2. Platform DID key management is a meta-governance concern.**
A single DID signs every hypercert; loss or compromise is catastrophic. The platform DID MUST be a `did:plc` controlled by a multisig of rotation keys, with rotation governed by 013-meta-governance. Specific operational requirements (rotation cadence, signer set, recovery procedure) are deferred to 013 but tracked as a hard dependency.

**3. Lexicon conformance must be verified.**
The `org.hypercerts.claim.contribution` schema separates the record creator from the named contributors. This split is what makes platform-as-creator viable. Before locking the marketplace and bridge facets, the implementation team must confirm against the live `@hypercerts-org/lexicon` package that:
   - the schema permits creator DID ≠ contributor DID(s);
   - the schema accepts contributor identification by `app.certified.link.evm` or by raw DID;
   - cross-platform marketplaces (Hypercerts.org, etc.) accept platform-signed activity records.
If any of these fails, the design must be revisited.

**4. Buyers must be able to audit the full evidence chain.**
Platform-signed claims are weaker than contributor-signed claims unless the underlying evidence is verifiable. Every hypercert anchored on-chain MUST include references to:
   - the contributor-signed `org.kindact.work.report` (proof of who claims the work);
   - the verifier signatures (proof of independent verification per 008);
   - the on-chain verification transaction (proof of platform-finalized verdict);
   - the issue's `verificationSnapshotHash` (proof of the rules under which the work was judged).

This evidence chain is what gives a Kindact-issued hypercert credibility despite the single-creator signature.

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
