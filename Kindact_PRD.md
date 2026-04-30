# Kindact — Product Requirements Document (PRD)

*Version 0.1 — Draft, May 2026*

> **Companion documents:** [Kindact_Main.md](Kindact_Main.md) (vision & mechanisms), [Kindact_Economics.md](Kindact_Economics.md) (token & reserve model). This PRD distills both into a product specification: *what* Kindact is, *who* it is for, *what it must do*, and *how we will know it works*.

---

## 1. Overview

Kindact is an **open-source, modular, voluntary governance and coordination platform** that lets anyone identify a problem, deliberate on solutions with bias-reduced tools, decide collectively, implement the agreed-upon work, and be **economically rewarded** when that work is verified.

It is a *parallel* layer of governance — it does not replace governments or laws. It is an **incentive layer**, not an enforcement layer. Real-world rules, permits, and physical constraints still apply.

The product spans:

- A **web/mobile application** that runs the Identify → Deliberate → Decide → Implement → Reward cycle.
- A **two-asset on-chain economy**: `$CC` (fungible coordination currency) and **Hypercerts** (non-fungible impact credentials).
- A **modular protocol** in which voting modules, ranking algorithms, metric providers, identity providers, and verification methods are pluggable and themselves governable.
- An **identity layer** that proves uniqueness without revealing personhood (ZK-based).

---

## 2. Problem Statement

Existing institutions cannot keep up with modern, fast-moving, cross-border problems (climate, AI risk, pandemics, polarization). At the same time:

- Individuals feel **powerless** — civic action does not produce visible results, "good" work is rarely paid.
- Communities have lost the **local institutions** that previously coordinated action.
- Online platforms are good at *talking* about problems but not at *deciding, executing, or rewarding* the work that solves them.
- Markets reward extraction; they do **not** reward positive externalities (planting trees, care work, safety research).

No existing tool combines **deliberation + decision-making + verified implementation + economic reward** in a single, interoperable, community-governed system. Kindact aims to be that tool.

---

## 3. Goals & Non-Goals

### 3.1 Product Goals

1. Enable any verified person to **propose, debate, decide on, and execute** community issues at any scope (local → global).
2. Make **deliberation less biased** through anonymization, randomized display, AI synthesis, and structured arguments.
3. Make **decision-making legitimate without high turnout**, via competence-gated, fluid, delegable voting with a hard "no net harm" floor.
4. Make **implementation accountable** through structured implementation reports, multi-modal verification, and public auditability.
5. Make **doing good economically rewarding** by minting `$CC` only against verified work and backing its value with real Hypercert sales.
6. Be **modular and self-governing**: every rule, threshold, and module can be changed through the platform's own processes.

### 3.2 Non-Goals (v1 / explicitly out of scope)

- Replacing nation-states, courts, or any statutory authority.
- Operating as a stablecoin or as a fully fiat-collateralized currency at launch.
- Building all dependencies in-house — Kindact **integrates** existing tools (Hypercerts, Human Passport, ValueFlows, Pol.is-style mappers, etc.) rather than reinventing them.
- Enforcing real-world action — Kindact rewards verified work; it does not coerce anyone.
- Speculative trading features (leverage, derivatives) on `$CC`.

---

## 4. Target Users & Personas

| Persona | Primary need from Kindact |
|---|---|
| **Engaged Citizen** ("Mira", 34, lives near a polluted river) | A way to raise an issue, see it taken seriously, and contribute without doing it for free. |
| **Implementer / Doer** ("Sam", 28, freelance ecologist) | Steady, meaningful, paid work doing things that matter. |
| **Delegate / Domain Expert** ("Dr. Park", climate scientist) | Influence proportional to demonstrated judgment, revocable at any time. |
| **Local Community Organizer** ("Aisha", coop leader) | Coordination infrastructure for an existing community, plus a local currency anchor. |
| **Aligned Org / NGO** | A transparent, auditable mechanism for participatory budgeting and impact reporting. |
| **External Impact Buyer** (corporation, impact fund, government) | Credible, verified Hypercerts to retire against ESG / offset / public-goods commitments. |
| **Platform Contributor** (developer, moderator, designer) | A way to be paid for platform work via the same mechanism as everything else. |

---

## 5. Core User Journeys

### 5.1 The Full Lifecycle (the "happy path")

```diagram
╭──────────╮   ╭────────────╮   ╭─────────╮   ╭───────────────╮   ╭─────────╮
│ Identify │──▶│ Deliberate │──▶│ Decide  │──▶│ Implement &   │──▶│ Reward  │
│ (issue)  │   │ (discuss + │   │ (vote / │   │ verify (proof │   │ ($CC +  │
│          │   │  metrics)  │   │ consent)│   │ of work)      │   │ Hyper.) │
╰──────────╯   ╰────────────╯   ╰─────────╯   ╰───────────────╯   ╰─────────╯
       ▲                                                                │
       ╰────────────────── fluid voting / re-evaluation ────────────────╯
```

