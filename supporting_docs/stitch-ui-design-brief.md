# Kindact UI Design Brief — Google Stitch

## What is Kindact?

Kindact is an open-source governance platform that helps communities make good decisions and incentivize coordinated implementation of those decisions. It runs a full loop from ideas to outcomes:

1. **Identify** — Anyone opens an issue (local problem or global challenge)
2. **Deliberate** — Communities discuss with bias-reducing mechanisms (anonymized identities, randomized display)
3. **Decide** — People vote directly, delegate votes by topic, or use consensus-style iteration
4. **Implement** — Contributors execute approved work and submit proof of progress
5. **Reward** — Verified contributors receive $CC tokens for measurable, community-approved impact

The key differentiator: Kindact links decision-making with implementation tracking and economic rewards. Without economic incentives, decisions don't get implemented. Without good deliberation, incentives get misaligned.

**Kindact is an incentive layer, not an enforcement layer.** It cannot force anyone — it can only reward actions the community approves.

---

## Design Philosophy

### Radical Simplicity
The platform deals with inherently complex topics (governance, metrics, voting, economics), so the UI must compensate by being extremely clean, focused, and calm. Every screen has one clear purpose.

### Core Principles
1. **One purpose per screen** — no multi-panel dashboards; each page does one thing well
2. **Progressive disclosure** — hover/click reveals actions; nothing clutters the default view
3. **Quiet chrome** — minimal navigation, muted colors, generous whitespace
4. **Content-first** — the community's words and data are the hero, not the UI
5. **Gentle interactions** — hover effects reveal contextual actions as a floating toolbar; never persistent button bars

### Visual Direction
- Think "Notion meets Wikipedia meets Reddit" — clean document feel, collaborative editing, threaded discussion — but with the governance layer (voting, metrics, verification) tucked behind progressive disclosure so it never overwhelms
- Warm neutral palette (stone/cream tones), not cold/institutional blue
- Generous whitespace, readable typography (nothing smaller than 12px)
- Status colors: green = deliberating, blue = voting, violet = adopted, amber = implementing, dark gray = completed

---

## Navigation & Layout

### Global Structure
```
┌─────────────────────────────────────────────────────────┐
│  [Kindact Logo]   Issues   Create   My Activity         │
│                                    [142.3 $CC]  [🔔]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   Page Content                          │
│                   (max-width ~80%sw, centered)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Top bar**: Logo, 3 nav links, wallet balance ($CC), notification bell. Fixed/sticky.
- No sidebar. No footer nav. No hamburger on desktop.
- Mobile: bottom tab bar with icons (🏠 Home, ➕ Create, 🗳️ Vote, 👤 Activity)

---

## Screen 1: Onboarding (First Visit)

A welcoming intro that explains the core loop before users see the issue feed. Only shown once on first visit.

### Content
A full-page visual walkthrough with 3-4 steps:

1. **"See a problem? Raise it."** — illustration of someone creating an issue
2. **"Discuss solutions together."** — illustration of anonymous deliberation (animal avatars talking)
3. **"Vote on what matters."** — illustration of approval voting with a metrics gate
4. **"Do the work. Get rewarded."** — illustration of someone submitting proof of work and receiving $CC tokens + a Hypercert impact credential

Each step is a card/slide with a simple illustration, a headline, and one sentence of explanation. A "Get Started →" button at the end leads to the issue feed.

### Design Notes
- Feels warm and inviting, not corporate
- Emphasize the unique end-to-end loop — this is what makes Kindact different
- Should take <30 seconds to read through

---

## Screen 2: Issue Feed (Home / Dashboard)

The landing page after onboarding. A clean, scannable list of community issues.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Community Health (subtle top banner)                    │
│  247 $CC minted · 18 verified implementations · 42 active│
│                                                         │
│  Search: [________________________] [🔍]                │
│                                                         │
│  Filters:  Scope ▾   Topic ▾   Status ▾                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🟢 Fix drainage on Elm Street            Local    │  │
│  │    12 participants · Deliberating · 3d ago        │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🔵 Community solar panel program         National │  │
│  │    87 participants · Voting · 1w ago              │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🟡 Reduce packaging waste citywide       Local    │  │
│  │    24 participants · Implementing · 5d ago        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                    Load more ↓                          │
└─────────────────────────────────────────────────────────┘
```

