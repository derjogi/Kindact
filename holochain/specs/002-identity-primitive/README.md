---
status: planned
created: '2026-05-12'
tags: [identity, smart-contracts, holochain, zkp, bridge]
priority: critical
derivation: changed
counterpart: 002-identity-primitive
depends_on:
  - 001-diamond-module-registry
  - 040-bridge-specification
  - 041-base-dna-specification
---

# 002 — Identity Primitive

> **Status**: Exploratory · **Derivation**: changed · **Counterpart in implementation/**: [002-identity-primitive](../../../implementation/specs/002-identity-primitive/README.md)

## Overview

On-chain identity and sybil resistance via humanity providers (Gitcoin Passport, BrightID, Proof of Humanity, Anon Aadhaar, World ID) — **unchanged** from the implementation/ counterpart. The hybrid adds a Holochain agent-key bridging layer so cell members' authoring agents are tied back to the canonical EVM identity record.

Read the [implementation/ counterpart](../../../implementation/specs/002-identity-primitive/README.md) for the IdentityRegistry facet, humanity providers, score weighting, and recovery model.

## What changes

### Cross-substrate identity binding

Each Kindact user has up to three identity layers:

| Layer | Substrate | Purpose |
|---|---|---|
| **EVM wallet** | EVM | Signs on-chain transactions; carries humanity score |
| **AT Proto DID** (optional) | AT Proto | Owns Hypercerts profile and outward-facing impact records |
| **Holochain agent key(s)** | Holochain | Authors entries inside cells; one or more per user |

The IdentityRegistry maps these together:

```solidity
struct IdentityRecord {
    address wallet;
    uint8   humanityScore;
    uint64  verifiedAt;
    uint32  providerMask;
    string  atProtoDid;          // optional
    bytes32[] holochainAgentKeys; // multiple agent keys per user allowed
}
```

### Linking flow

1. User onboards with EVM wallet + at least one humanity provider attestation.
2. User generates one or more Holochain agent keys (one per device is typical).
3. For each agent key:
   - User signs the agent key's public hash from their EVM wallet (EIP-191).
   - User submits `linkHolochainAgent(agentKey, signature)` on `IdentityFacet`.
   - On-chain verification adds the agent key to the identity record.
4. The bridge mirrors the linkage into the Holochain Global Registry.
5. Base DNA validators in any cell verify that the authoring agent key resolves to a humanity-verified identity by checking the Registry mirror.

### Holochain validation rule

Base DNA includes a `kindact_base_identity` zome that:
- Caches the latest humanity-score snapshot per agent key from the Registry mirror.
- Rejects entries from agent keys not linked to a humanity-verified wallet (with a small onboarding allowance for not-yet-linked agents).
- Re-validates periodically: stale humanity attestations (older than the configured threshold) are flagged.

### Multiple agent keys per identity

A user can have several agent keys (one per device) tied to the same EVM identity. This supports:
- Mobile + desktop usage from the same identity.
- Recovery: lose phone, revoke that agent key, generate a new one, link from EVM, continue.
- Privacy partitioning: separate agent keys per cell or per topic without separate identities.

Revocation is on-chain: `revokeHolochainAgent(agentKey)` removes the linkage. Cell validators reject subsequent entries from the revoked key once the mirror updates.

### AT Proto DID linkage

AT Proto DID linkage is **optional** in the hybrid (where in implementation/ it is necessary for deliberation content). It is required only if the user wants to:
- Hold a Hypercerts profile and receive credentials directly (rather than through the platform treasury).
- Cross-publish to AT-Proto-using ecosystems (Bluesky, etc.).

For pure-Holochain users, AT Proto DID is null and Hypercerts are held by the platform treasury on their behalf with redemption rights.

### Identity recovery

Recovery flow inherits from implementation/ (multi-provider re-attestation). The hybrid adds: agent-key revocation lets a user replace compromised keys without redoing humanity attestation, as long as the EVM wallet is still controlled.

If the EVM wallet itself is compromised:
- Standard EVM recovery applies (multi-sig, social recovery wallet).
- Until recovered, all agent keys linked to the wallet are at risk.

A future spec may add Holochain-side recovery via cell-attested re-link, but this is out of scope for v1.

## Plan

1. [ ] Inherit implementation/ Plan items.
2. [ ] Implement `linkHolochainAgent` and `revokeHolochainAgent` on `IdentityFacet`.
3. [ ] Implement Registry mirror entry for identity linkage.
4. [ ] Implement `kindact_base_identity` zome with cached humanity-score and validation rules.
5. [ ] Define onboarding allowance for not-yet-linked agents (magnitude, scope, anti-Sybil).
6. [ ] Document the multi-agent-key UX flow.

## Test

- [ ] Inherit implementation/ Test items.
- [ ] Linking: agent-key link signature verified on-chain; Registry mirror updated.
- [ ] Cell entry from unlinked agent: rejected (beyond onboarding allowance).
- [ ] Cell entry from agent linked to a wallet whose humanity score recently dropped below threshold: rejected after Registry mirror tick.
- [ ] Revocation: revoked agent key cannot author entries after mirror tick; existing entries remain valid.
- [ ] Multiple agent keys: user authors from desktop + mobile; both attribute to same canonical identity.

## Open questions

- **Onboarding allowance** — magnitude (e.g., 5 entries) and scope (which slot categories); this is the primary anti-Sybil knob.
- **Privacy of multi-agent-key linkage** — currently Registry mirror is public; do we want privacy-preserving linkage where the link is provable but not publicly enumerated?
- **AT Proto DID requirement for outward-facing roles** — should community leaders (cell stewards, bridge signers) require a public AT Proto DID for accountability?
- **Cell-locality of identity** — a user joining a sensitive cell may want a cell-specific agent key; how is the privacy-vs-accountability balance struck?
- **Recovery via cell attestation** — future spec; what threshold of cell members can re-link a wallet on a user's behalf in case of EVM wallet loss?

## Notes

The cross-substrate identity binding is the cleanest demonstration of the hybrid's structure: humanity verification is canonical on EVM (because that's where the providers attest), agent authoring is on Holochain (because that's where deliberation lives), and the bridge keeps the linkage current. The user owns their EVM wallet; their Holochain agent keys are lighter-weight identifiers tied back.
