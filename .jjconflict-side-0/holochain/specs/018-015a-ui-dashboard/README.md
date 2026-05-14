---
status: planned
created: 2026-04-07
priority: high
derivation: ported
ports_from: 018-015a-ui-dashboard
tags:
- frontend
- ux
- dashboard
depends_on:
- 015-frontend
related:
- 030-extensibility-foundation
- 034-information-architecture
- 035-governance-data-visualization
- 039-empty-loading-error-states
created_at: 2026-04-07T23:16:33.158820722Z
updated_at: 2026-04-07T23:22:02.202074861Z
---

# 018 — UI: Dashboard & Discovery

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [018-015a-ui-dashboard](../../../implementation/specs/018-015a-ui-dashboard/README.md)

## Hybrid notes

UI port. Data layer talks to the conductor over WebSocket per [015](../015-frontend/README.md) instead of an AppView REST API. Anchor subscriptions per [042](../042-anchor-and-subscription-model/README.md) drive feed personalization.


## Overview

The main landing screen after login. Personalized feed, lens-based discovery, and token balance overview.

## Features

- **Personalized issue feed** — issues filtered by user's lens subscriptions (location, topic, interest), respecting ranking/sorting defaults from active lenses
- **Lens-based discovery** — browse, follow, mute community lenses; auto-subscribe suggestions based on optional location hint
- **$CC balance widget** — current balance with demurrage decay visualization ("use it or lose it" countdown showing projected value over time)
- **Notification center** — new issues, vote results, implementation updates, dispute alerts, delegation activity
- **Community activity stream** — recent actions across subscribed lenses
- **Global search** — full-text and tag-based search with AI duplicate detection to surface existing issues before creating new ones
- **Quick actions** — create issue, browse lenses, view profile shortcuts

## Design Notes

- Progressive disclosure: summary cards expand into full issue detail
- Phase badges on every issue card (deliberation / voting / implementation / complete)
- Demurrage visualization must make the economic model intuitive — show decay curve, not just a number
- Dashboard layout is user-customizable via presentation modules (Layer D)

## Dependencies

- Backend issue feed API (014)
- Lens resolution engine (016)
- $CC balance query (003)
