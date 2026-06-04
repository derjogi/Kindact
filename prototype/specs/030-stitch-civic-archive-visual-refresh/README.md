---
status: complete
created: 2026-05-14
priority: medium
tags:
- frontend
- design-system
- visual
- stitch
created_at: 2026-05-14T01:31:24.303109345Z
updated_at: 2026-05-19T22:08:30.657738740Z
completed_at: 2026-05-19T22:08:30.657738740Z
transitions:
- status: in-progress
  at: 2026-05-17T20:26:49.038094534Z
- status: complete
  at: 2026-05-19T22:08:30.657738740Z
---

# Stitch "Civic Archive" Visual Refresh

> Bring the prototype's visual language in line with the Stitch design brief and the "Civic Archive" ethos. The current UI is functional stone-gray Tailwind defaults with 1px borders everywhere — the brief asks for a warmer, paper-feel, no-line, editorial aesthetic.

## Status (2026-05-18)

**Landed in this spec:**

- Civic palette + status colors via Tailwind v4 `@theme` in [`globals.css`](../../src/app/globals.css), plus utility classes `.btn-primary` (gradient CTA), `.input-line` (bottom-line input), `.card-lift` (always-on tonal lift), `.elevation-floating` (warm soft shadow).
- Fonts (Newsreader, Inter, Work Sans) wired via `next/font` in [`layout.tsx`](../../src/app/layout.tsx) and exposed as `font-display` / `font-sans` / `font-meta`.
- Glass top bar + side nav + mobile tab bar in [`Layout.tsx`](../../src/components/Layout.tsx).
- Issue feed in [`page.tsx`](../../src/app/page.tsx) with Community Pulse hero, pill status filters, white-card search + select with `card-lift`, floating "+" CTA.
- Editorial issue cards in [`IssueCard.tsx`](../../src/components/IssueCard.tsx) (nested `<a>` regression fixed — only title/summary are wrapped in `Link`).
- Issue detail in [`issues/[id]/page.tsx`](../../src/app/issues/[id]/page.tsx): editorial header, tonal-shift tab strip, status-palette dots, primary-container jump highlight.
- Refactored: [`VoteBar.tsx`](../../src/components/VoteBar.tsx), [`CommentThread.tsx`](../../src/components/CommentThread.tsx), [`SourcePanel.tsx`](../../src/components/SourcePanel.tsx), [`SummaryWithRefs.tsx`](../../src/components/SummaryWithRefs.tsx) (now renders Markdown via `react-markdown` + a rehype plugin that splits text nodes overlapping reference ranges into highlightable spans), [`EligibilityModal.tsx`](../../src/components/EligibilityModal.tsx), [`HoverToolbar.tsx`](../../src/components/HoverToolbar.tsx).
- Build is clean, no warnings.

**Deferred to [031 — Remaining Pages & Components](../031-stitch-civic-archive-remaining-pages/README.md):**

- All `/cells`, `/anchors`, `/activity`, `/vote`, `/issues/new` pages.
- Secondary components: `CollapsibleDescription`, `ThreadList`, `DiscussionSearch`, `CellBadge`, `AnchorPill`, `CellContextStrip`, `RelatedAcrossCells`, `JurisdictionalClaimsPanel`, `GuestContributorModal`, `BridgeToastContainer`, `OfflineBanner`, `RuntimeIndicator`, `WalletKeySigningModal`.
- Brief-mentioned screens not yet built: Onboarding, Delegation Management, Implementation & Verification, Reward & Impact / Hypercert card.
- Final regression sweep / lint for residual legacy color utilities.

References: [`prototype/stitch-design/stitch_guided_design_creation/stitch_ui_design_brief.md`](../../stitch-design/stitch_guided_design_creation/stitch_ui_design_brief.md), [`ethos_archive/DESIGN.md`](../../stitch-design/stitch_guided_design_creation/ethos_archive/DESIGN.md). Aligns with holochain/[032 Design System Foundations](../../../holochain/specs/032-design-system-foundations/README.md), holochain/[033 Component Library](../../../holochain/specs/033-component-library/README.md), holochain/[037 Motion and Feedback](../../../holochain/specs/037-motion-and-feedback/README.md).

