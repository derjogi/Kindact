---
status: planned
created: '2026-05-12'
tags: [hosting, conductor, ux, infrastructure, mobile]
priority: high
derivation: new
depends_on:
  - 030-cell-architecture-and-registry
  - 041-base-dna-specification
related:
  - 014-conductor-and-bridge-service
  - 015-frontend
---

# 047 — Holo Hosting Strategy

> **Status**: Exploratory · **Derivation**: new · **Counterpart in implementation/**: implicit; the AppView pattern doesn't have an analog.

## Overview

Holochain hApps run inside a **conductor** — a process that manages cells, source chains, and DHT participation. End users either run a local conductor (sovereignty, harder UX) or use **[Holo hosting](https://holo.host)** (managed conductor, browser UX, hosting-trust assumption). This spec captures the strategy for both, including when each is appropriate, what the trust model is, and how Kindact's frontend negotiates between them.

This is one of the open product questions ([§8.2.6 of the exploration document](../../../implementation/holochain-architecture-exploration.md)) and the spec stops short of choosing a single answer.

## Design

### Three runtime modes

| Mode | Conductor | Trust | UX | Use case |
|---|---|---|---|---|
| **Local conductor (desktop)** | Runs on user's machine | None added | Requires install | Power users, validators, signers |
| **Local conductor (mobile)** | Runs on user's phone | None added | Requires app install + always-on, battery cost | Sovereignty-conscious mobile users |
| **Holo hosting** | Runs on Holo host network | Hosting host trust | Browser; no install | Mass-market, casual users |

The frontend ([015](../015-frontend/README.md)) detects available conductor connections in this priority:
1. Local conductor on `ws://localhost:8888` if responsive.
2. Holo Web SDK if the user has selected Holo mode.
3. Read-only fallback (anchor browse only, no write).

### Holo hosting trust model

Holo hosts run user cells but cannot author entries on the user's behalf without the user's signing key. The signing key stays in the user's browser (or hardware) wallet; the host signs *nothing* — it only relays gossip and serves DHT queries.

What the host *can* do:
- Censor reads (selectively withhold gossip).
- Selectively reveal reads to other parties.
- Resource-limit (delay) requests.

What the host *cannot* do without detection:
- Forge entries (signature mismatch).
- Mutate user source chain (chain integrity).
- Equivocate on validation (other validators see the discrepancy).

Mitigation for the host's threat surface:
- Multi-host hosting: the user's data is replicated across N hosts; censorship requires colluding hosts.
- Periodic local-conductor sync: power users can run a local conductor and verify their Holo-hosted data matches.
- Audit mode: a third party can pull the user's source chain hash and verify against the host's served version.

### What Kindact ships

| Layer | Default |
|---|---|
| **Web app** | Holo-hosted by default; opt-in local-conductor mode |
| **Desktop app** | Local conductor bundled (Tauri or Electron wrapper around Launcher) |
| **Mobile app** | Holo-hosted by default; experimental local-conductor mode for power users |

### Sensitive operation handling

For operations with long-term economic consequence (work-claim signing, vote on a constitutional change, redemption request), the frontend forces an extra confirmation that surfaces the runtime mode and trust note:

> "You are running in **Holo-hosted** mode. Your signing key is local; your data path is hosted. Multi-host replication: 3-of-5. [Switch to local conductor]"

Users can switch modes for sensitive operations and back to Holo-hosted for everyday browsing.

### Conductor-as-a-service alternatives

If Holo hosting maturity or pricing is unsuitable at launch, fallback options:

- **Self-hosted conductor-as-a-service**: Kindact-operated conductor pool with the same trust profile as Holo hosting. Re-introduces a Kindact-operated dependency.
- **Community-hosted nodes**: cell members or validators offer hosted conductor slots.
- **Hybrid**: Holo-hosted for read; local for write (the frontend uses Holo for browsing and the user's mobile/desktop for signing).

The spec recommends starting with Holo hosting if mature at launch; otherwise launch with desktop-only and a public roadmap for mobile.

### Resource budgeting (per device)

| Resource | Local desktop | Local mobile | Holo-hosted (per host) |
|---|---|---|---|
| RAM | 200–800 MB | 80–250 MB | shared across many users |
| Storage | grows with cell membership; estimate 100 MB per active medium cell | same; budget tighter | host-side |
| Bandwidth | ongoing gossip; idle ~1 KB/s, active ~50 KB/s per cell | same | host-served |
| Battery | non-trivial; ongoing gossip drains | non-trivial | offloaded |

These numbers are rough; production hApp deployments today operate within them. Kindact-specific load testing is required before any commitment.

### Migration path

Users can switch between modes without losing data:
- Local → Holo: user authorizes a host to mirror their cells; source chain is replicated; user can revoke.
- Holo → Local: user installs a conductor; pulls cell data from Holo hosts; once verified, ceases hosting subscription.
- Multi-mode: user runs both simultaneously (desktop primary, Holo standby).

## Plan

1. [ ] Evaluate Holo hosting maturity (SDK, latency, cost) at decision time.
2. [ ] Build conductor-detection logic in the frontend ([015](../015-frontend/README.md)).
3. [ ] Build Tauri or Electron desktop wrapper bundling Launcher.
4. [ ] Document the trust model in user-facing docs and in the runtime-mode confirmation UI.
5. [ ] Decide and document the launch default.
6. [ ] Plan a 90-day load test against simulated Kindact traffic before launch.

## Test

- [ ] Frontend gracefully detects local conductor and prefers it.
- [ ] Holo-hosted mode signs a work claim using local key; the entry's signature verifies; the host cannot tamper.
- [ ] Migration: a user moves from Holo to local; source chain replicates; subsequent entries continue from the same chain head.
- [ ] Censorship test: simulate a malicious host withholding gossip; multi-host replication still surfaces the entry.
- [ ] Mobile battery: 8-hour passive usage drains < N% battery.

## Open questions

- **§8.2.6 End-user runtime** — local-only, Holo-hosted-only, or hybrid default?
- **Holo hosting pricing model** — does Kindact subsidize, charge users, or split with a sponsor?
- **Mobile production-readiness** — Holochain mobile conductors are maturing but not battle-tested; what's the minimum viable mobile experience?
- **Geographic Holo host distribution** — is Holo's host network present in Kindact's target communities (LATAM, Africa, SEA)?
- **What happens when Holo is down?** — graceful degradation to read-only, or graceful migration to local?
- **Privacy** — Holo hosts see metadata (which cells, when, how often); is this acceptable for sensitive cells (vulnerable communities)?

## Notes

The local-vs-hosted question is the single biggest UX risk in the hybrid architecture. AT Protocol's PDS-AppView model has the same shape (PDS = source chain, AppView = read service), but PDS hosting is much more mature today. Holo hosting is the right model for Kindact's values but its production readiness needs explicit validation before commitment.

For a ground-truth check, install Holo Launcher and walk through running an existing hApp end-to-end on multiple devices; the texture of conductor-life is hard to specify on paper.
