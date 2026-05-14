---
status: planned
created: '2026-04-03'
tags: [identity, skeleton, smart-contracts, zkp, atproto]
priority: critical
depends_on:
  - 001-diamond-module-registry
---

# 002 — Identity Primitive

## Overview

On-chain identity and sybil resistance for Kindact. Wallet addresses are mapped to pseudonymous identity records with a **humanity score** derived from ZK-verified attestations. No real-world identity is ever stored on-chain.

## Design

### IdentityRegistry Facet

Deployed as a Diamond facet. Stores identity records in `AppStorage`.

```
struct IdentityRecord {
    address wallet;
    uint8   humanityScore;   // 0–100
    uint64  verifiedAt;      // timestamp of last verification
    uint32  providerMask;    // bitmask of attesting providers
}
```

Mapping: `wallet → IdentityRecord` in AppStorage.

### Humanity Providers

Kindact relies on **multiple existing third-party humanity providers**, not a single one. The platform does **not** ship a manual-review fallback or an in-house attestation committee. Initial intended set:

| Bit | Provider | Notes |
|-----|----------|-------|
| 0 | Gitcoin Passport | Composite score; broad coverage in Web3-active regions |
| 1 | BrightID | Social-graph based; strong in non-wallet regions |
| 2 | Proof of Humanity | Video + vouching; strong identity assurance |
| 3 | Anon Aadhaar | ZK proof of Indian Aadhaar; high coverage in India |
| 4 | Worldcoin / World ID | Iris-based; broad geographic reach |

Score weights are governance-configurable per provider. Users may stack attestations from multiple providers — `providerMask` records which providers have attested for a given wallet, and the aggregate `humanityScore` reflects the sum of weighted contributions.

**Rationale**: relying on a portfolio of independent providers spreads exclusion risk across orthogonal failure modes (no wallet → BrightID/Worldcoin; no smartphone → vouching networks; no government ID → Gitcoin Passport stacks). No single provider becomes a chokepoint, and Kindact does not need to operate a subjective review process.

**Residual exclusion is acknowledged.** A small number of users will be excluded by *every* provider (no internet access, isolated populations, etc.). This residual is tracked as a v2 concern; v1 ships with the multi-provider stack and the platform commits to revisiting if real-world exclusion data warrants a remedy.

New providers are added via a **ProviderRegistry** (governance-gated). Each provider has an ID, a verifier contract address, and a score weight. `providerMask` is a bitmask up to 32 providers wide.

### ZKP Verification

- Users generate a ZK proof off-chain proving they hold a valid attestation from a registered provider, **without revealing** the specific attestation.
- The `IdentityRegistry` facet calls an on-chain **ZK verifier contract** (e.g., Groth16 or PLONK verifier) to validate the proof.
- On successful verification, the facet updates `humanityScore` and sets the relevant `providerMask` bit.

### One-Person-One-Vote

Governance actions (voting, proposing) require `humanityScore >= threshold`. The threshold is a governance-adjustable parameter stored in `AppStorage`. The identity facet exposes `isHuman(address) → bool` for other facets to call.

### Privacy

- Only pseudonymous wallet addresses on-chain.
- Attestation details remain with the provider; only the ZK proof result is recorded.
- No PII, no plaintext credentials.

### AT Protocol Identity Bridge

Users hold two identities: an **AT Proto DID** (`did:plc` or `did:web`) for off-chain data and deliberation, and an **EVM wallet address** for on-chain governance and tokens. These are linked via the `app.certified.link.evm` lexicon from the Hypercerts/Certified ecosystem.

**Linking flow:**

1. User signs an EIP-712 typed-data message binding their AT Proto DID to their EVM wallet.
2. The signed link record is stored in the user's AT Proto repo as an `app.certified.link.evm` record (cryptographic proof of wallet ownership).
3. The on-chain `IdentityRegistryFacet` stores the reverse mapping (`wallet → AT Proto DID`) alongside the existing `IdentityRecord`.

**What this enables:**

- Deliberation records (signed by DID) can be linked to on-chain votes (signed by wallet) for accountability.
- During anonymous deliberation phases, only the DID is visible — the wallet link is not exposed until the vote is finalized.
- Either side of the link (AT Proto repo or on-chain registry) can be independently verified.

### Events

- `IdentityVerified(address indexed wallet, uint8 humanityScore, uint32 providerMask)`
- `ProviderAdded(uint8 indexed providerId, string name, address verifier)`
- `HumanityScoreUpdated(address indexed wallet, uint8 oldScore, uint8 newScore)`

### Extension Points

- New identity providers register via governance proposal.
- Humanity threshold adjustable via governance.
- Verifier contract upgradeable per provider (new proof systems).
- AT Proto DID methods (`did:plc`, `did:web`) as identity anchors for off-chain deliberation records.

## Plan

1. Implement `IdentityRegistryFacet` with storage structs.
2. Implement `ProviderRegistry` (add/remove providers, governance-gated).
3. Integrate ZK verifier contract (start with Semaphore-style Groth16 verifier).
4. Implement `isHuman(address)` check callable by other facets.
5. Spec the off-chain proof generation service (provider SDKs → ZK circuit → proof).
6. Write tests.

## Test

- Unit: register identity, update score, provider mask operations.
- ZKP: valid proof accepted, invalid proof rejected, replay proof rejected.
- Access: only authorized verifier can update scores.
- Integration: governance action blocked when `humanityScore < threshold`.
- Edge: score overflow, duplicate provider attestation, provider removal with existing attestations.

## Notes

- Off-chain proof generation service is a separate deployable; this spec covers the on-chain contract interface.
- ZK circuit design is non-trivial — may start with a simpler commit-reveal scheme for the prototype, then upgrade to full ZKP.
- Consider Semaphore, Worldcoin, or Anon Aadhaar circuits as references.
- Optional location hints used for issue discovery are intentionally out of scope here; they should not be treated as humanity proofs or silent governance rights.
