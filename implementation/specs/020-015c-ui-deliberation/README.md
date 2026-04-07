---
status: planned
created: 2026-04-07
priority: high
tags:
- frontend
- ux
- deliberation
depends_on:
- 015-frontend
related:
- 006-deliberation-service
- 017-core-metrics-framework
created_at: 2026-04-07T23:16:33.294274586Z
updated_at: 2026-04-07T23:16:33.294324885Z
---

# 020 — UI: Deliberation & Discussion

## Overview

The most complex screen. Full deliberation workspace driven by the issue's protocol binding, with multiple discussion surfaces, anonymization, and live AI summarization.

## Features

### Core Discussion
- **Threaded comments** — traditional discussion with replies
- **Anonymized author display** — no visible identity during deliberation; clear visual indicator of anonymous mode (e.g. colored badge, "Anonymous participant #7")
- **Randomized comment ordering** — mix of randomness, outlier detection, upvotes; never pure popularity sorting
- **Identity reveal** — unmask authors only after voting concludes (per governance rules)

### Optional Deliberation Modules (plugin tabs)
- **Structured pro/con arguments** (Kialo-style) — argument tree with supporting / opposing branches
- **Opinion clustering** (Pol.is-style) — visual map of opinion groups and consensus areas
- **Consensus iteration rounds** — objection / response cycles for consensus-seeking decision mode

### Collaborative Proposal
- **Wiki-style editable proposal body** — Wikipedia-style document that evolves with discussion
- **AI content guard for wiki edits** — verify edits don't inappropriately alter existing content; flag significant changes for community review
- **Edit history / diff view** — track all changes to the proposal

### AI Assistance
- **Continuous summarization** — live-updating summary panel: main points, key arguments per side, consensus / disagreement areas, outstanding questions
- **Translation services** — real-time translation for cross-language participation

### Metrics & Predictions
- **Metrics panel** — per-issue impact estimates across social and planetary boundaries, economic cost, time, uncertainty
- **Confidence levels** on all estimates with visual indicators
- **Comparison view** — side-by-side when multiple approaches are proposed
- **Source labels** — AI estimation, prediction market, user / expert input clearly marked
- **User flagging** — mark estimates as disputed or unsupported
- **Prediction market widget** — community forecasting on likely outcomes (signal module)

## Design Notes

- Module tabs limited to 3 visible by default; "advanced" toggle for more (UI complexity budget)
- Fallback renderers mandatory — users whose lens doesn't include a module still see read-only summaries
- Metrics and AI summary should be visible as persistent sidebar panels, not hidden tabs
- Must follow issue's protocol binding, not viewer's lens, for all active modules

## Dependencies

- Deliberation service (006)
- Core metrics framework (017)
- Content anchoring (004)
- Extensibility foundation — plugin slots (016)
