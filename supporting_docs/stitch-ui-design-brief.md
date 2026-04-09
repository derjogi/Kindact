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

### Guiding Principle: Decluttered Functionality

The platform deals with inherently complex topics (governance, deliberation, metrics, voting, implementation tracking, economics). The UI must make **every action easy to find and perform** without overwhelming the user. Two failure modes to avoid equally:

1. ❌ **Too much visible at once** — user is overwhelmed, doesn't know where to focus
2. ❌ **Actions hidden or missing** — user wants to do something obvious (vote, flag, delegate, comment) and can't figure out how

The right balance: **show what's relevant to the current context, and make everything else one click/tap away.** Use tabs, collapsible sections, expandable panels, slide-out drawers, and contextual menus freely — these are not anti-patterns here, they're essential tools for managing complexity. The user should always feel "I can see what matters now, and I know where to find the rest."

### Core Principles

1. **Functional clarity over minimalism** — don't hide things for aesthetic purity. If multiple panels help the user understand a complex issue, show them. A description + discussion + source panel side by side is fine if each panel's purpose is obvious.
2. **Content can breathe** — complex issue descriptions, long discussions, and detailed reports can and should use the available screen width. Don't constrain content to a narrow column for visual reasons.
3. **User-controlled focus** — let users expand, collapse, and resize sections to focus on what they care about. Expand the description to read it carefully. Collapse it to focus on discussion. Resize the source panel. These controls empower the user.
4. **Contextual actions, always reachable** — actions like voting, flagging, commenting, and delegating should appear in context (hover toolbars, inline buttons) but also be accessible through explicit menus or panels. Never rely solely on hover for critical actions.
5. **Progressive complexity, not progressive hiding** — new users see a clean starting point; experienced users discover depth. But "depth" means richer data and more options, not a scavenger hunt.

### Visual Direction

- Think "Notion meets Wikipedia meets Reddit" — document feel, collaborative editing, threaded discussion — with the governance layer (voting, metrics, verification) presented naturally alongside content, not hidden behind layers of disclosure.
- Warm neutral palette (stone/cream tones), not cold/institutional blue.
- Status colors: green = deliberating, blue = voting, violet = adopted, amber = implementing, dark gray = completed.
- Readable typography (nothing smaller than 12px). Content-first — the community's words and data are the hero.
- **Use available space.** A complex issue with a long description, detailed metrics, and active discussion benefits from using the full viewport — don't artificially constrain it.

---

## Navigation & Layout

### Global Structure

- **Top bar** (fixed/sticky): Logo + primary nav links + wallet balance ($CC) + notification bell
- Primary nav: **Issues** (home/feed), **Create** (new issue), **My Activity** (personal dashboard)
- Consider a **collapsible side nav or settings drawer** for secondary navigation: Delegation management, Token/wallet details, Profile settings, Verification queue (for verifiers). This keeps the top bar clean while making these features one click away — not buried.
- Mobile: bottom tab bar with icons (🏠 Home, ➕ Create, 🗳️ Vote, 👤 Activity)

### Layout Flexibility

You have full creative freedom on layout decisions. Some guidelines:

- Multi-panel layouts are welcome where they add clarity (e.g., issue content + source panel, or description + discussion side by side on wide screens)
- Panels should be collapsible/resizable where it makes sense — let users choose their focus
- Full-width content is fine for complex issue descriptions, long form text, and detailed reports
- Tabs, accordions, and drawers are encouraged for organizing related functionality without clutter
- Side navigation (collapsible) is acceptable for secondary features if it improves discoverability

---

## Screen 1: Onboarding (First Visit)

A welcoming intro that explains the core loop before users see the issue feed. Only shown once on first visit.

### Content

A visual walkthrough with 3–4 steps, presented as cards, slides, or a scroll-through story:

1. **"See a problem? Raise it."** — creating an issue
2. **"Discuss solutions together."** — anonymous deliberation (animal avatars talking)
3. **"Vote on what matters."** — approval voting with a metrics gate
4. **"Do the work. Get rewarded."** — submitting proof of work, receiving $CC tokens + a Hypercert impact credential

