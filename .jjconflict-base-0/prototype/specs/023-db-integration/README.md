---
status: complete
created: 2026-03-20
priority: high
tags:
- database
- prisma
- integration
depends_on:
- 022-ui-prototype
created_at: 2026-03-20T10:42:34.162701526Z
updated_at: 2026-04-01T09:46:58.692202615Z
completed_at: 2026-04-01T09:46:58.692202615Z
transitions:
- status: complete
  at: 2026-04-01T09:46:58.692202615Z
---

# Database Integration — Wire Frontend to Prisma

> **Status**: in-progress · **Priority**: high · **Created**: 2026-03-20

## Overview

The prototype frontend uses mock data from `src/lib/mock-data.ts` and a Zustand store for client-side state. The backend server modules (`src/server/*`) are fully wired to Prisma but the frontend never calls them. This spec wires the frontend to the real database through the existing API routes.

## Design

- **Database**: PostgreSQL (`kindact_dev`) via Prisma, using Unix socket auth
- **Seed**: `prisma/seed.ts` populates the DB with the same 8 issues from mock-data, including comments, arguments, metrics, AI summaries, decision states, aliases, reward intents, and a current user with a token account
- **Auth**: Dev-only `/api/auth/dev-login` route auto-creates a session for the seed user (wallet `0xdev...`). The client API layer auto-authenticates on first authed request
- **Data layer**: `src/lib/api.ts` provides typed fetch functions for all API routes, with transparent auth token management via localStorage

## Plan

- [x] Set up `.env` with DATABASE_URL (Unix socket auth for local postgres)
- [x] Run `bun install`, `prisma generate`, `prisma migrate deploy`
- [x] Create `prisma/seed.ts` — seeds all mock data into the DB with deterministic UUIDs
- [x] Add wallet link to seed user so dev-login can find them
- [x] Run `prisma db seed` — verified working
- [x] Create `/api/auth/dev-login` route for prototype auth
- [x] Create `src/lib/api.ts` — client-side API layer with auto-auth
- [x] Rewire `page.tsx` (Issue Feed) — fetches from API, loading state, DB status enums
- [x] Update `IssueCard.tsx` — accepts DB shape, handles `vote_ready` status
- [x] Rewire `issues/[id]/page.tsx` (Issue Detail) — fetches issue + deliberation from API
- [x] Update `CommentThread.tsx` — uses `postComment` API, accepts DB comment shape
- [x] Update `VoteBar.tsx` — uses `postVote` API, accepts individual props
- [x] Rewire `vote/page.tsx` (Quick Vote) — fetches vote-ready issues, inline vote buttons
- [x] Rewire `activity/page.tsx` — fetches user profile + balance from DB
- [x] Create `/api/me/balance` route — returns demurrage-adjusted balance
- [x] Rewire `issues/new/page.tsx` — submits via `createIssue` API, debounced duplicate detection
- [x] Fix build — fixed TypeScript cast error in issue detail page
- [x] Smoke test — all API endpoints return correct data from DB
- [x] Verify write operations — post comment, cast vote both persist to DB and return correctly
- [x] Clean up — no remaining imports of `@/lib/mock-data` or `@/lib/store`
- [x] Add `BoundaryAssessment` model to Prisma schema (label, icon, direction, delta, confidence, authorId)
- [x] Run migration `add_boundary_assessments`, regenerate Prisma client
- [x] Add boundary seeding to `prisma/seed.ts`
- [x] Include `boundaries` in `getIssue` server query
- [x] Restore boundary impact chips in issue detail page UI
- [x] Re-run `prisma db seed` to populate boundary data
- [x] Re-run `next build` — compiles successfully

## Test

- [x] `npx next build` compiles without errors
- [ ] All 5 pages render in browser with data from the database (API-verified, browser not tested)
- [ ] Creating an issue persists to DB and redirects to detail page (API-verified)
- [x] Posting a comment persists to DB (verified via curl)
- [x] Casting a vote updates the tally in DB (verified via curl)

## Notes

- Activity feed still shows static placeholder data — ledger events don't map cleanly to the UI format
- `EligibilityModal` still uses hardcoded issue IDs ("2", "7") for quiz data — needs updating to UUID-based IDs
