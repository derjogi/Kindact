---
status: complete
created: '2026-03-18'
tags:
  - notifications
  - mvp
  - ux
priority: medium
created_at: '2026-03-18T00:00:00.000Z'
depends_on:
  - 002-wallet-auth
  - 004-issue-intake
  - 008-voting-engine
  - 010-verification-disputes
  - 011-cc-ledger
---

# Notifications & Feed

> **Phase**: MVP · **Priority**: Medium · **Subsystem**: UX

## Overview

In-app notification system and issue subscription so users can follow issues they care about and be informed when meaningful events happen. Keeps participants engaged across the slow-moving timescale of real governance issues.

Push/email delivery is a Phase 2 enhancement; at MVP, notifications are in-app only.

## Design

### Notification Event Types

| Event | Triggered By |
|---|---|
| `issue.state_changed` | Issue advances (e.g., → `vote-ready`, → `adopted`) |
| `issue.vote_adopted` | Issue reaches adoption threshold |
| `vote.tally_shifted` | Tally crosses a significant threshold (e.g., 50%, 80%) |
| `claim.verification_result` | Implementer's claim approved or rejected |
| `claim.reward_minted` | $CC minted to implementer's account |
| `dispute.opened` | Dispute raised on a claim the user is involved in |
| `dispute.resolved` | Dispute on user's claim or accusation resolved |
| `quiz.unlocked` | User becomes eligible to take eligibility quiz on followed issue |

### Data Models

- **IssueSubscription** — user ↔ issue follow binding
- **Notification** — event record: type, actor, object, read status, timestamp
- **NotificationPreference** — per-event-type opt-in/out setting per user

### API Surface

- `POST /issues/:id/subscribe` — follow an issue
- `DELETE /issues/:id/subscribe` — unfollow an issue
- `GET /notifications` — list notifications (unread first, paginated)
- `POST /notifications/read` — mark notifications as read (bulk)
- `GET /notifications/preferences` — get notification preferences
- `PUT /notifications/preferences` — update notification preferences

### Key Rules

- Users are auto-subscribed to issues they create or claim work on
- Users can manually subscribe to any issue
- Notifications are delivered in-app only at MVP (no email, no push)
- Users always receive notifications for their own claims and disputes, regardless of preferences
- Unread count displayed in the app header

## Plan

- [ ] Design notification schema with event types
- [ ] Implement issue subscription (auto + manual)
- [ ] Build notification generation on key state transitions (hooked into spec 001 events)
- [ ] Build notification list and mark-read API
- [ ] Build notification preference management
- [ ] Wire unread badge count to app header (spec 018)

## Test

- [ ] Auto-subscribe fires on issue creation and claim creation
- [ ] Notification generated for each covered event type
- [ ] Mark-as-read correctly updates unread count
- [ ] Users cannot unsubscribe from own claim / dispute notifications
- [ ] Preference opt-outs suppress correct event types

## Notes

**Phase 2:** Add email digest and browser push notifications. Add weekly summary digest for followed issues with low activity.

**Open questions:**
- Whether to show a notification preview (first N chars of summary) or just the event type
- Retention period for read notifications before archival
