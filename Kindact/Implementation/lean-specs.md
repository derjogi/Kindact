# Kindact Platform — Lean Implementation Specs

*Generated: March 18, 2026*

---

## Architecture Overview

**App architecture:** Modular monolith backend + worker queue + single web app
**State:** PostgreSQL (source of truth) + append-only event log
**Search/similarity:** Postgres FTS + pgvector
**Files/evidence:** S3-compatible object storage, content-addressed
**Chain:** Single EVM-compatible L2 at launch (chain-agnostic design)
**On-chain rule:** Every write creates an event; event hashes anchored on-chain in batches; critical economic/governance state written directly on-chain
**Identity privacy:** Public pseudonyms, private identity mapping encrypted server-side; ZK/nullifier-based uniqueness added progressively

---

## Priority & Implementation Order

| Order | ID | Spec | Phase |
|---|---|---|---|
| 1 | KND-00 | core-ledger | MVP |
| 2 | KND-01 | wallet-auth | MVP |
| 3 | KND-02 | human-verification | MVP |
| 4 | KND-03 | issue-intake | MVP |
| 5 | KND-04 | deliberation-workspace | MVP |
| 6 | KND-05 | ai-assist-summary | MVP |
| 7 | KND-06 | metrics-eligibility | MVP |
| 8 | KND-07 | voting-engine | MVP |
| 9 | KND-09 | work-reports-evidence | MVP |
| 10 | KND-10 | verification-disputes | MVP |
| 11 | KND-11 | cc-ledger | MVP |
| 12 | KND-15 | fraud-risk-engine | MVP |
| 13 | KND-12 | reserve-exchange | Later |
| 14 | KND-13 | hypercerts-market | Later |
| 15 | KND-14 | meta-governance | Later |
| 16 | KND-08 | delegation-conviction | Later |
| 17 | KND-16 | module-registry | Mature |

## Subsystem Mapping

| Major Area | Specs |
|---|---|
| Identity & Authentication | KND-01, KND-02 |
| Issue Management | KND-03, KND-05 |
| Deliberation | KND-04, KND-05, KND-06 |
| Decision Making | KND-06, KND-07, KND-08 |
| Implementation & Verification | KND-09, KND-10 |
| Token Economy | KND-11, KND-15 |
| Reserve & Exchange | KND-12 |
| Hypercerts | KND-13 |
| Platform Governance | KND-14 |
| Fraud & Abuse Prevention | KND-15 |
| Blockchain Infrastructure | KND-00, KND-11, KND-12, KND-13, KND-14 |
| Modular Architecture | KND-16 |

---

# MVP Specs

---

## KND-00 / core-ledger

**Phase:** MVP
**Description:** Append-only event system for all platform mutations. Full payload stays off-chain; every event is content-addressed and hash-linked; batches are anchored on-chain.

### User Stories
- As an auditor, I can reconstruct issue/vote/reward history.
- As a client, I can subscribe to state changes.
- As an operator, I can rebuild read models from events.

### Acceptance Criteria
- Every write API emits an immutable `Event`.
- Each event includes `actor`, `object_type`, `object_id`, `payload_hash`, `prev_hash`, `timestamp`.
- Event batches are anchored on-chain at fixed interval or batch size threshold.
- Read models can be replayed from genesis with deterministic results.

### Key Data Models
- `Event` — immutable mutation record
- `EventBatch` — grouped events for on-chain anchoring
- `OnChainAnchor` — tx hash + block + merkle root for a batch
- `ContentBlob` — content-addressed payload storage
- `AuditReadModel` — materialized view rebuilt from events

### API Surface
```
GET  /events
GET  /events/:id
GET  /objects/:type/:id/history
GET  /anchors
```

### Dependencies
None (foundation layer).

### Open Questions
- Anchor cadence: fixed time vs fixed batch size vs both?
- Whether to pin all blobs to IPFS at MVP or only high-value evidence.

---

## KND-01 / wallet-auth

**Phase:** MVP
**Description:** Wallet-first authentication with pseudonymous profile, multi-wallet linking, signed session creation, and recovery/contact methods.