### Elements
- **Community health bar** at top (subtle, not dominating): total $CC minted, number of verified implementations completed, active issues by phase. Gives a sense of the system working.
- Search input with icon
- Filter row: Scope (All/Local/National/Global), Topic tags, Status (Deliberating/Voting/Adopted/Implementing/Completed)
- Issue cards: color-coded status dot, title, scope badge, participant count, current stage, time ago
- Hover on card → subtle highlight, click goes to detail
- Floating "➕ New Issue" button (bottom-right on mobile)

---

## Screen 3: Issue Detail

The heart of the app. This is where deliberation, voting, and implementation all converge. Uses a two-column layout on desktop.

### Layout (Desktop)
```
┌──────────────────────────────────────────┬──────────┐
│ ← Back to Issues                         │          │
│                                          │  SOURCE  │
│ ┌─ LIFECYCLE STEPPER ──────────────────┐ │  PANEL   │
│ │ ● Identify → ● Deliberate → ○ Decide│ │          │
│ │ → ○ Implement → ○ Reward             │ │ (sticky, │
│ └──────────────────────────────────────┘ │  ~16%    │
│                                          │  width)  │
│ ┌─ HEADER ─────────────────────────────┐ │          │
│ │  Fix drainage on Elm Street          │ │  Shows   │
│ │  "Recurring flooding after rain..."  │ │  source  │
│ │                                      │ │  comments│
│ │  🟢 Deliberating  · Local · 12 ppl  │ │  when    │
│ │                                      │ │  user    │
│ │  Metrics: 💰$15k  ⏱3mo  (hover=src) │ │  hovers  │
│ │  Impact: 🌍↑ Water ♿↑ Access        │ │  over    │
│ └──────────────────────────────────────┘ │  summary │
│                                          │  text,   │
│ ┌─ DESCRIPTION (collapsed by default) ─┐ │  metrics,│
│ │  ▶ Full description...               │ │  or      │
│ │  (expand to read + comment on text)  │ │  arguments│
│ └──────────────────────────────────────┘ │          │
│                                          │  Idle:   │
│ ┌─ AI SUMMARY ─────────────────────────┐ │  💬 icon │
│ │  Key points: ...                     │ │  + hint  │
│ │  Areas of consensus: ...             │ │  "Hover  │
│ │  Open questions: ...                 │ │  summary │
│ │  🟢 Updated since last visit         │ │  text to │
│ └──────────────────────────────────────┘ │  see     │
│                                          │  sources"│
│ ┌─ TABS ───────────────────────────────┐ │          │
│ │ [Discussion (34)] [Pro/Con (8)] [Hist]│ │          │
│ │                                      │ │          │
│ │  Search: [___________]               │ │          │
│ │  [+ Add Comment]  Sort: Recent ▾     │ │          │
│ │                                      │ │          │
│ │  ── Spotlighted ──                   │ │          │
│ │  │▌ Anonymous Owl 🦉 · 2h ago       │ │          │
│ │  │▌ "The drainage plan doesn't..."   │ │          │
│ │  │▌ ↳ 3 replies                      │ │          │
│ │  │▌                                  │ │          │
│ │  ── All Threads ──                   │ │          │
│ │  Anonymous Fox 🦊 · 5h ago           │ │          │
│ │  "Consider permeable pavement..."    │ │          │
│ └──────────────────────────────────────┘ │          │
│                                          │          │
│ ┌─ VOTE BAR (if vote-ready) ──────────┐ │          │
│ │ [✅ Approve] [❌ Reject]  78% (12)  │ │          │
│ └──────────────────────────────────────┘ │          │
└──────────────────────────────────────────┴──────────┘
```

### Lifecycle Stepper
A horizontal progress indicator at the top of every issue showing the 5 phases: **Identify → Deliberate → Decide → Implement → Reward**. The current phase is highlighted with a filled dot and bold text, past phases are checked, future phases are dimmed circles. This makes the full loop visible on every issue.

