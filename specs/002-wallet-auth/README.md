---
status: planned
created: '2026-03-17'
tags:
  - identity
  - mvp
  - authentication
priority: critical
created_at: '2026-03-17T11:07:38.160Z'
depends_on:
  - 001-core-ledger
updated_at: '2026-03-17T11:08:16.768Z'
---

# Wallet Authentication

> **Phase**: MVP · **Priority**: Critical · **Subsystem**: Identity

## Overview

Wallet-first authentication with pseudonymous profiles, multi-wallet linking, signed session creation, and recovery methods. No legal identity fields in public profiles.

## Design

### Data Models

- **UserProfile** — pseudonymous display name, avatar, bio
- **WalletLink** — wallet address ↔ account binding with link/unlink timestamps
- **Session** — signed session token with expiry
- **RecoveryContact** — optional email/passkey for account recovery

### API Surface

- `POST /auth/nonce` — request signing challenge
- `POST /auth/verify` — submit signed nonce, receive session
- `POST /me/wallets` — link additional wallet
- `DELETE /me/wallets/:wallet` — unlink wallet (delayed if active disputes/claims)
- `GET /me` — current profile

### Key Rules

- SIWE-style nonce/signature authentication
- One account may link multiple wallets; one wallet → one account
- Wallet unlink delayed if account has active disputes, claims, or redemption requests

## Plan

- [ ] Implement SIWE nonce challenge/response flow
- [ ] Build UserProfile CRUD with pseudonymous fields only
- [ ] Implement multi-wallet linking with ownership verification
- [ ] Add wallet unlink with delay checks (disputes, claims, redemptions)
- [ ] Build session management with expiry and refresh

## Test

- [ ] Auth flow works end-to-end with wallet signature
- [ ] Cannot link a wallet already linked to another account
- [ ] Cannot unlink wallet during active disputes
- [ ] Public profile contains no legal identity fields

## Notes

**Open questions:**
- Allow optional email/passkey recovery or keep pure wallet auth?
- Whether public handles are globally unique or only display names
