---
status: planned
created: 2026-04-03
priority: high
tags:
- frontend
- ux
depends_on:
- 014-off-chain-backend
- 006-deliberation-service
- 030-extensibility-foundation
- 031-core-metrics-framework
related:
- 032-design-system-foundations
- 033-component-library
- 034-information-architecture
- 038-accessibility-and-responsive
created_at: 2026-04-05T10:28:37.332555954Z
updated_at: 2026-04-05T10:28:37.332555954Z
---

# 015 – Frontend

## Overview

New frontend for Kindact, informed by prototype learnings. Wallet-first, React-based application connecting to the off-chain backend and directly to on-chain contracts, with issue-centric module rendering and lens-based discovery.

## Design

### Tech Stack

- Framework: Next.js (React, TypeScript)
- Wallet: wagmi + RainbowKit (Optimism/Base L2 support)
- Styling: Tailwind CSS (or similar utility-first framework)
- AT Proto: `@atproto/api`, `@hypercerts-org/lexicon`
- State: React Query for server state, zustand or context for local state

### Key Screens

Informed by prototype's 020-ui-desktop wireframes and 025-deliberation-ui-redesign:

- **Dashboard**: personalized feed of issues, notifications, $CC token balance, community activity, and lens-based discovery subscriptions
- **Issue Detail**: full deliberation workspace driven by the issue's protocol binding — comments, optional module tabs, proposal document, AI summary, participation metrics, and baseline metrics/gate explanations
- **Voting**: eligibility check → vote casting → live tally visualization with result breakdown
- **Implementation**: work packages, claim management, report submission, evidence upload
- **Profile**: wallet info, identity verification status, $CC balance with demurrage visualization, contribution history
- **Token**: balance, transaction history, demurrage tracker, exchange interface (when available)
- **Lens Settings**: follow/mute lenses, configure presentation defaults, inspect active overlays

### Wallet-First Auth

Dual auth flow: EIP-4361 (Sign-In with Ethereum) for on-chain identity + AT Proto OAuth for data operations. Users link their EVM wallet to their AT Proto DID via `app.certified.link.evm`. The frontend handles both auth flows — wallet connection establishes on-chain identity, AT Proto OAuth authorizes reads/writes to the user's PDS. No email/password flow.

### Anonymization UX

During deliberation phases, author identities are masked. UI clearly indicates anonymous mode with visual cues and explains *why* identities are hidden (bias reduction). Since voting is fluid and ongoing (007), anonymization is tied to the **deliberation phase**, not vote conclusion — identities may remain masked as long as the issue is actively deliberated. Exact reveal rules are governance-configurable.

### Responsive Design

Desktop-first layout, mobile-friendly. Prototype had separate mobile spec (021); this design unifies via responsive breakpoints rather than separate views.

### Design Principles

- Reuse UX patterns validated in the prototype — don't reinvent what worked
- Prototype's deliberation UI (025) and desktop wireframes (020) are primary reference material
- Prioritize clarity of governance state (what phase is this issue in? what can I do?)
- Progressive disclosure: simple overview → detailed workspace on drill-down
- Separate raw data availability from default visibility/prominence in the UI
- A viewer's current lens must never suppress an issue's active protocol binding
- Baseline metrics and the gate decision should be visible as first-class issue context, not hidden as a secondary panel

### Plugin Slot Contracts

Frontend extension is mediated by **typed slot contracts**, not by handing modules raw React/DOM access. Every slot the shell exposes declares:

- A typed `props` interface — exactly what the shell will hand into a contributed component (e.g. `{ issueId, phase, binding }`).
- A typed `events` interface — what the module can emit back to the shell (e.g. `onVoteCast`, `onArgumentAdded`, `onFallbackRequested`).
- A typed `capabilities` surface — the analogue of the backend `ctx`: any API/data access a module needs from the shell (e.g. `shell.api.issues.read`, `shell.notify.toast`).

Modules contribute components that conform to that contract; they do not import the shell's store, router, or fetch layer directly. v1 modules technically run inside the same bundle and could reach outside the contract — doing so is grounds for code-review rejection. In v2 the same component can be served from an iframe / Web Worker because the slot interface is already a typed message contract.

Slot identities follow the same `<namespace>/<key>` convention as modules (e.g. `kindact/issue.deliberation.tabs`). Contributed components are registered into slots from each module's `manifest.json`, not by ad-hoc imports.

### Fallback Renderers

Every module data type that can appear in a slot MUST ship a fallback renderer (a minimal read-only view) keyed in its manifest under `read_fallback`. The shell uses the fallback when no full module UI is registered for the current viewer. This guarantees a viewer's lens never silently suppresses an issue's active protocol binding.

### Extension Points

- Theme system for community branding
- Community-customizable layouts
- Plugin slots (typed contracts above) for module-specific UIs and fallback renderers driven by issue protocol binding
- Canonical location pickers and lens discovery surfaces backed by shared geography refs

## Plan

1. Scaffold project with Next.js, wallet integration (wagmi/RainbowKit)
2. Implement dashboard (issue feed, notifications, balance)
3. Implement issue detail + deliberation UI (comments, arguments, proposals)
4. Implement voting flow (eligibility → casting → tally)
5. Implement implementation/verification UI (work packages, reports)
6. Implement profile + token UI (balance, demurrage, history)
7. Responsive polish and accessibility pass
8. E2E tests with mocked backend

## Test

- Wallet connection: connect/disconnect, network switching, signature flow
- Screen rendering: each key screen renders with mock data
- Voting flow: eligibility gate, cast vote, tally update
- Anonymization: identities masked during deliberation, revealed after
- Responsive: key screens render correctly at desktop/tablet/mobile breakpoints
- Accessibility: keyboard navigation, screen reader basics
- Slot contracts: a module component registered against a slot receives only the declared `props` / `capabilities` and emits only the declared `events`
- Fallback renderers: when no full module UI is registered, the module's `read_fallback` view is shown and renders without errors

## Notes

- The prototype (../prototype/) contains validated UX patterns — review before building each screen.
- Deliberation UI is the most complex screen; prototype spec 025 has the refined design.
- Demurrage visualization (token decay over time) needs careful UX — make the economic model intuitive.
- The frontend should render issue modules according to protocol binding, not according to the viewer's current dashboard lens.