### Header
- Title, summary text
- Status badge (color dot + label), scope, participant count
- **Metrics row**: impact dimensions (Cost, Time, etc.) as small cards. Each shows the value, confidence level, and is hoverable — hovering a metric populates the Source Panel with comments that discuss that metric.
- **Impact/Boundary indicators**: icons with directional arrows (↑ improve, ↓ regress, → neutral) showing estimated impact on social/planetary boundaries. Also hoverable for source panel.
- Reward intent (if set): "💰 500 $CC per milestone"

### Description (Collapsible)
- Collapsed by default (just shows "▶ Full description" toggle)
- When expanded: full proposal text, wiki-style
- **Text selection interaction**: selecting text shows a floating "💬 Comment on this" button, creating a quote-comment anchored to that specific passage
- Passages with existing quote-comments get a faint highlight on hover, populating the Source Panel

### AI Summary
- Always visible (not in a tab)
- Renders clean text in idle state — no visual decoration
- **Hover interaction**: hovering over any word highlights reference spans and populates the Source Panel with the specific comments that informed that part of the summary
- **Click interaction**: clicking makes the selection sticky (stays highlighted when mouse moves away)
- "🟢 Updated since your last visit" indicator when summary has changed
- Shows: Key points, Areas of consensus, Areas of disagreement, Open questions

### Anonymization Banner
- A subtle, dismissible banner or info pill near the comment area: "🎭 Identities are hidden to help you evaluate ideas by their merits, not by who said them"
- Anonymous animal aliases (consistent per user per issue): "Anonymous Owl 🦉", "Anonymous Fox 🦊", "Anonymous Bear 🐻"

### Discussion Tab
- Search bar at top (client-side text filtering)
- "Add Comment" button + Sort dropdown (Recent / Most replies)
- **Spotlighted threads** at top (purple left border) — algorithmically promoted overlooked perspectives
- Regular threads below
- Each thread shows: alias, time, text preview, reply count
- Click to expand inline showing nested replies
- **Stance indicators** on replies: green left border + "SUPPORTING" pill for pro arguments, orange left border + "COUNTER" pill for con arguments
- Vote counts on comments are HIDDEN (to reduce popularity bias) — vote buttons exist but don't show tallies
- New-since-last-visit indicator on unread comments

### Pro/Con Tab
- Kialo-style argument tree
- Top-level arguments with PRO (green left border, green pill) or CON (red left border, red pill)
- Nested counter-arguments indented below
- Hover-to-Act toolbar on each argument node

### Voting Bar (contextual)
- Only visible when issue status is "Voting" (vote-ready)
- Sticky at bottom of viewport
- Two buttons: "✅ Approve" and "❌ Reject"
- Approval percentage and total vote count
- **Conviction indicator** (new): a small visual showing how long the current decision has been stable, implying how much momentum would be needed to reverse it. Could be a thin progress bar labeled "Conviction: 3 weeks stable" or similar.

### Metrics Gate (contextual)
- When issue is in deliberation but metrics are NOT yet complete, show a muted banner where the vote bar would be: "🔒 Voting unlocks when impact assessment is complete" with indicators showing which metrics dimensions still need data.

### Source Panel (Right Column)
- Sticky positioned, ~16% viewport width, right margin
- **Idle state**: small box with 💬 icon and text "Hover summary text to see sources"
- **Active state**: list of source comment cards showing alias, text snippet, strength indicator (direct vs. approximate). Each card has a "↓ jump" link that scrolls to and highlights that comment in the thread.
- Mobile: renders as a bottom sheet that slides up on tap, swipe to dismiss

### Hover-to-Act Toolbar
On hover over any actionable content (metric, summary paragraph, comment, argument), a small floating toolbar fades in:
```
┌──────────────────────────────────┐
│  👍  👎  💬  🏴  ✏️              │
└──────────────────────────────────┘
```
- 👍 Upvote / 👎 Downvote (micro-vote on that element)
- 💬 Comment (inline reply anchored to that element)
- 🏴 Flag (report misleading/off-topic/harmful)
- ✏️ Edit (propose a change, for editable elements)
- Clicking 👍/👎 optionally expands a small "Why?" text field

---

## Screen 4: Create Issue

