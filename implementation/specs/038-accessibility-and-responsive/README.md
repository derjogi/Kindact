---
status: planned
created: 2026-05-01
priority: high
tags:
- frontend
- design
- a11y
- responsive
depends_on:
- '032'
related:
- '015'
- 033-component-library
- 037-motion-and-feedback
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 038 — Accessibility & Responsive Design

## Overview

Kindact intends to be governance infrastructure. That makes accessibility and responsive design **non-negotiable**: anyone affected by a decision must be able to participate in deliberation, voting, and verification, regardless of device, network, or assistive technology. This spec defines the platform-wide accessibility (a11y) contract and the responsive layout system.

## Design

### Accessibility Targets

- **WCAG 2.2 AA** baseline; AAA where feasible (contrast, focus visibility).
- **Screen readers**: VoiceOver (macOS / iOS), NVDA + JAWS (Windows), TalkBack (Android).
- **Keyboard**: every interactive surface reachable and operable without a pointer.
- **Cognitive load**: progressive disclosure, plain-language labels, no time-pressure (governance is async; never use forced countdowns on critical actions).
- **Motor**: 44 × 44 px minimum touch target; large hit areas on mobile primary actions.
- **Visual**: respects user font-size up to 200 % zoom and `prefers-contrast: more`.

### Semantic & ARIA Contract

Every component in [033-component-library](../033-component-library/README.md) must:

- Use the correct **native semantic element** first (`<button>`, `<a>`, `<nav>`, `<dialog>`, `<table>`, `<form>`).
- Use ARIA only when no native equivalent exists, and follow the ARIA Authoring Practices patterns (Disclosure, Combobox, Tabs, Dialog, Menu).
- Provide `aria-label` / `aria-labelledby` for icon-only controls.
- Wire `aria-describedby` for hint + error text via the shared `Field` wrapper.
- Use `aria-live="polite"` for non-urgent updates (toast, tally tick) and `aria-live="assertive"` only for critical alerts (dispute opened on your work).
- Manage focus on dialog open / close, route change, and dynamic content insertion.

### Keyboard Map (platform-level)

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | move focus |
| `Enter` / `Space` | activate focused control |
| `Esc` | close dialog / popover; cancel composer if empty |
| `?` | open keyboard help overlay |
| `Cmd/Ctrl + K` | global search (cmd palette) |
| `g` then `h/d/w/p/m` | go to home / discover / work / wallet / profile |
| `j` / `k` | next / previous item in feeds |
| `v` | open voting tab on focused issue |
| `c` | start composer (where applicable) |
| arrow keys | move within radio groups, tab strips, opinion-map data points |

A keyboard help overlay (`?`) lists the active map for the current page.

### Focus Management Rules

- Focus ring is visible and high-contrast (token `focus.ring`); never removed.
- Modal dialogs trap focus, return focus to trigger on close.
- Route changes move focus to the new page's `<h1>` and announce page title via a polite live region.
- Skip links: "Skip to content", "Skip to navigation", "Skip to phase tabs" (on issue detail).

### Color & Contrast

- All token pairs (text on surface, icon on surface) ≥ 4.5:1 for normal text, 3:1 for large.
- `prefers-contrast: more` swaps to a high-contrast semantic-token set with bolder borders, stronger text, no translucent surfaces.
- Information never encoded by color alone (paired with shape, label, or pattern). See [035-governance-data-visualization §Encoding Rules](../035-governance-data-visualization/README.md).

### Internationalization Readiness

- All strings sourced via i18n key (`react-intl` or `next-intl`); no hardcoded English in components.
- RTL support: layout uses logical CSS properties (`margin-inline-start`, etc.). Visual mirroring tested with a sample RTL locale.
- Numbers, dates, durations, plural forms localized via `Intl.*` APIs.
- Detailed translation governance lives in a future spec; this spec mandates the foundations.

### Network & Device Resilience