### User Stories
- As a user, I can sign in with my wallet.
- As a user, I can link a new wallet without losing history.
- As a user, I can keep a public pseudonym instead of my legal identity.

### Acceptance Criteria
- Supports SIWE-style nonce/signature auth.
- One account may link multiple wallets; one wallet belongs to one account.
- Public profile contains no legal identity fields.
- Wallet unlink is delayed if account has active disputes, claims, or redemption requests.

### Key Data Models
- `UserProfile` — pseudonymous display name, avatar, bio
- `WalletLink` — wallet address ↔ account binding
- `Session` — signed session token with expiry
- `RecoveryContact` — optional email/passkey for account recovery

### API Surface
```
POST   /auth/nonce
POST   /auth/verify
POST   /me/wallets
DELETE /me/wallets/:wallet
GET    /me
```

### Dependencies
KND-00

### Open Questions
- Allow optional email/passkey recovery or keep pure wallet auth?
- Whether public handles are globally unique or only display names.

---

## KND-02 / human-verification

**Phase:** MVP
**Description:** Unique-human verification using external human-proof providers, provider score aggregation, one-person-one-vote enforcement, and challenge flow. MVP uses provider attestations + nullifier registry; mature version adds full ZK selective disclosure.

### User Stories
- As a user, I can prove I am a unique human without exposing my real-world identity publicly.
- As the system, I can enforce one active voting identity per person.
- As a participant, I can challenge suspected duplicate identities.

### Acceptance Criteria
- Identity providers can be connected/disconnected with audit logs.
- Voting/verifying keys are based on `human_id`, not wallet.
- Only one active `human_id` can be eligible per verified person/nullifier.
- Duplicate challenge freezes high-risk privileges pending review.
- Accounts below trust threshold may read/post, but cannot vote/verify high-impact issues.

### Key Data Models
- `IdentityProviderLink` — provider name, attestation, connection timestamp
- `HumanCredential` — aggregated trust score from linked providers
- `HumanNullifier` — cryptographic uniqueness proof
- `IdentityChallenge` — dispute claiming two accounts are same person
- `IdentityRiskState` — current risk level and privilege restrictions

### API Surface
```
POST /identity/providers/:provider/connect
POST /identity/verify
GET  /identity/status
POST /identity/challenges
POST /identity/challenges/:id/resolve
```

### Dependencies
KND-00, KND-01

### External Dependencies
BrightID, Human Passport/Gitcoin Passport, future ZK credential providers.

### Open Questions
- Provider weighting/threshold policy.
- Manual review fallback for users excluded by provider availability.

---

## KND-03 / issue-intake

**Phase:** MVP
**Description:** Issue creation, editing, discovery, categorization, tagging, scope assignment, duplicate surfacing, and spam throttling.

### User Stories
- As a user, I can create an issue with topic, scope, and initial proposal.
- As a user, I can see likely duplicates before posting.
- As a moderator, I can merge/redirect near-duplicate issues.

### Acceptance Criteria
- Issue requires title, summary, scope, tags, impacted domains, and initial reward intent.
- Submit flow shows top duplicate candidates before final create.
- Issues support states: `draft` → `deliberating` → `vote-ready` → `adopted` → `implementing` → `completed` → `archived`.
- Rate limits and issue quotas reduce flooding.

### Key Data Models
- `Issue` — core issue record with state machine
- `IssueRevision` — version history of issue description
- `IssueTag` — topic/domain tags
- `ScopeTag` — local/national/global + geographic scope
- `DuplicateCandidate` — AI-surfaced similar issues with similarity score
- `IssueMergeRequest` — proposal to merge/redirect issues

### API Surface
```
POST /issues
PUT  /issues/:id
GET  /issues
GET  /issues/:id
GET  /issues/:id/duplicates
POST /issues/:id/merge-request
```

### Dependencies
KND-00, KND-01

### Open Questions
- Tag taxonomy bootstrap: free-form only vs seeded ontology?
- Merge authority: mods only vs community approval for non-trivial merges?

---

## KND-04 / deliberation-workspace