Each step: a simple illustration, a headline, one sentence of explanation. A "Get Started →" button at the end.

### Design Notes
- Warm and inviting, not corporate
- Emphasize the unique end-to-end loop — this is what makes Kindact different from every other governance/deliberation platform
- Should take <30 seconds to read through
- Can be replayed from settings/help

---

## Screen 2: Issue Feed (Home)

The landing page. A scannable list of community issues with enough context to decide what to engage with.

### Elements

- **Community health bar** (subtle, at top or in sidebar): total $CC minted, verified implementations completed, active issues by phase. Gives a sense of the system working. Can be collapsible.
- **Search** input
- **Filters**: Scope (All/Local/National/Global), Topic tags, Status (Deliberating/Voting/Adopted/Implementing/Completed). Filters can be a row of dropdowns, a filter panel, or whatever works best.
- **Issue cards**: each showing color-coded status dot, title, scope badge, participant count, current stage, time since last activity. Click goes to detail.
- Infinite scroll or "Load more"
- Floating "➕ New Issue" action (mobile)

---

## Screen 3: Issue Detail

The heart of the app. This is where deliberation, voting, and implementation all converge. This screen has the most complexity to manage — it needs to present a lot of information without overwhelming.

### Sections (top to bottom conceptually, but layout is flexible)

#### Lifecycle Stepper
A progress indicator showing the 5 phases: **Identify → Deliberate → Decide → Implement → Reward**. Current phase highlighted, past phases checked, future phases dimmed. This makes the full loop visible on every issue. Can be horizontal or compact — the important thing is it's always visible on the issue page.

#### Header
- Title, summary text
- Status badge (color dot + label), scope, participant count
- **Metrics row**: impact dimensions (Cost, Time, etc.) as compact indicators. Each shows value + confidence level. Hovering/clicking a metric shows source comments in the source panel.
- **Impact/Boundary indicators**: directional arrows (↑ improve, ↓ regress, → neutral) for social/planetary boundaries. Also interactive for source panel.
- Reward intent (if set): "💰 500 $CC per milestone"

#### Description
- Can start collapsed or expanded — user's choice, with a toggle
- When expanded: full proposal text, wiki-style, using available width
- **Text selection interaction**: selecting text shows a floating "💬 Comment on this" button, creating a quote-comment anchored to that passage
- Passages with existing quote-comments get a faint highlight, populating the Source Panel on hover

#### AI Summary
- Always visible (not hidden in a tab)
- Shows: Key points, Areas of consensus, Areas of disagreement, Open questions
- **Hover interaction**: hovering any phrase highlights reference spans and populates the Source Panel with specific comments that informed that claim
- **Click interaction**: click makes selection sticky (persists when mouse moves)
- "🟢 Updated since your last visit" badge when summary changed since last visit

#### Anonymization Explainer
A subtle, dismissible info element near the comment area: "🎭 Identities are hidden to help you evaluate ideas by their merits, not by who said them." This explains *why* the system uses anonymization — it's not accidental, it's a deliberate bias-reduction mechanism.

Anonymous animal aliases are consistent per user per issue: "Anonymous Owl 🦉", "Anonymous Fox 🦊", etc.

#### Discussion Tab
- Search bar (text filtering within discussion)
- "Add Comment" button + Sort control (Recent / Most replies)
- **Spotlighted threads** promoted at top (distinct visual, e.g. purple left border) — algorithmically surfaced overlooked perspectives
- Regular threads below
- Each thread: alias, time, text preview, reply count. Click to expand inline.
- **Stance indicators** on replies: green border + "SUPPORTING" for pro, orange border + "COUNTER" for con
- Vote counts on comments are **hidden** (to reduce popularity bias) — vote buttons exist but tallies don't show
- New-since-last-visit indicator on unread comments

#### Pro/Con Tab
- Kialo-style argument tree
- Top-level arguments labeled PRO (green) or CON (red)
- Nested counter-arguments indented below
- Each node has contextual actions (vote, reply, flag)

