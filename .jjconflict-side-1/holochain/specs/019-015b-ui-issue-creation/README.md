---
status: planned
created: 2026-04-07
priority: high
derivation: ported
ports_from: 019-015b-ui-issue-creation
tags:
- frontend
- ux
- issues
depends_on:
- 015-frontend
related:
- 005-issue-lifecycle
- 031-core-metrics-framework
created_at: 2026-04-07T23:16:33.232787938Z
updated_at: 2026-04-07T23:16:33.232839469Z
---

# 019 — UI: Issue Creation

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [019-015b-ui-issue-creation](../../../implementation/specs/019-015b-ui-issue-creation/README.md)

## Hybrid notes

UI port. Issue creation writes a DHT entry to the chosen home cell per [005](../005-issue-lifecycle/README.md). Cell selection UI added; jurisdictional-claim preview surfaces applicable claims per [043](../043-jurisdictional-claims/README.md).


## Overview

Issue creation flow with AI assistance, duplicate detection, and initial metrics assignment.

## Features

- **Free-form issue creation** — title, description, scope (local / national / global), canonical location refs from shared geographic taxonomy, topic tags
- **AI-assisted drafting** — improvement suggestions, refinement prompts for clarity and completeness
- **AI duplicate / similar issue detection** — surface existing related issues before submission; prompt user to join existing discussion or differentiate
- **AI-suggested categorization** — auto-suggest tags and topics based on content
- **Reward amount proposal** — creator proposes initial $CC reward, with AI suggestion based on comparable past tasks (ValueFlows resource-flow data from similar completed issues)
- **Initial metrics assignment** — attach impact estimates across core dimensions (social, planetary, economic cost, time, uncertainty); optional community dimension packs

## Design Notes

- Step-by-step wizard or progressive form (not a wall of fields)
- Duplicate detection happens live as the user types — similar to GitHub issue search
- Metrics assignment should default to AI-estimated values that the user confirms or adjusts
- Location picker backed by canonical geographic taxonomy (shared with lenses and user profiles)

## Dependencies

- Issue lifecycle contract (005)
- Core metrics framework (017)
- AI assistive modules (Layer C)
- Content anchoring (004)