**Phase:** MVP
**Description:** Deliberation layer with threaded comments, structured pro/con maps, wiki-style proposal revisions, anonymized public display, and randomized ranking.

### User Stories
- As a user, I can comment in threads.
- As a user, I can add pro or con arguments to a structured argument map.
- As a newcomer, I can browse discussion without author prestige bias.

### Acceptance Criteria
- Each participant has one issue-scoped public alias per issue.
- Moderators can deanonymize only with explicit audit reason.
- Proposal body supports revision history, diffs, rollback.
- Default feed order is weighted/randomized, not pure popularity sort.

### Key Data Models
- `Comment` — threaded discussion item
- `ArgumentNode` — structured pro/con claim with parent linkage
- `ProposalDocument` — current state of the proposal body
- `ProposalRevision` — diff-based revision with author + AI review flag
- `IssueAlias` — per-issue anonymous identity for display
- `DeliberationReaction` — upvote/downvote (used in ranking, optionally hidden)

### API Surface
```
POST /issues/:id/comments
POST /issues/:id/arguments
POST /issues/:id/proposal/revisions
GET  /issues/:id/deliberation
GET  /issues/:id/proposal/history
```

### Dependencies
KND-03

### Open Questions
- Make anonymization default for all issues or configurable per issue/module?
- Whether reaction scores should be public or only used in ranking.

---

## KND-05 / ai-assist-summary

**Phase:** MVP
**Description:** AI assistance for issue improvement, duplicate explanation, proposal revision review, and living deliberation summaries. AI output is advisory, versioned, and challengeable.

### User Stories
- As an issue creator, I can get a better draft before publishing.
- As a newcomer, I can read a current summary of a long discussion.
- As a participant, I can flag a misleading summary.

### Acceptance Criteria
- AI outputs store `model_version`, `prompt_version`, and `source_refs`.
- Summaries include cited source item IDs.
- AI summaries can be flagged as biased/incomplete.
- Eligibility quizzes cannot use unapproved summary content.
- AI cannot directly overwrite proposal text; it can only suggest revisions.

### Key Data Models
- `AISuggestion` — improvement/edit suggestion with source refs
- `AISummary` — versioned deliberation summary with citations
- `AIReview` — automated review of a proposal revision
- `SummaryFlag` — user flag for bias/incompleteness
- `SummaryApprovalState` — approval status for use in quizzes

### API Surface
```
POST /ai/issues/:id/improve
GET  /issues/:id/summary
POST /summaries/:id/flags
POST /proposal-revisions/:id/ai-review
```

### Dependencies
KND-03, KND-04

### Open Questions
- Single-model at launch vs dual-model cross-check?
- Whether summaries need explicit human approval before they become default view.

---

## KND-06 / metrics-eligibility

**Phase:** MVP
**Description:** Voting gate with impact metrics, confidence/dispute states, stakeholder definitions, stake claims, and low-friction competence checks.

### User Stories
- As a user, I can see impact estimates before voting.
- As a resident or affected expert, I can prove stake and gain voting eligibility.
- As the system, I can block voting if required impact metrics are missing/disputed.

### Acceptance Criteria
- Required impact dimensions exist per issue type/scope.
- Minimum dimensions at MVP: `planetary`, `social`, `cost`, `time`, `legal/compliance`.
- Voting cannot open unless all required dimensions are `ready` and none are `blocking-disputed`.
- Eligibility quiz uses approved summary and non-leading factual questions.
- Stake claims support auto-accept via profile tags or manual review with appeal.

### Key Data Models
- `ImpactDimension` — typed impact axis (planetary, social, cost, time, legal)
- `MetricAssessment` — estimate with source, confidence level, revision history
- `MetricSource` — AI estimate, expert input, prediction market, user input
- `MetricDispute` — challenge to a specific metric assessment
- `StakeholderRule` — per-issue/scope rules for who qualifies
- `StakeClaim` — user's claim of relevance (auto or manual)
- `EligibilityQuiz` — generated quiz questions from approved summary
- `QuizAttempt` — user's quiz submission and result

### API Surface
```
POST /issues/:id/metrics
POST /metrics/:id/disputes
POST /issues/:id/stake-claims
POST /issues/:id/eligibility/attempts
GET  /issues/:id/eligibility/status
```