### 5.2 Representative User Stories

- *As an Engaged Citizen*, I can create an issue in under 3 minutes; the system suggests duplicates, helps me phrase it, and assigns scope/tags.
- *As a Participant*, I can read a constantly-updated AI synthesis of an issue rather than wading through 400 comments.
- *As a Voter*, I must pass a brief comprehension + relevance check before voting on any issue.
- *As a Delegate-er*, I can delegate my vote on "Environment / Local" to a person I trust and revoke instantly.
- *As an Implementer*, I can claim an approved issue, file periodic ValueFlows-structured progress reports, attach geotagged evidence, and receive proportional `$CC` as milestones are verified.
- *As a Holder*, I can see the live reserve, the backing ratio, and the current `$CC ↔ fiat` exchange rate.
- *As an External Buyer*, I can browse Kindact's Hypercert portfolio, purchase Hypercerts in fiat, and retire them against my own commitments.
- *As a Challenger*, I can dispute a verification with a small `$CC` deposit and trigger community review.
- *As the Community*, we can change a voting threshold or add a new voting module via the same issue process.

---

## 6. Functional Requirements

Each subsection lists the capabilities the product **must** support. Detailed mechanism design lives in Kindact_Main.md and Kindact_Economics.md.

### 6.1 Identity & Access

- **F-ID-1** Verified, unique-human identity via pluggable providers (Human Passport, BrightID, gov ID, etc.) with **ZK proofs of uniqueness** so the public layer remains pseudonymous.
- **F-ID-2** A single human ↔ a single voting identity (with the ability to rotate keys without losing personhood).
- **F-ID-3** Free baseline access for all verified humans; extended features gated by `$CC` access fees.
- **F-ID-4** Local-first sensitive data; only commitments / hashes on-chain.

### 6.2 Issue Creation (Identify)

- **F-IS-1** Any verified user may create an issue.
- **F-IS-2** Issues carry: title, description, scope (geographic + topical), tags, optional proposed solution(s), required impact dimensions.
- **F-IS-3** AI assistance for: duplicate detection, phrasing improvement, tag/scope suggestion.
- **F-IS-4** Issues can be linked (related, duplicates, depends-on) and merged.

### 6.3 Deliberation

- **F-DE-1** Threaded comments with optional anonymization at display time.
- **F-DE-2** Pro/con structured arguments (Kialo-style).
- **F-DE-3** Wiki-style proposal body with AI-assisted change validation.
- **F-DE-4** Continuous AI synthesis: main points, consensus, disagreement, open questions.
- **F-DE-5** Bias-reducing display: anonymity by default, randomized + outlier-aware ranking (not pure popularity).
- **F-DE-6** Pluggable ranking / sorting modules.

### 6.4 Impact Metrics

- **F-MT-1** Each issue carries metrics estimating impact across **Social and Planetary Boundary** dimensions and resource/time cost.
- **F-MT-2** Metric sources: AI estimation, prediction markets, expert input, user input — each tagged with confidence.
- **F-MT-3** Users can flag estimates as disputed or unsupported.
- **F-MT-4** **Voting is blocked** until required metrics exist and the projected outcome is net-positive within community-set thresholds. Larger-scope issues require stricter thresholds.
- **F-MT-5** Metric providers are modular and can be added/replaced via meta-governance.

### 6.5 Decision-Making

- **F-DC-1** **Competence + relevance gate** before any vote: short comprehension check + auto-admitted or self-declared stake.
- **F-DC-2** **Fluid voting** — votes can be changed at any time; no permanent close.
- **F-DC-3** **Conviction** — accumulated time without contestation increases the cost of reversal.
- **F-DC-4** **Liquid delegation** — per-topic delegation, instantly revocable.
- **F-DC-5** Multiple decision modes available per issue: simple majority, supermajority, consent-based iteration, etc. (modular).
- **F-DC-6** Constitutional changes require supermajority of *total* verified users, not just participants.

### 6.6 Implementation & Verification

- **F-IM-1** Approved issues become claimable work packages with declared milestones and reward schedule.
- **F-IM-2** Implementation reports use a **ValueFlows-style structured vocabulary** (events: consume / use / produce; agents; processes) plus free-text narrative.
- **F-IM-3** Multi-modal verification: geotagged media, third-party / professional auditors, peer attestations, on-chain proofs, algorithmic consistency checks on resource flows.
- **F-IM-4** Verifier rotation; verifiers stake reputation/`$CC`.
- **F-IM-5** Partial / milestone payouts allowed; payments halt while disputes are open.
- **F-IM-6** Public, immutable audit trail of every report and verification.

