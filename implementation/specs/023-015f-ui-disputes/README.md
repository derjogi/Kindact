---
status: planned
created: 2026-04-07
priority: medium
tags:
- frontend
- ux
- disputes
depends_on:
- 015-frontend
related:
- 012-dispute-resolution
created_at: 2026-04-07T23:16:33.511557878Z
updated_at: 2026-04-07T23:16:33.511740082Z
---

# 023 — UI: Dispute Resolution

## Overview

Dispute creation, tracking, community adjudication, and outcome enforcement interfaces.

## Features

- **Challenge / flag button** — flag submitted proof with a small $CC deposit; accessible from any implementation report
- **Dispute status panel** — show that payments are halted while unresolved; display resolution timeline
- **Community adjudication** — voting interface for fraud determination (reuses voting components)
- **Threshold display** — clearly show required threshold: 2% of original voters (minimum 3 people), 80% agreement to confirm fraud
- **Gradual restriction loosening** — visual timeline showing how restrictions loosen if no verdict emerges
- **Clawback notification** — alert and explanation when fraud triggers clawback; display negative balance state
- **Rate-limited accusation tracker** — show exponential cooldown periods after wrong accusations; display remaining cooldown
- **Retroactive ban indicator** — platform restriction status for confirmed fraud; visible on profile
- **Dispute history** — record of all disputes on an issue, with outcomes

## Design Notes

- Challenge action should require confirmation and clearly show the deposit cost
- Dispute panel should be prominent on affected issues but not dominate unaffected ones
- Cooldown visualization should discourage frivolous accusations without hiding the mechanism

## Dependencies

- Dispute resolution contract (012)
- Voting components (shared with 021)