A focused, single-column form.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Create a New Issue                                     │
│                                                         │
│  Title                                                  │
│  [_______________________________________________]      │
│                                                         │
│  ⚠ Similar issues found:                               │
│  "Drainage issues on Main St" — 80% similar → View     │
│                                                         │
│  Summary (1–2 sentences)                                │
│  [_______________________________________________]      │
│                                                         │
│  Description                                            │
│  [                                                ]     │
│  [          (markdown/rich text editor)             ]   │
│  [                                                ]     │
│                                                         │
│  Scope       [Local ▾]                                  │
│  Topics      [environment] [infrastructure] [+ Add]     │
│  Reward      [___] $CC per [milestone ▾]  (optional)    │
│                                                         │
│             [Cancel]          [Submit Issue]             │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- **Duplicate detection**: as user types the title, similar existing issues appear dynamically in an amber warning box with links to view them
- Minimal required fields: title, summary, scope
- Tags as removable pills with inline add
- Reward intent clearly marked optional
- Submit button is dark/prominent, Cancel is subtle text

---

## Screen 5: Quick Vote (Tinder-style)

A streamlined card-based voting experience for issues that are vote-ready.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Quick Vote  (3 awaiting)                               │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                     ││
│  │  Community Solar Panel Program                      ││
│  │  "Install solar panels on public buildings and      ││
│  │   distribute energy savings as credits..."          ││
│  │                                                     ││
│  │  AI Summary:                                        ││
│  │  Main points: ... Consensus: ... Questions: ...     ││
│  │                                                     ││
│  │  Impact: 💰 $45k  ⏱ 6mo  🌍↑ Energy  ♿→ Neutral  ││
│  │                                                     ││
│  │  Current: 82% approval (28 votes)                   ││
│  │                                                     ││
│  │  ┌──────────────┐  ┌──────────────┐                 ││
│  │  │ 👍 Approve   │  │ 👎 Reject    │                 ││
│  │  └──────────────┘  └──────────────┘                 ││
│  │                                                     ││
│  │  📖 Read full issue              Skip →             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

- Shows one issue at a time as a card
- Includes the AI summary and key metrics inline
- Two large vote buttons (green approve, red reject)
- "Read full issue" link to the detail page
- "Skip →" to move to next issue
- After voting, automatically shows next unvoted issue
- "All caught up! 🗳️" empty state when done

---

## Screen 6: Eligibility Gate (Modal)

When a user clicks Vote and hasn't passed the eligibility check yet, this modal overlays the screen.

### Layout
```
┌───────────────────────────────────────────┐
│  Before you vote                          │
│  Quick check to make sure you're          │
│  familiar with this issue.                │
│                                           │
│  ✅ Stakeholder check — auto-verified     │
│                                           │
│  1. What is the main goal of this         │
│     proposal?                             │
│     ○ Install solar on private homes      │
│     ● Install solar on public buildings   │
│       and share savings                   │
│     ○ Build a new power plant             │
│                                           │
│  2. How will savings be distributed?      │
│     ○ Kept by city government             │
│     ○ Sold to energy companies            │
│     ● Distributed as credits to           │
│       participating households            │
│                                           │
│          [Cancel]    [Submit]              │
│                                           │
│  ✅ Passed! Redirecting to vote...        │
│  ❌ Incorrect — review and try again      │
└───────────────────────────────────────────┘
```

- Lightweight overlay with backdrop blur
- Auto-verified stakeholder check shown as a green checkmark
- 2-3 simple multiple-choice questions about the issue (not opinions, just comprehension)
- Pass = auto-close and proceed to vote
- Fail = show which were wrong, offer "Try again"

---

## Screen 7: Delegation Management (NEW — not in prototype)