- Critical paths (vote cast, work claim, dispute open) work over slow 3G; confirm UX via Lighthouse "slow 4G" + 4× CPU throttle.
- Optimistic UI on cast / claim, with explicit pending state until on-chain confirmation; never silently roll back.
- Offline state banner if the device goes offline during deliberation; queued composer drafts persisted to local storage.

### Responsive Layout System

Breakpoints (consumed via tokens):

| Token | Min width | Notes |
|---|---|---|
| `bp.xs` | 0 | phone portrait |
| `bp.sm` | 480 | phone landscape / small tablet |
| `bp.md` | 768 | tablet portrait |
| `bp.lg` | 1024 | tablet landscape / small desktop |
| `bp.xl` | 1280 | desktop |
| `bp.2xl` | 1536 | wide desktop |

Layout primitives:
- `Stack` (vertical), `Row` (horizontal), `Cluster`, `Sidebar`, `Switcher`, `Cover`, `Center` — Every Layout-style primitives, all built on container queries where possible.
- The persistent rail collapses to bottom bar at `bp.md` and below.
- Issue-detail right rail collapses into a tab at `bp.lg` and below.
- Tables degrade to "stacked card" layout at `bp.sm` (each row becomes a card with labeled cells).

Container queries used for component-level responsiveness so a component renders correctly inside narrow side-panels regardless of viewport.

### Touch & Pointer

- All primary actions ≥ 44 × 44 px touch target with ≥ 8 px spacing.
- Hover states are not the only way to discover affordance — icon-only buttons always have visible labels on touch devices (long-press tooltip is not enough).
- Drag-and-drop interactions (delegation reorder, lens reorder) have keyboard equivalents.

### Cognitive Accessibility

- Plain-language summary at the top of every governance phase explaining what the user can do now.
- Default copy avoids jargon; technical terms link to a glossary.
- No surprise destructive actions: always confirm with a second step (delegation revoke, work-claim release, dispute escalation).
- Time estimates ("~3 min to vote", "~5 min to write a report") shown on entry to long flows.

## Plan

- [ ] Author breakpoint + layout-primitive tokens; wire into Tailwind
- [ ] Implement Stack / Row / Cluster / Sidebar / Switcher / Cover / Center primitives
- [ ] Implement skip links and route-change focus management
- [ ] Implement global keyboard map + `?` help overlay
- [ ] Implement `prefers-contrast: more` high-contrast token set
- [ ] Implement RTL pass with logical CSS properties + sample locale
- [ ] Add automated a11y CI: `axe-core` per Storybook story + per route in E2E
- [ ] Add lint: no hardcoded user-facing strings; logical CSS properties only
- [ ] Run manual screen-reader pass on every critical path (vote, claim, dispute)
- [ ] Lighthouse a11y score ≥ 95 on all primary routes

## Test

- [ ] axe-core: 0 violations on every Storybook story
- [ ] Keyboard-only walkthrough of: dashboard → issue → deliberate → vote → wallet (no mouse)
- [ ] Screen-reader walkthrough on iOS VoiceOver + NVDA for the same path
- [ ] 200 % zoom: no horizontal scroll, no clipped content
- [ ] RTL locale: layout correct, all icons flipped where appropriate
- [ ] `prefers-reduced-motion`, `prefers-contrast: more`, `prefers-color-scheme: dark` all behave correctly
- [ ] Slow-3G + 4× CPU: vote-cast still completes within UX budget (≤ 5 s perceived)

## Notes

- Accessibility is the spec most likely to slip without explicit budget. CI gates (axe, Lighthouse) keep regressions out; manual passes per release catch what automation misses.
- Container queries are preferred over media queries wherever practical so components are reusable in side-panels and embedded contexts (lens previews, embed widgets).
- Keyboard shortcuts overlap with several power-user norms (`j/k` for feed, `g h` for navigation) to lower learning cost for technical users without forcing them on novices.
