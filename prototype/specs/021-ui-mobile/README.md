---
status: planned
created: '2026-03-18'
tags:
  - frontend
  - mvp
  - ux
  - mobile
  - wireframes
priority: medium
depends_on:
  - 020-ui-desktop
related:
  - 018-frontend
  - 004-issue-intake
  - 005-deliberation-workspace
  - 008-voting-engine
---

# Mobile UI Design

> **Phase**: MVP · **Priority**: Medium · **Subsystem**: UX / Design

## Overview

Simplified mobile experience (375–428px). Mobile is **read-heavy, act-light**: optimized for browsing issues, reading discussions, and quick voting. Full issue creation and detailed deliberation are deferred to desktop. The mobile UI is a strict subset of the desktop feature set.

## Design

### What Mobile Does

| Action | Mobile | Desktop |
|--------|--------|---------|
| Browse / search issues | ✅ | ✅ |
| Read issue detail + summary | ✅ | ✅ |
| Read comments | ✅ | ✅ |
| Vote (approve / reject) | ✅ | ✅ |
| Quick comment / reply | ✅ | ✅ |
| Upvote / downvote content | ✅ | ✅ |
| View $CC balance | ✅ | ✅ |
| Create new issue | ❌ (link to desktop) | ✅ |
| Edit proposal body | ❌ | ✅ |
| Pro/con argument tree | ❌ (read-only list) | ✅ full tree |
| Metrics deep-dive / vote on metrics | ❌ | ✅ |
| Submit implementation report | ❌ (link to desktop) | ✅ |
| Moderator tools | ❌ | ✅ |

### Mobile Layout

```
┌────────────────────────┐
│ [☰]  Kindact    [🔔 👤]│  ← Sticky header
├────────────────────────┤
│                        │
│    Page Content        │
│                        │
│                        │
├────────────────────────┤
│ [🏠] [🔍] [⬆️]  [👤]  │  ← Bottom tab bar
└────────────────────────┘
```

- **Header**: Hamburger (for settings/profile), logo, notification + avatar
- **Bottom bar**: Home (feed), Search, Quick Vote (shows issues awaiting your vote), Profile/Activity
- No top navigation links — everything through bottom tabs and the hamburger

---

### Screen 1: Issue Feed (Home)

```
┌────────────────────────┐
│ [☰]  Kindact    [🔔 👤]│
├────────────────────────┤
│ Scope ▾  Status ▾      │  ← Horizontal filter chips
├────────────────────────┤
│                        │
│ 🟢 Fix drainage on    │
│    Elm Street          │
│    Local · 12 people   │
│    Deliberating · 3d   │
│ ────────────────────── │
│ 🔵 Community solar    │
│    panel program       │
│    National · 87 ppl   │
│    Voting · 1w         │
│ ────────────────────── │
│ 🟡 Reduce packaging   │
│    waste citywide      │
│    Local · 24 people   │
│    Deliberating · 5d   │
│                        │
└────────────────────────┘
```

- Card-style list, one issue per card
- Tap to open detail
- Pull-to-refresh
- Filter chips scroll horizontally

---

### Screen 2: Issue Detail (Mobile)

Collapsed version of desktop. Stacked vertically, swipeable sections.

```
┌────────────────────────┐
│ ← Issues        [🔔 👤]│
├────────────────────────┤
│                        │
│ Fix drainage on        │
│ Elm Street             │
│ "Recurring flooding    │
│  after rain damages    │
│  sidewalks..."         │
│                        │
│ 🟢 Deliberating        │
│ 12 participants        │
│ 💰 ~$15k  ⏱ 3mo       │
│                        │
│ ── Summary ──────────  │
│ AI summary text...     │
│ 🟢 Updated since       │
│    your last visit     │
│                        │
│ ── Comments (34) ────  │
│ 🦉 Owl · 2h ago       │
│ "The drainage plan     │
│  doesn't account..."  │
│   👍 12  👎 2  💬 3    │
│                        │
│ 🦊 Fox · 1h ago       │
│ "Good point — the      │
│  2019 survey shows..." │
│   👍 8   👎 0  💬 1    │
│                        │
│ [Load more comments]   │
│                        │
│ [💬 Add comment]       │
│                        │
├────────────────────────┤
│ ┌────────────────────┐ │
│ │ ✅ Approve  ❌ Reject│ │  ← Sticky vote bar
│ └────────────────────┘ │  (when vote-ready)
└────────────────────────┘
```

