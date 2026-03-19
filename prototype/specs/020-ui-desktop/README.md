---
status: planned
created: '2026-03-18'
tags:
  - frontend
  - mvp
  - ux
  - desktop
  - wireframes
priority: high
depends_on:
  - 018-frontend
related:
  - 021-ui-mobile
  - 004-issue-intake
  - 005-deliberation-workspace
  - 007-metrics-eligibility
  - 008-voting-engine
---

# Desktop UI Design

> **Phase**: MVP · **Priority**: High · **Subsystem**: UX / Design

## Overview

Desktop wireframe spec for Kindact. The desktop UI is the primary experience and exposes the full feature set. Design principle: **radical simplicity** — the platform deals with inherently complex topics (governance, metrics, voting, economics), so the UI must compensate by being extremely clean, focused, and calm. Every screen has one clear purpose. Progressive disclosure keeps advanced features out of the way until needed.

## Design

### Design Principles

1. **One purpose per screen** — no multi-panel dashboards; each page does one thing well
2. **Progressive disclosure** — hover/click reveals actions; nothing clutters the default view
3. **Quiet chrome** — minimal navigation, muted colors, generous whitespace
4. **Content-first** — the community's words and data are the hero, not the UI
5. **Gentle interactions** — hover effects reveal contextual actions (vote, comment, flag) as a floating toolbar; never persistent button bars

### Global Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]   Issues   Create   My Activity    [Wallet/🔔]  │  ← Top bar (fixed)
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   Page Content                          │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Top bar**: Logo, 3 nav links (Issues, Create, My Activity), wallet status + notification bell. That's it.
- No sidebar. No footer navigation. No hamburger menus on desktop.
- Breadcrumbs appear below the top bar only when navigating into nested views (e.g. Issue → Deliberation).

---

### Screen 1: Issue Browse / Discovery

The landing page after sign-in. A clean, scannable list.

```
┌─────────────────────────────────────────────────────────┐
│  Search: [________________________] [🔍]                │
│                                                         │
│  Filters:  Scope ▾   Topic ▾   Status ▾   Sort ▾       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🟢 Fix drainage on Elm Street            Local    │  │
│  │    12 participants · Deliberating · 3d ago        │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🔵 Community solar panel program         National │  │
│  │    87 participants · Voting · 1w ago              │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🟡 Reduce packaging waste citywide       Local    │  │
│  │    24 participants · Deliberating · 5d ago        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                    Load more ↓                          │
└─────────────────────────────────────────────────────────┘
```

- Each row: color-coded status dot, title, scope badge, participant count, stage, recency
- Hover on a row → subtle highlight, no extra buttons here (click goes to detail)
- Filters collapse into a single row of dropdowns
- Infinite scroll or "Load more" — no pagination numbers

---

### Screen 2: Create Issue

A focused, single-column form. No distractions.

```
┌─────────────────────────────────────────────────────────┐
│  Create a New Issue                                     │
│                                                         │
│  Title                                                  │
│  [_______________________________________________]      │
│                                                         │
│  Summary (1–2 sentences)                                │
│  [_______________________________________________]      │
│                                                         │
│  Description                                            │
│  [                                                ]     │
│  [                (rich text editor)               ]    │
│  [                                                ]     │
│                                                         │
│  Scope       [Local ▾]   Location  [_____________]      │
│  Topics      [+ Add tag]                                │
│  Reward      [___] $CC per [unit ▾]  Schedule [▾]       │
│                                                         │
│  ┌─ Similar issues found ──────────────────────────┐    │
│  │  ⚠ "Drainage issues on Main St" — 80% similar  │    │
│  │     → View issue                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│             [Cancel]          [Submit Issue]             │
└─────────────────────────────────────────────────────────┘
```

- Similar-issues panel appears dynamically as user types the title
- Minimal required fields (title, summary, scope)
- Reward intent section clearly optional with sensible defaults

---

### Screen 3: Issue Detail / Contribute

The heart of the app. Three zones stacked vertically, with hover-to-act on every content element.

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Issues                                        │
│                                                         │
│ ┌─ HEADER ─────────────────────────────────────────────┐│
│ │  Fix drainage on Elm Street                          ││
│ │  "Recurring flooding after rain damages sidewalks    ││
│ │   and creates safety hazards for pedestrians."       ││
│ │                                                      ││
│ │  Status: Deliberating    Scope: Local                ││
│ │  Participants: 12   Comments: 34   Vote: —           ││
│ │                                                      ││
│ │  ┌─ Metrics ──────────────────────────────────┐      ││
│ │  │  💰 Cost: ~$15k  (med conf)  ⏱ Time: 3mo  │      ││
│ │  │         ↕ hover for vote/comment           │      ││
│ │  └────────────────────────────────────────────┘      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ SUMMARY ───────────────────────────────────────────┐ │
│ │  AI-generated summary of current discussion state.  │ │
│ │  Key points: ...                                    │ │
│ │  Areas of consensus: ...                            │ │
│ │  Open questions: ...                                │ │
│ │  🟢 Updated since your last visit (highlighted)     │ │
│ │                              [✏️ Suggest edit]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ TABS ──────────────────────────────────────────────┐ │
│ │  [Description]  [Comments]  [Pro/Con]  [History]    │ │
│ │                                                     │ │
│ │  (Tab: Description — wiki-editable proposal body)   │ │
│ │  (Tab: Comments — threaded, anonymous aliases)      │ │
│ │  (Tab: Pro/Con — Kialo-style argument tree)         │ │
│ │  (Tab: History — revision log with diffs)           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ VOTING BAR (when issue is vote-ready) ─────────────┐ │
│ │  [✅ Approve]   [❌ Reject]      78% approval (12)  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Hover-to-Act Pattern (key interaction)

