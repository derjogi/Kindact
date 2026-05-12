---
status: planned
created: 2026-05-01
priority: medium
derivation: ported
ports_from: 039-empty-loading-error-states
tags:
- frontend
- design
- ux
depends_on:
- '033'
related:
- 018-015a-ui-dashboard
- 021-015d-ui-voting
- 022-015e-ui-implementation
- 024-015g-ui-token-wallet
- 023-015f-ui-disputes
created_at: 2026-05-01T11:32:05.666178413Z
updated_at: 2026-05-01T11:32:05.666252116Z
---

# 039 — Empty, Loading & Error States

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [039-empty-loading-error-states](../../../implementation/specs/039-empty-loading-error-states/README.md)

## Hybrid notes

Empty/loading/error port. New states needed: conductor-disconnected, holo-host-unreachable, gateway-readonly-fallback, bridge-pending-redemption, queue-cap-blown, guest-contributor-mode.


## Overview

A governance platform spends a non-trivial fraction of its UI time in **non-happy-path** states: a new lens has zero issues, an off-chain backend hiccup, an on-chain transaction pending, an eligibility gate blocking voting, a wallet disconnected, a dispute pending without verdict. Without a deliberate state vocabulary, users see "infinite spinners" or "no results" and lose trust. This spec defines the **canonical state taxonomy and visual treatment** every screen consumes.

## Design

### State Taxonomy

Every data surface (page, panel, list, chart) renders one of these states:

1. **Idle** — initial render before fetch starts. (Rare; mostly an internal SSR concept.)
2. **Loading (initial)** — first fetch, no prior data. Skeletons.
3. **Loading (background)** — refreshing while showing prior data. Subtle indicator only.
4. **Empty (legitimate)** — fetch succeeded, no data exists. (e.g. "no issues in this lens yet.")
5. **Empty (filtered)** — data exists but the active filter excludes everything.
6. **Partial / Degraded** — some data succeeded, some failed (multi-source surface).
7. **Error (recoverable)** — fetch failed, retry possible.
8. **Error (terminal)** — fetch failed, retry won't help (auth required, network missing, route invalid).
9. **Pending (on-chain)** — user-initiated tx awaiting confirmation.
10. **Blocked (gate)** — user is not eligible / authorized for this surface (vote eligibility quiz, wallet not connected, lens-locked).
11. **Stale** — data shown but known to be older than freshness budget.

### State Treatment

**Loading (initial) — Skeletons**

- Geometry-matching skeletons (preserve final layout to avoid CLS).
- Subtle shimmer, low contrast, `motion.slow` cycle ([037](../037-motion-and-feedback/README.md)).
- Skeleton stories live alongside the component in Storybook.

**Loading (background) — Quiet indicator**

- Top-bar progress hairline (1 px) animates while a refresh is in flight.
- Existing data stays visible; nothing flickers.
- Optimistic actions show their pending state inline (button spinner, ghost row).

**Empty (legitimate) — Inviting, not apologetic**

- Centered illustration (small, on-brand, optional), short headline, one-sentence body, primary CTA that *creates the missing thing* when applicable.
- Examples:
  - Dashboard with no subscribed lenses → "Pick a lens to start your feed." [Browse lenses]
  - Lens with zero issues → "Be the first to raise an issue here." [Create issue]
  - No notifications → "You're all caught up." (No CTA.)
  - No work claims → "No claimable work right now. We'll notify you when something opens." [Manage notifications]

Empty states **never lie**. If we don't know whether data exists, show loading; only show empty after the fetch confirms zero.

**Empty (filtered) — Distinct from legitimate empty**

- Headline names the filter responsible: "No issues match these filters."
- Body shows the active filter pills and offers a one-click "Clear filters."
- Visual treatment less prominent than legitimate empty (no large illustration).

**Partial / Degraded — Honest banner**

- Surface what *did* load with a small banner above it: "Couldn't load impact metrics. [Retry]"
- Never silently hide failed parts.

**Error (recoverable)**

- Inline panel with a friendly headline ("We couldn't load this right now."), a one-line technical hint when useful, a `[Retry]` primary action and `[Report]` secondary.
- Auto-retry with exponential backoff for transient network errors, capped at 3 attempts; then show the error panel.
- Error boundaries scope errors to the failing region — never blank the whole page for one bad widget.

