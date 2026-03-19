---
status: planned
created: '2026-03-17'
tags:
  - architecture
  - mature
  - extensibility
priority: low
created_at: '2026-03-17T11:08:04.903Z'
depends_on:
  - 015-meta-governance
updated_at: '2026-03-17T11:08:39.730Z'
related:
  - 015-meta-governance
---

# Module Registry

> **Phase**: Mature · **Priority**: Low · **Subsystem**: Architecture

## Overview

Registry for pluggable voting, ranking, identity, verification, and deliberation modules. Supports bounded community-level parameter overrides and assurance contracts. Enables Kindact's modular, extensible design where communities can experiment with different mechanisms.

## Design

### Data Models

- **ModuleDefinition** — interface type, description, config schema, security level
- **ModuleVersion** — specific version with compatibility and audit info
- **IssueModuleBinding** — which modules an issue uses (locked at issue creation)
- **ParameterOverride** — community-scoped parameter adjustment within platform bounds
- **AssuranceContract** — "I will if you will" threshold mechanism for coordinated action

### API Surface

- `GET /modules` — browse available modules
- `POST /modules/:id/enable` — enable module for issue/community
- `POST /overrides` — apply parameter override within bounds
- `POST /assurance-contracts` — create assurance contract for an issue

### Key Rules

- Modules declare interface version, config schema, and security level
- Issues bind to module versions at creation; NO hot-swap mid-vote
- Overrides apply only to parameters explicitly marked overrideable
- Override range validation prevents breaking global economic/security invariants
- Assurance contracts gate issue activation or reward tranche release

### Module Types (Planned)

- **Voting**: approval, consensus, ranked-choice, quadratic
- **Ranking**: randomized, outlier-weighted, reputation-weighted
- **Deliberation**: anonymized, attributed, hybrid
- **Verification**: peer, expert, automated, multi-sig
- **Identity**: BrightID, Passport, ZK, composite

## Plan

- [ ] Design module interface specification and versioning
- [ ] Build module registry with discovery and compatibility info
- [ ] Implement issue ↔ module binding (locked at creation)
- [ ] Build parameter override engine with range validation
- [ ] Design and implement assurance contract mechanism
- [ ] Build community-scoped override management

## Test

- [ ] Modules bind at issue creation and cannot change mid-vote
- [ ] Overrides respect parameter bounds
- [ ] Invalid overrides (breaking invariants) are rejected
- [ ] Assurance contracts correctly gate activation
- [ ] Module version compatibility is enforced

## Notes

**Open questions:**
- How to define "community" for overrides in an issue-based platform
- Whether module execution is code-plugin, config-plugin, or service-adapter
- Security audit requirements for new module types