Per-topic liquid democracy management. Users delegate their voting power on specific topics to trusted delegates.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  My Delegations                                         │
│                                                         │
│  Delegate your vote on topics you trust others to       │
│  handle. You can always override by voting directly,    │
│  and revoke any delegation instantly.                   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  🌍 Environment                                     ││
│  │  Delegated to: Dr. Elena Rivera                     ││
│  │  Since: 3 months ago                                ││
│  │  Voted on your behalf: 7 times                      ││
│  │  ↳ Last: ✅ Approved "River cleanup" — 2d ago       ││
│  │                          [View votes]  [Revoke]     ││
│  ├─────────────────────────────────────────────────────┤│
│  │  🏗️ Infrastructure                                  ││
│  │  Delegated to: Marcus Chen                          ││
│  │  Since: 1 month ago                                 ││
│  │  Voted on your behalf: 3 times                      ││
│  │                          [View votes]  [Revoke]     ││
│  ├─────────────────────────────────────────────────────┤│
│  │  💻 Technology                                      ││
│  │  No delegate — you vote directly                    ││
│  │                              [+ Assign delegate]    ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ℹ️ Delegation is topic-specific. Direct votes always   │
│     override. Revocation is instant.                    │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- List of topic categories with current delegate status
- For each active delegation: delegate name, duration, number of votes cast on your behalf, last vote action
- "View votes" expands to show how the delegate voted on each issue
- "Revoke" button — instant, one-click revocation
- "Assign delegate" for unassigned topics — opens a search/select modal
- Info text reinforcing that direct votes always override and revocation is instant

---

## Screen 8: Implementation & Verification (NEW — not in prototype)

This is Kindact's core differentiator. After an issue is adopted, this is where work gets claimed, executed, reported, and verified.

### 8a: Work Packages View (on adopted issue detail)

When an issue reaches "Adopted" status, a new section appears on the issue detail page below the vote bar:

```
┌─────────────────────────────────────────────────────────┐
│  Implementation                                         │
│                                                         │
│  This issue has been adopted! Here's the work needed:   │
│                                                         │
│  ┌─ Work Package 1 ────────────────────────────────────┐│
│  │  🔨 Install drainage pipes on north side            ││
│  │  Reward: 200 $CC  ·  2 active claims                ││
│  │  Status: In Progress                                ││
│  │                              [Claim this work]      ││
│  ├─ Work Package 2 ────────────────────────────────────┤│
│  │  📐 Survey and grade assessment                     ││
│  │  Reward: 50 $CC  ·  1 active claim                  ││
│  │  Status: Submitted — awaiting verification          ││
│  │                              [Claim this work]      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 8b: Submit Implementation Report (Modal/Page)

When a claimant submits progress:

```
┌─────────────────────────────────────────────────────────┐
│  Submit Implementation Report                           │
│  Work Package: Install drainage pipes on north side     │
│                                                         │
│  Report Type: ○ Partial/Milestone  ● Final              │
│                                                         │
│  What was done                                          │
│  [                                                ]     │
│  [    Describe the work you performed...           ]    │
│                                                         │
│  ┌─ Resource Tracking ─────────────────────────────────┐│
│  │  Labor                                              ││
│  │  [40] hours  by  [2] people                         ││
│  │                                                     ││
│  │  Materials Used                                     ││
│  │  [PVC pipes, 200m] [Gravel, 5 tons] [+ Add]        ││
│  │                                                     ││
│  │  Outputs Produced                                   ││
│  │  [Drainage system, 200m installed] [+ Add]          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  Evidence                                               │
│  [📷 Upload photos/videos]  [📄 Upload documents]      │
│  ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │ img1 │ │ img2 │ │ doc1 │                            │
│  │ .jpg │ │ .jpg │ │ .pdf │                            │
│  └──────┘ └──────┘ └──────┘                            │
│  ℹ️ Photos are geotagged. All evidence is immutable     │
│     and content-addressed for auditability.             │
│                                                         │
│           [Cancel]          [Submit Report]              │
└─────────────────────────────────────────────────────────┘
```

### 8c: Verification Dashboard (for verifiers)

```
┌─────────────────────────────────────────────────────────┐
│  Verification Queue                                     │
│                                                         │
│  Reports awaiting your review:                          │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  📋 Install drainage pipes — Final Report           ││
│  │  Submitted by: Anonymous Hawk 🦅  ·  2d ago         ││
│  │  Reward at stake: 200 $CC                           ││
│  │                                                     ││
│  │  Summary: "Installed 200m of PVC drainage..."       ││
│  │  Evidence: 3 photos, 1 document                     ││
│  │  Resources: 40hrs labor, 200m PVC, 5t gravel        ││
│  │                                                     ││
│  │  [View Full Report]                                 ││
│  │                                                     ││
│  │  Your decision:                                     ││
│  │  [✅ Approve — work verified]                       ││
│  │  [❌ Reject — insufficient evidence]                ││
│  │                                                     ││
│  │  Rationale (required):                              ││
│  │  [________________________________]                 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ℹ️ Verifiers are rotated. Your identity is hidden from ││
│     the implementer during review.                      │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 9: Reward & Impact (NEW — not in prototype)

