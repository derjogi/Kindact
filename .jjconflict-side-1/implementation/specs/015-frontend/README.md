---
status: planned
created: '2026-04-03'
tags: [frontend, ux]
priority: high
depends_on:
  - 014-off-chain-backend
---

# 015 – Frontend

## Overview

New frontend for Kindact, informed by prototype learnings. Wallet-first, React-based application connecting to the off-chain backend and directly to on-chain contracts.

## Design

### Tech Stack

- Framework: Next.js (React, TypeScript)
- Wallet: wagmi + RainbowKit (Optimism/Base L2 support)
- Styling: Tailwind CSS (or similar utility-first framework)
- State: React Query for server state, zustand or context for local state

### Key Screens

Informed by prototype's 020-ui-desktop wireframes and 025-deliberation-ui-redesign:

- **Dashboard**: personalized feed of issues, notifications, $CC token balance, community health metrics (total $CC minted, verified implementations, active issues by phase)
- **Issue Detail**: full deliberation workspace — comments, pro/con arguments, proposal document, AI summary, participation metrics. Must include an **issue lifecycle stepper** showing the full Identify→Deliberate→Decide→Implement→Reward pipeline with the current phase highlighted, making the end-to-end loop tangible.
- **Voting**: eligibility check → vote casting → live tally with **conviction visualization** (time-series or strength indicator showing how conviction accumulates per 009, making reversal thresholds visible). **Metrics gate indicator**: when impact assessment is incomplete, voting is visually locked with an explanation ("Voting unlocks when impact assessment is complete"), per the vision's requirement that voting is blocked until metrics are determined and outcomes are net-positive.
- **Implementation**: work packages, claim management, report submission (structured ValueFlows fields: labor, materials, outputs per 008), evidence upload (geotagged photos/video, documents). **Verification dashboard**: verifier queue, review interface, approval/rejection with rationale. This is the vision's core differentiator — the screen that turns decisions into verified action — and must feel as polished as the deliberation workspace.
- **Reward & Impact**: on verified completion, prominently display the **minted $CC** with clear provenance (which issue, which work, how much), and the auto-generated **Hypercert** (011) as a visual impact credential card. Users should be able to trace every token back to specific verified work.
- **Delegation**: per-topic delegation management (009) — assign delegates by tag/category, view active delegations, see how delegates have voted on your behalf, instant revocation. Currently has no UI in the prototype at all.
- **Profile**: wallet info, identity verification status, $CC balance with demurrage visualization, contribution history, Hypercert portfolio
- **Token**: balance, transaction history, demurrage tracker, exchange interface (when available)
- **Onboarding**: first-visit experience explaining the full loop (good decisions → verified work → economic reward → impact credentials). The prototype currently drops users straight into an issue list with no context — this screen communicates why Kindact is different from every other deliberation platform.

### Wallet-First Auth

Sign-In with Ethereum (EIP-4361) via the backend auth middleware. No email/password flow. Wallet connection is the single entry point.

### Anonymization UX

During deliberation phases, author identities are masked. UI clearly indicates anonymous mode with visual cues and an **explainer tooltip/banner** ("Identities are hidden to help you evaluate ideas by their merits, not by who said them"). Making the bias-reduction philosophy visible builds user trust and distinguishes Kindact from platforms where anonymity feels accidental. Identity reveal only after voting concludes (per governance rules).

### Responsive Design

Desktop-first layout, mobile-friendly. Prototype had separate mobile spec (021); this design unifies via responsive breakpoints rather than separate views.

### Design Principles

- Reuse UX patterns validated in the prototype — don't reinvent what worked
- Prototype's deliberation UI (025) and desktop wireframes (020) are primary reference material
- Prioritize clarity of governance state (what phase is this issue in? what can I do?)
- Progressive disclosure: simple overview → detailed workspace on drill-down

### Extension Points

- Theme system for community branding
- Community-customizable layouts
- Plugin slots for module-specific UIs (new facets can ship UI components)

## Plan

1. Scaffold project with Next.js, wallet integration (wagmi/RainbowKit)
2. Implement onboarding flow (first-visit experience explaining the core loop)
3. Implement dashboard (issue feed, notifications, balance, community health metrics)
4. Implement issue detail + deliberation UI (comments, arguments, proposals) with lifecycle stepper
5. Implement voting flow (metrics gate indicator → eligibility → casting → conviction-aware tally)
6. Implement delegation management UI (per-topic delegation, revocation, delegate voting history)
7. Implement implementation/verification UI (work packages, claims, ValueFlows report submission, evidence upload, verifier dashboard)
8. Implement reward & impact UI (minted $CC provenance, Hypercert credential display)
9. Implement profile + token UI (balance, demurrage, history, Hypercert portfolio)
10. Anonymization explainer UX (tooltips, banners explaining bias-reduction rationale)
11. Responsive polish and accessibility pass
12. E2E tests with mocked backend

## Test

- Wallet connection: connect/disconnect, network switching, signature flow
- Screen rendering: each key screen renders with mock data
- Onboarding: first-time user sees the loop explainer before issue feed
- Issue lifecycle stepper: correct phase highlighted for each issue status
- Voting flow: metrics gate visible when assessment incomplete; eligibility gate; cast vote; conviction visualization updates
- Delegation: create delegation by topic, view delegate votes, revoke instantly
- Implementation flow: claim work package, submit report with ValueFlows fields, upload evidence, view verification status
- Reward display: minted $CC links back to specific verified work; Hypercert card renders
- Anonymization: identities masked during deliberation with explainer visible; revealed after
- Community health: dashboard shows aggregate metrics (total minted, verified count, phase breakdown)
- Responsive: key screens render correctly at desktop/tablet/mobile breakpoints
- Accessibility: keyboard navigation, screen reader basics

## Notes

- The prototype (../prototype/) contains validated UX patterns — review before building each screen.
- Deliberation UI is the most complex screen; prototype spec 025 has the refined design.
- Demurrage visualization (token decay over time) needs careful UX — make the economic model intuitive.

### Prototype Gap Analysis (vision vs. prototype UI)

The prototype covers Steps 1–3 (Identify→Deliberate→Decide) well but has significant gaps for the features that differentiate Kindact from other governance platforms:

| Gap | Vision requirement | Prototype status | This spec |
|-----|-------------------|------------------|-----------|
| Implementation/verification UI | Core differentiator — claim→report→verify→mint flow | Activity page references "My Claims" but no submission/verification UX | Covered: Implementation screen + verifier dashboard |
| Reward provenance | Users trace every $CC to specific verified work | Balance shown but disconnected from work | Covered: Reward & Impact screen |
| Hypercert display | Impact credentials visible after completion | Not present | Covered: Reward & Impact + Profile |
| Delegation UI | Per-topic liquid democracy, instant revocation | Completely absent | Covered: Delegation screen |
| Conviction visualization | Time-weighted conviction making reversals harder | Simple approve/reject counter | Covered: Voting screen |
| Metrics gate | Voting blocked until impact assessment complete | Metrics shown but no gatekeeping UX | Covered: Voting screen |
| Anonymization explainer | Users understand *why* identities are hidden | Aliases shown but no rationale | Covered: Anonymization UX |
| Issue lifecycle stepper | Visualize the full end-to-end loop | No pipeline visualization | Covered: Issue Detail screen |
| Onboarding | Explain why Kindact is different | Drops into issue list with no context | Covered: Onboarding screen |
| Community health | Aggregate impact metrics (total minted, verified count) | Not present | Covered: Dashboard |