- **No tabs** — sections stack vertically (header → summary → comments)
- Pro/con arguments shown as a flat "Pro (5) / Con (3)" summary, not a tree
- Vote/comment actions are **always visible** (not hover-dependent — mobile has no hover)
  - Upvote/downvote/reply shown inline beneath each comment
  - Voting bar sticky at bottom when issue is in vote-ready state
- Eligibility quiz appears as a full-screen modal before first vote

---

### Screen 3: Quick Vote Queue

A mobile-only view for fast decision-making.

```
┌────────────────────────┐
│ ← Back         [🔔 👤] │
├────────────────────────┤
│                        │
│  Issues awaiting       │
│  your vote (3)         │
│                        │
│ ┌────────────────────┐ │
│ │ Community solar    │ │
│ │ panel program      │ │
│ │ National · 87 ppl  │ │
│ │                    │ │
│ │ Summary: Install   │ │
│ │ solar panels on    │ │
│ │ public buildings...│ │
│ │                    │ │
│ │ 78% approve (82)   │ │
│ │                    │ │
│ │ [✅ Approve]       │ │
│ │ [❌ Reject]        │ │
│ │ [📖 Read more]     │ │
│ └────────────────────┘ │
│         ↕ swipe        │
└────────────────────────┘
```

- One issue card at a time, swipeable (like a card stack)
- Shows summary + current tally
- "Read more" opens full detail view
- Eligibility gate still applies — quiz modal pops before first vote if needed

---

### Screen 4: Profile / Activity

```
┌────────────────────────┐
│ ← Back         [🔔 👤] │
├────────────────────────┤
│                        │
│  💰 142.3 $CC          │
│  decays ~1.4/mo        │
│                        │
│  ── Recent ──────────  │
│  Commented on "Elm     │
│  Street" · 2h ago      │
│                        │
│  Voted Approve on      │
│  "Solar panels" · 1d   │
│                        │
│  Earned 25 $CC for     │
│  "Park cleanup" · 3d   │
│                        │
└────────────────────────┘
```

Simple chronological activity feed. Tap any item to navigate to the issue.

## Plan

- [ ] Define mobile feature subset (this spec's table above)
- [ ] Create wireframes for 4 mobile screens (feed, detail, quick-vote, profile)
- [ ] Design touch-friendly vote/comment inline actions (no hover dependency)
- [ ] Design sticky vote bar for issue detail
- [ ] Design quick-vote swipeable card component
- [ ] Design eligibility quiz as full-screen mobile modal
- [ ] Create tappable prototype for usability testing
- [ ] Test on actual devices (iOS Safari, Android Chrome) at 375px

## Test

- [ ] All mobile screens usable one-handed on a 375px viewport
- [ ] Tap targets are minimum 44×44px (Apple HIG)
- [ ] Issue feed loads and scrolls smoothly with 50+ issues
- [ ] Vote action completes in ≤2 taps from issue detail
- [ ] No horizontal scrolling on any screen
- [ ] "Create issue" gracefully redirects to desktop with a clear message

## Notes

**Key difference from desktop:** Mobile replaces hover-to-act with always-visible but compact inline actions (small icon row beneath each content element). This avoids the "hidden functionality" problem on touch devices.

**Open questions:**
- PWA vs native app vs responsive web only?
- Offline support for reading cached issues?
- Should quick-vote queue include a mini eligibility quiz inline or still use full modal?