### Dependencies
KND-02, KND-03, KND-05

### Open Questions
- Exact set of mandatory dimensions by scope.
- Max retries and cooldowns for quiz attempts.

---

## KND-07 / voting-engine

**Phase:** MVP
**Description:** Ongoing one-person-one-vote approval voting with live tally, threshold policy, observation window, and pause/resume behavior if support drops.

### User Stories
- As an eligible user, I can cast and change my vote.
- As an observer, I can see current support and adoption state.
- As an implementer, I can see whether a decision is still active enough to continue claims.

### Acceptance Criteria
- One active vote per `human_id` per issue per decision mode.
- Default enabled mode at MVP: `approval`.
- Proposal enters `adopted` when threshold + quorum hold through observation window.
- If support falls below threshold after adoption, new claims pause pending review.
- Full vote history is auditable even though only current vote counts.

### Key Data Models
- `VoteRecord` — current vote + history per human_id per issue
- `DecisionMode` — approval (MVP), consensus, ranked-choice (later)
- `DecisionState` — current state: open, adopted, paused, reversed
- `ThresholdPolicy` — approval %, quorum rules
- `ObservationWindow` — time period threshold must hold before adoption

### API Surface
```
POST /issues/:id/votes
GET  /issues/:id/tally
GET  /issues/:id/decision-state
GET  /issues/:id/vote-history
```

### Dependencies
KND-02, KND-06

### Open Questions
- Initial default approval threshold: 80% vs issue-class overrides?
- Whether quorum scales by affected population, active users, or total verified users.

---

## KND-09 / work-reports-evidence

**Phase:** MVP
**Description:** Work packages, implementer claims, partial progress reports, ValueFlows-compatible reporting, compliance fields, and evidence upload.

### User Stories
- As an implementer, I can claim an approved work package.
- As an implementer, I can submit partial progress and not wait for full completion.
- As an auditor, I can inspect inputs, outputs, time spent, and evidence.

### Acceptance Criteria
- Work package links to adopted issue and reward schedule.
- Reports support `partial`, `milestone`, `final`.
- Minimal ValueFlows subset captured for labor, materials, outputs, location, time.
- Evidence is immutable, content-addressed, and linked to report events.
- Compliance/permit fields exist for legally sensitive work.

### Key Data Models
- `WorkPackage` — scoped piece of work with reward schedule
- `Claim` — implementer's claim on a work package
- `ImplementationReport` — progress submission (partial/milestone/final)
- `EconomicEvent` — ValueFlows event: consume, produce, use, work
- `ResourceItem` — inputs/outputs referenced by economic events
- `ProcessRecord` — ValueFlows process linking events
- `EvidenceAsset` — content-addressed file (photo, video, document, geodata)
- `ComplianceAttestation` — legal/permit compliance declaration

### API Surface
```
POST /issues/:id/work-packages
POST /work-packages/:id/claims
POST /claims/:id/reports
POST /reports/:id/evidence
GET  /claims/:id
```

### Dependencies
KND-07

### Open Questions
- Whether issues allow parallel implementers by default.
- How exclusive claims are handled for scarce/physical tasks.

---

## KND-10 / verification-disputes

**Phase:** MVP
**Description:** Verifier assignment, evidence review, automated consistency checks, reward holdback, disputes, penalties, and fraud clawback.

### User Stories
- As a verifier, I can review a claim and approve/reject/request changes.
- As a participant, I can raise a dispute on a suspicious claim.
- As the system, I can block minting until verification is complete.

### Acceptance Criteria
- Claims above risk/reward threshold require multiple verifiers.
- Verifier rotation prevents repeated same-pair approvals above threshold.
- Automated checks include: duplicate media hash, metadata consistency, basic AI-media score, ValueFlows consistency.
- Reward minting only occurs for verified tranches.
- Disputes pause only unreleased tranches unless fraud severity threshold is met.
- Failed accusations trigger cooldown escalation (exponential).
- Confirmed fraud can create negative balance liability and permission restrictions.

