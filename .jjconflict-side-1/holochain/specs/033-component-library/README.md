---
status: planned
created: 2026-05-01
priority: high
derivation: ported
ports_from: 033-component-library
tags:
- frontend
- design
- components
depends_on:
- '032'
related:
- '015'
- 035-governance-data-visualization
- 036-anonymization-visual-language
- 039-empty-loading-error-states
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 033 — Component Library

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [033-component-library](../../../implementation/specs/033-component-library/README.md)

## Hybrid notes

Component library port — fully substrate-agnostic. Net-new components likely needed: ConductorStatusBadge, RuntimeModeSwitch, LocalCreditBalanceCard, RedemptionQueueRow, BridgePendingNotice.


## Overview

Every UI feature spec (015a–015j) reaches for the same building blocks: buttons, cards, inputs, badges, tabs, dialogs. Implementing them spec-by-spec creates drift in behavior, accessibility, and visual treatment. This spec defines a shared, accessible, token-driven component library that the entire frontend consumes.

## Design

### Architecture

- Headless primitives (Radix UI / React Aria) wrapped with Kindact styling.
- All components consume tokens from [032-design-system-foundations](../032-design-system-foundations/README.md). No raw colors / sizes.
- TypeScript-strict, exhaustive variant types via `cva` or `tailwind-variants`.
- Server-component-friendly where possible (no client-only imports unless needed).

### Component Inventory

**Primitives**
- `Button` — variants: `primary`, `secondary`, `ghost`, `danger`, `link`. Sizes: `sm`, `md`, `lg`. States: `loading`, `disabled`, `success`. Icon-only variant with required `aria-label`.
- `IconButton` — square, accessible label required.
- `Input`, `Textarea`, `Select`, `Combobox`, `MultiSelect`, `Checkbox`, `Radio`, `Switch`, `Slider`.
- `Field` — wrapper providing label, hint, error, required indicator, `aria-describedby` wiring.
- `Badge` — generic + governance-phase variants.
- `Tag` — used for issue tags, lens topics. Removable variant.
- `Avatar` — with anonymized fallback (see [036](../036-anonymization-visual-language/README.md)).
- `Tooltip`, `Popover`, `Dialog`, `Sheet` (slide-over), `Drawer`.
- `Tabs`, `Accordion`, `Collapsible`, `Disclosure`.
- `Toast` / `Notification`.
- `Skeleton`, `Spinner`, `ProgressBar`, `ProgressRing`.
- `Breadcrumbs`, `Pagination`, `Stepper`.
- `Toolbar`, `Menu` (context + dropdown).
- `Card`, `Surface`, `Divider`.
- `Table` — sortable, sticky header, virtualized variant.
- `EmptyState`, `ErrorState` — see [039](../039-empty-loading-error-states/README.md).
- `CodeBlock`, `AddressDisplay` (truncated, copy-on-click), `TxHashLink`.

**Governance-domain components**
- `PhaseBadge` — colored by issue phase token.
- `PhaseTimeline` — horizontal stepper of governance phases.
- `IssueCard` — used in feeds, search results.
- `LensChip` — followable / mutable.
- `VoteBar` — approval / score / quadratic visualizations.
- `DemurrageRing` — countdown ring around $CC balance.
- `ConvictionMeter` — accumulating fill bar for decision continuity.
- `ConfidenceBar` — uncertainty indicator on metrics estimates.
- `EvidenceTile` — geotagged photo / video evidence.
- `ArgumentCard` — Kialo-style pro/con argument.
- `OpinionMap` — Pol.is-style cluster scatter (also covered in [035](../035-governance-data-visualization/README.md)).
- `MetricsPanel` — social / planetary / economic / time grid with confidence + sources.
- `WalletButton` — connect / connected states with ENS / DID display.
- `AnonymousAvatar` — see [036](../036-anonymization-visual-language/README.md).

### Variants & Composition

- Variants expressed via discriminated unions, not boolean flags. (`<Button variant="primary" />`, never `<Button primary danger />`.)
- Composition over configuration. Complex components expose slots (`<Card.Header>`, `<Card.Body>`).

### Accessibility (cross-cutting)

- Every interactive component is keyboard-operable, has visible focus ring (token: `focus.ring`), and meets contrast AA.
- See [038-accessibility-and-responsive](../038-accessibility-and-responsive/README.md) for the full a11y contract that every component must pass.

### Documentation

- **Storybook** with one story per variant + a11y addon + visual-regression snapshots (Chromatic or Loki).
- Each component README includes: anatomy, props, do/don't, governance-context examples.

### Distribution

- Published as `@kindact/ui` workspace package consumed by the Next.js app.
- Tree-shakeable; CSS injected via Tailwind layer, not per-component CSS-in-JS runtime.

## Plan

- [ ] Set up `@kindact/ui` workspace + Storybook
- [ ] Implement primitives (Button, Input, Field, Badge, Card, Dialog, Tabs)
- [ ] Implement form-heavy primitives (Combobox, MultiSelect, Slider, Switch)
- [ ] Implement feedback primitives (Toast, Skeleton, Spinner, ProgressRing)
- [ ] Implement governance-domain components (PhaseBadge, PhaseTimeline, IssueCard, VoteBar, DemurrageRing, ConvictionMeter)
- [ ] Implement evidence + metrics components (EvidenceTile, MetricsPanel, ConfidenceBar)
- [ ] Storybook a11y + visual-regression CI
- [ ] Write usage docs and "do/don't" guidance per component

## Test

- [ ] Storybook a11y addon: 0 violations on every story
- [ ] Visual-regression snapshots reviewed on PR
- [ ] Keyboard-only navigation works for every interactive component
- [ ] Dark-mode visual parity for every story
- [ ] Bundle size budget enforced in CI (per-component)

## Notes

- Primitives chosen over a third-party kit (e.g. shadcn/ui scaffolds) so we own visual + governance semantics end to end. Headless behavior layer (Radix / React Aria) is reused.
- Governance-domain components are intentionally separate from primitives so generic primitives stay reusable outside Kindact context.