Displayed after work is verified. Shows the $CC minting event and the generated Hypercert impact credential.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  🎉 Work Verified — Rewards Minted!                    │
│                                                         │
│  ┌─ Reward ────────────────────────────────────────────┐│
│  │                                                     ││
│  │     💰  +200 $CC                                    ││
│  │                                                     ││
│  │  For: Install drainage pipes on north side          ││
│  │  Issue: Fix drainage on Elm Street                  ││
│  │  Verified by: 3 community verifiers                 ││
│  │  Date: April 9, 2026                                ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ Impact Credential ────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────────┐       │ │
│  │  │  🏆  HYPERCERT                          │       │ │
│  │  │                                         │       │ │
│  │  │  Fix Drainage on Elm Street             │       │ │
│  │  │  200m drainage system installed         │       │ │
│  │  │                                         │       │ │
│  │  │  Impact: 🌍 Water ↑  ♿ Access ↑        │       │ │
│  │  │  Verified: April 2026                   │       │ │
│  │  │  Community: 12 voters, 3 verifiers      │       │ │
│  │  │                                         │       │ │
│  │  │  [View on-chain] [Share]                │       │ │
│  │  └─────────────────────────────────────────┘       │ │
│  │                                                     │ │
│  │  This credential is held by Kindact and may be     │ │
│  │  purchased by impact buyers. Proceeds strengthen   │ │
│  │  the $CC reserve.                                  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- Celebratory but not over-the-top — a subtle "🎉" and clean card layout
- **$CC reward** with full provenance: amount, what work it was for, which issue, who verified, when
- **Hypercert card**: a visually distinct credential card (slightly elevated, maybe a subtle gradient border) showing the impact claim — what was done, impact dimensions, verification details
- Links: "View on-chain" (opens block explorer), "Share" (social sharing)
- Explanatory text about Hypercerts and the reserve

---

## Screen 10: My Activity