#### History Tab
- Revision log of the issue: creation, description edits, metric additions, status transitions, vote milestones

#### Voting Bar (contextual — only when status is "Voting")
- Sticky at bottom of viewport
- Two buttons: "✅ Approve" and "❌ Reject"
- Approval percentage and total vote count
- **Conviction indicator**: a visual showing how long the current decision has been stable and how much momentum reversal would require. E.g., "Conviction: 3 weeks stable — reversal requires 67% opposition." Can be a bar, badge, or tooltip.

#### Metrics Gate (contextual — when metrics incomplete)
When voting can't proceed because impact assessment is incomplete, show a clear indicator: "🔒 Voting unlocks when impact assessment is complete" with a checklist of which metric dimensions are filled (✅) vs. still needed (⬜).

#### Implementation Section (contextual — when status is "Adopted" or "Implementing")
When an issue is adopted, an implementation section appears (see Screen 8 for details). This can be an additional tab, an expandable section, or an inline panel — whatever integrates naturally.

#### Source Panel
A panel (side column, drawer, or overlay depending on layout choice) that shows contextual source information:

- **Idle state**: hint text like "Hover summary text to see sources"
- **Active state**: list of source comment cards with alias, text snippet, strength (direct/approximate), and a "↓ jump to comment" link
- On desktop: could be a sticky side column, a slide-out drawer, or a resizable panel
- On mobile: bottom sheet that slides up on tap

### Layout Suggestions for Issue Detail

Several approaches could work — use your judgment:

- **Two-column**: main content (description, summary, discussion) on left (~80%), source panel on right (~20%), both scrollable independently
- **Three-panel on wide screens**: description | discussion | source panel — for users who want to read the proposal while following the conversation
- **Single column with slide-out source panel**: maximizes content width, source panel slides in from right when activated
- **User-resizable split**: let users drag a divider to allocate space between content and source panel

The key: whatever layout you choose, the user should be able to **expand or collapse sections** to focus. If someone wants to read a long description full-screen, let them. If they want description + discussion side by side, let them.

---

## Screen 4: Create Issue

A focused form for creating a new community issue.

### Elements

- **Title** input — as user types, similar existing issues appear dynamically (duplicate detection, amber warning box with links)
- **Summary** (1–2 sentences)
- **Description** (markdown/rich text editor, can be expanded to larger size)
- **Scope** selector: Local / National / Global
- **Topics/Tags**: removable pills with inline add
- **Reward intent** (clearly optional): amount + unit
- Submit and Cancel actions

### Design Notes
- Form should feel simple — minimal required fields (title, summary, scope)
- Similar-issues detection is important to prevent fragmentation
- The description editor should allow expansion to near-full-screen for writing long proposals

---

## Screen 5: Quick Vote

A streamlined card-based voting experience for issues that are vote-ready. Designed for efficient, informed voting.

### Elements

- Shows one issue at a time as a card
- Card includes: title, summary, AI summary (key points), metrics, impact indicators, current approval percentage
- Two prominent vote buttons: Approve (green) / Reject (red)
- "📖 Read full issue" link to the detail page (for deeper investigation)
- "Skip →" to move to next issue without voting
- After voting, automatically shows next unvoted issue
- "All caught up! 🗳️" empty state when done

---

## Screen 6: Eligibility Gate (Modal/Overlay)

When a user tries to vote but hasn't passed the eligibility check. A lightweight overlay, not a new page.

### Elements

- **Stakeholder check**: auto-verified badge (green checkmark) based on user profile/location
- **Comprehension quiz**: 2–3 simple multiple-choice questions about the issue (testing understanding, NOT opinion). E.g., "What is the main goal of this proposal?"
- Submit button, pass/fail result
- Pass → auto-close and proceed to vote
- Fail → show incorrect answers, offer "Try again"

### Design Notes
- The quiz should feel quick and non-threatening — "Quick check to make sure you're familiar" not "You must prove yourself"
- Questions test comprehension of the issue summary, not domain expertise

