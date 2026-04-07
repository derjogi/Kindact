---
status: planned
created: 2026-04-07
priority: high
tags:
- frontend
- ux
- verification
depends_on:
- 015-frontend
related:
- 008-work-verification-rewards
created_at: 2026-04-07T23:16:33.435416386Z
updated_at: 2026-04-07T23:16:33.435481467Z
---

# 022 — UI: Implementation & Verification

## Overview

Work claiming, implementation reporting, evidence submission, and verification workflows for approved issues.

## Features

### Work Management
- **Work package listing** — approved issues broken into claimable work units
- **Claim management** — claim, start, and track progress on approved tasks
- **Progress tracking** — monthly / periodic progress milestones for long-running projects

### Implementation Reports
- **Structured report form** capturing:
  - What was done (free text + structured fields)
  - Time spent (hours / duration)
  - Resources used (materials, tools, services)
  - Impact achieved (measurable outcomes)
  - ValueFlows-compatible structured resource-flow data (inputs consumed, outputs produced, ecological impacts)

### Evidence Submission
- **Photo / video upload** — with geotagging and timestamp verification
- **Peer confirmation** — N-of-M community member attestation interface (request attestations, track responses)
- **Third-party verification** — auditor attestation submission interface
- **On-chain proof display** — show smart contract interaction evidence

### Automated Checks
- **Consistency validation** — algorithmic validation of resource-flow data (flagging mismatches before human review)
- **Verifier rotation indicator** — show that the same verifier can't repeatedly approve the same issue
- **Verification policy display** — show which evidence types are required per the issue's protocol binding

### Rewards
- **Partial reward display** — show rewards already earned for partial / ongoing work (pivoting doesn't mean total loss)
- **Reward breakdown** — show how reward amount was determined (voter count, community deliberation)

## Design Notes

- Report form should adapt to the issue's verification policy (only show relevant evidence types)
- ValueFlows data entry should be guided, not raw — drop-downs for resource types, auto-calculations where possible
- Evidence upload should support drag-and-drop with automatic metadata extraction

## Dependencies

- Work verification & rewards (008)
- Content anchoring (004)
- Extensibility foundation — verification modules (016)