Personal dashboard — everything about the user's participation.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  My Activity  (Jonas)                                   │
│                                                         │
│  💰 142.3 $CC                                           │
│  Decays ~1.4 $CC / month                                │
│  ┌──────────────────────────────────────┐               │
│  │ ████████████░░░░ decay visualization │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  [My Issues] [My Votes] [My Claims] [Delegations] [🔔] │
│                                                         │
│  (Tab: My Issues)                                       │
│  • 🟢 Fix drainage on Elm Street — Deliberating         │
│  • 🟡 Park cleanup program — Implementing               │
│                                                         │
│  (Tab: My Claims)                                       │
│  • 📋 Install drainage pipes — Submitted, awaiting      │
│    verification                                         │
│  • ✅ Park bench installation — Verified, +50 $CC       │
│                                                         │
│  (Tab: My Votes)                                        │
│  • ✅ Approved "Solar panel program" — 1d ago            │
│  • ❌ Rejected "Parking expansion" — 3d ago              │
│                                                         │
│  (Tab: Delegations — links to Screen 7)                 │
│                                                         │
│  (Tab: Notifications)                                   │
│  • 📩 Your claim was verified — 1h ago                  │
│  • 📩 New comment on "Elm Street" — 3h ago              │
└─────────────────────────────────────────────────────────┘
```

### Key Features
- **$CC balance** prominently displayed with demurrage visualization (a subtle decay indicator showing how the balance decreases over time — "use it or lose it")
- Tabs for different activity types
- Each tab is a simple chronological list with status indicators
- Hypercert portfolio section showing earned impact credentials
- Claims tab shows verification status with clear provenance

---

## Interaction Patterns

### Hover-to-Act Toolbar
A universal pattern: when hovering over any actionable content element (comment, argument, metric, summary paragraph), a small floating toolbar fades in above/below the element:
```
┌──────────────────────────────────┐
│  👍  👎  💬  🏴  ✏️              │
└──────────────────────────────────┘
```
Appears within 200ms, positioned not to obscure content. On mobile, these actions are accessible via long-press or an explicit "..." menu.

### Conviction Voting Indicator
On issues that have been adopted, show a subtle indicator of conviction strength:
- A thin colored bar or label: "Conviction: 3 weeks stable — reversal requires 67% opposition"
- Grows visually over time (wider bar, stronger color)
- Hovering shows explanation: "The longer a decision stands uncontested, the harder it is to reverse. This prevents constant upheaval while allowing genuine course corrections."

### Metrics Gate Lock
When an issue is in deliberation but impact metrics are incomplete:
- The area where the vote bar would appear shows a locked state
- Muted/gray bar: "🔒 Voting unlocks when impact assessment is complete"
- Below: checklist of metric dimensions, showing which are filled (✅) and which still need data (⬜)

### New-Since-Last-Visit Indicators
- Comments posted since the user's last visit get a subtle left-border highlight (e.g., light blue)
- AI summary gets a "🟢 Updated since your last visit" badge if it changed
- Issue cards on the feed could show a "• new activity" dot

---

## Mobile Adaptations

- Bottom tab bar: 🏠 Home, ➕ Create, 🗳️ Vote, 👤 Activity
- Source Panel becomes a bottom sheet (slide up on tap, swipe to dismiss)
- Hover-to-Act becomes long-press or "..." context menu
- Issue lifecycle stepper wraps to two lines or becomes a compact horizontal scroll
- Cards go full-width with adequate touch targets (minimum 44×44px)
- Vote bar fixed at bottom above the tab bar

---

## Sample Data for Prototyping

### Issues
1. **"Fix drainage on Elm Street"** — Local, Deliberating, 12 participants, 34 comments. Metrics: Cost ~$15k (medium confidence), Time ~3 months. Impact: Water management ↑, Pedestrian access ↑.
2. **"Community solar panel program"** — National, Voting, 87 participants. 82% approval (28 votes). Metrics: Cost ~$45k, Time ~6 months. Impact: Clean energy ↑, Grid independence ↑. Reward: 500 $CC per milestone.
3. **"Reduce packaging waste citywide"** — Local, Deliberating, 24 participants. Impact: Waste ↓, Ecosystem health ↑.
4. **"Park cleanup and bench installation"** — Local, Implementing, 8 participants. 2 work packages, 1 verified. Impact: Community space ↑.
5. **"Free public Wi-Fi in town center"** — Local, Voting, 15 participants. Metrics: Cost ~$8k, Time ~2 months. Impact: Digital access ↑.
6. **"Protected bike lane network"** — Local, Deliberating, 45 participants. 56 comments. Has rich AI summary with references to specific comments.

### Users
- Current user: "Jonas", balance 142.3 $CC, 3 active delegations
- Delegates: "Dr. Elena Rivera" (environment), "Marcus Chen" (infrastructure)
- Anonymous aliases: Owl 🦉, Fox 🦊, Bear 🐻, Hawk 🦅, Deer 🦌

### Notifications
- "Your claim on 'Park bench installation' was verified — you earned 50 $CC" — 1h ago
- "New comment on 'Elm Street drainage' by Anonymous Fox 🦊" — 3h ago
- "Solar panel program reached 80% approval" — 1d ago

---

## What to Build

Please generate an interactive prototype with the following screens, in priority order:

1. **Issue Detail** (Screen 3) — the most complex and important screen. Include the lifecycle stepper, header with metrics, collapsible description, AI summary, tabbed discussion with anonymous comments, and the source panel on the right.
2. **Issue Feed** (Screen 2) — the home page with community health bar, search, filters, and issue cards.
3. **Implementation Report** (Screen 8b) — the report submission form with resource tracking and evidence upload.
4. **Reward & Impact** (Screen 9) — the reward display with Hypercert credential card.
5. **Delegation Management** (Screen 7) — per-topic delegation list with revoke/assign actions.
6. **Quick Vote** (Screen 5) — the card-based voting flow.
7. **My Activity** (Screen 10) — the personal dashboard with $CC balance and tabs.
8. **Onboarding** (Screen 1) — the first-visit walkthrough.

Use the warm neutral stone palette, generous whitespace, and the hover-to-act interaction pattern throughout. The overall feel should be calm, trustworthy, and empowering — not flashy or corporate.
