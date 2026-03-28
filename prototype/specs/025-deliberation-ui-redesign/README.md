---
status: complete
created: 2026-03-25
priority: high
tags:
- frontend
- deliberation
- mvp
- ux
depends_on:
- 005-deliberation-workspace
created_at: 2026-03-25T20:43:16.567833480Z
updated_at: 2026-03-29T08:35:22.520457685Z
completed_at: 2026-03-29T08:35:22.520457685Z
transitions:
- status: complete
  at: 2026-03-29T08:35:22.520457685Z
related:
- 006-ai-assist-summary
- 022-ui-prototype
- 023-db-integration
---

# Deliberation UI Redesign

> **Phase**: MVP · **Priority**: High · **Subsystem**: Frontend, Deliberation

## Overview

Redesign the issue deliberation UI to surface overlooked perspectives and make every claim traceable to its source. Key additions: a universal floating source panel, AI summary with comment-level references, spotlighted discussion threads, stance indicators on nested comments, quote-comments on descriptions, and hidden vote counts.

Full design spec: `docs/superpowers/specs/2026-03-25-deliberation-redesign-design.md`

## Design

### Page Structure (top → bottom)

1. Issue header with metrics row (all interactive → source panel)
2. Description — collapsible, collapsed by default
3. AI Summary — hover/click any word → source panel shows related comments
4. Tabs: Discussion (default) | Pro/Con | History
5. Discussion: search bar → "Add Comment" + sort → unified thread list (5 spotlights promoted, rest below)

### Universal Floating Source Panel

Sticky panel in right margin (~16% width). Responds to hover/click on summary text, description quotes, metrics, boundaries, arguments. Hover shows sources immediately; click makes it sticky. Mobile: bottom sheet on tap.

### Data Model Changes

- `AISummary`: add `references Json?` — overlapping character-position spans mapping to comment IDs with strength
- `Comment`: add `quotedText String?`, `sourceType String?` (description/metric/boundary), `sourceId String?`, `quoteStart Int?`, `quoteEnd Int?`

## Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

### Task 1: Schema — add quote-comment and summary reference fields

**Files:**
- Modify: `prisma/schema.prisma` (Comment model ~L208, AISummary model ~L284)

- [x] Add `quotedText`, `sourceType`, `sourceId`, `quoteStart`, `quoteEnd` fields to `Comment` model
- [x] Add `references Json?` field to `AISummary` model
- [x] Run `npx prisma generate` and verify no errors
- [x] Run `npx prisma db push` to apply changes
- [x] Commit: `feat(schema): add quote-comment and summary reference fields`

### Task 2: Seed — add summary references and quote-comments for issue #6

