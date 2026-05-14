---
status: planned
created: 2026-04-07
priority: medium
derivation: ported
ports_from: 027-015j-ui-meta-governance
tags:
- frontend
- ux
- governance
depends_on:
- 015-frontend
related:
- 013-meta-governance
- 034-information-architecture
created_at: 2026-04-07T23:16:33.819506640Z
updated_at: 2026-04-07T23:16:33.819553905Z
---

# 027 — UI: Meta-Governance

> **Status**: Exploratory · **Derivation**: ported · **Counterpart in implementation/**: [027-015j-ui-meta-governance](../../../implementation/specs/027-015j-ui-meta-governance/README.md)

## Hybrid notes

UI port. Adds bridge multi-sig roster view ([040](../040-bridge-specification/README.md)), oracle relay roster view ([045](../045-oracle-relay-network/README.md)), cell promotion proposals, and jurisdictional-claim authority proposals.


## Overview

Platform-level governance: rule changes, module approval, and constitutional safeguards — all using the same issue/deliberation/vote flow as regular issues.

## Features

### Platform Rule Changes
- **Meta-governance proposals** — create issues that modify platform rules, using the same creation / deliberation / voting flow as regular issues
- **Rule change diff view** — clearly show what the current rule is vs. what the proposal would change
- **Constitutional change indicators** — prominent visual markers when a proposal affects constitutional-level rules (one-person-one-vote, open-source requirements); display supermajority quorum requirements

### Module Catalog
- **Module catalog browser** — view all available modules with maturity levels (experimental / beta / stable / core)
- **Module detail page** — description, slot, dependencies, incompatibilities, data produced, fallback renderer preview
- **Module approval process** — meta-governance voting on new modules; security audit status display
- **Module promotion / deprecation tracking** — history of maturity level changes

### Audit & Transparency
- **Governance history** — log of all platform rule changes with who proposed, vote tallies, and effective dates
- **Active rules reference** — current state of all configurable platform parameters

## Design Notes

- Meta-governance issues should be visually distinct from regular issues (badge, color, icon) to signal their platform-wide importance
- Constitutional changes should feel intentionally heavyweight — extra confirmation steps, prominent quorum counter
- Module catalog can start as a simple list; grows into a marketplace-style experience later

## Dependencies

- Meta-governance contract (013)
- Module registry (001)
- Standard issue / voting UI (shared components from 019, 021)
