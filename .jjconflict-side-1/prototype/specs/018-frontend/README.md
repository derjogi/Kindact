---
status: complete
created: 2026-03-18
priority: high
tags:
- frontend
- mvp
- ux
depends_on:
- 002-wallet-auth
- 003-human-verification
- 004-issue-intake
- 005-deliberation-workspace
- 006-ai-assist-summary
- 007-metrics-eligibility
- 008-voting-engine
- 009-work-reports-evidence
- 010-verification-disputes
- 011-cc-ledger
created_at: 2026-03-18T00:00:00Z
updated_at: 2026-04-01T19:38:52.190425986Z
completed_at: 2026-04-01T19:38:52.190425986Z
transitions:
- status: complete
  at: 2026-04-01T19:38:52.190425986Z
related:
- 020-ui-desktop
- 021-ui-mobile
---

# Frontend Web Application

> **Phase**: MVP · **Priority**: High · **Subsystem**: UX

## Overview

Web application providing the complete user-facing Kindact experience. Consumes the REST APIs defined across all other specs. Built as a single-page application with server-side rendering for SEO and initial load performance.

## Design

### Stack

- **Framework**: Next.js (React) — SSR + SPA hybrid
- **Styling**: Tailwind CSS
- **Wallet connection**: wagmi + viem (EVM wallet support)
- **State management**: React Query for server state (API data), Zustand for client state
- **Auth**: SIWE (Sign-In with Ethereum) via spec 002

### Screens & User Flows

**Auth & Identity**
- Landing / connect wallet
- Sign-in with Ethereum flow
- Identity verification (Gitcoin Passport connect)
- Profile view/edit (pseudonymous: display name, bio, tags)

**Issue Discovery**
- Issue feed / browse (filterable by scope, topic, state)
- Issue search
- Issue detail view (summary, state, metrics, vote tally)

**Issue Creation (Identify)**
- New issue form (title, summary, scope, tags, reward intent)
- Duplicate suggestion step (similar issues shown before submit)

**Deliberation**
- Comments thread (anonymous aliases shown)
- Pro/con argument tree
- Proposal document (wiki view + revision history)
- AI summary panel

**Metrics & Eligibility (Decide gate)**
- Impact dimensions display (cost, time at MVP)
- Stake claim flow
- Eligibility quiz

**Voting**
- Cast/change vote
- Live tally display
- Adoption state banner

**Implementation (Implement)**
- Work packages list for an adopted issue
- Create claim
- Submit implementation report (with evidence upload)
- View claim status and verification progress

**Rewards**
- Personal $CC balance (demurrage-adjusted)
- Transaction/mint history
- Pending rewards (in holdback)

**Moderation (moderator role)**
- Flagged items queue
- Restriction management
- Case notes

### Key UX Rules

- Wallet connection is required for any write action; read-only browsing works without wallet
- Human verification prompt shown inline when a gated action is attempted
- Anonymous aliases displayed throughout deliberation (no real names or wallet addresses visible)
- Demurrage countdown shown on token balance ("decays ~X CC/month")
- Mobile-responsive; core flows must work on a phone

## Plan

- [ ] Bootstrap Next.js app with Tailwind, wagmi, and React Query
- [ ] Implement SIWE auth flow (spec 002)
- [ ] Build Gitcoin Passport connection UX (spec 003)
- [ ] Build issue feed and search
- [ ] Build issue creation flow with duplicate step and reward intent
- [ ] Build deliberation workspace (comments, arguments, proposal, AI summary)
- [ ] Build metrics display and eligibility quiz flow
- [ ] Build voting UI with live tally
- [ ] Build work package / claim / report / evidence upload flow
- [ ] Build $CC balance and history view
- [ ] Build moderator queue and case management

## Test

- [ ] Full core loop (create issue → deliberate → vote → claim → report → verify → receive CC) can be completed by a new user
- [ ] Deliberation displays anonymous aliases, not wallet addresses
- [ ] Mobile viewport: core flows usable on 375px width
- [ ] Ungated pages (issue feed, issue detail) load without wallet connection
- [ ] Human verification gate appears inline when attempting gated actions

## Notes

**Open questions:**
- i18n at MVP or English-only first?
- Native mobile app (PWA vs React Native) — post-MVP
- Whether the AI summary panel updates in real-time (websocket) or on page refresh
