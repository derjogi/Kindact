---
status: in-progress
created: '2026-03-18'
tags:
  - frontend
  - mvp
  - prototype
  - ux
priority: high
depends_on:
  - 020-ui-desktop
  - 021-ui-mobile
related:
  - 018-frontend
---

# UI Prototype (Mock-Data Frontend)

> **Phase**: MVP · **Priority**: High · **Subsystem**: UX / Prototype

## Overview

Interactive frontend prototype with mock data. No backend — all data lives in JSON fixtures and localStorage. Goal: showcase the full UI/UX, test with real users, iterate on design. When ready, swap mock hooks for real API calls.

Stack: Next.js (App Router) + Tailwind CSS + Zustand (client state) + JSON fixtures.

## Design

### Architecture

```
prototype/            (Next.js app)
  src/
    app/              Next.js App Router pages
      page.tsx        → Issue feed (browse)
      issues/
        new/page.tsx  → Create issue
        [id]/page.tsx → Issue detail
      activity/page.tsx → My Activity
      vote/page.tsx     → Quick Vote (mobile)
    components/       Shared UI components
      Layout.tsx      Global layout (top bar, bottom bar mobile)
      IssueCard.tsx   Issue list item
      HoverToolbar.tsx  Hover-to-act floating toolbar
      CommentThread.tsx Threaded comments with replies
      VoteBar.tsx     Sticky vote bar
    lib/
      mock-data.ts    8 sample issues with comments, arguments, metrics
      store.ts        Zustand store (votes, comments → localStorage)
      types.ts        TypeScript types
```

### Mock Data Strategy

- `mock-data.ts` exports 8–10 sample issues across states (deliberating, vote-ready, adopted, implementing)
- Comments, arguments, and metrics are embedded per issue
- Zustand store persists user actions (votes, new comments) to localStorage
- A fake "logged in" user with a mock $CC balance

## Plan

- [x] Scaffold Next.js app in `prototype/` with Tailwind + Zustand
- [x] Create TypeScript types and mock data fixtures (8 issues, user, activities)
- [x] Build global layout (top bar desktop, bottom bar mobile)
- [x] Build Issue Feed / Browse page (search, scope/status filters)
- [x] Build Issue Detail page (header, summary, tabs: description/comments/pro-con/history)
- [x] Build hover-to-act toolbar component (👍👎💬🏴 on hover, optional comment input)
- [x] Build comments tab with threaded replies (depth-limited, upvote/downvote/reply/flag)
- [x] Build Create Issue page (title, summary, desc, scope, tags, reward intent, duplicate detection)
- [x] Build My Activity page (balance, decay rate, activity feed)
- [x] Build Quick Vote page (card view with approve/reject/skip/read-more)
- [x] Build VoteBar component (sticky on mobile, approve/reject with live tally)
- [x] Build eligibility quiz modal (full-screen overlay, per-issue questions, pass/fail with retry)
- [x] Integrate quiz into VoteBar (triggers before first vote, skipped once passed)
- [x] Polish responsive mobile breakpoints and touch targets (44×44px min, scrollable tabs, scrollable filters)
- [ ] Deploy to Vercel (manual step)

## Test

- [ ] All 4 desktop screens render without errors
- [ ] Mock data loads and displays correctly
- [ ] Votes persist across page reloads (localStorage)
- [ ] Mobile layout activates below 768px
- [ ] No TypeScript or build errors

## Notes

**Resumption guide**: Run `cd prototype && npm run dev` to start dev server (http://localhost:3000). Check this spec's Plan section for what's done (✅) vs remaining. Build verified clean with `npm run build`.
