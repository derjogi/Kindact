# Kindact UI Features

> **Source**: Derived from [Kindact_Main.md](../Kindact_Main.md) and cross-referenced with
> the [extensibility strategy](./extensibility-strategy.md).
> **Date**: 2026-04-08
> **Purpose**: Comprehensive inventory of every user-facing feature implied by the vision document. Each section maps to one or more implementation specs.

---

## 1. Dashboard & Discovery

**Spec**: 015-frontend, 015a-ui-dashboard

- Personalized issue feed filtered by user's lens subscriptions (location, topic, interest)
- Lens-based discovery — browse, follow, mute community lenses; auto-subscribe suggestions based on optional location hint
- $CC token balance with demurrage decay visualization ("use it or lose it" countdown)
- Notification center — new issues, vote results, implementation updates, dispute alerts, delegation activity
- Community activity stream — recent actions across subscribed lenses
- Global search with AI duplicate detection — find existing issues before creating new ones

---

## 2. Issue Creation

**Spec**: 015b-ui-issue-creation, relates to 005-issue-lifecycle

- Free-form issue creation — title, description, scope (local / national / global), canonical location refs, topic tags
- AI-assisted drafting — improvement suggestions, refinement prompts
- AI duplicate / similar issue detection — surface existing related issues before submission
- AI-suggested categorization — auto-suggest tags and topics
- Reward amount proposal — creator proposes initial $CC reward with AI suggestion based on comparable past tasks (ValueFlows data)
- Initial metrics assignment — attach impact estimates across social / planetary / economic / time dimensions

---

## 3. Deliberation & Discussion

**Spec**: 015c-ui-deliberation, relates to 006-deliberation-service

- **Threaded comments** — traditional discussion with replies
- **Anonymized author display** — no visible identity during deliberation; clear visual indicator of anonymous mode
- **Randomized comment ordering** — mix of randomness, outlier detection, upvotes (never pure popularity)
- **Structured pro/con arguments** (Kialo-style) — argument tree with supporting / opposing points
- **Collaborative proposal wiki** — Wikipedia-style editable proposal body evolving with discussion
- **AI content guard for wiki edits** — verify edits don't inappropriately alter existing content; flag significant changes for community review
- **AI continuous summarization** — live-updating summary: main points, key arguments per side, consensus / disagreement areas, outstanding questions
- **Opinion clustering** (Pol.is-style) — visual map of opinion groups
- **Consensus iteration rounds** — objection / response cycles for consensus-seeking
- **Metrics & predictions panel**
  - Per-issue impact estimates across social and planetary boundaries, economic cost, time, uncertainty
  - Confidence levels on all estimates
  - Side-by-side comparison when multiple approaches are proposed
  - Source labels (AI estimation, prediction market, user / expert input)
  - User flagging of disputed estimates
- **Prediction market widget** — community forecasting on likely outcomes
- **Identity reveal after voting** — unmask authors only after deliberation / voting concludes

---

## 4. Voting & Decision

**Spec**: 015d-ui-voting, relates to 007-voting-engine, 009-delegation-conviction

### Eligibility Gate
- Short quiz — true/false, multiple choice questions about the issue summary (not opinions)
- Relevance / stakeholder check — auto-admit if profile shows clear connection (location, field); brief stake explanation for others
- Metrics gate enforcement — voting blocked until metrics are filled; only net-positive outcomes may proceed

### Voting Interface
- Approval voting (default, always available as fallback)
- Alternative voting modules — ranked-choice, score voting, quadratic voting, consensus decision mode
- Fluid / ongoing voting — votes can be changed at any time; no permanent cutoff
- Live tally visualization — real-time vote counts with result breakdown

### Decision Continuity
- Conviction accumulation display — visual indicator showing how entrenched a decision has become over time (harder to reverse)
- Reconsideration window indicator

### Delegation (Liquid Democracy)
- Delegate your vote per-topic to a trusted person
- Delegation management UI — see current delegations per category
- Instant revocation — take back delegated vote at any time
- Delegation chain transparency — see how delegated votes flow

### Reward Scaling Indicators
- Voter-scaled reward caps — display that small groups can only unlock small rewards
- Asymmetric voting indicator — objections reduce caps more than approvals increase them

---

## 5. Implementation & Verification

**Spec**: 015e-ui-implementation, relates to 008-work-verification-rewards

