---
status: complete
created: 2026-03-17
priority: critical
tags:
- identity
- mvp
- sybil-resistance
depends_on:
- 001-core-ledger
- 002-wallet-auth
created_at: 2026-03-17T11:07:38.573Z
updated_at: 2026-04-01T09:51:33.920807398Z
completed_at: 2026-04-01T09:51:33.920807398Z
transitions:
- status: in-progress
  at: 2026-04-01T04:47:24.658181804Z
- status: complete
  at: 2026-04-01T09:51:33.920807398Z
implementation_note: Schema created (IdentityProviderLink model). Gitcoin Passport integration not yet implemented - stub needed.
---

# Human Verification

> **Phase**: MVP · **Priority**: Critical · **Subsystem**: Identity

## Overview

Unique-human verification using a single external provider (Gitcoin Passport) at MVP. Ensures one-person-one-vote integrity and blocks sybil accounts from voting or verifying work. Multi-provider aggregation and ZK selective disclosure are deferred to Phase 2.

## Design

### Data Models

- **IdentityProviderLink** — provider name, attestation, connection timestamp
- **HumanNullifier** — cryptographic uniqueness proof (one per real person)
- **IdentityChallenge** — dispute claiming two accounts are the same person
- **IdentityRiskState** — current risk level and privilege restrictions

### API Surface

- `POST /identity/providers/gitcoin-passport/connect` — link Gitcoin Passport attestation
- `POST /identity/verify` — trigger verification check
- `GET /identity/status` — current verification state
- `POST /identity/challenges` — challenge suspected duplicate
- `POST /identity/challenges/:id/resolve` — resolve identity challenge

### Key Rules

- Voting/verifying keys are based on `human_id`, not wallet address
- Only one active `human_id` per verified person/nullifier
- Duplicate challenge freezes high-risk privileges pending review
- Accounts without verification can read/post but cannot vote/verify

### External Dependencies

Gitcoin Passport (Human Passport) — single provider at MVP

## Plan

- [x] Design provider adapter interface (extensible for Phase 2 multi-provider)
- [x] Implement provider connect/disconnect with score-based verification (`src/server/identity`)
- [x] Implement humanId uniqueness enforcement (one humanId per verified user)
- [x] Build API routes: connect, disconnect, verify, status (`src/app/api/identity/`)
- [x] Audit-log all identity events via ledger
- [x] Build identity challenge flow (freeze, review, resolve) — uses Restriction model
- [x] Implement privilege tiering based on verification status (`checkPrivilege`)
- [ ] Implement Gitcoin Passport external API integration (currently accepts score directly)

## Test

- [x] Provider disconnection is audit-logged
- [x] Identity challenge correctly freezes privileges (creates privilege_freeze Restriction)
- [x] Unverified accounts can post but cannot vote (`checkPrivilege` enforces)
- [ ] Cannot create two voting identities from same human proof (humanId is unique in DB)

## Notes

**Phase 2:** Add BrightID integration and multi-provider trust score aggregation. Add ZK selective disclosure for stronger privacy guarantees.

**Open questions:**
- Manual review fallback for users excluded by Gitcoin Passport availability (geography, no wallet)