---

## Screen 7: Delegation Management

Per-topic liquid democracy. Users delegate their voting power on specific topics to trusted community members. **This has no UI in the current prototype — it's entirely new.**

### Elements

Each topic category shows:
- Topic name and icon (🌍 Environment, 🏗️ Infrastructure, 💻 Technology, etc.)
- Current delegate (if assigned): name, how long delegated, number of votes cast on behalf, last vote action with link
- **"View votes"** — expands to show how the delegate voted on each issue
- **"Revoke"** — instant, one-click revocation
- **"Assign delegate"** for unassigned topics — search/select modal
- Topics without a delegate show "You vote directly" with an assign button

### Key Info to Display
- "Delegation is topic-specific. Direct votes always override. Revocation is instant." — this information needs to be clearly communicated, as users may be unfamiliar with liquid democracy.

### Placement
Could be a dedicated page (linked from My Activity or side nav), a tab within My Activity, or a drawer accessible from the main nav. However it's reached, it should be easy to find — a user thinking "I want someone else to vote on environment topics for me" should be able to find this within 2 clicks from anywhere.

---

## Screen 8: Implementation & Verification

This is Kindact's core differentiator — the UI that turns decisions into verified action. **Mostly absent from the current prototype.**

### 8a: Work Packages (appears on adopted issue detail)

When an issue reaches "Adopted" status, the issue detail page gains an implementation section showing:
- List of work packages: title, reward amount, number of active claims, status
- "Claim this work" button on each package
- Multiple people can claim the same work package (parallel implementation)

### 8b: Submit Implementation Report

A form (modal, drawer, or dedicated page) for submitting progress on a claimed work package:

- **Report type**: Partial/Milestone or Final
- **What was done**: text description of work performed
- **Resource tracking** (structured ValueFlows-compatible fields):
  - Labor: hours, number of people
  - Materials used: list of items with quantities (addable)
  - Outputs produced: list of deliverables (addable)
- **Evidence upload**: photos (geotagged), videos, documents. Displayed as thumbnails. Note: "All evidence is immutable and content-addressed for auditability."
- Submit and Cancel actions

### 8c: Verification Dashboard (for verifiers)

A queue-based interface for community verifiers to review submitted reports:

- List of reports awaiting review, each showing: work package title, report type, submitter alias, submission date, reward at stake
- Expandable detail: full report text, evidence gallery, resource log
- Decision: Approve or Reject buttons, with **required rationale** text field
- Note: "Verifiers are rotated. Your identity is hidden from the implementer during review."

### Placement
- Work packages section integrates into the issue detail page (tab, expandable section, or inline)
- Report submission is triggered from the user's active claims (My Activity or issue detail)
- Verification dashboard could be in My Activity, side nav, or a dedicated section — wherever verifiers can easily find their queue

---

## Screen 9: Reward & Impact

Displayed after work is verified. Shows the $CC minting event and the generated Hypercert impact credential.

### Elements

- **$CC reward card**: amount minted (prominent), with full provenance — what work it was for, which issue, who verified, when
- **Hypercert card**: a visually distinct impact credential (slightly elevated, perhaps a subtle gradient border or certificate feel) showing:
  - Issue title
  - Work description
  - Impact dimensions with direction arrows
  - Verification date and community participation stats
  - "View on-chain" (block explorer link) and "Share" actions
- Brief explanation: "This credential is held by Kindact and may be purchased by impact buyers. Proceeds strengthen the $CC reserve."

### Design Notes
- Celebratory but not over-the-top — the user just accomplished something real, acknowledge it warmly
- This can be a modal/overlay that appears on verification, and also viewable from the user's profile/activity

---

## Screen 10: My Activity

Personal dashboard for the user's participation, balance, and history.

### Elements