**Error (terminal)**

- Full-region treatment with explicit next step.
- Examples:
  - Wallet disconnected → "Connect your wallet to view your work claims." [Connect]
  - Route not found → "We couldn't find this issue. It may have been removed." [Back to discover]
  - Auth required → "Sign in to vote." [Sign in with Ethereum]

**Pending (on-chain)**

- Inline tx pill: spinner + truncated tx hash (link to explorer) + estimated time.
- The triggering button stays disabled with the pending state visible inside it.
- On confirmation: pill swaps to a success check for 2 s, then the data updates.
- On revert / fail: pill shows error icon + tooltip with the revert reason; button re-enables.

**Blocked (gate)**

- Treat as a first-class onboarding moment, not a denial.
- Headline names what's needed; body explains why; CTA is the next concrete step.
- Examples:
  - Voting eligibility quiz not yet passed → "Take a 2-minute quiz to confirm you've read the issue summary, then you can vote." [Start quiz]
  - Metrics gate not satisfied → "Voting opens once impact metrics are filled in. Help estimate?" [Open metrics panel]
  - Lens-locked content → "This module is enabled in a different lens. Preview as that lens?" [Preview]

**Stale — Subtle indicator, never alarming**

- Tiny "updated 5 m ago" timestamp + refresh icon button.
- For data older than its freshness budget, badge becomes a colored chip ("data may be stale").

### Copy Guidelines

- Plain language. Never blame the user; never use ALL-CAPS errors.
- Headlines are 2–6 words. Bodies are 1–2 sentences. CTAs are imperative ("Connect wallet", not "Click here").
- Localized via the i18n key system from [038-accessibility-and-responsive](../038-accessibility-and-responsive/README.md).

### Composition Rules

- A surface chooses **at most one** primary state at a time (no nested empty-inside-loading flicker).
- States are owned by the data hook (`useIssue`, `useTally`) so every consumer renders consistently.
- Standard hook return: `{ data, status, error, isStale, retry }` where `status ∈ idle | loading | success | empty | error | blocked | pending`. Components branch on `status`, not on truthiness of `data`.

### Components

Provided by [033-component-library](../033-component-library/README.md):

- `Skeleton` — primitive shapes (`SkeletonText`, `SkeletonAvatar`, `SkeletonCard`).
- `EmptyState` — illustration slot + headline + body + CTA.
- `ErrorState` — recoverable + terminal variants.
- `PendingTx` — on-chain tx pill.
- `Gate` — blocked-state container with reason + CTA.
- `StaleBadge` — small chip with timestamp + refresh.

## Plan

- [ ] Define the standard data-hook contract (`status` discriminated union)
- [ ] Implement `Skeleton`, `EmptyState`, `ErrorState`, `PendingTx`, `Gate`, `StaleBadge`
- [ ] Wire ErrorBoundary scoping per major region (dashboard widgets, issue tabs)
- [ ] Author empty-state copy + illustrations for each known empty surface (dashboard, lens, work, notifications, search results, deliberation, votes, disputes, wallet history)
- [ ] Implement transient-error backoff + retry policy
- [ ] Implement on-chain pending pill with tx-explorer linkage
- [ ] Implement gate components for: wallet, eligibility quiz, metrics gate, lens-lock, identity verification
- [ ] Storybook stories for every state of every data surface

## Test

- [ ] No surface ever shows "no results" before its fetch resolves (verified via mock fetch latency)
- [ ] Every error has a Retry or a recovery CTA (no dead-ends)
- [ ] Tx-pending pill cleans up on confirmation, revert, and timeout
- [ ] Filtered-empty distinguishable from legitimate-empty (visual + screen-reader)
- [ ] Stale badge appears when data exceeds freshness budget; refresh button restores
- [ ] Error boundary contains failures to the failing region

## Notes

- The trick to good empty states is **distinguishing "nothing exists" from "we couldn't load it"**. Conflating them erodes trust fast in a system where on-chain data really might be silent for a while.
- Pending-tx UX is the highest-anxiety state in a Web3 governance app. Always show progress + explorer link + estimated time, and never disable navigation while pending.
- Gates are not errors. Treat them as onboarding moments and write copy accordingly.
