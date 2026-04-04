---
status: planned
created: '2026-03-17'
tags:
  - governance
  - later
  - platform
priority: medium
created_at: '2026-03-17T11:08:04.078Z'
depends_on:
  - 008-voting-engine
  - 001-core-ledger
updated_at: '2026-03-17T11:08:39.733Z'
related:
  - 017-module-registry
---

# Meta-Governance

> **Phase**: Later · **Priority**: Medium · **Subsystem**: Platform Governance

## Overview

Platform rule changes use the same issue-based workflow as any other Kindact issue, plus a typed parameter registry, constitutional protections requiring supermajority, code review requirements, timelock before deployment, and anti-salami-slicing detection. The platform governs itself using itself.

## Design

### Constitutional Keys (Proposed Initial Set)

- `one_person_one_vote` — foundational integrity guarantee
- `open_source_requirement` — transparency and trust
- `work_backed_minting` — no printing money from nothing
- `self_referential_governance` — platform uses its own mechanisms
- `constitutional_change_quorum` — 66%+ of total users required

### Data Models

- **GovernanceProposal** — links to standard issue + parameter targets
- **ParameterKey** — typed, versioned platform parameter
- **ConstitutionRule** — protected parameter requiring supermajority quorum
- **CodeChangeRef** — git ref / PR linked to proposal
- **ReviewApproval** — code reviewer sign-off
- **DeploymentWindow** — timelock before execution
- **GovernanceExecution** — on-chain record of parameter change

### API Surface

- `POST /governance/proposals` — create governance proposal (targets parameter keys)
- `POST /governance/proposals/:id/code-links` — link code changes to proposal
- `POST /reviews/:id/approve` — code reviewer approval
- `POST /deployments/:id/execute` — execute after timelock
- `GET /governance/registry` — browse all parameters and their status

### Key Rules

- Governance proposals must target typed `parameter_keys` and/or `code_change_refs`
- Constitutional changes require 66%+ of total users (supermajority quorum)
- Regular changes use standard voting thresholds with scaled quorum
- Code deployment blocked until review approvals AND timelock pass
- Cumulative-delta linter: escalates repeated small changes in same policy family that cross protected thresholds (anti-salami-slicing)

## Plan

- [ ] Design parameter registry with typed keys and version tracking
- [ ] Define initial constitutional key set
- [ ] Build governance proposal flow (extends standard issue workflow)
- [ ] Implement code change linking and review approval pipeline
- [ ] Build timelock enforcement before deployment
- [ ] Implement cumulative-delta linter for salami-slicing detection
- [ ] Build on-chain governance execution records

## Test

- [ ] Constitutional changes require supermajority quorum
- [ ] Code changes blocked without review + timelock
- [ ] Cumulative-delta linter detects policy family drift
- [ ] All governance executions are on-chain auditable
- [ ] Parameter changes are traceable to proposals and votes

## Notes

**Open questions:**
- Final constitutional key list at launch
- Bootstrap operator model before governance has sufficient participation
- How to handle emergency security patches (fast-track governance?)
