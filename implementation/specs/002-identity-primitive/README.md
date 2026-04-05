---
status: planned
created: '2026-04-03'
tags: [identity, skeleton, smart-contracts, zkp]
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

Initial providers:

| Bit | Provider | Score Weight |
|-----|----------|-------------|
| 0 | Gitcoin Passport | configurable |
| 1 | BrightID | configurable |

New providers are added via a **ProviderRegistry** (governance-gated). Each provider has an ID, a verifier contract address, and a score weight. `providerMask` records which providers have attested for a given wallet.

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

### Events

- `IdentityVerified(address indexed wallet, uint8 humanityScore, uint32 providerMask)`
- `ProviderAdded(uint8 indexed providerId, string name, address verifier)`
- `HumanityScoreUpdated(address indexed wallet, uint8 oldScore, uint8 newScore)`

### Extension Points

- New identity providers register via governance proposal.
- Humanity threshold adjustable via governance.
- Verifier contract upgradeable per provider (new proof systems).

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
