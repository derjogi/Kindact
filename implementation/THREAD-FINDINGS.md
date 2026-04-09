# Kindact — Design Decisions & Details from Past Threads

> **Purpose**: Collated from ~12 Amp threads (Mar–Apr 2026). Contains design decisions, data models, architecture patterns, and identified gaps that have been discussed but may not yet be reflected in the current lean-specs.

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
1. **Foundation**: 001 (Diamond), Extensibility Foundation, Core Metrics Framework
2. **Primitives**: 004 (Content Anchoring), 002 (Identity), 003 ($CC Token)
3. **Issue Core**: 005 (Lifecycle)
4. **Runtime/Decision**: 007 (Voting), 014 (Backend)
5. **Governance**: 009 (Delegation), 013 (Meta-Governance)
6. **Economics**: 008 (Work Verification), 010 (Reserve Exchange)
7. **Impact/Disputes**: 012 (Disputes), 011 (Hypercerts)
8. **Deliberation**: 006
9. **Frontend**: 015

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
- **Open**: Manual review fallback for users excluded by Gitcoin Passport

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
- **Verifier selection**: Rotated from qualified community members; multiple verifiers for larger rewards
- **Open**: Verifier selection/rotation algorithm is TBD
- **Open**: Holdback percentage for verified-but-not-finalized rewards
- **Open**: Default reward threshold for multiple verifiers

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
- Governance dimensions (topics vs. scope vs. tags) collapsed into single tag system

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
- Multisig attestation of deposits from Stripe/bank transfers
- **Gap**: No detailed oracle security design

### 011 — Hypercerts Bridge
#### AT Protocol Shift
- Hypercerts v2 is built on AT Protocol, not ERC-1155
- Uses `org.hypercerts.claim.activity` for impact records
- On-chain `HypercertsBridgeFacet` anchors AT-URI + CID, manages funding/settlement

#### Ownership Model Conflict
- AT Proto: records owned by creators
- Kindact design: Hypercerts "held by platform" to back reserve
- **Open**: Custodial model, platform-managed wallets, or Kindact-as-creator?

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

## 5. Additional Specs Discussed

### Tag Registry (from delegation thread — specs 016-020 in that numbering)
Five sub-specs were designed for tag-based delegation but **may conflict with current spec numbering** (016-017 are now Impact Metrics and Work Planning):

| Sub-spec | Content |
|----------|---------|
| Tag Registry | Tag struct, slug normalization, frozen snapshots at VoteReady |
| Delegation Rules | Rule struct with tagSet matching |
| Multi-Tag Resolution | Specificity-ranked algorithm |
| Transitive Delegation | BFS resolution, tally integration |
| Conviction / Decision Stability | Linear conviction, reversal process |

**Action needed**: Merge this content into spec 009 or create sub-specs under it.

### Extensibility Foundation & Core Metrics Framework
Discussed as new foundation specs but **may overlap with existing 016 (Impact Metrics)**. Define:
- Lenses, canonical geography, module slots, protocol binding, snapshots
- Baseline dimensions (social, planetary, economic cost, time, uncertainty)

**Action needed**: Determine if these should be standalone specs or folded into 013/016.

---

## 6. Outstanding Gaps & Open Questions

> **Updated 2026-04-22**: Specs 006, 009, 010, 011, 012, 014 updated with thread content. Items marked ✅ have been merged into specs.

### Unresolved Design Questions
1. **Verifier selection algorithm** (008) — mechanism for rotating qualified community verifiers is TBD
2. ✅ **Fiat oracle security** (010) — multisig oracle design added; decentralization path noted as open question
3. ✅ **Hypercert ownership model** (011) — three options documented in spec; decision still needed
4. ✅ **Delegation eligibility bypass** (009) — documented as security consideration
5. ✅ **Governance dimensions** (009) — documented as security consideration (future work)
6. **Holdback percentage** (008) — for verified-but-not-finalized rewards
7. **Multiple verifier threshold** (008) — reward level requiring >1 verifier

### Specs Updated with Thread Content (2026-04-22)
| Spec | What was merged |
|------|-----------------|
| 006 | Data models (Comment, ArgumentNode, AISummary), spotlight algorithm, issue-scoped aliases, universal source panel, quote-commenting |
| 009 | Multi-tag resolution algorithm, transitive BFS resolution, conviction cap, reversal process, security considerations |
| 010 | ReserveState + QueuedRedemption structs, fiat oracle design |
| 011 | HypercertAnchor struct, ownership model options, marketplace details |
| 012 | Dispute struct, procedural snapshot binding |
| 014 | Database schema, API contract outline |

### Already Merged in Prior Threads (found in current specs)
| Spec | Already present |
|------|-----------------|
| 002 | AT Proto DID bridging via `app.certified.link.evm` ✅ |
| 004 | AT Proto signed repos, Merkle batch anchoring ✅ |
| 005 | Snapshot hashes, version field, amendment/reversal flows ✅ |
| 007 | Fluid voting, eligibility via 002 ✅ |
| 008 | AT Proto work reports, evidence via `org.hypercerts.context.attachment` ✅ |

### Still Missing — Not in Any Spec
- **Tag Registry**: Required by 009's multi-tag delegation design. Five sub-specs were designed in the delegation thread but not created as lean-specs (numbering conflict with 016/017).
- **Extensibility Foundation**: Lenses, module slots, protocol binding, procedural snapshots — referenced by 005, 007, 008, 014, 015 but no dedicated spec exists.
- **Verifier selection algorithm** (008): Rotation mechanism TBD.
- **Holdback percentage** and **multi-verifier threshold** (008): Open design questions.
- **Hypercert ownership model decision** (011): Three options documented but no decision made.