- Work package listing — approved issues broken into claimable work units
- Claim management — claim, start, track work on approved tasks
- Implementation report submission — structured form:
  - What was done
  - Time spent
  - Resources used
  - Impact achieved
  - ValueFlows-compatible structured resource-flow data (inputs consumed, outputs produced)
- Evidence upload — geotagged photo / video, timestamps, location verification
- Peer confirmation — N-of-M community member attestation UI
- Third-party verification — auditor attestation interface
- On-chain proof display — show smart contract interaction evidence
- Automated consistency checks — algorithmic validation of resource flow data (flagging before human review)
- Progress tracking — monthly / periodic progress for long-running projects
- Verifier rotation indicator — show that the same verifier can't repeatedly approve the same issue
- Partial reward display — show rewards earned for partial / ongoing work (pivoting ≠ total loss)

---

## 6. Dispute Resolution

**Spec**: 015f-ui-disputes, relates to 012-dispute-resolution

- Challenge / flag button — flag proof with a small $CC deposit
- Dispute status panel — show payment halt, resolution progress
- Community engagement on disputes — voting on fraud determination
- Threshold display — 2% of original voters (min 3), 80% agreement to confirm fraud
- Gradual restriction loosening — visual timeline if no verdict emerges
- Clawback notification — show negative balance state if fraud confirmed
- Rate-limited accusation tracker — exponential cooldown display for wrong accusations
- Retroactive ban indicator — platform restriction status for confirmed fraud

---

## 7. Token & Wallet

**Spec**: 015g-ui-token-wallet, relates to 003-cc-token-core, 010-reserve-exchange

- Wallet connection — Sign-In with Ethereum (EIP-4361); single auth entry point
- $CC balance with real-time demurrage visualization (token decay over time)
- Transaction history — full ledger of earned, spent, burned, fee-paid $CC
- Demurrage tracker — show base demurrage rate (e.g. 1% / month) and projected balance over time
- Reserve exchange interface — swap $CC ↔ fiat through the reserve
- Exchange rate display — current rate reflecting fiat reserve / $CC circulation ratio
- Hypercert portfolio view (platform-level) — Hypercerts generated from completed work
- Access fee indicator — which features require $CC (delegation, AI summaries, detailed stats)
- Negative balance display — for clawback scenarios

---

## 8. Profile & Identity

**Spec**: 015h-ui-profile, relates to 002-identity-primitive

- Wallet info — connected address, network
- Identity verification status — integration with BrightID, Gitcoin Passport, government ID, etc.
- Privacy indicator — show that on-chain interactions use pseudonymous keys; ZKP credential status
- Contribution history — all past work, votes, deliberation participation
- Reputation signal — accumulated $CC provenance showing how tokens were earned
- Delegation settings — manage per-topic vote delegations
- Location hint settings — optional coarse location sharing for lens auto-subscription
- Lens subscriptions — manage followed / muted lenses

---

## 9. Lens & Community Configuration

**Spec**: 015i-ui-lens-config, relates to 016-extensibility-foundation

- Lens browser — discover available lenses by geography, topic, interest
- Lens creation — define selector (location refs, tags, scope, keywords), subscription mode, governance rules
- Module enable / disable toggles — configure which optional modules are active for the lens
- Module preset bundles — e.g. "Neighborhood governance pack", "Research community pack"
- Governance rule configuration — how the lens's config can be changed (via the platform's own issue / vote process)
- Active overlay inspector — see which modules are active and from which lens
- UI theme / branding — community-specific visual customization
- Dashboard layout presets — configure default views
- Ranking / sorting defaults — configure issue list ordering

---

## 10. Meta-Governance

**Spec**: 015j-ui-meta-governance, relates to 013-meta-governance

- Platform rule change proposals — same issue / deliberation / vote flow used for platform changes
- Constitutional change indicators — supermajority quorum requirements clearly displayed
- Module catalog browser — view available modules with maturity levels (experimental / beta / stable / core)
- Module approval process — meta-governance voting on new modules

---

## 11. Cross-Cutting UI Concerns

**Spec**: 015-frontend (global concerns)

- **Fallback renderers** — read-only summary views for modules the user's lens doesn't include
- **Phase indicator** — always-visible governance state: what phase is this issue in? what can I do?
- **Progressive disclosure** — simple overview → detailed workspace on drill-down
- **Responsive design** — desktop-first, mobile-friendly via responsive breakpoints
- **Accessibility** — keyboard navigation, screen reader support
- **AI translation services**
- **Moderation tools** — AI-assisted flagging, audit logs
- **Data export / audit** — canonical API access to all platform data
