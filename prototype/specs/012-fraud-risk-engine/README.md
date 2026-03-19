---
status: planned
implementation_note: 'Schema created (RiskSignal, Restriction, Appeal). Service and API routes not yet created.'
created: '2026-03-17'
tags:
  - fraud-prevention
  - mvp
  - security
priority: critical
created_at: '2026-03-17T11:07:53.632Z'
depends_on:
  - 003-human-verification
  - 004-issue-intake
  - 005-deliberation-workspace
  - 010-verification-disputes
  - 011-cc-ledger
updated_at: '2026-03-17T11:08:34.657Z'
related:
  - 010-verification-disputes
---

# Fraud & Risk Engine

> **Phase**: MVP · **Priority**: Critical · **Subsystem**: Security

## Overview

Rate-based abuse prevention, basic sybil signals, manual moderator tools, and a structured appeal process. Actions are reversible restrictions with appeal paths — never irreversible automated punishment.

At MVP: protection is based on rate limits and simple threshold signals. Graph-based collusion cluster detection, wash trading analysis, and delegation capture detection are deferred to Phase 2.

## Design

### Covered Abuse Vectors at MVP

| Signal | Abuse Case |
|---|---|
| Issue creation rate | Issue flooding |
| Report submission rate | Spam implementation reports |
| Failed verification ratio | Verification fraud |
| Reward/voter ratio anomaly | Reward amount gaming |
| Sybil identity signal | Multiple identities per person |

### Data Models

- **RiskSignal** — individual risk indicator with confidence score and trigger event
- **Restriction** — automated action with reason code + expiry + appeal path
- **Appeal** — user appeal of automated restriction
- **CaseNote** — moderator investigation notes

### API Surface

- `GET /risk/entities/:id` — risk signals and active restrictions for entity (moderator only)
- `POST /risk/cases` — create investigation case
- `POST /risk/restrictions` — apply restriction (automated or moderator-initiated)
- `POST /risk/restrictions/:id/lift` — lift restriction
- `POST /appeals` — submit appeal

### Key Rules

- Automated actions limited to REVERSIBLE restrictions: throttles, enhanced verification review requirement, privilege freeze, payout delay
- Every automated action logged with reason codes and appeal path visible to user
- No automated permanent bans — only human-reviewed moderator escalation
- Moderators can see risk signals; risk scores are not public to regular users

## Plan

- [ ] Design risk signal taxonomy (rate-based signals for MVP)
- [ ] Implement issue creation rate limiting with escalating cooldowns
- [ ] Implement report submission rate limiting
- [ ] Implement failed verification ratio signal
- [ ] Implement reward/voter ratio anomaly detection
- [ ] Build restriction engine with expiry and auto-lift
- [ ] Implement appeal workflow
- [ ] Build moderator case management interface

## Test

- [ ] Issue flooding triggers rate-limit restriction with appeal path
- [ ] Restrictions auto-expire as configured
- [ ] Appeals create review cases with moderator visibility
- [ ] All automated actions are logged with reason codes
- [ ] Moderator can manually lift restrictions

## Notes

**Phase 2:** Add graph-based cluster detection for mutual-verification fraud rings and collusion. Add circular transfer / wash trading detection. Add delegation concentration monitoring. Add multi-persona deliberation detection.

**Open questions:**
- Thresholds for auto-action vs requiring moderator review
- Whether risk signals are partially visible to users (e.g., "your account is under review") or fully opaque