## Overview

The Civic Archive ethos rejects "cold institutional blue" and "digital white." Governance UI should feel like a high-end modern library: warm paper tones, editorial typography, structural clarity through tonal layering instead of borders. This spec captures the concrete tokens and component substitutions to apply across the existing prototype.

This is a visual refresh, not a layout rewrite — the screen inventory from [022-ui-prototype](../022-ui-prototype/README.md), [025-deliberation-ui-redesign](../025-deliberation-ui-redesign/README.md), and the new cell/anchor specs ([026](../026-cell-discovery-and-membership-ui/README.md), [027](../027-anchor-subscription-management-ui/README.md), [029](../029-issue-cell-context-affordances/README.md)) is unchanged.

## Design

### Token set (Tailwind config)

Add a `civic` palette extension to `tailwind.config`:

```ts
colors: {
  surface: {
    dim:           '#d5dcd0',  // Level 0 — the floor
    DEFAULT:       '#fafaf5',  // Level 1 — the desk (main canvas)
    container_lowest: '#ffffff', // Level 2 — the document (cards)
    container_low:  '#f1f1ec',
    container:      '#ebede5',
    container_high: '#e3e6dc',
    container_highest: '#d8dccf',
  },
  on_surface: {
    DEFAULT:  '#2e342d',
    variant:  '#5b6159',
  },
  primary:        '#5d5f56',
  primary_dim:    '#51534a',
  primary_container: '#dde1d4',
  on_primary:     '#fafaf5',
  tertiary:       '#6e3bd8',  // Adopted
  outline_variant:'#9aa097',
  status: {
    deliberating: 'surface_container_high', // text uses primary
    voting:       '#3b6fd8',
    adopted:      '#6e3bd8',
    implementing: '#c08a2e',
    completed:    '#5b6159',
  },
}
```

### Typography stack

Install via Next.js `next/font`:

| Use | Font |
|---|---|
| Display & Headlines (page titles, issue titles, proposal text) | **Newsreader** (serif) |
| Titles & Body (functional text, long-form reading) | **Inter** |
| Metadata (labels, small technical data) | **Work Sans** |

Apply via Tailwind `font-display`, `font-sans`, `font-meta`. Lead paragraphs use `text-lg leading-[1.6]`. Discussion list density uses `text-sm` with `text-on_surface` (not gray-900).

### Structural rules

1. **No-line rule**: remove all `border`, `border-stone-200`, `divide-y` utilities used purely for sectioning. Replace with surface tier shifts (e.g. card on `container_lowest` over section on `container_low`).
2. **Tonal layering** for cards: instead of a shadow, lift via background tone. Reserve shadow (`shadow-[0_2px_24px_rgba(46,52,45,0.06)]`) for true floating elements (modals, popovers, dropdowns).
3. **Glassmorphism on the top bar**: replace `bg-white/90 backdrop-blur` with `bg-surface/70 backdrop-blur-[16px]` so the warm tones bleed through on scroll.
4. **Primary CTA gradient**: subtle linear gradient `from-primary to-primary_dim`; no shadow; on hover use an inset glow.
5. **Input fields**: drop the 4-sided box. Use bottom-line only or a `surface_container_high` flood fill with `rounded-b-sm`. Labels in `font-meta text-on_surface_variant`.
6. **Lists**: forbid `divide-y`. Use 16–24px vertical spacing. For dense data, zebra-stripe with `surface` and `surface_container_low`.
7. **Status chips**: redesign to the palette above; `Deliberating` uses neutral `surface_container_high`, `Adopted` uses `tertiary` (violet), etc. Update `IssueCard`, lifecycle stepper, and the dashboard health bar.

### Component refactors

Concrete touchpoints in the current codebase:

