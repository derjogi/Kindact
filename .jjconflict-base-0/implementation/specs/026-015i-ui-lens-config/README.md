---
status: planned
created: 2026-04-07
priority: medium
tags:
- frontend
- ux
- lens
- community
depends_on:
- 015-frontend
related:
- 030-extensibility-foundation
- 032-design-system-foundations
- 034-information-architecture
created_at: 2026-04-07T23:16:33.754795577Z
updated_at: 2026-04-07T23:16:33.754902955Z
---

# 026 — UI: Lens & Community Configuration

## Overview

Lens discovery, creation, and configuration — how communities customize their experience within the global platform.

## Features

### Discovery
- **Lens browser** — discover available lenses by geography (map view), topic, interest
- **Lens detail page** — description, active modules, member count, recent activity
- **Join / follow / mute** — manage lens subscriptions; clear distinction between auto-subscribed (location) and manually followed

### Lens Creation
- **Selector definition** — canonical location refs (map picker), topic tags, scope level, interest keywords
- **Subscription mode** — auto-location, opt-in, or hybrid
- **Governance rule selection** — how the lens's config can be changed (via platform's own issue / vote process)

### Module Configuration
- **Module enable / disable toggles** — configure which optional modules are active for the lens, with live previews
- **Module preset bundles** — one-click configurations: "Neighborhood governance pack" (consensus + delegation + peer verification), "Research community pack" (expert panels + prediction markets + enhanced metrics)
- **Compatibility matrix** — show which modules can coexist and which are mutually exclusive
- **Maturity badges** — experimental / beta / stable / core labels on each module

### Presentation
- **UI theme / branding** — community-specific colors, logo, visual identity
- **Dashboard layout presets** — configure default card arrangements and prominence
- **Ranking / sorting defaults** — configure how issues are ordered by default for lens members

### Inspection
- **Active overlay inspector** — see which modules are active on a specific issue and which lens contributed each binding
- **Precedence explanation** — understand why a particular module was selected (which lens won)

## Design Notes

- Map-based lens browser for geographic lenses; tag cloud or category tree for topic lenses
- Module toggles should show a preview of what changes (before committing)
- Overlay inspector is a developer/power-user feature — accessible but not prominent

## Dependencies

- Extensibility foundation (016)
- Module catalog (001 on-chain, 014 backend)
