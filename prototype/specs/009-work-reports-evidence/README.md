---
status: complete
created: '2026-03-17'
tags:
  - implementation
  - mvp
  - core-loop
priority: high
created_at: '2026-03-17T11:07:52.430Z'
depends_on:
  - 008-voting-engine
updated_at: '2026-03-17T11:08:19.544Z'
---

# Work Reports & Evidence

> **Phase**: MVP · **Priority**: High · **Subsystem**: Implementation

## Overview

Work packages, implementer claims, partial progress reports, a minimal ValueFlows-compatible resource tracking subset, and immutable evidence upload. Enables the Implementation step of the core loop — turning adopted decisions into verified action.

Multiple parallel implementers are allowed by default on the same issue. Exclusive claim handling (for scarce/physical tasks) is a Phase 2 concern.

## Design

### Data Models

- **WorkPackage** — scoped piece of work linked to adopted issue with reward schedule (from issue's locked RewardIntent)
- **Claim** — implementer's claim on a work package (status: `active`, `submitted`, `verified`, `rejected`)
- **ImplementationReport** — progress submission: `partial`, `milestone`, `final`
- **EconomicEvent** — minimal ValueFlows subset: `work` (labor), `consume` (materials used), `produce` (outputs created)
- **ResourceItem** — inputs/outputs referenced by economic events
- **EvidenceAsset** — content-addressed file (photo, video, document, geodata)
- **ComplianceAttestation** — legal/permit compliance declaration

### API Surface

- `POST /issues/:id/work-packages` — create work package for adopted issue
- `POST /work-packages/:id/claims` — claim a work package (multiple allowed per issue)
- `POST /claims/:id/reports` — submit implementation report
- `POST /reports/:id/evidence` — upload evidence for a report
- `GET /claims/:id` — get claim with reports and evidence
- `GET /issues/:id/claims` — list all claims for an issue

### Key Rules

- Work packages link to adopted issues; reward schedule derived from locked RewardIntent (spec 004)
- Parallel implementers are allowed by default — multiple actors can hold active claims on the same issue simultaneously; each receives rewards for their own verified work
- Reports support partial progress (monthly for bigger projects) — rewards pay out per verified unit, not on final completion only
- Minimal ValueFlows subset at MVP: `work`, `consume`, `produce` event types; location and time fields
- Evidence is immutable, content-addressed, linked to report events
- Compliance/permit fields exist for legally sensitive work

## Plan

- [ ] Design work package and claim schemas
- [ ] Build claim lifecycle (active → submitted → verified/rejected)
- [ ] Implement parallel claim support (multiple active claims per issue)
- [ ] Implement report submission with partial/milestone/final types
- [ ] Build minimal ValueFlows economic event logging (work, consume, produce)
- [ ] Implement content-addressed evidence upload (S3 + hash)
- [ ] Add compliance attestation fields
- [ ] Build report/evidence query APIs

## Test

- [ ] Work packages correctly link to adopted issues and inherit reward schedule
- [ ] Multiple active claims can exist for the same issue simultaneously
- [ ] Partial reports allow incremental progress tracking and reward release
- [ ] Evidence files are immutable and content-addressed
- [ ] Claims cannot be created for non-adopted issues

## Notes

**Phase 2:** Add exclusive claim support (for tasks where only one actor should work, e.g., scarce physical resources). Expand ValueFlows vocabulary. Add GrowGood-style farm management integration as a domain-specific module.

**Open questions:**
- How exclusive claims are handled for scarce/physical tasks (opt-in flag on work package?)