**Files:**
- Modify: `prisma/seed.ts` (~L160, AISummary creation section)
- Modify: `src/lib/mock-data.ts` (issue #6 aiSummary)

- [x] Add `references` JSON to the AISummary seed for issue #6, mapping key phrases to existing comment IDs (c30–c36b) with `direct`/`approximate` strength
- [x] Add 2-3 quote-comments in issue #6's comments array with `sourceType: "description"`, `quotedText`, `quoteStart`, `quoteEnd` fields
- [x] Update seed.ts to pass new Comment fields when creating comments
- [x] Run `npx prisma db seed` and verify clean output
- [x] Commit: `feat(seed): add summary references and quote-comments for bike lanes`

### Task 3: API — expose references and strip vote counts

**Files:**
- Modify: `src/server/deliberation/index.ts` (`getDeliberation` ~L143)
- Modify: `src/app/api/issues/[id]/deliberation/route.ts`
- Modify: `src/app/api/issues/[id]/route.ts`

- [x] In `getDeliberation`, include `AISummary.references` in the response
- [x] In `getDeliberation`, include quote-comment fields (`quotedText`, `sourceType`, `sourceId`, `quoteStart`, `quoteEnd`) on returned comments
- [x] Strip `upvotes`/`downvotes` from comments returned to client (keep only for the requesting user's own votes — or omit entirely for now since individual vote tracking per user isn't wired up yet)
- [x] In the issue detail API, include `AISummary` with references
- [x] Verify deliberation API response shape with a manual curl test
- [x] Commit: `feat(api): expose summary references, strip vote counts`

### Task 4: Component — SourcePanel

**Files:**
- Create: `src/components/SourcePanel.tsx`

- [x] Build `SourcePanel` component: a sticky-positioned box that sits in the right margin
- [x] Props: `sources: { commentId, alias, text, strength }[]`, `label: string`, `onJumpToComment: (id: string) => void`, `idle: boolean`
- [x] Idle state: small box with 💬 icon and hint text
- [x] Active state: list of source comment cards with "↓ jump" links, grouped by strength (`direct` first, then `see also`)
- [x] Max-height with scroll overflow
- [x] Smooth fade-in transition when sources change
- [x] Commit: `feat(ui): add SourcePanel component`

### Task 5: Component — CollapsibleDescription

**Files:**
- Create: `src/components/CollapsibleDescription.tsx`

- [x] Build collapsible description section: collapsed by default, click to expand
- [x] When expanded, track mouse selection — on text selection, show a floating "💬 Comment on this" button near the selection
- [x] Clicking the button opens an inline comment input with the selected text shown as a quote
- [x] On submit, call `postComment` with `quotedText`, `sourceType: "description"`, `quoteStart`, `quoteEnd`
- [x] When hovering over a passage that has existing quote-comments, highlight it faintly and populate the SourcePanel
- [x] Commit: `feat(ui): add CollapsibleDescription with quote-comment support`

### Task 6: Component — SummaryWithRefs

**Files:**
- Create: `src/components/SummaryWithRefs.tsx`

- [x] Build summary component that renders AI summary as clean text (no decoration in idle)
- [x] On hover over a word: find all reference spans containing that character position, apply faint yellow highlight to the word, populate SourcePanel with merged comment IDs grouped by strength
- [x] On click: make the selection "sticky" (persists when mouse moves away), dim rest of summary slightly
- [x] Click elsewhere or press Escape to clear sticky selection
- [x] Commit: `feat(ui): add SummaryWithRefs with hover/click source linking`

### Task 7: Component — ThreadList with spotlights and stance indicators

**Files:**
- Modify: `src/components/CommentThread.tsx`
- Create: `src/components/ThreadList.tsx`

- [x] Create `ThreadList`: renders a unified list of top-level comments. First 5 marked as spotlights (purple left border `border-l-2 border-violet-500`), rest as regular threads
- [x] Each thread item shows: alias, time, text preview, reply count (no vote counts)
- [x] Click a thread → expands inline to show full nested thread
- [x] "Add Comment" button and Sort dropdown at the top of the list
- [x] Modify `CommentThread` (the nested reply view): add stance indicator styling — `pro` gets green left border (3px `border-emerald-400`) + small green pill "SUPPORTING"; `con` gets orange left border (`border-orange-400`) + orange pill "COUNTER"; null gets no decoration
- [x] Remove visible upvote/downvote counts from `CommentItem` (keep the vote buttons themselves, just don't show counts)
- [x] Commit: `feat(ui): add ThreadList with spotlights and stance indicators`

### Task 8: Component — DiscussionSearch

**Files:**
- Create: `src/components/DiscussionSearch.tsx`

- [x] Build search bar component with text input + "Search" button
- [x] On enter/click: call a search endpoint or filter comments client-side (for now, simple client-side text match is fine — AI search is out of scope)
- [x] When active, replaces the thread list with search results (same card format)
- [x] Clear/cancel button to return to normal thread list
- [x] Commit: `feat(ui): add DiscussionSearch component`

### Task 9: Wire up — issue detail page

**Files:**
- Modify: `src/app/issues/[id]/page.tsx`

- [x] Replace page layout: add `SourcePanel` as a sticky element in a right margin (flex layout: main ~84%, panel ~16%)
- [x] Add source panel context/state: track `activeSources` and `activeLabel`, pass to `SourcePanel`
- [x] Replace Description tab with `CollapsibleDescription` above the summary, wired to populate source panel on quote-comment hover
- [x] Replace AI Summary section with `SummaryWithRefs`, wired to populate source panel on hover/click
- [x] Make metric and boundary chips populate source panel on hover (query comments with matching `sourceType`/`sourceId`)
- [x] Replace Comments tab content with `DiscussionSearch` + `ThreadList`
- [x] Keep Pro/Con tab as-is
- [x] Remove "Description" from tabs array (now collapsible above summary)
- [x] Wire "jump to comment" from source panel: scroll to comment element and briefly highlight it
- [x] Commit: `feat(ui): wire up deliberation redesign on issue detail page`

### Task 10: Mobile — bottom sheet source panel

**Files:**
- Modify: `src/components/SourcePanel.tsx`

- [x] Add responsive behavior: on screens < 768px, render as a bottom sheet instead of side panel
- [x] Bottom sheet slides up when sources are active, swipe/tap outside to dismiss
- [x] Main content goes full-width on mobile (no right margin)
- [x] Commit: `feat(ui): responsive source panel with mobile bottom sheet`

## Test

- [x] Issue #6 detail page loads with summary, spotlights, thread list
- [x] Hovering a word in the summary populates the source panel with relevant comments
- [x] Clicking a source card scrolls to and highlights that comment in the thread list
- [x] Hovering a metric (e.g. Cost) shows related comments in source panel
- [x] Expanding a thread shows stance indicators (green/orange borders + pills) on replies
- [x] Vote counts are not visible on other users' comments
- [x] Description is collapsible; text selection shows "Comment on this"
- [x] Search bar filters threads on enter, clear returns to full list
- [x] Spotlighted threads appear at top with purple left border
- [x] Source panel is sticky and doesn't cause layout shifts
- [x] Mobile: source panel renders as bottom sheet

## Notes

**Out of scope (future):**
- Spotlight selection algorithm (backend) — currently hardcoded first 5
- AI-powered search (currently client-side text match)
- AI summary generation pipeline
- AI reference span generation (currently seeded manually)
- Real-time summary updates
- Individual per-user vote tracking (to show "your vote" state)