### Key Data Models
- `VerificationAssignment` — verifier ↔ claim binding with rotation tracking
- `VerificationReview` — approve/reject/request-changes with rationale
- `EvidenceCheck` — automated consistency check result
- `DisputeCase` — formal dispute with challenger deposit
- `DisputeVote` — community vote on dispute (threshold: max(5, 2% of original voters), 80% agreement)
- `PenaltyAction` — clawback, negative balance, ban, restriction
- `CooldownState` — per-user accusation cooldown with escalation

### API Surface
```
POST /claims/:id/verify
POST /claims/:id/disputes
POST /disputes/:id/votes
POST /disputes/:id/resolve
GET  /claims/:id/verification
```

### Dependencies
KND-09, KND-15

### Open Questions
- Default dispute threshold: `max(5, 2% of original voters)`?
- Holdback % for verified-but-not-finalized rewards.

---

## KND-11 / cc-ledger

**Phase:** MVP
**Description:** $CC mint/burn/demurrage ledger, access fee burns, reward caps, clawback handling, and monthly monetary snapshots. Critical token state lives on-chain; app keeps indexed projections.

### User Stories
- As an implementer, I receive $CC after verified work.
- As a user, I can inspect my current and decayed balance.
- As an auditor, I can verify supply from public snapshots.

### Acceptance Criteria
- Mint paths limited to `work_minting` and `reserve_minting`.
- Burn paths include `access_fees`, `redemptions`, `hypercert_purchases`, optional `tx_fees`.
- Demurrage applies via global decay index — moving tokens does not avoid decay.
- Issue reward budget is capped by voter-scaled formula.
- Negative liabilities are tracked off-chain and netted against future rewards.
- Monthly supply snapshot exposes: `S_t`, `d`, `M_w`, `M_r`, `A`, `F`, `H`, `X`.
- Snapshot must satisfy: `S_{t+1} = (1-d)·S_t + M_w + M_r - A - F - H - X`.

### Key Economic Formulas
```
Supply:      S_{t+1} = (1 - d) · S_t + M_w + M_r - A - F - H - X
Equilibrium: S* = (M_w + M_r - A - F - H - X) / d
```

### Key Data Models
- `TokenAccount` — per-user token account
- `ScaledBalance` — balance adjusted for demurrage via global index
- `MintEvent` — work mint or reserve mint with source linkage
- `BurnEvent` — access fee, redemption, Hypercert purchase, tx fee
- `DemurrageCheckpoint` — global decay index snapshots
- `RewardBudget` — per-issue reward cap derived from voter count
- `NegativeLiability` — fraud clawback debt
- `MonetarySnapshot` — monthly aggregate for audit

### API Surface
```
GET  /ledger/accounts/:id
GET  /ledger/supply
GET  /ledger/snapshots/:period
POST /fees/charge
POST /rewards/mint
```

### Dependencies
KND-10

### Open Questions
- Initial voter-scaled cap function.
- Whether transfer fees are off by default until abuse justifies activation.

---

## KND-15 / fraud-risk-engine

**Phase:** MVP
**Description:** Cross-cutting risk engine for sybils, collusion, issue flooding, wash trading, delegation capture, manipulation patterns, and appealable auto-restrictions.

### User Stories
- As an operator, I can see why an account/claim/cluster was flagged.
- As the system, I can throttle suspicious activity before reserve damage occurs.
- As a user, I can appeal automated restrictions.

### Acceptance Criteria
- Risk scores recompute on key events and daily batch.
- Signals exist for: sybil risk, mutual-verification cluster, issue spam, wash trading, reward gaming, summary brigading, dispute griefing, demurrage evasion attempts.
- Automated actions limited to reversible restrictions: throttles, enhanced review, freeze high-risk privileges, redemption delay.
- Every automated action is logged with reason codes and appeal path.