### 6.7 Token Economy (`$CC`)

- **F-EC-1** `$CC` is minted only via two channels: **work minting** (verified implementation) and **reserve minting** (fiat purchase).
- **F-EC-2** No pre-mine, no founder allocation, no debt issuance.
- **F-EC-3** **Demurrage** on all balances (default 1%/month, governance-adjustable). Optional stagnation demurrage activatable by vote.
- **F-EC-4** Burn channels: access fees, transaction fees, Hypercert-in-`$CC` purchases, redemptions.
- **F-EC-5** Voter-scaled reward caps; asymmetric voting (objections weigh more than approvals on cap).
- **F-EC-6** Public, real-time supply, mint, burn, and reserve dashboards.

### 6.8 Hypercerts & Reserve

- **F-HC-1** Every verified work item generates a Hypercert held by the platform, recording who/what/when/result.
- **F-HC-2** Hypercerts are listable, browsable, and purchasable in **fiat** (proceeds → reserve) or in `$CC` (tokens burned).
- **F-HC-3** Reserve operates in three phases:
  - **Bootstrap** (S < 100k `$CC`): no cash-outs.
  - **Growth** (R < R_target): exchange rate follows a confidence curve `E = b + (1 − b)·(R/R_target)²`.
  - **Maturity** (R ≥ R_target): 1:1 exchange.
- **F-HC-4** Buy premium (default 3%) on fiat → `$CC`.
- **F-HC-5** Flow controls: ≤1% of reserve redeemable per 24 h; reserve floor (default `b < 5%`) pauses redemptions to a time queue.
- **F-HC-6** All reserve parameters governance-adjustable.

### 6.9 Disputes & Fraud Prevention

- **F-DR-1** Any user may flag a verification with a small `$CC` deposit.
- **F-DR-2** Default resolution threshold: ≥2% of original voters (min. 5 people), 80% agreement to confirm fraud.
- **F-DR-3** Confirmed fraud → clawback (balances may go negative), platform restrictions, possible revocation.
- **F-DR-4** Rate-limited accusations with exponential cooldown for failed challenges.
- **F-DR-5** Verifier rotation enforced on larger issues.

### 6.10 Meta-Governance

- **F-MG-1** Platform parameters (thresholds, fees, demurrage rate, R_target, module enable/disable) are changed via standard issues.
- **F-MG-2** Module marketplace: third parties can publish voting / ranking / verification / metric modules.
- **F-MG-3** Constitutional invariants (one-person-one-vote, open-source, no pre-mine) protected by supermajority of all users.
- **F-MG-4** Platform development itself is funded via standard issues — no hidden treasury.

### 6.11 Transparency & Auditability

- **F-TR-1** All discussions, votes, reports, mints, burns, and reserve flows recorded on a distributed ledger.
- **F-TR-2** Chain-agnostic architecture — no lock-in to a single L1/L2.
- **F-TR-3** Public read-only APIs for all on-chain and aggregated off-chain data.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Privacy** | Pseudonymous by default; identity never required for participation; ZK proofs for uniqueness. |
| **Security** | Audited smart contracts; key-rotation support; defense-in-depth against sybil, front-running, and reserve-draining attacks. |
| **Scalability** | Architecture must accommodate ≥10⁵ active users in Phase 3 without redesign; chain-agnostic to allow L2 / Holochain / hybrid deployments. |
| **Internationalization** | Multi-language UI; locale-aware moderation; works across jurisdictions. |
| **Accessibility** | WCAG 2.1 AA target. |
| **Open Source** | All core code permissively licensed; constitutional requirement. |
| **Interoperability** | First-class integrations with Hypercerts, Human Passport / BrightID, ValueFlows, prediction-market providers, and at least one major impact-funding pipeline (e.g., Optimism RetroPGF). |
| **Performance** | Reading an issue + AI synthesis ≤2 s p95; voting transaction confirmation perceived ≤5 s. |
| **Auditability** | Every state change traceable to a signed action; no admin override of on-chain history. |
| **Resilience** | No single entity can censor a participant or shut the platform down. |

---

## 8. Success Metrics

We measure by **realized coordination outcomes**, not vanity metrics.

### 8.1 Activation & Engagement
- Median time from sign-up → first verified contribution.
- Issues completed per active user per month.
- Ratio of *implemented* to *approved* issues.

### 8.2 Deliberation Quality
- % of issues with AI synthesis that voters report as accurately representing the discussion.
- Diversity-of-viewpoint score on randomized display (proxy: viewpoint coverage in synthesis).
- Drop-off rate on competence test (target: low — accessible, not elitist).

### 8.3 Economic Health
- `$CC` net mint vs. burn each month (must trend toward equilibrium).
- Reserve backing ratio `b = R/S` over time.
- Hypercert sales volume (fiat) per quarter.
- Number of distinct external buyers.
- Open-market `$CC` price vs. reserve rate (a healthy spread, neither collapsed nor wildly speculative).