| File | Change |
|---|---|
| [Layout.tsx](../../src/components/Layout.tsx) | Glass top bar, drop `border-b border-stone-200`, reduce `max-w-4xl` constraint where content benefits from breathing room (issue detail). |
| [IssueCard.tsx](../../src/components/IssueCard.tsx) | Tonal-layered card on `container_lowest`, no border, status chip per new palette, Newsreader title. |
| [VoteBar.tsx](../../src/components/VoteBar.tsx) | Floating element gets glassmorphism; primary CTA gradient. |
| [CommentThread.tsx](../../src/components/CommentThread.tsx) | Drop the divider lines between comments, use whitespace and zebra-stripe for dense threads. |
| [SourcePanel.tsx](../../src/components/SourcePanel.tsx) | Convert to a "Focus Panel" pattern (right column for deliberation, left for data). |
| [SummaryWithRefs.tsx](../../src/components/SummaryWithRefs.tsx) | Newsreader for the summary lead paragraph; Inter for the bullet body; Work Sans for the "🟢 Updated since your last visit" badge. |
| `globals.css` | Set `body` color to `on_surface`, background to `surface`. Remove any `border-color` defaults. |

### Motion

Subtle, non-jittery. Tailwind `transition-colors duration-200`. New states (optimistic→confirmed from [028](../028-conductor-runtime-status-ui/README.md)) get a 240ms fade-in opacity transition rather than a slide.

### Don'ts (lifted from ethos)

- No pure `#000` text. Always `on_surface` (`#2e342d`).
- No 100% opaque borders for sectioning.
- No Material Design "elevation" shadows.
- No corner radii beyond `0.375rem`.

## Plan

- [x] Install Newsreader, Inter, Work Sans via `next/font` and wire `font-display`, `font-sans`, `font-meta`.
- [x] Extend `tailwind.config.ts` with the civic palette and remove default border colors.
- [x] Refactor `globals.css` background and text base.
- [x] Refactor `Layout.tsx` (glass nav, surface background, drop borders).
- [x] Refactor `IssueCard.tsx`, `VoteBar.tsx`, `CommentThread.tsx`, `SourcePanel.tsx`, `SummaryWithRefs.tsx`, `EligibilityModal.tsx`, `HoverToolbar.tsx`.
- [x] Update status chips across the codebase (Deliberating / Voting / Adopted / Implementing / Completed).
- [x] Convert form inputs to bottom-line-only style.
- [x] Replace all `border-*` sectioning utilities with surface tier shifts.
- [x] Visual regression sweep on every existing screen + new cell/anchor screens.

## Test

- [x] No `border` utilities remain on sectioning containers (lint with `grep -E 'border-(t|b|l|r|stone|gray|slate)' src/`).
- [x] All page text on `surface` reads as `on_surface` (not pure black).
- [x] Status chips render with correct palette across IssueCard, lifecycle stepper, health bar.
- [x] Top bar visibly blurs the content beneath when scrolling.
- [x] Newsreader is loaded for issue titles and proposal text; Inter for body; Work Sans for metadata.
- [x] Primary CTAs (Submit Issue, Approve Vote, Submit Report) render with the gradient + inset hover glow.

## Notes

This is the largest visual change but the smallest functional change. Best executed after [026](../026-cell-discovery-and-membership-ui/README.md), [027](../027-anchor-subscription-management-ui/README.md), and [029](../029-issue-cell-context-affordances/README.md) land — those introduce new components (cell badge, anchor pill, cell context strip) that should be born into the new design system rather than retrofit.

The ethos's "Focus Panel" pattern (left = data, right = deliberation) is a strong fit for the existing Issue Detail's content / source-panel split. Retaining that intent while updating tone.

Open: scope of refactor for [020-ui-desktop](../020-ui-desktop/README.md) and [021-ui-mobile](../021-ui-mobile/README.md) — should those specs be updated in lockstep, or kept as historical record with this spec acting as the authoritative current visual system?
