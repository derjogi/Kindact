---
status: in-progress
created: '2026-05-12'
tags: [governance, lens, jurisdictional, cross-cutting]
priority: high
derivation: new
depends_on:
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
related:
  - 044-cross-cell-validation-and-trust
---

# 043 — Jurisdictional Claims

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: gap noted in [extensibility-strategy §4](../../../implementation/extensibility-strategy.md#L218-L249) (scope-vector resolution); not yet a first-class concept anywhere.

## Overview

A **jurisdictional claim** is an overlay that applies *unconditionally* to any issue whose physical or topical scope falls within the claim's authority, regardless of which cell hosts the issue or how the issue is tagged. Jurisdictional claims are required to handle the Berlin housing scenario: Berlin specifies that housing projects must use consensus + neighbor agreement; an outsider in the global Housing cell creates an issue physically located in Berlin, and Berlin's rule must be enforced.

The current model partially addresses this via scope-vector resolution, but a bad-faith creator can mistag scope to evade the overlay. Jurisdictional claims close that gap.

This concept is required regardless of substrate (the gap exists in both the current and hybrid architectures). It is included in this spec set because the multi-cell architecture has cleaner enforcement.

## Design

### Claim entry

Jurisdictional claims live in the Global Registry as signed entries:

```json
{
  "claimId": "jc:berlin-housing-rules-v2",
  "issuer": {
    "did": "did:plc:berlin-cell-governance",
    "cellId": "kindact:berlin"
  },
  "scope": {
    "geographic": ["h3:88283082..."],
    "topicTags": ["#housing"],
    "scopeLevel": "city"
  },
  "overlay": {
    "decisionEngine": "consensus_with_neighbor_agreement",
    "eligibilityModifiers": ["resident_of_affected_district"],
    "verificationModifiers": ["municipal_review_required"]
  },
  "verificationTier": "geotagged_evidence_required",
  "lifecycle": {
    "effectiveAt": 1715000000,
    "supersedes": "jc:berlin-housing-rules-v1",
    "status": "active"
  }
}
```

Components:
- `issuer` MUST be a cell that holds recognized authority over the claimed scope. Recognition is granted via meta-governance ([013](../013-meta-governance/README.md)).
- `scope` is a canonical scope vector using H3 / S2 hierarchical location commitments.
- `overlay` is the rule package applied to in-scope issues.
- `verificationTier` is the required scope-proof tier from the [verifiable scope vectors](#verifiable-scope-vectors) below.

### Two overlay categories

A lens / cell can declare overlays as one of:

| Category | Application |
|---|---|
| **Default overlay** | Applies if the cell's selector matches and no contrary jurisdictional claim exists. |
| **Jurisdictional claim** | Applies *unconditionally* to any in-scope issue. Cells cannot opt out for in-scope issues. |

Jurisdictional claims always take precedence over default overlays. Conflicts between two jurisdictional claims (e.g., overlapping authorities) are resolved by precedence rule: most-specific-geographic-scope wins; ties broken by most-recent `effectiveAt`.

### Verifiable scope vectors

Without verifiable location claims, jurisdictional enforcement is gameable. Tiered verification:

| Tier | Required scope proof | Use case |
|---|---|---|
| `self_declared` | Issue creator asserts scope; no proof | Low-stakes issues, small reward, small impact |
| `geotagged_evidence` | At least one piece of evidence (photo, document) carries verifiable geotag matching scope | Medium-stakes issues |
| `oracle_attested` | Third-party attestation (oracle relay or external service) confirms scope | High-stakes issues, regulated domains |

The required tier per issue is set by the strictest applicable jurisdictional claim or by the cell's default. Validators reject issues whose scope-proof tier is below the required tier.

### Resolution flow at issue creation

```diagram
Issue X created in cell C with declared scope vector S.
  │
  ▼
Base DNA validator queries Global Registry for jurisdictional claims matching S.
  │
  ├─ no claims match: cell C's default overlays apply.
  │
  └─ claim(s) match:
        ├─ verify scope-proof tier >= claim's required tier; reject if below
        ├─ apply claim's overlay over cell C's default
        └─ record `appliedClaims: [claimId, ...]` in the issue's protocol binding
```

The protocol binding hash includes the applied claims, so two cells indexing the same issue compute the same binding hash. Divergence is detectable.

### Cross-cell challenge

Any peer aware of a jurisdictional claim can flag a binding as `binding-invalid` if:
- The claim should have applied but is missing from `appliedClaims`.
- The scope proof tier is below the claim's required tier.
- The applied overlay is not the current canonical overlay for the claim.

The flag enters the dispute pipeline ([012](../012-dispute-resolution/README.md)). If upheld, the binding is reset and the issue rolls back to `Draft`.

This distributed-challenge mechanism is the multi-cell advantage: an oblivious or hostile home cell cannot suppress claims that other cells' validators are watching.

### Authority recognition

A cell's authority to issue jurisdictional claims is granted via meta-governance:

| Authority kind | Recognition path |
|---|---|
| Geographic (city, region, country) | Application + community ratification + (optionally) recognition from the existing political authority for that geography |
| Topical (a discipline-defined practice standard) | Recognized professional body or standards organization petitions |
| Time-bounded (event-specific) | Event organizer with sufficient cell promotion |

Recognition is revocable via constitutional vote. Revoked claims become inactive but historical bindings remain valid for resolved issues.

## Plan

1. [ ] Define `jurisdictional_claim` entry type in Global Registry.
2. [ ] Implement Base DNA validation hook that consults claims at issue creation.
3. [ ] Implement scope-proof tier checking in Base DNA.
4. [ ] Define authority-recognition meta-governance procedure ([013](../013-meta-governance/README.md)).
5. [ ] Implement cross-cell `binding-invalid` flag flow into [012](../012-dispute-resolution/README.md).
6. [ ] Author seed claims for the Berlin Housing scenario as a worked example.
7. [ ] Document the precedence resolution algorithm with examples.

## Test

- [ ] An outsider in the global Housing cell creates an issue physically in Berlin: the Berlin claim applies; consensus + neighbor agreement engine activates; default approval-vote engine does not.
- [ ] Issue created with `self_declared` scope but a `geotagged_evidence`-required claim applies: rejected at creation.
- [ ] Two overlapping claims (Berlin + Germany): more-specific (Berlin) wins.
- [ ] Bad-faith creator tags `location: global` to evade Berlin: rejected because the geotagged evidence (or oracle attestation) doesn't match `global` scope.
- [ ] An issue's binding silently omits an applicable claim: a peer flags `binding-invalid`; dispute pipeline upholds; binding reset.

## Open questions

- **§8.4.11 Jurisdictional claims model** — adopt this design? what verification tier is default?
- **§8.4.12 Verifiable scope vectors** — implement the tiered model? per-stake configurability?
- **Authority granting** — how is the *first* recognition for a cell established? Bootstrap by founders, then meta-governance forever after?
- **Conflict between municipal and national authority** — does municipal always win because it's more specific, or does national have an opt-out for things like hate-speech laws?
- **Self-declared scope in low-stakes issues** is desirable for friction reasons but creates a small attack surface; is the dispute backstop sufficient?
- **Privacy** — geotagged evidence reveals issue location; some legitimate work (whistleblower, vulnerable communities) needs the option to obfuscate. How to provide tier-passing proof without full disclosure (zero-knowledge location proofs)?

## Notes

This concept is the explicit answer to the user's stated preference: **issues live in a single home cell**, and cross-jurisdictional enforcement is handled by jurisdictional claims rather than by multi-overlay composition across cells. It is structurally cleaner: cells own their issues; geographic / topical authorities own their rules; the binding resolver consults both at issue creation and the binding hash is the single canonical record.

The same concept should be backported to `implementation/extensibility-strategy.md` per [§9.5 of the exploration document](../../../implementation/holochain-architecture-exploration.md).
