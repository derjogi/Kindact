---
status: planned
created: 2026-04-07
priority: high
derivation: ported
ports_from: 024-015g-ui-token-wallet
tags:
- frontend
- ux
- token
- wallet
depends_on:
- 015-frontend
related:
- 003-cc-token-core
- 010-reserve-exchange
- 011-hypercerts-bridge
- 035-governance-data-visualization
- 037-motion-and-feedback
- 039-empty-loading-error-states
created_at: 2026-04-07T23:16:33.598630293Z
updated_at: 2026-04-07T23:16:33.598709341Z
---

# 024 — UI: Token & Wallet

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [024-015g-ui-token-wallet](../../../implementation/specs/024-015g-ui-token-wallet/README.md)

## Hybrid notes

UI port. Wallet shows local-mutual-credit balance per cell + canonical $CC balance + reconciliation prompt; redemption queue status per [046](../046-reserve-operation-queue/README.md).


## Overview

Wallet connection, token balance management, demurrage visualization, exchange interface, and Hypercert views.

## Features

### Authentication
- **Wallet connection** — Sign-In with Ethereum (EIP-4361); single auth entry point; no email/password
- **Network switching** — support Optimism / Base L2; clear indicator of current network

### Token Balance
- **$CC balance** — real-time balance with demurrage decay visualization
- **Demurrage tracker** — show base demurrage rate (e.g. 1% / month), projected balance over time as a decay curve chart
- **Transaction history** — full ledger: earned (minting), spent, burned (fees, Hypercert purchases), fee-paid

### Exchange
- **Reserve exchange interface** — swap $CC ↔ fiat through the reserve
- **Exchange rate display** — current rate reflecting fiat reserve / $CC circulation ratio
- **Buy / sell $CC** — clear flow with rate preview and slippage info

### Impact Credentials
- **Hypercert portfolio view** — platform-level display of all Hypercerts generated from completed work
- **Hypercert detail** — specific work, who did it, when, verified results

### Access & Fees
- **Access fee indicator** — show which features require $CC (delegation, AI summaries, detailed statistics)
- **Fee schedule** — transparent display of transaction fees and access costs

### Edge Cases
- **Negative balance display** — for clawback scenarios; clear explanation of why and how to resolve

## Design Notes

- Demurrage visualization is the hardest UX challenge here — must make "your tokens lose value" feel natural and motivating, not punitive
- Exchange interface should clearly separate reserve-backed floor price from any future open market price
- Hypercert view is read-only for users; Hypercerts are held by the platform

## Dependencies

- $CC token core (003)
- Reserve exchange (010)
- Hypercerts bridge (011)