### 8.4 Integrity
- Fraud confirmation rate per 1,000 verifications.
- Median dispute resolution time.
- % of verifications using ≥2 independent verification modes.

### 8.5 Phase Milestones (from Kindact_Economics §"Growth Stages")
| Phase | Users | Issues / mo | Defining outcome |
|---|---|---|---|
| 1. Social value | 0–1k | ~50 | Communities use Kindact; `$CC` = recognition only. |
| 2. Local utility | 1k–10k | ~500 | First merchant acceptance; first Hypercert sales. |
| 3. Credibility threshold | 10k–100k | ~5k | `$CC` has a real exchange rate; institutional buyers active. |
| 4. Established marketplace | 100k+ | 10k+ | Self-reinforcing flywheel; governments routing budgets. |

---

## 9. MVP Scope (v1)

The MVP must demonstrate the **full lifecycle end-to-end**, even if each step uses the simplest viable module.

**In MVP:**
- Verified identity via one provider (Human Passport).
- Issue creation with duplicate detection.
- Threaded + Kialo-style deliberation; AI synthesis.
- One voting module (approval voting) with competence + relevance gate.
- One verification module (geotagged media + peer attestation).
- `$CC` minting on verified work; demurrage; access-fee burns.
- Hypercert generation per completed issue (held by platform).
- Reserve in **Bootstrap** phase only (no cash-outs yet).
- Basic dispute flow.
- Public dashboards: supply, burn, reserve, recent issues.
- Meta-governance limited to a small whitelist of parameters.

**Deferred post-MVP:**
- Reserve cash-outs (Phase 2 onward).
- Full module marketplace.
- Liquid delegation UI (votes only at MVP, delegation contract optional).
- Prediction-market integrations.
- Advanced metric providers beyond AI estimation.

---

## 10. Risks & Open Questions

Adapted from Kindact_Main §"Challenges" and Kindact_Economics §"Open Questions":

1. **Verification quality is the entire system.** Weak verification = counterfeiting = currency collapse. Verification design and verifier incentives are top engineering risks.
2. **Bootstrapping / cold start.** Until the first cohort of communities + first external Hypercert buyers materialize, `$CC` has only social value. Need partnerships (Metagov, RCF, Hypha, Localscale, aligned NGOs) lined up before launch.
3. **Legal & regulatory uncertainty.** Token classification (utility / security / income / money transmission) varies by jurisdiction. Requires counsel review *before* enabling Phase 2 cash-outs.
4. **Sybil & coordinated capture.** Even with ZK uniqueness, organized groups will try to game voting. Requires ongoing red-teaming.
5. **Demurrage calibration.** Too high → people exit; too low → supply overshoots. Must be governance-adjustable from day one.
6. **AI failure modes.** Bad summaries, hallucinated metrics, biased duplicate detection. Human-in-the-loop required; AI outputs labeled and contestable.
7. **Privacy ↔ accountability tension.** Pseudonymity for participants vs. need to ban / claw back from confirmed bad actors. Mechanisms must be defined precisely.
8. **Hypercert pricing across domains.** Carbon vs. care work vs. civic outcomes — no shared unit. May require domain-specific marketplaces.
9. **UX complexity.** Five-stage lifecycle, multiple modules, two assets — risk of overwhelming new users. UX must hide complexity by default.

---

## 11. Out of Scope (v1)

- Speculative / derivative trading on `$CC`.
- Native fiat custody by Kindact (use regulated partners for the reserve).
- Direct legal enforcement of decisions.
- Closed-source modules in core.
- Replacing existing community currencies — Kindact should *interoperate* (RCF / oswap) rather than displace.

---

## 12. Glossary

- **`$CC`** — Coordination Currency; fungible, demurrage-bearing, work-minted token.
- **Hypercert** — Non-fungible impact credential tied to a specific verified work item.
- **Reserve** — Fiat fund backing `$CC`, fed by Hypercert sales and fiat purchases of `$CC`.
- **Backing ratio (b)** — Fiat reserve ÷ circulating `$CC`.
- **Demurrage** — Continuous, uniform decay of `$CC` balances.
- **Conviction** — Accumulated time-weighted support that makes a decision harder to reverse.
- **Competence test** — Brief comprehension + relevance check required to vote on a given issue.
- **Module** — A pluggable, governable component (voting, ranking, metric, verification, identity).
- **Meta-governance** — Use of Kindact's own processes to change Kindact's own rules.

---

*This PRD is a living document. It is intentionally derived from Kindact_Main and Kindact_Economics; it should be updated whenever the vision documents change, and it takes precedence over individual specs when they conflict on product intent.*