When the user hovers over **any actionable content element** (a metric, a summary paragraph, a comment, an argument node), a small floating toolbar fades in:

```
          ┌──────────────────────────────┐
          │  👍  👎  💬  🏴  ✏️          │
          └──────────────────────────────┘
```

- 👍 Upvote / 👎 Downvote — cast a micro-vote on that specific element
- 💬 Comment — opens an inline reply/annotation anchored to that element
- 🏴 Flag — report as misleading, off-topic, or harmful
- ✏️ Edit — propose a change (for editable elements like summary/proposal)

Clicking 👍/👎 expands a small optional text field: "Why?" — so users can leave a brief rationale with their vote. Not required.

This pattern keeps the default view **completely clean** while making every element interactive on demand.

#### Comments Tab Detail

```
  Anonymous Owl 🦉 · 2h ago
  "The current drainage plan doesn't account for the slope
   on the north side of the street."
        └─ Reply (3)
           Anonymous Fox 🦊 · 1h ago
           "Good point — the 2019 survey shows a 4% grade..."

  Anonymous Bear 🐻 · 5h ago
  "We should consider permeable pavement instead of pipes."
  ● Pro-argument linked
```

- Anonymous animal aliases (consistent per user per issue)
- Thread depth limited to 3 levels to prevent deep nesting
- Comments tagged as pro/con link to the argument tree
- New-since-last-visit indicator on unread comments

---

### Screen 4: My Activity

Personal dashboard — simple list view, not a complex dashboard.

```
┌─────────────────────────────────────────────────────────┐
│  My Activity                                            │
│                                                         │
│  💰 Balance: 142.3 $CC  (decays ~1.4/mo)               │
│                                                         │
│  [My Issues]  [My Votes]  [My Claims]  [Notifications]  │
│                                                         │
│  (Tab content: simple chronological list of actions)    │
│                                                         │
│  • You commented on "Elm Street drainage" — 2h ago      │
│  • You voted Approve on "Solar panel program" — 1d ago  │
│  • Your claim on "Park cleanup" was verified — 3d ago   │
│  • You earned 25 $CC for "Park cleanup" — 3d ago        │
└─────────────────────────────────────────────────────────┘
```

---

### Eligibility Gate (Modal/Overlay)

When a user clicks "Vote" and hasn't passed eligibility yet:

```
┌───────────────────────────────────────────┐
│  Before you vote                          │
│                                           │
│  1. Stakeholder check                     │
│     ✅ Auto-verified (you live in area)   │
│                                           │
│  2. Quick comprehension check             │
│     Q1: What is the main goal of this     │
│         proposal?                         │
│     ○ A) Improve drainage  ← correct      │
│     ○ B) Build a new road                 │
│     ○ C) Expand the park                  │
│                                           │
│              [Submit]                     │
└───────────────────────────────────────────┘
```

Lightweight overlay, not a new page. Pass = proceed to vote immediately.

## Plan

- [ ] Finalize design principles doc and share with contributors
- [ ] Create wireframes for all 4 main screens (browse, create, detail, activity)
- [ ] Design hover-to-act floating toolbar component
- [ ] Design eligibility gate overlay
- [ ] Design "changes since last visit" highlight pattern
- [ ] Define responsive breakpoints for desktop (1024px+)
- [ ] Create a clickable prototype (Figma / HTML) for usability testing
- [ ] Usability test with 3–5 people unfamiliar with governance platforms

## Test

- [ ] A new user can browse issues, create an issue, and vote within 5 minutes without guidance
- [ ] Hover-to-act toolbar appears within 200ms and does not obscure content
- [ ] Issue detail page loads with header + summary visible above the fold (no scrolling needed to understand the issue)
- [ ] No screen has more than 5 primary actions visible at once
- [ ] All text is readable at default browser font size (no text smaller than 14px)

## Notes

**Design philosophy**: Think "Notion meets Wikipedia meets Reddit" — clean document feel, collaborative editing, threaded discussion — but with the governance layer (voting, metrics, verification) tucked behind progressive disclosure so it never overwhelms.

**Open questions:**
- Color scheme: warm neutral palette vs cool/blue institutional feel?
- Should the pro/con tree be a separate tab or inline with comments?
- Notification model: bell icon with dropdown vs dedicated notifications page?
- Accessibility: WCAG AA as MVP target?