- **$CC balance** displayed prominently with demurrage visualization (showing how balance decays over time — "use it or lose it" economics). E.g., "142.3 $CC · Decays ~1.4/month" with a small visual indicator.
- **Tabs** (or similar organization) for:
  - **My Issues** — issues created by the user, with status
  - **My Votes** — voting history with outcome
  - **My Claims** — claimed work packages with verification status and earned rewards. Each claim links to its issue and shows provenance.
  - **Delegations** — current delegation status per topic (or link to full delegation management screen)
  - **Notifications** — activity notifications with read/unread state
- **Hypercert portfolio** — earned impact credentials, viewable as cards

### Design Notes
- The tabs approach is one option; alternatively a vertical sidebar within this page, or even a unified activity feed with filters, could work
- The key is that users can quickly find: their balance, their active work, their voting history, and their notifications

---

## Interaction Patterns

### Contextual Actions (Hover-to-Act + Always Reachable)

On hover over any actionable content (comment, argument, metric, summary paragraph), a small floating toolbar appears:
- 👍 Upvote / 👎 Downvote (micro-vote on that element)
- 💬 Comment (inline reply anchored to that element)
- 🏴 Flag (report misleading/off-topic/harmful)
- ✏️ Edit (propose a change, for editable elements)
- Clicking 👍/👎 optionally expands a "Why?" text field

**Important**: on mobile and for accessibility, these same actions must also be reachable via a "⋯" menu button, long-press, or always-visible compact action row. Don't rely solely on hover — critical actions must always be discoverable.

### Conviction Voting Indicator

On adopted issues, show conviction strength:
- E.g., "Conviction: 3 weeks stable — reversal requires 67% opposition"
- Grows visually over time (wider bar, stronger color, higher threshold)
- Hovering/clicking shows explanation: "The longer a decision stands uncontested, the harder it is to reverse."

### Metrics Gate Lock

When voting can't proceed because metrics are incomplete:
- Clear locked state: "🔒 Voting unlocks when impact assessment is complete"
- Checklist showing which dimensions are filled (✅) vs. still needed (⬜)

### New-Since-Last-Visit Indicators
- Unread comments get a subtle highlight (e.g., left border or background tint)
- AI summary shows "🟢 Updated" badge if changed since last visit
- Issue cards on the feed can show a "new activity" indicator

### Expand/Collapse/Resize

Users should be able to customize their view:
- **Description**: expand to focus on reading, collapse when done
- **Discussion**: expand to see more threads, or focus on a single thread
- **Source Panel**: resize, collapse, or toggle visibility
- **Any section** that might contain long content should have a sensible default height with the ability to expand

---

## Mobile Adaptations

- Bottom tab bar: 🏠 Home, ➕ Create, 🗳️ Vote, 👤 Activity
- Source Panel becomes a bottom sheet (slide up on tap, swipe to dismiss)
- Hover-to-Act actions become long-press, "⋯" menu, or compact inline buttons
- Issue lifecycle stepper adapts (compact horizontal scroll, or abbreviated)
- Adequate touch targets (minimum 44×44px)
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

1. **Issue Detail** (Screen 3) — the most complex and important screen. Include the lifecycle stepper, header with metrics, expandable description, AI summary with source linking, tabbed discussion with anonymous comments, and a source panel.
2. **Issue Feed** (Screen 2) — the home page with community health indicators, search, filters, and issue cards.
3. **Implementation Report** (Screen 8b) — the report submission form with resource tracking and evidence upload.
4. **Reward & Impact** (Screen 9) — the reward display with Hypercert credential card.
5. **Delegation Management** (Screen 7) — per-topic delegation list with revoke/assign actions.
6. **Quick Vote** (Screen 5) — the card-based voting flow.
7. **My Activity** (Screen 10) — the personal dashboard with $CC balance and tabs.
8. **Onboarding** (Screen 1) — the first-visit walkthrough.

Use the warm neutral stone palette. The overall feel should be calm, trustworthy, and empowering — not flashy or corporate. **Prioritize functional clarity**: every action the user might want to perform should be easy to find, without the interface feeling cluttered. Use your judgment on layout, panels, tabs, drawers, and navigation — the descriptions above are guidelines for *what* to include, not prescriptions for *how* to arrange it.
