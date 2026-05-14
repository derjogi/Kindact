---
status: planned
created: 2026-05-01
priority: high
tags:
- frontend
- design
- ux
depends_on:
- '015'
related:
- 026-015i-ui-lens-config
- 033-component-library
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 032 — Design System Foundations

## Overview

Kindact is a governance platform whose UI must communicate phase, eligibility, anonymity, demurrage, and many other domain-specific states clearly and consistently. Without a shared visual language, each module spec (015a–015j) will improvise its own treatment and the platform will feel fragmented.

This spec defines the **foundational design tokens** — color, typography, spacing, elevation, radii, motion timing — that every other frontend spec consumes. It is the single source of truth for the look of Kindact.

## Design

### Token Layers

Three layers, each consuming the layer above:

1. **Primitive tokens** — raw values (e.g. `color.slate.500 = #64748b`, `space.4 = 16px`).
2. **Semantic tokens** — purpose-named aliases (e.g. `color.surface.subtle`, `color.text.primary`, `color.intent.danger`).
3. **Component tokens** — component-scoped (e.g. `button.primary.background`).

Components consume only semantic / component tokens, never primitives. This makes theming (lens branding, dark mode) a swap of the semantic layer.

### Color System

- **Neutral scale** (12-step, OKLCH-based) for surfaces, borders, text.
- **Brand scale** — Kindact's primary identity color. Single hue with 12 steps.
- **Intent scales** — `success`, `warning`, `danger`, `info` (each 12 steps).
- **Governance phase colors** — distinct hues for `Draft`, `Deliberation`, `Voting`, `Implementation`, `Verified`, `Disputed`. Reused across phase indicators, badges, timeline, breadcrumbs.
- **$CC token color** — single signature hue used only for $CC, demurrage, and reward UI to give the token a strong visual identity.
- **Dark mode** — full parity. Tokens defined as semantic pairs; components never branch on theme.
- **Contrast** — every text-on-surface pair meets WCAG AA (4.5:1) at minimum, AAA where feasible.

### Typography

- **Type scale** — 8 steps, modular (1.125 ratio): `xs, sm, base, lg, xl, 2xl, 3xl, display`.
- **Families**:
  - `sans` — UI text (Inter / system fallback).
  - `serif` — long-form proposal / wiki bodies (Source Serif / system fallback).
  - `mono` — addresses, hashes, transaction IDs, code.
- **Line-height pairs** — tight for headings, comfortable for body, loose for proposal wiki.
- **Weights** — 400 / 500 / 600 / 700 only. No 800/900.

### Spacing & Layout

- **4 px base unit**, scale `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32`.
- **Layout grid** — 12-column desktop, 8-column tablet, 4-column mobile. Gutters from spacing scale.
- **Container widths** — `prose` (640), `default` (960), `wide` (1200), `full`.

### Elevation

5 levels (`0–4`). Each is a triple of `box-shadow + border + background-tint` so elevation reads in both light and dark mode without relying on shadow alone.

### Radii

`none, sm (4), md (8), lg (12), xl (16), pill, full`. Cards use `lg`, inputs `md`, badges `pill`.

### Iconography

- 24 px nominal grid, 1.5 px stroke.
- Single icon set (Lucide or equivalent) for consistency.
- Custom governance icons (issue, lens, deliberation, vote, hypercert, demurrage) added to the same grid.

### Motion Timing

- Durations: `instant (0)`, `fast (120 ms)`, `base (200 ms)`, `slow (320 ms)`, `epic (480 ms)`.
- Easings: `standard`, `decelerate`, `accelerate`. Defined as cubic-beziers in tokens.
- Detailed motion patterns live in [037-motion-and-feedback](../037-motion-and-feedback/README.md).

### Implementation

- Tokens authored in **Style Dictionary** (or W3C DTCG JSON) → exported to:
  - CSS custom properties (consumed by Tailwind via theme extension)
  - TS constants (`@kindact/tokens`) for non-CSS contexts (charts, canvas)
- Tailwind config consumes only semantic tokens. No magic numbers in components.

## Plan

- [ ] Author primitive token JSON (color OKLCH ramps, type scale, spacing, radii, elevation, motion)
- [ ] Author semantic token JSON (light + dark)
- [ ] Author governance-phase + $CC token aliases
- [ ] Wire Style Dictionary build → CSS vars + TS constants
- [ ] Extend Tailwind theme to consume tokens
- [ ] Document tokens in Storybook (Foundations section)
- [ ] Contrast audit (light + dark) for all semantic pairs
- [ ] Lens-theming hook: per-lens override of brand + accent

## Test

- [ ] Every token has light + dark value
- [ ] WCAG AA pass for all `text-on-surface` semantic pairs (automated via `pa11y-ci` or similar)
- [ ] No raw hex / rem values in component source (lint rule)
- [ ] Dark-mode toggle changes only the semantic layer (visual regression snapshots)

## Notes

- Reuses learnings from prototype (../prototype/) but treats tokens as a fresh deliverable — not all prototype values are kept.
- Lens branding ([015i](../026-015i-ui-lens-config/README.md)) is implemented as a constrained override on the semantic / brand layer; lenses cannot break governance-phase semantics.
- Open question: do we ship a 3rd theme (high-contrast) at v1, or wait for community demand?
