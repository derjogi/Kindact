---
status: planned
created: 2026-04-07
priority: medium
tags:
- frontend
- ux
- identity
- profile
depends_on:
- 015-frontend
related:
- 002-identity-primitive
created_at: 2026-04-07T23:16:33.675201325Z
updated_at: 2026-04-07T23:16:33.675255593Z
---

# 025 — UI: Profile & Identity

## Overview

User profile management including identity verification, privacy controls, contribution history, and delegation settings.

## Features

### Wallet & Identity
- **Wallet info** — connected address, current network
- **Identity verification status** — integration status with BrightID, Gitcoin Passport (Human Passport), government ID, or similar; step-by-step verification flow
- **Privacy indicator** — show that on-chain interactions use pseudonymous public keys; ZKP credential status ("you've proven you're a unique human without revealing your identity")

### Contribution History
- **Activity log** — all past work, votes cast, deliberation participation, issues created
- **Reputation signal** — accumulated $CC with provenance showing how tokens were earned (minted for work vs. purchased vs. received)
- **Impact summary** — aggregate view of verified impact across all contributions

### Settings
- **Delegation management** — configure per-topic vote delegations; see delegates and delegators
- **Location hint settings** — optional coarse location sharing for lens auto-subscription; granularity control
- **Lens subscriptions** — manage followed / muted lenses from profile
- **Notification preferences** — configure which events trigger notifications

## Design Notes

- Verification flow should feel like onboarding, not a barrier — guide users through available identity providers
- Privacy explanation should be non-technical: "Others see your contributions, not your identity"
- Contribution history could use a GitHub-style activity heatmap

## Dependencies

- Identity primitive (002)
- $CC token core (003)
