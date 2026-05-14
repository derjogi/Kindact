---
status: planned
created: 2026-05-01
priority: high
tags:
- frontend
- design
- ux
- navigation
depends_on:
- '015'
related:
- 018-015a-ui-dashboard
- 027-015j-ui-meta-governance
- 026-015i-ui-lens-config
- 030-extensibility-foundation
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 034 — Information Architecture & Navigation

## Overview

Kindact has many surfaces (dashboard, issue detail, voting, implementation, disputes, wallet, profile, lens config, meta-governance). Without a coherent IA, users get lost between governance phases and module surfaces. This spec defines the **navigation model, URL structure, and progressive-disclosure pattern** that knits the platform together.

## Design

### Mental Model

Three orthogonal axes the user always navigates along:

1. **Subject** — what am I looking at? (issue, lens, person, my own state)
2. **Phase** — at what stage of the governance loop? (draft → deliberation → vote → implementation → verified → disputed)
3. **Lens** — through whose configuration am I viewing it?

The IA must surface all three at every depth without overwhelming.

### Top-Level Navigation

A persistent left rail (desktop) / bottom bar (mobile) with these primary destinations:

- **Home** — personalized dashboard ([015a](../018-015a-ui-dashboard/README.md))
- **Discover** — issue feed, lens browser, search
- **Work** — claimable + active work packages ([015e](../022-015e-ui-implementation/README.md))
- **Wallet** — $CC balance, demurrage, history ([015g](../024-015g-ui-token-wallet/README.md))
- **Profile** — me ([015h](../025-015h-ui-profile/README.md))
- **Meta** — meta-governance + lens config ([015j](../027-015j-ui-meta-governance/README.md), [015i](../026-015i-ui-lens-config/README.md))

The persistent rail also carries: lens switcher, notifications bell, wallet status, theme toggle.

### URL Structure

Stable, shareable, lens-aware:

- `/` — dashboard
- `/i/:issueId` — issue detail (canonical, lens-agnostic)
- `/i/:issueId/deliberate` — deliberation tab
- `/i/:issueId/vote` — voting tab (eligibility gate handled inside)
- `/i/:issueId/implement` — implementation tab
- `/i/:issueId/disputes` — disputes tab
- `/l/:lensSlug` — lens detail / browse-as-lens
- `/u/:didOrAddr` — public profile
- `/me` — current user
- `/me/wallet`, `/me/delegations`, `/me/work`, `/me/notifications`
- `/discover`, `/discover/lenses`, `/discover/search?q=…`
- `/meta` — meta-governance dashboard
- `/meta/modules` — module catalog

Lens override via query param: `?lens=<slug>` previews the page through a different lens without committing the user's default subscription.

### Issue Detail — Phase-Aware Workspace

The issue detail page is the densest surface. Design rules:

- **Always-visible header**: title, scope, phase badge, baseline metrics summary, eligibility gate state.
- **Tab strip** indexed by governance phase: `Overview · Deliberate · Vote · Implement · Disputes · History`. Phases the issue hasn't reached yet are visible but disabled with a tooltip ("opens after deliberation closes").
- **Active phase auto-selected** on first load.
- **Module slots** within each tab driven by the issue's protocol binding ([030-extensibility-foundation](../030-extensibility-foundation/README.md)) — the lens never suppresses a bound module.
- **Right-rail context**: AI summary, participation metrics, related issues, lens overlay inspector.
- **Sticky phase timeline** at the top so user always knows what phase they're in and what's next.

### Progressive Disclosure

Three-tier rule, applied consistently:

1. **Card / row** — title, phase, scope, top metric, single action. (Feeds, search results.)
2. **Overview** — full title, summary, phase timeline, key metrics, primary CTA. (Issue detail Overview tab.)
3. **Workspace** — full module surface (deliberation tree, voting tally, evidence gallery, etc.).

Module specs decide which tier they own; primitives in the component library enforce the visual contract.

### Search & Filter

- Global search in the top bar (cmd-K). Scopes: issues, lenses, people, tags, transactions.
- Filter pills (saved as URL query) for: phase, scope (local/national/global), lens, tag, time range.
- AI duplicate detection surfaces inline as the user types a new issue title (links into [015b](../019-015b-ui-issue-creation/README.md)).

### Notifications

- Unified inbox at `/me/notifications` and a popover from the top bar.
- Categories: `governance` (new issues, vote results), `work` (claims, verifications), `wallet` (rewards, demurrage milestones), `disputes`, `delegation`, `lens` (lens updates).
- Per-category mute + digest preferences.

### Cross-References & Backlinks

Every issue, work package, and dispute exposes "referenced by" links so users can trace decisions backwards (a verified work item links to its originating issue, votes link to delegations, disputes link to clawbacks).

## Plan

- [ ] Define and document the URL map as a TypeScript constant (`routes.ts`)
- [ ] Implement persistent rail / mobile bottom bar with active-state semantics
- [ ] Implement lens switcher + `?lens=` preview
- [ ] Implement phase-aware issue tab strip with disabled-future-phase semantics
- [ ] Implement cmd-K global search shell (results wired in 015a + Discover)
- [ ] Implement breadcrumbs derived from route metadata
- [ ] Implement notifications inbox shell with category filters
- [ ] Wire backlink resolver (issue → work → dispute graph)

## Test

- [ ] Every primary destination reachable in ≤ 2 clicks from any other
- [ ] Phase tab strip never hides a phase the issue is currently in
- [ ] `?lens=` preview never mutates the user's stored subscriptions
- [ ] Direct-link to `/i/:id/vote` while ineligible shows the gate, not a 404
- [ ] Browser back/forward restores tab + filter state losslessly
- [ ] Mobile bottom bar reachable with one-handed thumb operation (touch-target ≥ 44 px)

## Notes

- "Phase as primary axis" is a deliberate departure from generic forum IA. Kindact's value is governance state clarity; the IA must reinforce it.
- Lens previewing via query param (rather than full lens switch) lets users explore without losing their home context.
- Open question: should `/i/:id` use a slug-with-id pattern (`/i/:id-:slug`) for shareable readability? Defer.
