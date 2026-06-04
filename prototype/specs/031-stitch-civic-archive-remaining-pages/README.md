---
status: complete
created: 2026-05-18
priority: medium
tags:
- frontend
- design-system
- visual
- stitch
depends_on:
- '030'
created_at: 2026-05-18T11:03:33.842321805Z
updated_at: 2026-05-19T22:08:30.704408052Z
completed_at: 2026-05-19T22:08:30.704408052Z
transitions:
- status: in-progress
  at: 2026-05-19T21:55:59.212612362Z
- status: complete
  at: 2026-05-19T22:08:30.704408052Z
---

# Stitch Civic Archive — Remaining Pages & Components

> Follow-up to [030 Stitch "Civic Archive" Visual Refresh](../030-stitch-civic-archive-visual-refresh/README.md). The token system, fonts, glass top bar, side nav, issue feed, issue detail, vote bar, comment thread, source panel, AI summary, eligibility modal, and hover toolbar landed in 030. This spec sweeps the remaining pages and secondary components into the Civic Archive palette and addresses brief-mentioned screens that are not yet built.

## Overview

After 030, residual `border-stone-*`, `bg-stone-*`, `text-stone-*`, `emerald-*`, `rose-*`, `amber-*`, `violet-*`, and `bg-blue-*` usages still live on the secondary pages and some auxiliary components. Visually they read as legacy stone-gray Tailwind defaults — out of step with the warm paper palette of the core flow. Additionally, several screens called out in the Stitch design brief (`prototype/stitch-design/stitch_guided_design_creation/stitch_ui_design_brief.md`) have no implementation yet and should be born into the new design system rather than retrofit later.

## Design

Reuse the tokens, fonts, and utility classes already defined in [`globals.css`](../../src/app/globals.css) and the patterns established in `Layout.tsx`, `IssueCard.tsx`, `VoteBar.tsx`, `CommentThread.tsx`, `SourcePanel.tsx`, `SummaryWithRefs.tsx`, `EligibilityModal.tsx`, and `HoverToolbar.tsx` (all updated in 030). No new tokens are expected.

### Visual substitutions (mechanical sweep)

| Old | New |
|---|---|
| `border-stone-200`, `divide-stone-*`, `divide-y` for sectioning | drop borders, use tonal layering (`bg-surface-container-low` over `bg-surface`) |
| `bg-white` | `bg-surface-container-lowest` (often with `card-lift` for separation) |
| `text-stone-{500,600,700,800,900}` | `text-on-surface-variant` / `text-on-surface` |
| `bg-stone-{50,100,800}`, `hover:bg-stone-*` | `bg-surface-container-low`, `hover:bg-surface-container` |
| `bg-emerald-*` / `text-emerald-*` | `bg-primary-container` / `text-status-deliberating` |
| `bg-rose-*` / `text-rose-*` | `bg-tertiary-container` / `text-status-implementing` |
| `bg-amber-*` / `text-amber-*` | `text-status-implementing` |
| `bg-violet-*` / `text-violet-*` | `bg-tertiary-container` / `text-tertiary` |
| `bg-blue-*` | `bg-status-voting` (status dots only) |
| Old `<a>`/button submit CTAs | `.btn-primary` |
| Old `<input>` styles | `.input-line` or filled `bg-surface-container-lowest` + `card-lift` |

## Plan

### Pages still on old palette

- [x] [`/cells`](../../src/app/cells/page.tsx)
- [x] [`/cells/[id]`](../../src/app/cells/[id]/page.tsx)
- [x] [`/cells/new`](../../src/app/cells/new/page.tsx)
- [x] [`/cells/settings`](../../src/app/cells/settings/page.tsx)
- [x] [`/anchors`](../../src/app/anchors/page.tsx)
- [x] [`/anchors/[id]`](../../src/app/anchors/[id]/page.tsx)
- [x] [`/activity`](../../src/app/activity/page.tsx)
- [x] [`/vote`](../../src/app/vote/page.tsx)
- [x] [`/issues/new`](../../src/app/issues/new/page.tsx)

### Secondary components still on old palette

- [x] [`CollapsibleDescription`](../../src/components/CollapsibleDescription.tsx)
- [x] [`ThreadList`](../../src/components/ThreadList.tsx)
- [x] [`DiscussionSearch`](../../src/components/DiscussionSearch.tsx)
- [x] [`CellBadge`](../../src/components/CellBadge.tsx)
- [x] [`AnchorPill`](../../src/components/AnchorPill.tsx)
- [x] [`CellContextStrip`](../../src/components/CellContextStrip.tsx)
- [x] [`RelatedAcrossCells`](../../src/components/RelatedAcrossCells.tsx)
- [x] [`JurisdictionalClaimsPanel`](../../src/components/JurisdictionalClaimsPanel.tsx)
- [x] [`GuestContributorModal`](../../src/components/GuestContributorModal.tsx)
- [x] [`BridgeToastContainer`](../../src/components/BridgeToastContainer.tsx)
- [x] [`OfflineBanner`](../../src/components/OfflineBanner.tsx)
- [x] [`RuntimeIndicator`](../../src/components/RuntimeIndicator.tsx)
- [x] [`WalletKeySigningModal`](../../src/components/WalletKeySigningModal.tsx)

### Brief-mentioned screens not yet built

- [x] **Onboarding** (Screen 1) — first-visit 3–4 step walkthrough
- [x] **Delegation Management** (Screen 7) — per-topic delegation list with revoke/assign
- [x] **Implementation & Verification** (Screen 8) — work packages on adopted issues, report submission form, verifier dashboard
- [x] **Reward & Impact / Hypercert card** (Screen 9) — $CC mint event + impact credential

All new screens born directly into the Civic Archive design system (no retrofit).

## Test

- [x] `grep -rE 'border-stone|bg-stone-|text-stone-|emerald-|rose-|amber-|violet-|bg-blue-' src/` returns no matches in `src/app/**` or `src/components/**`.
- [x] No `<a>` is a descendant of another `<a>` (regression from issue card refactor).
- [x] Each page above visually reads as the warm paper canvas with white cards lifted by `card-lift`, not as the legacy gray UI.
- [x] New screens (Onboarding, Delegation, Implementation, Reward) render using `font-display` / `font-meta`, `.btn-primary`, `.input-line`, `.card-lift`, and the status palette out of the box.

## Notes

- Some palette substitutions are subjective (e.g. emerald → `status-deliberating` vs `primary-container`). Pick by semantic intent: success-ish = `primary-container`, "pro" stance = `status-deliberating`, "voting" = `status-voting`, "adopted" = `status-adopted`, warnings/regress = `status-implementing`.
- Keep `border-l-4 border-status-*` accents for stance rails and section headlines — those are intentional accent rails, not generic borders.
- Consider extracting a small `Card` component (`bg-surface-container-lowest rounded-md card-lift p-6`) to reduce duplication across the sweep.
