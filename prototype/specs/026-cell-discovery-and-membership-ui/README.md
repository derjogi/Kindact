---
status: complete
created: 2026-05-14
priority: high
tags:
- frontend
- ux
- holochain
- cells
created_at: 2026-05-14T01:31:18.962477560Z
updated_at: 2026-05-14T22:43:37.982189905Z
completed_at: 2026-05-14T22:43:37.982189905Z
transitions:
- status: complete
  at: 2026-05-14T22:43:37.982189905Z
---

# Cell Discovery & Membership UI

> Make the prototype Holochain-cell-aware. Replaces the implicit "one shared platform" assumption with an explicit notion of bounded cells the user can browse, subscribe to, join, leave, fork, or create.

Counterpart in holochain/: [030-cell-architecture-and-registry](../../../holochain/specs/030-cell-architecture-and-registry/README.md), [015-frontend §Cell installation UX](../../../holochain/specs/015-frontend/README.md), [026-015i-ui-lens-config (renamed Cell Configuration)](../../../holochain/specs/026-015i-ui-lens-config/README.md).

## Overview

The current prototype has no surface for "which community am I participating in?" The Holochain spec set replaces lenses with **cells** — bounded DNA instances with their own membership and validators — discoverable through a three-tier registry (Global / promoted / uncurated). The UI must make the difference between **subscribing** (cheap watch, see issues) and **joining** (membership, can write) obvious, because that distinction is what makes broad-interest users tractable on commodity hardware.

This spec covers the cell-side of that affordance. Anchors are spec [027](../027-anchor-subscription-management-ui/README.md).

## Design

### Screens

| Screen | Purpose |
|---|---|
| **Cell Browser** (`/cells`) | Map view (geographic cells) + filterable list (topical / event / project cells). Tier badge: `canonical` / `promoted` / `uncurated`. |
| **Cell Detail** (`/cells/[cellId]`) | Description, scope selector, membrane rules, jurisdictional claims, member count, recent activity, governance summary, "Join" / "Subscribe" / "Fork" actions. |
| **Cell Settings** (replaces "Lens Settings" in [022-ui-prototype](../022-ui-prototype/README.md)) | Two tabs: **My Subscriptions** (anchor watches — see [027](../027-anchor-subscription-management-ui/README.md)) and **My Cells** (memberships, with sync status per cell). |
| **Create Cell** (`/cells/new`) | Selector definition (scope, location refs, topic tags), membrane defaults, governance preset picker. Lands in `uncurated/<did>/<name>` and explains the canonical-promotion path. |

### Key affordances

- **Subscribe vs. Join** are visually distinct primary actions on every cell card and detail page. Tooltip / inline copy: *"Subscribe = read-only watch. Join = full member, can post and vote."*
- **Guest contributor** affordance ([044](../../../holochain/specs/044-cross-cell-validation-and-trust/README.md)): on an issue from a cell the user isn't in, surface "Contribute as guest on this issue only" instead of forcing a full join.
- **Tier badges** on every cell reference: 🟢 canonical, 🔵 promoted, ⚪ uncurated. Hover explains promotion path via meta-governance.
- **Forking** is a first-class button on cell detail; explains it lives in `uncurated` until promoted.
- **Sunset state** rendered as a muted "Archived — read-only" badge with the dispute-window countdown when applicable.

### Data layer (mock for prototype)

Add `Cell` model + endpoints in `src/server/` and mock fixtures in `src/lib/api.ts`. Keep the API surface shaped like the eventual `@kindact/conductor-client` so swap-in is mechanical: `listCells(filter)`, `getCell(id)`, `joinCell(id)`, `leaveCell(id)`, `subscribeAnchor(anchor)`.

### Navigation impact

- Add **"Cells"** entry to top-bar nav (between Issues and Create) and to the mobile bottom tab bar (replacing the Vote tab; voting moves into Activity → Pending Votes per [022-ui-prototype](../022-ui-prototype/README.md)).
- Persistent footer/sidebar widget: "Active in N cells · Subscribed to M anchors" with a tap-target to Cell Settings.

## Plan

- [x] Add `Cell` types + mock fixtures (canonical/promoted/uncurated samples mirroring the holochain seed set: Berlin, Housing, Green-Energy, Climate, Permaculture, plus 1–2 uncurated cells).
- [x] Cell Browser page with map + list + tier filter. *(List + tier filter shipped; map view deferred — see Notes.)*
- [x] Cell Detail page with Subscribe/Join/Fork actions and membrane explainer.
- [x] Cell Settings page (My Subscriptions / My Cells tabs).
- [x] Create Cell wizard (selector, membrane, governance preset).
- [x] Update Layout nav (desktop + mobile).
- [ ] Wire issue detail "Contribute as guest" CTA when current user is non-member of the issue's home cell (handoff to [029](../029-issue-cell-context-affordances/README.md)).

## Test

- [x] Cell Browser lists seed cells with correct tier badges and renders map markers for geographic cells. *(List + badges verified; map view deferred.)*
- [x] Subscribe/Join distinction is conveyed without a hover (visible primary copy + tooltip).
- [x] Joining a cell appears in Cell Settings → My Cells with a mock "syncing → connected" state. *(Membership shown; sync animation deferred to [028](../028-conductor-runtime-status-ui/README.md).)*
- [x] Fork action from a canonical cell creates an `uncurated/<did>/<name>` entry visible in the browser.
- [ ] Sunset cell renders archived state and is read-only. *(Archived lifecycle in schema; UI affordance deferred.)*

## Notes

This spec deliberately mirrors the Holochain registry vocabulary even though the prototype has no real conductor — so when [holochain/015-frontend](../../../holochain/specs/015-frontend/README.md) lands, screens swap `mockApi` for `conductorClient` without redesign.

Open: do we want a "default home cell" concept on first run, or treat every user as cell-less until they explicitly subscribe/join? Holochain spec leans toward optional location-hint auto-subscribe; prototype could ship with no auto-join to keep the model honest.

### Implementation summary (2026-05-14)

Shipped:

- Prisma models `Cell`, `CellMembership` + migration; seed set (1 canonical, 5 promoted, 1 uncurated).
- Server module `src/server/cells/` (list, get, join, leave, joinAsGuest, createCell, forkCell, listMyCells).
- API routes `/api/cells`, `/api/cells/[id]`, `/api/cells/[id]/join`, `/api/cells/[id]/fork`, `/api/me/cells`.
- UI pages `/cells` (browser), `/cells/[id]` (detail), `/cells/new` (wizard), `/cells/settings` (with My Cells / My Subscriptions tabs).
- `<CellBadge>` reusable component; rendered on `IssueCard`.
- Layout nav additions (desktop + mobile).
- End-to-end smoke verified: join, leave, fork, subscribe, source filter all return live data.

Deferred (explicitly):

- **Map view** in cell browser — list view shipped; map requires a tile layer + H3/place-ref decoding. Punt to a follow-up after 030 visual refresh.
- **Sunset / archived UI affordance** — schema has `lifecycle: archived`, no UI rendering yet.
- **"Contribute as guest" CTA on issue detail** — server-side `joinAsGuest` ready; UI integration belongs in [029](../029-issue-cell-context-affordances/README.md).
- **Per-cell sync indicator on My Cells** — belongs in [028](../028-conductor-runtime-status-ui/README.md).
