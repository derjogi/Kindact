---
status: planned
created: '2026-05-14'
tags:
  - frontend
  - ux
  - holochain
  - issues
priority: high
created_at: '2026-05-14T01:31:24.247743749+00:00'
---

# Issue Cell-Context Affordances

> Surface the cell that owns each issue, the anchors it publishes to, and the cross-cell contribution affordance ("Contribute as guest"). Without this, every issue looks like it lives on a single global platform — which contradicts the cell architecture.

Counterpart in holochain/: [030 Cell Architecture & Registry](../../../holochain/specs/030-cell-architecture-and-registry/README.md), [042 Anchor & Subscription Model](../../../holochain/specs/042-anchor-and-subscription-model/README.md), [044 Cross-Cell Validation & Trust](../../../holochain/specs/044-cross-cell-validation-and-trust/README.md), [015-frontend §Issue detail](../../../holochain/specs/015-frontend/README.md).

## Overview

The current `IssueCard` and Issue Detail show title, status, scope, and tags — none of which indicate the issue's **home cell** or its **anchor links**. This spec is the integration layer between [026 Cell Discovery](../026-cell-discovery-and-membership-ui/README.md) and [027 Anchor Subscriptions](../027-anchor-subscription-management-ui/README.md): adding the per-issue cell + anchor + cross-cell-contribution affordances so the cell architecture is felt at the point of action.

## Design

### Issue card additions

```diagram
╭───────────────────────────────────────────────────────────────╮
│ ● Voting   Protected bike lane network                        │
│ ╭─────────────────╮  ╭───────────────╮ ╭──────────────╮       │
│ │ 🟢 kindact:berlin│  │ # bike-lanes │ │ 📍 Berlin   │ +2 ... │
│ ╰─────────────────╯  ╰───────────────╯ ╰──────────────╯       │
│ 45 participants · 56 comments · 3h ago                        │
│                                              [ Quick view → ] │
╰───────────────────────────────────────────────────────────────╯
```

- **Cell badge** (left, with tier dot from [026](../026-cell-discovery-and-membership-ui/README.md)): clicking jumps to the cell detail page.
- **Anchor pills** ([027](../027-anchor-subscription-management-ui/README.md)): up to 3, overflow chip, click switches feed source.
- "Quick view" remains; primary click target stays on the issue title.

### Issue detail header

A new line directly under the title:

```
Posted in 🟢 kindact:berlin · publishes to # bike-lanes  📍 Berlin  # transit
```

The `Posted in` link opens cell detail; anchor pills behave per [027](../027-anchor-subscription-management-ui/README.md).

### Cell context strip (sticky on issue detail)

Below the lifecycle stepper, a one-line strip clarifying the user's relationship to this issue's home cell:

| User state | Strip content |
|---|---|
| Member of this cell | `✓ You are a member of kindact:berlin` (collapsed by default) |
| Subscribed via anchor | `🔭 You see this via your # bike-lanes subscription. ` `[ Join cell ]` `[ Contribute as guest ]` |
| Not subscribed at all | `🌐 Public issue. ` `[ Subscribe to # bike-lanes ]` `[ Join cell ]` `[ Contribute as guest ]` |
| Cell membrane denies | `🔒 Writing requires scope verification (geo-tagged evidence)` with a learn-more link. |

### Guest-contributor flow

A modal launched from "Contribute as guest" CTA:

1. **Scope explainer**: "You'll get write access to *this issue only* in `kindact:berlin`. No validation duties. You can comment, vote, and submit work reports."
2. **Membrane proof if required**: e.g. upload geotagged evidence, accept invite token, or none for default-public cells.
3. **Confirm**: registers user as guest contributor for this issue (per [holochain/044](../../../holochain/specs/044-cross-cell-validation-and-trust/README.md)). Mocked as a local flag in the prototype.

After confirmation, all action CTAs unlock with a small `Guest contributor` badge next to the user's alias on every interaction.

### Jurisdictional-claim binding view

If the cell carries jurisdictional claims (e.g. `jc:berlin-housing-rules-v2`), an inline expandable: *"This issue is subject to: Berlin Housing Rules v2 — see clauses applied."* Aligns with [holochain/043](../../../holochain/specs/043-jurisdictional-claims/README.md).

### Cross-cell linkage

When a related issue exists in another cell (same anchor, related deliberation), surface a "Related across cells" section with cards that include the source cell badge. Important: makes the discoverability story tangible.

## Plan

- [ ] Extend `Issue` model with `cellId`, `anchorIds`, `jurisdictionalClaims`.
- [ ] Update `IssueCard` to render cell badge + anchor pills + overflow.
- [ ] Update Issue Detail header line and Cell Context Strip component.
- [ ] Build Guest Contributor modal with mocked membrane-proof step.
- [ ] Jurisdictional-claim expandable on issue detail.
- [ ] "Related across cells" section under issue detail.
- [ ] Update sample issues to span multiple cells, including one cross-cell guest-contribution scenario for demos.

## Test

- [ ] Issue card shows correct cell badge + anchor pills; tier dot reflects canonical/promoted/uncurated.
- [ ] User who is a member sees the collapsed member strip; user with only an anchor subscription sees the explainer + Join/Guest CTAs.
- [ ] Guest contributor flow unlocks comment/vote on a single issue without joining the cell.
- [ ] Jurisdictional-claim panel renders when cell has claims and is absent otherwise.
- [ ] Related-across-cells section surfaces an issue from a different cell sharing an anchor.

## Notes

This spec is the most visible to users of the four — it's where the cell vocabulary lands in the place people actually spend time. Worth UX-reviewing the strip copy before code; the language differences (member vs. subscriber vs. guest) are exactly the texture the holochain spec set is trying to make legible.

Open: should the guest-contributor badge persist on the user's alias forever for that cell, or only within the issue scope? Holochain spec leaves this open under §8.3.9 — prototype should pick the per-issue model to keep the privacy story clean.
