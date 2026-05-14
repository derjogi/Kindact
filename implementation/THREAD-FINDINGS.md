# Kindact — Design Decisions & Details from Past Threads

> **Purpose**: Collated from ~12 Amp threads (Mar–Apr 2026). Contains design decisions, data models, architecture patterns, and identified gaps that have been discussed but may not yet be reflected in the current lean-specs.
>
> **Last updated 2026-04-30 (later)**: All 7 outstanding open design questions resolved through brainstorming pass. Decisions merged into specs 002, 008, 009, 010, 011. See [Section 6](#6-outstanding-gaps--open-questions).
>
> **Earlier 2026-04-30**: Spec restructuring resolved naming conflicts. New specs created: 028 (Tag Registry), 029 (Decision Continuity), 030 (Extensibility Foundation), 031 (Core Metrics Framework). 009 trimmed to delegation only. Cross-references added between 016 ↔ 031; dependency frontmatter audited for 005 and 014.

---

## Table of Contents

1. [Cross-Cutting Architecture](#1-cross-cutting-architecture)
2. [AT Protocol Integration](#2-at-protocol-integration)
3. [Extensibility & Lenses](#3-extensibility--lenses)
4. [Per-Spec Findings](#4-per-spec-findings)
5. [Additional Specs Discussed](#5-additional-specs-discussed)
6. [Outstanding Gaps & Open Questions](#6-outstanding-gaps--open-questions)

---

## 1. Cross-Cutting Architecture

### Blockchain Target
- EVM-based L2 (Optimism or Base) — chosen for Hypercerts/RetroPGF ecosystem alignment.

### On-Chain / Off-Chain Split
| Layer | Owns |
|-------|------|
| **On-chain (Diamond)** | Governance rules, voting, token ledger ($CC), disputes, rewards, identity registry |
| **AT Protocol (Federated)** | Deliberation content, evidence, profiles, Hypercerts records |
| **Content Anchoring (004)** | The bridge — anchors AT Proto CIDs on-chain |

### Procedural Snapshots
At phase boundaries, issues freeze their procedural rules to prevent "mid-game" changes:
- **Decision Snapshot**: `decision.engine`, `decision.continuity`, `decision.modifier`, eligibility rules
- **Implementation Snapshot**: `verification.policy`, `verification.evidence`, reward parameters
- **Dispute Snapshot**: `dispute.policy`

Snapshots freeze *procedure*, not *outcome* — votes and reversals can still evolve.

### Dependency Execution Order (Updated)
1. **Foundation**: 001 (Diamond), 030 (Extensibility Foundation), 031 (Core Metrics Framework)
2. **Primitives**: 004 (Content Anchoring), 002 (Identity), 003 ($CC Token), 028 (Tag Registry)
3. **Issue Core**: 005 (Lifecycle), 016 (Impact Metrics)
4. **Runtime/Decision**: 007 (Voting), 014 (Backend)
5. **Governance**: 009 (Delegation), 029 (Decision Continuity), 013 (Meta-Governance)
6. **Economics**: 008 (Work Verification), 017 (Work Planning), 010 (Reserve Exchange)
7. **Impact/Disputes**: 012 (Disputes), 011 (Hypercerts)
8. **Deliberation**: 006
9. **Frontend**: 015, 018-027 (UI specs)

---

## 2. AT Protocol Integration

### Rationale
The off-chain shell (backend, deliberation, frontend) presented centralization risks. AT Protocol decentralizes the data layer.

### AT Proto ↔ Kindact Mapping

| AT Proto Concept | Kindact Problem Solved |
|---|---|
| **Personal Data Servers (PDS)** | Users own deliberation data |
| **Signed Data Repositories** | Records are cryptographically signed by author's DID |
| **Account Portability** | Users can migrate PDS without losing history |
| **Relays + AppViews** | Multiple independent indexers; no single operator monopoly |
| **Lexicons** | Standardized schemas for interoperability |

### Kindact Lexicon Namespace (`org.kindact.*`)

| Lexicon | Spec |
|---------|------|
| `org.kindact.deliberation.comment` | 006 |
| `org.kindact.deliberation.argument` | 006 |
| `org.kindact.deliberation.proposal` | 006 |
| `org.kindact.work.report` | 008 |

### Hypercerts Lexicons Used

| Lexicon | Purpose |
|---------|---------|
| `org.hypercerts.claim.activity` | Impact records (replaces ERC-1155) |
| `org.hypercerts.context.attachment` | Evidence blobs |
| `org.hypercerts.context.measurement` | Quantitative metrics |
| `org.hypercerts.context.evaluation` | Qualitative assessments |
| `org.hypercerts.funding.receipt` | Funding records |
| `app.certified.link.evm` | DID ↔ wallet bridging |

### Identity Bridging (002)
- Link AT Proto DIDs to EVM wallet addresses via `app.certified.link.evm` lexicon
- On-chain `IdentityRegistryFacet` stores `wallet → AT Proto DID`
- Verification via EIP-712 signature

---

## 3. Extensibility & Lenses

### Lenses
- Discovery and configuration layers (not territorial jurisdictions)
- Select issues using: canonical location refs, topic tags, scope level, interest keywords
- Lens governance only affects overlays and defaults, not core platform rights

### Protocol Binding
When an issue is created, matching lens overlays resolve into a single authoritative Protocol Binding:
1. Issue explicit override
2. Most specific combined overlay
3. Most specific geographic overlay
4. Most specific topic/interest overlay
5. Platform default

### Module Slots
| Slot | Cardinality |
|------|-------------|
| `deliberation.surface` | multi |
| `decision.engine` | single |
| `decision.continuity` | single |
| `decision.modifier` | multi |
| `verification.policy` | single |
| `dispute.policy` | single |
| `metrics.dimension_pack` | multi |

---

## 4. Per-Spec Findings

### 001 — Diamond Module Registry
*Current spec is implementation-ready. No additional thread findings.*

### 002 — Identity Primitive
- **AT Proto DID bridging** via `app.certified.link.evm` — discussed in architecture thread, may not be in spec yet
- On-chain record: `walletAddress`, `humanityScore` (0-100), `providerMask` (bitmask)
- External integration with Gitcoin Passport is API-based (score submitted, not fetched)
- ✅ **Resolved**: multi-provider portfolio (Gitcoin Passport, BrightID, Proof of Humanity, Anon Aadhaar, Worldcoin). No manual-review fallback. Residual exclusion is a v2 concern.

### 003 — $CC Token Core
- **Demurrage formula**: `effectiveBalance(account) = rawBalance * (currentDecayIndex / balanceDecayIndex)`
- **Debt Ledger** (for dispute clawbacks without breaking ERC-20):
  ```solidity
  struct DebtRecord {
      int256  debtBalance;     // negative = owes tokens
      uint64  incurredAt;
  }
  ```
- **MonetarySnapshot**:
  ```solidity
  struct MonetarySnapshot {
      uint256 totalSupply;
      uint256 totalMinted;
      uint256 totalBurned;
      uint256 currentDecayIndex;
      uint64  timestamp;
  }
  ```

### 004 — Content Anchoring
- Shifted from raw IPFS to AT Protocol signed repositories
- On-chain anchors AT-URI references and CIDs from AT Proto records
- Verification: Retrieve from PDS/Relay → verify DID signature → compare CID to on-chain anchor

### 005 — Issue Lifecycle
- **States**: `Draft → Deliberating → VoteReady → Adopted → Implementing → Completed → Archived`
- **New on-chain fields** (from extensibility thread):
  - `scopeVectorHash`, `protocolBindingHash`, `metricsBundleHash`
  - `decisionSnapshotHash`, `implementationSnapshotHash`, `disputeSnapshotHash`
  - `rewardCeiling`, `snapshotHash`, `version`
- **Transition gate**: `Deliberating → VoteReady` requires resolved protocol binding + net-impact gate satisfied
- **Reversal**: Adopted decisions can revert to Deliberating (via conviction challenge); completed milestones/rewards are unaffected

### 006 — Deliberation Service
**This is the most enriched spec from threads — substantial design exists:**

#### Architecture
- **AT Proto AppView pattern**: Users write to PDS → Relay aggregates firehose → Kindact AppView indexes and serves API
- Multiple independent AppViews can exist — no single operator monopoly
- Threaded comments are core; pro/con graphs and wikis are optional surfaces activated by protocol binding

#### Data Models (from prototype)
```prisma
model Comment {
  id          String   @id @default(uuid())
  issueId     String
  authorId    String
  text        String
  parentId    String?
  upvotes     Int      @default(0)
  downvotes   Int      @default(0)
  stance      String?  // "pro" | "con" | null
  quotedText  String?
  sourceType  String?  // "description" | "metric" | "boundary"
  sourceId    String?
  quoteStart  Int?
  quoteEnd    Int?
}

model ArgumentNode {
  id        String   @id @default(uuid())
  issueId   String
  authorId  String
  text      String
  type      String   // "pro" | "con"
  parentId  String?
}

model AISummary {
  id            String   @id @default(uuid())
  issueId       String   @unique
  content       String
  modelVersion  String
  promptVersion String
  sourceRefs    String[] @default([])
  references    Json?    // Overlapping character-position spans → comment IDs
}
```

#### AI Integration — Universal Source Panel
- AI pre-computes overlapping character-position spans when generating summaries
- Reference structure: `{ start, end, text, commentIds, strength: "direct"|"approximate" }`
- Hovering any word in summary populates a floating side panel with source comments

#### Anonymization
- **Issue-Scoped Aliases**: Each user gets a unique animal alias per issue (e.g., "Anonymous Owl 🦉")
- Display-layer only; backend retains author mapping for moderation
- Deanonymization only by moderators with audit reason

#### Ranking Algorithm — Spotlight Selection
5 threads promoted to top:
1. 2 threads: Random from top 10 most-interacted
2. 2 threads: Random from least-interacted
3. 1 thread: Completely random

Vote counts are **hidden** from all users except the vote author (prevents popularity bias).

### 007 — Voting Engine
- Eligibility gates removed for MVP — everyone with verified identity (002) can vote
- Decomposed: approval tallying is core; observation periods/finalization moved to `decision.continuity` modules
- New event: `DecisionContinuityCheckpoint`

### 008 — Work Verification & Rewards
- Implementation reports stored as `org.kindact.work.report` in implementer's PDS
- Evidence as AT Proto blobs via `org.hypercerts.context.attachment`
- Flow: create AT Proto records → submit AT-URI + CID on-chain
- **ValueFlows vocabulary** for reports: `work` (labor), `consume` (materials), `produce` (outputs)
- Modular verification via `verification.evidence` and `verification.policy` slots
- ✅ **Resolved — Verifier model**: volunteer-based, never assigned. Eligibility filtered by hard exclusions (self-claim, recent same-implementer, dispute-confirmed bad-history, delegation-graph proximity, failed-dispute cooldown).
- ✅ **Resolved — Verifier rewards**: default = platform fees on the issue (community-tunable per 013).
- ✅ **Resolved — Holdback**: 70/30 default (30% deferred to dispute-window close). Tunable + tierable via 013.
- ✅ **Resolved — Multi-verifier threshold**: voter-scaled tiers — 1 (<20), 3 (20–100), 5 (>100). Tunable.

#### API Surface (from prototype)
```
POST /issues/:id/work-packages
POST /work-packages/:id/claims
POST /claims/:id/reports
POST /reports/:id/evidence
```

### 009 — Delegation & Conviction
**Extensively designed across threads — 5 sub-specs were drafted:**

#### Delegation Rules
```solidity
struct Delegation {
    address delegator;
    address delegate;
    bytes32[] topicTags;
    uint256 delegatedAt;
    uint256 revokedAt;
}
```

#### Multi-Tag Resolution Algorithm
1. Find matching rules: `rule.tagSet ⊆ IssueTags`
2. Rank by specificity: sort by `|rule.tagSet|` descending
3. Take top tier (largest tag count)
4. Check uniqueness: ambiguous → no delegation

#### Transitive Resolution
- BFS with max depth 5
- Cycle detection: if visited address reappears, marked unresolved
- Direct vote always overrides delegation
- Tally counts represent **represented humans**, not unique senders

#### Conviction Formula
- `conviction = k * time_since_adoption` (linear growth)
- Reversal threshold: `required_opposition > base_threshold + conviction`
- Conviction cap ensures decisions are never truly irreversible
- Successful reversal: `Adopted → Deliberating`; completed milestones unaffected

#### Security Gaps Identified
- No gas analysis for transitive resolution
- Eligibility bypass: only terminal delegate needs to pass eligibility quiz
- ✅ **Resolved — Governance dimensions**: topic and scope delegation now coexist via a `dimension` field. Geographic delegation has its own resolution rules (specificity-by-containment) and shares multi-rule machinery. Hard prerequisite on 030.

### 010 — Reserve Exchange
#### Confidence Curve
```
E_t = b_t + (1 - b_t) * (R_t / R_target)^2
```
Where `b_t` is backing ratio (`R_t / S_t`).

#### Three Phases
| Phase | Condition | Behavior |
|-------|-----------|----------|
| Bootstrap | Supply < 100k $CC | No cash-outs |
| Growth | Reserve < $1M | Confidence curve pricing |
| Maturity | Reserve ≥ $1M | Rate pegged to $1 |

#### Flow Controls
- Daily redemption cap: 1% of reserve per 24h
- Reserve floor: backing ratio < 5% → queue
- Buy premium: 3% fee on fiat-to-$CC

#### Fiat Oracle
- ✅ **Resolved**: `IReserveOracle` interface; pluggable, automated providers only. No manual multisig in the steady-state read loop.
- Acceptable providers: oracle networks with Open Banking PoR adapters (Chainlink, Pyth, RedStone), zkTLS/TLSNotary attestations, bank-signed attestations.
- Multiple providers may be registered for N-of-M agreement. Registration via 013.
- Multisig limited to bootstrap configuration and timelocked emergency overrides.

### 011 — Hypercerts Bridge
#### AT Protocol Shift
- Hypercerts v2 is built on AT Protocol, not ERC-1155
- Uses `org.hypercerts.claim.activity` for impact records
- On-chain `HypercertsBridgeFacet` anchors AT-URI + CID, manages funding/settlement

#### Ownership Model
- ✅ **Resolved**: **Kindact-as-creator** with contributor attribution. Platform DID signs every `org.hypercerts.claim.activity`. Contributors compensated entirely in $CC at verification time; no revenue share on hypercert sales.
- Required mitigations (in 011): contributor portability via `org.kindact.work.report`; platform-DID key management as 013 concern; lexicon conformance check before implementation; full evidence-chain references on every hypercert.

#### Revenue Model
- Fiat purchases → Reserve Exchange (010)
- $CC purchases → token burn (deflationary)

#### Marketplace Gaps
- No pricing model, listing struct, or access control defined
- **ValueFlows vocabulary** for mapping implementation reports to Hypercert dimensions

#### HypercertRecord (discussed)
```solidity
struct HypercertRecord {
    uint256 id;
    uint256 issueId;
    uint256 claimId;
    bytes32 workDescriptionHash;
    bytes32 impactMetricsHash;
    uint256 mintedAt;
}
```

### 012 — Dispute Resolution
- Challenger stakes $CC deposit
- Resolution: 2% of original voters (min 5), 80% agreement
- Confirmed fraud → clawback current balance; remainder → Debt Ledger (003)
- Anti-abuse: exponential cooldown on failed challengers (24h → 72h → 7d)
- Verifier rotation enforced on-chain
- Should bind to issue's snapshotted dispute rules
- **Gap**: No Dispute struct defined

### 013 — Meta-Governance
- Two-tier model with constitutional protection
- Emergency brake and timelocks
- Well-defined Parameter and ParameterProposal structs
- *Current spec is implementation-ready.*

### 014 — Off-Chain Backend
#### Architecture (Kindact AppView)
| Component | Role |
|-----------|------|
| Chain Indexer | Indexes Diamond events → PostgreSQL |
| AT Proto Relay Subscription | Filters firehose for `org.kindact.*` and `org.hypercerts.*` |
| AppView API | Serves combined on-chain + AT Proto data |
| Extensibility Runtime | Global module catalog + protocol binding resolution |

#### Auth
- Dual-stack: EIP-4361 / SIWE (on-chain) + AT Proto OAuth (data operations)

#### DB Schema (from prototype Prisma)
```prisma
model LedgerEvent {
  id          String   @id @default(uuid())
  sequence    BigInt   @default(autoincrement()) @unique
  actor       String
  objectType  String
  objectId    String
  action      String
  payloadHash String
  prevHash    String?
  eventHash   String
  createdAt   DateTime @default(now())
}

model User {
  id          String   @id @default(uuid())
  humanId     String?  @unique
  wallets     WalletLink[]
  tokenAccount TokenAccount?
}

model Issue {
  id           String      @id @default(uuid())
  status       IssueStatus @default(draft)
  scope        IssueScope
  rewardIntent RewardIntent?
  metrics      MetricAssessment[]
  workPackages WorkPackage[]
}

model TokenAccount {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Float    @default(0)
}
```

#### API Endpoints (bullets only — no request/response shapes)
- Issues CRUD, Deliberation (comments/arguments), Voting (tallies/eligibility), Users (profiles/balances), Work Reports

#### Gaps
- No request/response type definitions
- No error handling strategy
- No deployment architecture

### 015 — Frontend
#### Tech Stack
- Next.js, React, TypeScript, Tailwind CSS
- wagmi + RainbowKit (wallet), SIWE (auth)
- React Query (server state), Zustand (client state)
- `@atproto/api`, `@hypercerts-org/lexicon`

#### Key Components (from prototype)
- **SourcePanel**: Sticky right-margin panel for citation display
- **SummaryWithRefs**: AI summary with hover-linked references
- **CollapsibleDescription**: Wiki-style body with quote-commenting
- **ThreadList**: Spotlighted threads, stance indicators, hidden vote counts
- **Lifecycle Stepper**: Phase pipeline visualization
- **VoteBar**: Conviction visualization + metrics gate

*Appropriate level of detail for a UI spec — no struct-level gaps.*

### 016 — Impact Metrics
- MetricsBundle struct defined
- Net-impact gate logic specified
- AI estimation results published as AT Proto records by AI service's DID
- Uses `org.hypercerts.context.measurement` and `org.hypercerts.context.evaluation`

### 017 — Work Planning
- WorkPackage and Milestone structs defined
- Multi-implementer model with parallel claims
- Lightweight approval delegates to 007
- Well-integrated with 005 and 008

---

## 5. Additional Specs Discussed — Now Created ✅

### Tag Registry (from delegation thread)
Five sub-specs were originally designed for tag-based delegation. After review, they were restructured into **3 cohesive specs** rather than 5 fragmented ones:

| Original sub-spec | Where it lives now |
|-------------------|---------------------|
| Tag Registry | ✅ **028-tag-registry** (preserved as standalone — tags are a cross-cutting primitive) |
| Delegation Rules | ✅ Merged into **009-delegation** |
| Multi-Tag Resolution | ✅ Merged into **009-delegation** |
| Transitive Delegation | ✅ Merged into **009-delegation** |
| Conviction / Decision Stability | ✅ **029-decision-continuity** (separated — orthogonal to delegation) |

### Extensibility Foundation & Core Metrics Framework
Both have been created as standalone foundation specs:

- ✅ **030-extensibility-foundation**: lenses, canonical geography, module slots, protocol binding, procedural snapshots
- ✅ **031-core-metrics-framework**: baseline dimensions, dimension packs, metrics lifecycle, canonical export format

Note: 031 has intentional overlap with **016-impact-metrics** — 031 defines the *what/why* (framework, taxonomy), 016 defines the *how* (on-chain facet, AT Proto storage).

---

## 6. Outstanding Gaps & Open Questions

> **Updated 2026-04-30**: Restructuring complete. Specs 006, 009, 010, 011, 012, 014 enriched with thread content. Specs 028, 029, 030, 031 created. Items marked ✅ have been addressed.

### Specs Updated with Thread Content
| Spec | What was merged |
|------|-----------------|
| 006 | Data models (Comment, ArgumentNode, AISummary), spotlight algorithm, issue-scoped aliases, universal source panel, quote-commenting |
| 009 | Multi-tag resolution algorithm, transitive BFS resolution, security considerations (conviction moved to 029) |
| 010 | ReserveState + QueuedRedemption structs, fiat oracle design |
| 011 | HypercertAnchor struct, ownership model options, marketplace details |
| 012 | Dispute struct, procedural snapshot binding |
| 014 | Database schema, API contract outline |

### Specs Created from Prior Thread Designs
| Spec | Source |
|------|--------|
| 028-tag-registry | Delegation thread (originally proposed at 016) |
| 029-decision-continuity | Delegation thread (originally proposed at 020 as conviction-voting) |
| 030-extensibility-foundation | Extensibility strategy thread (originally proposed at 016) |
| 031-core-metrics-framework | Extensibility strategy thread (originally proposed at 017) |

### Already Merged in Prior Threads (found in current specs)
| Spec | Already present |
|------|-----------------|
| 002 | AT Proto DID bridging via `app.certified.link.evm` ✅ |
| 004 | AT Proto signed repos, Merkle batch anchoring ✅ |
| 005 | Snapshot hashes, version field, amendment/reversal flows ✅ |
| 007 | Fluid voting, eligibility via 002 ✅ |
| 008 | AT Proto work reports, evidence via `org.hypercerts.context.attachment` ✅ |

### Resolved — Decisions Locked In ✅

All 7 previously-open design questions were resolved on 2026-04-30 in a dedicated brainstorming pass and merged into the affected specs.

1. ✅ **Verifier model** (008) — **volunteer-based, not assigned.** Any humanity-verified user MAY opt in to verify a claim. The protocol filters eligibility via hard exclusions (self-claim, recent same-implementer cooldown, dispute-confirmed bad-verification history, presence in implementer's delegation graph, failed-dispute cooldown) plus soft signals surfaced in UI. *Merged into 008.*
2. ✅ **Holdback** (008) — **70% released on verification, 30% held back** until dispute window closes. Tunable per 013, may be community-tiered (e.g., 50/30/15 by reward size). Frozen at Implementing entry. *Merged into 008.*
3. ✅ **Multi-verifier threshold** (008) — **voter-scaled tiers**: 1 verifier (< 20 voters), 3 (20–100), 5 (> 100). Governance-tunable. *Merged into 008.*
4. ✅ **Hypercert ownership** (011) — **Kindact-as-creator with contributor attribution.** Platform DID signs every `org.hypercerts.claim.activity`; contributors are attributed but do not own the record. Compensation is in $CC at verification time, no revenue share on hypercert sales. Spec captures four required mitigations: portability via the contributor's `org.kindact.work.report`, platform-DID key management as a 013 concern, lexicon conformance check, and full evidence-chain references on every hypercert. *Merged into 011.*
5. ✅ **Identity fallback** (002) — **multi-provider portfolio**, no manual review. Initial set: Gitcoin Passport, BrightID, Proof of Humanity, Anon Aadhaar, Worldcoin/World ID. Stackable; weights governance-configurable. Residual exclusion acknowledged as v2 concern. *Merged into 002.*
6. ✅ **Fiat oracle** (010) — **interface-only design (`IReserveOracle`); no manual multisig in the steady-state read loop.** Acceptable providers: decentralized oracle networks with Open Banking PoR adapters (Chainlink, Pyth, RedStone), zkTLS/TLSNotary attestations, bank-signed attestations. Multiple oracles can be registered for N-of-M. Pluggable via 013. Multisig role limited to bootstrap configuration and timelocked emergency overrides. *Merged into 010.*
7. ✅ **Geographic-scope delegation** (009) — **promoted from "deferred" to v1**, with hard prerequisite on 030 canonical-geography lock. Variable-precision H3/S2 location commitments stored in user's PDS. Self-declared and flagged in v1 (verified-location providers tracked as v2). Boundary data sourced from OSM, HydroSHEDS, lens overlays. Scope-match resolution by hierarchical specificity, no fuzzy "closest scope" fallback. Coexists with topic-tag delegation via a `dimension` field; multi-dimensional ambiguity → no delegation. 009 now declares 030 as a dependency. *Merged into 009.*

### Spec Update Map (this round)

| Spec | What was merged |
|------|-----------------|
| 002 | Multi-provider stack (5 providers); removed manual-review fallback question |
| 008 | Volunteer verifier model + exclusions; verifier-reward source (platform fees); voter-scaled verifier-count tiers; 30% holdback default with tiering; updated Plan, Test, Notes |
| 009 | Geographic-scope delegation (full v1 design); `DelegationDimension` enum; multi-dimensional resolution; new dependency on 030 |
| 010 | `IReserveOracle` interface; provider categories; bootstrap-only multisig role; rationale for no manual loop |
| 011 | Kindact-as-creator decision + four required mitigations (portability, key mgmt, lexicon conformance, evidence chain) |

### Issues with the Spec Set Itself

1. ✅ **Overlap between 016 and 031** — Both specs now carry an explicit cross-reference banner explaining the split: 031 = framework/taxonomy (*what/why*), 016 = on-chain implementation (*how*).
2. **UI specs (018-027) are densely numbered** — leaves no room between core protocol specs (001-017) and foundation specs (028-031). If new core specs are needed, they'll have to go at 032+. *Decision: accept this; the UI specs were created as a contiguous block on purpose.*
3. ✅ **Spec 005 (Issue Lifecycle)** — now declares `030-extensibility-foundation` as a dependency in frontmatter.
4. ✅ **Spec 014 (Backend)** — now declares `030-extensibility-foundation` as a dependency in frontmatter.

### Recommended Next Actions
- ✅ All 7 open design questions resolved.
- **Pre-implementation verification**: confirm `org.hypercerts.claim.contribution` lexicon allows creator DID ≠ contributor DID(s) (per 011 mitigation #3) before hypercerts implementation begins.
- **030 canonical-geography lock** is now on the critical path for 009's geographic-scope delegation. Treat 030 progress as a v1 blocker, not a foundation-only concern.
- **013 meta-governance scope expansion**: 013 now owns several governance-tunable parameters from this round (verifier exclusion windows, holdback %/tiers, verifier reward source mix, oracle provider registration, humanity-provider weights, platform DID key rotation). Audit 013 to confirm its parameter registry can host these.
- Update lean-spec status to `in-progress` for any spec being actively designed.
- Implementation kickoff is no longer blocked by open design decisions.
