---
status: planned
created: '2026-05-14'
tags:
  - frontend
  - ux
  - holochain
  - anchors
  - discovery
priority: high
created_at: '2026-05-14T01:31:24.160034255+00:00'
---

# Anchor Subscription Management UI

> Add the cross-cell discovery primitive — anchors — to the prototype. Replaces flat "topic filters" with a first-class subscription concept that survives across cells.

Counterpart in holochain/: [042-anchor-and-subscription-model](../../../holochain/specs/042-anchor-and-subscription-model/README.md). Related: [026 Cell Discovery & Membership UI](../026-cell-discovery-and-membership-ui/README.md).

## Overview

In the Holochain architecture, **cells are bounded; anchors are global.** A user with broad interests (`#wind-power`, `#new-york`, `#housing`) subscribes to anchors and only joins the cells that own issues they want to actively contribute to. The current prototype's filter row (Scope, Topic, Status) collapses this into ephemeral local filtering — losing the persistence, hierarchy, and notification value that makes anchors useful.

This spec elevates anchors from "search facets" to a saved, navigable, notifiable user concept.

## Design

### Anchor pill (visual primitive)

A reusable component used everywhere an anchor appears (issue card, issue detail, feed, search results):

```
[ # wind-power · 1.2k ]   ← topic anchor with subscriber count
[ 📍 Berlin · subscribed ]   ← location anchor, current user state
[ 🎪 cop34-2026 ]   ← event anchor
```

Click → anchor detail page. Long-press / `⋯` → Subscribe / Mute / Open in feed.

### Screens

| Screen | Purpose |
|---|---|
| **Anchor Browser** (`/anchors`) | Searchable, hierarchical tree of anchors (topic / location / event), with subscriber counts and parent/child links. |
| **Anchor Detail** (`/anchors/[id]`) | Description, synonyms, parent anchors, recent issues from any cell that linked here, Subscribe / Mute action, hierarchy walker. |
| **Subscriptions** (lives under Cell Settings → My Subscriptions per [026](../026-cell-discovery-and-membership-ui/README.md)) | List + edit subscribed anchors with per-anchor filter chips: scopeLevels, languages, min reward. |

### Feed integration

- The home Issue Feed gains a **"Source"** selector at the top: `All Subscriptions` (default) · `My Cells` · `Single anchor` · `All public`. Replaces today's flat "Scope" dropdown.
- Each issue card shows up to 3 anchor pills (overflow → `+N`); tapping a pill switches the feed source to that anchor.
- "🟢 New since last visit" badge respects per-anchor read state.

### Hierarchy walking

Subscribing to `#energy` surfaces `#wind-power`, `#solar`, etc. The Anchor Detail page renders the parent chain as breadcrumbs and child anchors as a chip cloud. Subscriptions show whether they are direct or hierarchy-inherited.

### Mock data

Seed anchor set covering: top-level topics (`#energy`, `#housing`, `#climate`, `#governance`, `#permaculture`), child anchors (`#wind-power`, `#solar`, `#bike-lanes`, `#waste`), location anchors (Berlin, Manhattan, NYC, EU), and one event anchor (`event:cop34-2026`). Wire 6–10 sample anchor_links from existing prototype issues.

### "Lens" terminology

Operationally, a saved anchor query + presentation overlay = the Holochain spec's definition of a lens. UI label: **"Lens"** is retained as the user-facing term for a saved, named bundle of subscriptions — accessible from the Subscriptions screen as `Save current view as Lens…`. This keeps the lens vocabulary alive without contradicting the cell architecture.

## Plan

- [ ] Build `<AnchorPill>` component with kind glyphs and state variants (subscribed / muted / hierarchy-inherited).
- [ ] Add anchor model + mock fixtures + `listAnchors`, `getAnchor`, `subscribe`, `unsubscribe` API.
- [ ] Anchor Browser page (tree view + search).
- [ ] Anchor Detail page with hierarchy breadcrumbs and recent-issue stream.
- [ ] Wire pills onto Issue Card + Issue Detail header.
- [ ] Replace flat Scope filter on home feed with Source selector.
- [ ] Subscriptions tab inside Cell Settings.
- [ ] "Save as Lens" affordance.

## Test

- [ ] Subscribing to `#energy` surfaces a `#wind-power`-tagged issue from a cell the user is not a member of.
- [ ] Anchor pill on issue card jumps the feed to that anchor's stream.
- [ ] Muted anchor's issues stay hidden across reloads.
- [ ] Saved Lens appears in the Source selector and reopens the same combined anchor view.
- [ ] Anchor with zero linked issues renders empty state per [holochain/039](../../../holochain/specs/039-empty-loading-error-states/README.md).

## Notes

The anchor pill design must reconcile with the current Topic-tag pill in [022-ui-prototype](../022-ui-prototype/README.md). Decision: deprecate the old pill component; anchor pills replace it. Tag-only issues become "auto-anchored to `#<tag>`" on creation, preserving the feel.

Open: should the prototype simulate notification fan-out for subscribed anchors, or leave that for the real conductor? Probably yes — fake notifications now to keep design pressure on the notification center.
