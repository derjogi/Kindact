# Deliberation System Redesign

## Goal

Redesign the issue deliberation UI to facilitate better discussions, surface overlooked perspectives, and make every claim traceable to its source. The system should make it easy to understand what the main concerns are and help the community reach the best outcome.

## Design Decisions

### Discussion Model: Hybrid (Spotlights + Threads + AI)

The primary discussion view combines Reddit-style threaded comments with AI-powered features:

- **AI Summary** at the top, with a universal source panel that links claims to comments
- **Spotlighted threads** promoted to the top of a unified thread list
- **AI-powered search** via a search bar (results shown on enter/click, not live)
- **Threaded comments** that expand inline with stance indicators

### Page Structure (top to bottom)

1. **Issue header** — title, status, scope, participants
2. **Metrics row** — cost, time, boundary impacts (all interactive → source panel)
3. **Description** — collapsible, shown above summary, collapsed by default
4. **AI Summary** — clean text, no decoration; hover/click any word reveals related source comments in the floating source panel
5. **Tabs**: Discussion (default) | Pro/Con | History
6. **Discussion tab contents**:
   - Search bar (AI-powered, replaces thread list on enter/click)
   - "Add Comment" button + Sort dropdown
   - Unified thread list: 5 spotlighted threads promoted to top (purple left border), remaining threads below in continuous list
   - Click thread → expands inline showing nested replies with stance indicators

### Floating Source Panel (Universal)

A persistent, sticky panel in the right margin (~16% width) that responds to hover/click on any interactive element across the page.

**Idle state**: Small box with hint text ("Hover or click on any element to see related comments").

**Active state**: Populates with source comment cards when hovering/clicking:
- Summary text → comments that informed that part of the summary
- Description text → quote-comments users attached to highlighted passages
- Metrics/impacts → comments that discussed/challenged that value
- Pro/con arguments → threaded replies to that argument

**Behaviors**:
- `position: sticky` — follows scroll, always in view
- Main content never shifts — margin is always reserved
- Rest of page dims slightly on hover/click to focus attention
- Hover shows sources immediately; click makes it "sticky" (persists when mouse moves away)
- Panel has max-height with scroll if many comments reference the same thing
- **Mobile**: becomes a bottom sheet that slides up on tap, swipe down to dismiss

### Summary ↔ Comment Linking

The AI generates overlapping character-position reference spans when producing the summary. Each span maps to comment IDs with a strength level.

**Data model**:
```json
{
  "content": "...usage data is biased toward neighborhoods...",
  "references": [
    { "start": 72, "end": 82, "text": "usage data",
      "commentIds": ["c35", "c35a", "c31a"],
      "strength": "direct" },
    { "start": 86, "end": 92, "text": "biased",
      "commentIds": ["c35a", "c35"],
      "strength": "direct" },
    { "start": 72, "end": 127,
      "text": "usage data is biased toward...infrastructure",
      "commentIds": ["c35", "c35a", "c33b"],
      "strength": "direct" }
  ]
}
```

**Interaction**: When user hovers/clicks a word, the UI finds all spans containing that character position, merges comment IDs, and groups them by strength ("direct" → **Related**, "approximate" → **See also**). Surrounding context (neighboring words in matching spans) gets a faint yellow highlight. The clicked/hovered word gets a slightly stronger highlight (dotted underline).

**Feasibility note**: ~60-80% of summary content will be traceable. Unreferenced text has no interaction — the system is honest about what it can and can't trace. The AI may also include "approximate" references for indirect influences (e.g., "see discussion under post X").

### Quote-Comments on Description

Users can highlight text in the description and attach a comment to that selection (Medium-style "comment on this" flow).

- Select text → "💬 Comment on this" button appears
- Comment lives in the discussion thread like any other comment, with `quotedText`, `sourceType: "description"`, and character positions attached
- Description text is not visually cluttered — but when hovering over a passage with quote-comments, the source panel populates

### Stance Indicators on Nested Comments

When a thread expands, nested replies show their stance relative to the parent comment:

- **Supporting (pro)**: Subtle green left border (3px, `#4ade80`) + small pill label "SUPPORTING" in green
- **Counter (con)**: Subtle orange left border (3px, `#fb923c`) + small pill label "COUNTER" in orange
- **Neutral/unset**: No decoration at all

Stance is set by the comment author when replying (optional). The data layer keeps `"pro"` / `"con"` / `null`; the UI maps to "Supporting" / "Counter".

### Vote Visibility

Up/downvote counts are **hidden** from other users. Only your own vote state is visible (whether you upvoted or downvoted). This prevents popularity bias — people judge comments on merit, not crowd agreement.

### Spotlight Selection

5 top-level comments are promoted to the top of the thread list with a purple left border. Selection algorithm (backend, not in initial UI scope):
- 2 random from the 10 most-interacted-with threads
- 2 random from the least-interacted-with threads
- 1 completely random

### Pro/Con Tab (Separate)

Kept as a separate tab alongside Discussion. Provides a structured Kialo-style argument tree view. Shares data with the discussion — a comment tagged pro/con can appear in both views.

### Tabs

- **Discussion** (default) — the unified thread/spotlight/search view described above
- **Pro/Con** — structured argument tree
- **History** — timeline of changes

"Description" is no longer a tab; it's a collapsible section above the summary.

## Data Model Changes

### AISummary — add references

Add a `references` JSON field to the existing `AISummary` model:

```prisma
model AISummary {
  // ... existing fields ...
  references Json? // Array of { start, end, text, commentIds, strength }
}
```

### Comment — add quote-comment fields

Add fields to support quote-comments on description text:

```prisma
model Comment {
  // ... existing fields ...
  quotedText   String?  // the text passage being quoted
  sourceType   String?  // "description" | "metric" | "boundary" | null
  sourceId     String?  // ID of the metric/boundary being commented on, if applicable
  quoteStart   Int?     // character position start in source
  quoteEnd     Int?     // character position end in source
}
```

### Metric/Boundary comment linking

Comments about metrics or boundaries use the same `sourceType` + `sourceId` fields on Comment. When hovering a metric, the UI queries comments where `sourceType = "metric"` and `sourceId` matches that metric's ID.

## Mock Data

Issue #6 (Bike lane network expansion) has been expanded with 23 comments across 7 threads and 6 structured arguments, covering:
- Safety vs usage prioritization
- Protected vs painted lane tradeoffs
- Cost estimate challenges ($200k → $300-500k)
- Parking displacement concerns
- School safety (children's routes)
- Equity (west side infrastructure gap)
- Quick-win interim protection

## Out of Scope (Future)

- Spotlight selection algorithm implementation (backend)
- AI search implementation
- AI summary generation pipeline
- AI reference span generation
- Real-time summary updates
- Conviction/fluid voting mechanics on the discussion layer