### Covered Abuse Vectors
| Signal | Source Abuse Case |
|---|---|
| Sybil risk score | Sybil attacks (#1) |
| Mutual-verification cluster | Verification fraud rings (#2) |
| Governance vote pattern | Hostile governance takeover (#3) |
| Circular transfer detection | Wash trading (#4), demurrage evasion (#10) |
| Delegation concentration | Delegation capture (#5) |
| Metric manipulation score | Metrics manipulation (#6) |
| Issue creation rate/similarity | Issue flooding (#11) |
| Multi-persona deliberation | Strategic anonymity exploitation (#12) |
| Reward/voter ratio anomaly | Reward amount gaming (#17) |

### Key Data Models
- `RiskSignal` — individual risk indicator with confidence
- `RiskScore` — aggregated risk level per entity
- `FraudCluster` — graph-detected collusion group
- `Restriction` — automated action with reason + expiry
- `Appeal` — user appeal of restriction
- `CaseNote` — moderator investigation notes

### API Surface
```
GET  /risk/entities/:id
POST /risk/cases
POST /risk/restrictions
POST /risk/restrictions/:id/lift
POST /appeals
```

### Dependencies
KND-02, KND-03, KND-04, KND-10, KND-11

### Open Questions
- Thresholds for auto-action vs human-only review.
- Whether risk scoring is fully public, partially public, or moderator-only.

---

# Later Phase Specs

---

## KND-12 / reserve-exchange

**Phase:** Later
**Description:** Fiat reserve accounting, buy/redeem flow, 3-phase exchange behavior, premiums, daily redemption cap, reserve floor, and public reserve snapshots.

### User Stories
- As a user, I can buy $CC with fiat.
- As a holder, I can redeem $CC once the system is past bootstrap.
- As an auditor, I can verify reserve state and quote calculation.

### Acceptance Criteria
- **Phase 1 (Bootstrap, S_t < 100,000 CC):** Redemptions blocked; $CC circulates internally only.
- **Phase 2 (Growth, R_t < R_target):** Redemptions enabled; exchange rate uses confidence curve.
- **Phase 3 (Maturity, R_t ≥ R_target):** Exchange rate reaches $1; reverts to Phase 2 curve if reserve drops below target.
- Buy quote uses `E_buy = E_t × (1 + premium)` (default premium: 3%).
- Daily redemption cap: 1% of current reserve balance per 24h.
- Reserve floor: if `b_t = R_t / S_t` drops below 5%, redemptions pause and queue.
- Reserve snapshots expose inputs for reserve evolution formula.
- Fiat custody actions require dual approval and external attestation.

### Key Economic Formulas
```
Exchange rate: E_t = b_t + (1 - b_t) · (R_t / R_target)²
Reserve:       R_{t+1} = R_t + E_buy · M_r + V_h$ - E_t · X
Backing ratio: b_t = R_t / S_t
```

### Key Data Models
- `ReserveSnapshot` — point-in-time reserve state
- `ExchangeQuote` — computed quote with formula inputs
- `ReservePolicy` — phase rules, caps, floor thresholds
- `RedemptionRequest` — queued sell with status
- `FiatSettlement` — external fiat movement record
- `HypercertReserveInflow` — Hypercert sale → reserve inflow linkage

### API Surface
```
GET  /reserve/status
GET  /reserve/quote?side=buy|sell
POST /reserve/buy
POST /reserve/redeem
POST /reserve/hypercert-inflow
```

### Dependencies
KND-11, KND-15

### Open Questions
- Custody/legal jurisdiction.
- Whether reserve should be pre-seeded before public launch.

---

## KND-13 / hypercerts-market

**Phase:** Later
**Description:** Hypercert generation on verified completion, treasury ownership, listing/sale/retirement flows, fiat and $CC purchases, and reserve integration.

### User Stories
- As the platform, I generate a Hypercert when verified work completes.
- As an external buyer, I can browse and buy verified impact credentials.
- As a holder, I can retire a Hypercert claim (e.g., use a carbon offset).

### Acceptance Criteria
- Hypercert metadata links to issue, reports, evidence, metrics, and verification record.
- Hypercert treasury owns new certs by default.
- $CC purchases burn received tokens.
- Fiat sales create reserve inflow event.
- Hypercert lifecycle: `draft` → `listed` → `sold` → `retired`.
- Platform does not promise treasury buyback of Hypercerts.

### Key Data Models
- `Hypercert` — on-chain impact credential token
- `HypercertMetadata` — linked issue, evidence, metrics, verification
- `TreasuryHolding` — platform-owned Hypercert inventory
- `Listing` — marketplace listing with price/terms
- `Sale` — completed purchase record
- `Retirement` — one-time claim retirement (e.g., offset used)

### API Surface
```
POST /issues/:id/hypercerts/generate
GET  /hypercerts
POST /hypercerts/:id/list
POST /hypercerts/:id/purchase
POST /hypercerts/:id/retire
```

### Dependencies
KND-09, KND-10, KND-11, KND-12

### Open Questions
- Fractionalization at launch or later?
- Fixed-price listings first vs auction support?

---

## KND-14 / meta-governance

**Phase:** Later
**Description:** Platform rule changes use the same issue workflow, plus parameter registry, constitutional protections, code review requirements, timelock, and deployment execution.

### User Stories
- As a participant, I can propose a platform rule change.
- As a reviewer, I can approve a code change linked to a governance proposal.
- As an auditor, I can trace a deployed change to vote, code, review, and on-chain execution.

### Acceptance Criteria
- Governance proposals must target typed `parameter_keys` and/or `code_change_refs`.
- Constitutional keys are explicitly enumerated in registry at launch.
- Constitutional changes require higher quorum (66%+ of total users) and approval policy.
- Code deployment blocked until required review approvals and timelock pass.
- A cumulative-delta linter escalates repeated small changes in same policy family if they cross protected threshold (anti-salami-slicing).

### Initial Constitutional Keys (Proposed)
- `one_person_one_vote`
- `open_source_requirement`
- `work_backed_minting`
- `self_referential_governance`
- `constitutional_change_quorum`

### Key Data Models
- `GovernanceProposal` — links to standard issue + parameter targets
- `ParameterKey` — typed, versioned platform parameter
- `ConstitutionRule` — protected parameter with supermajority quorum
- `CodeChangeRef` — git ref / PR linked to proposal
- `ReviewApproval` — code reviewer sign-off
- `DeploymentWindow` — timelock before execution
- `GovernanceExecution` — on-chain record of parameter change

### API Surface
```
POST /governance/proposals
POST /governance/proposals/:id/code-links
POST /reviews/:id/approve
POST /deployments/:id/execute
GET  /governance/registry
```

### Dependencies
KND-07, KND-00, KND-16

### Open Questions
- Final constitutional key list at launch.
- Bootstrap operator model before governance legitimacy is broad enough.

---

## KND-08 / delegation-conviction

**Phase:** Later
**Description:** Topic-scoped liquid delegation, expiry, alerts, concentration caps, and conviction accumulation to stabilize ongoing decisions.

### User Stories
- As a user, I delegate my environment votes to a trusted expert.
- As a delegator, I get notified when my delegate votes.
- As the system, I make reversals harder once a decision remains uncontested.

### Acceptance Criteria
- Delegations are topic/scope-scoped and revocable at any time.
- Delegations expire automatically unless renewed.
- Delegation concentration cap enforced per delegate (max delegated votes).
- Conviction accrues while approval stays above threshold and no blocking dispute exists.
- Reversal threshold rises as conviction rises.
- New implementation claims pause if reversal motion enters contested state.

### Key Data Models
- `Delegation` — delegator → delegate with scope + expiry
- `DelegationScope` — topic/tag filter for delegation
- `DelegateNotification` — alert when delegate casts vote
- `ConvictionScore` — per-issue accumulated conviction over time
- `ReversalPolicy` — conviction-adjusted reversal threshold

### API Surface
```
POST   /delegations
DELETE /delegations/:id
GET    /delegates/:id/impact
GET    /issues/:id/conviction
```

### Dependencies
KND-07

### Open Questions
- Default expiry window for delegations.
- Exact conviction formula and reversal margin.

---

# Mature Phase Specs

---

## KND-16 / module-registry

**Phase:** Mature
**Description:** Registry for pluggable decision, ranking, identity, verification, and deliberation modules. Later supports bounded community-level overrides and assurance contracts.

### User Stories
- As the platform, I can add a new voting mode without rewriting the core app.
- As a community, I can apply allowed overrides within platform bounds.
- As a moderator, I can enable an assurance contract for a specific issue type.

### Acceptance Criteria
- Modules declare interface version, config schema, and security level.
- Issues bind to module versions at creation and cannot hot-swap mid-vote.
- Overrides only apply to parameters explicitly marked overrideable.
- Override range validation prevents breaking global economic/security invariants.
- Assurance contracts can gate issue activation or reward tranche release.

### Key Data Models
- `ModuleDefinition` — interface type, version, config schema
- `ModuleVersion` — specific version with compatibility info
- `IssueModuleBinding` — which modules an issue uses (locked at creation)
- `ParameterOverride` — community-scoped parameter adjustment within bounds
- `AssuranceContract` — "I will if you will" threshold mechanism

### API Surface
```
GET  /modules
POST /modules/:id/enable
POST /overrides
POST /assurance-contracts
```

### Dependencies
KND-14

### Open Questions
- How to define "community" for overrides in an issue-based platform.
- Whether module execution is code-plugin, config-plugin, or service-adapter only.

---

# Dependency Graph

```
KND-00 (core-ledger)
├── KND-01 (wallet-auth)
│   └── KND-02 (human-verification)
│       ├── KND-06 (metrics-eligibility)
│       │   └── KND-07 (voting-engine)
│       │       ├── KND-09 (work-reports-evidence)
│       │       │   └── KND-10 (verification-disputes) ←── KND-15
│       │       │       └── KND-11 (cc-ledger)
│       │       │           ├── KND-12 (reserve-exchange) ←── KND-15
│       │       │           │   └── KND-13 (hypercerts-market)
│       │       │           └── KND-15 (fraud-risk-engine)
│       │       └── KND-08 (delegation-conviction)
│       └── KND-15 (fraud-risk-engine)
├── KND-03 (issue-intake)
│   ├── KND-04 (deliberation-workspace)
│   │   └── KND-05 (ai-assist-summary)
│   └── KND-05 (ai-assist-summary)
└── KND-14 (meta-governance) ←── KND-07
    └── KND-16 (module-registry)
```

---

# Risks & Guardrails

## 1. Identity failure = system failure
- Votes keyed by `human_id`, not wallet
- Multi-provider identity score
- Duplicate challenge flow
- Risk-based privilege throttles

## 2. Verification fraud rings = counterfeit minting
- Verifier rotation
- Multi-verifier thresholds
- Reward holdbacks
- Fraud graph detection
- Negative liability + clawback

## 3. Governance capture
- Enumerated constitutional registry
- Typed parameter changes
- Code-review + timelock
- Cumulative-delta linter for salami-slicing

## 4. AI manipulation
- AI output is advisory only
- Source-linked summaries
- Flag/challenge workflow
- Human-approved summary required for quizzes

## 5. Reserve drain / wash trading
- Bootstrap phase with no redemption
- Daily redemption cap
- Reserve floor pause
- Redemption delays for high-risk accounts
- Provenance/risk checks before cash-out

---

# Scaling Triggers — When to Move Beyond MVP

Move to Later/Mature phase when at least 2–3 of these are true:
- >10k verified users
- >$50k equivalent monthly rewards
- Reserve redemptions are live
- >100 active disputes/month
- >5 communities need materially different governance parameters
- Multiple external Hypercert buyers require richer market tooling
- On-chain tx costs or replay load become operational bottlenecks

---

# Optional Advanced Path

When triggers hit, next upgrades:
- Full ZK identity/nullifier proofs
- Multi-model summary verification
- Prediction markets as a metric source
- Separate treasury/custody service with external audits
- Multi-chain adapters
- Community override framework with strict bounded parameters
- Fully on-chain governance executor for protected modules

---

*This spec document is a working draft. Cross-reference with: Kindact_Main.md, Kindact_Economics.md, Kindact_Abuse_Cases.md, Kindact_Disagreements_Meta_Governance_Deep_Dive.md, Kindact_Local_vs_Global_Analysis.md, Open_Questions_and_Ideas.md.*
