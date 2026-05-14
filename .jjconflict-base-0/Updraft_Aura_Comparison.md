# Updraft & Aura: How They Work and Where They Overlap with Kindact

*Research notes — mechanics, token economics, and structural parallels*

> **Note:** Updraft and Aura are closely related projects by the same creator (Adam Stallard, also behind BrightID). Updraft handles coordination/funding; Aura handles identity/verification. Together they form a complementary stack — much like Kindact bundles deliberation, implementation, and economics into one platform.

---

## Part 1: Updraft

### What It Is

Updraft is a **decentralized coordination platform** built on Ethereum (currently deployed on Arbitrum One). It implements what Stallard calls "Attention Streams" — a mechanism where **ideas attract financial support, support draws in builders, and successful outcomes reward everyone who believed early.** It's permissionless: anyone with a wallet can participate.

The core loop:
1. **Ideas** — Anyone posts a problem or opportunity they think matters
2. **Support** — Others back the idea with UPD tokens, boosting its visibility
3. **Solutions** — Builders propose concrete plans to address funded ideas
4. **Contributions** — Supporters fund solutions directly
5. **Delivery** — Builders implement and get paid

### How UPD Works

**UPD** is a pre-minted ERC-20 token launched on Ethereum mainnet, bridged to Arbitrum One, with **100% of supply placed in a Uniswap liquidity pool paired with USDC**. This means UPD is not minted through work (unlike Kindact's $CC); it's a fixed-supply token whose price is set by AMM market dynamics.

Key properties:
- **Acquisition:** Buy on Uniswap/Jumper Exchange, or claim free UPD from the weekly **faucet** (funded by anti-spam fees)
- **Price stability:** Being paired with USDC in a liquidity pool gives it relatively stable pricing
- **No demurrage:** UPD does not decay over time (unlike Kindact's $CC)

### The Funding Mechanics (Ideas)

This is where Updraft's economic design gets interesting — and has the clearest Kindact parallels:

**Creating an Idea:**
- Deposit UPD when creating an Idea (99% refundable; 1% anti-spam fee goes to the faucet)
- The deposit size determines the creator's earning potential from funder reward fees

**Supporting an Idea:**
- Supporters deposit UPD to back an Idea
- Most support (90%) is refundable when withdrawn
- The remaining 10% is the **funder reward fee** — this is both the risk and the earning mechanism

**Funder Reward Fee (the core innovation):**
- Later supporters pay a fee (default 10%) that is distributed to *all previous* supporters proportionally to their **shares** (contribution × time held, measured in 12-hour "cycles")
- First-cycle supporters (within 12 hours of creation) pay no fee — they receive all fees from the next cycle's contributions
- This creates an early-supporter advantage: backing good ideas early is rewarded if the idea gains traction

**Withdrawing:**
- Withdraw to collect your refundable amount + any accumulated funder rewards
- This is how ideas "pay" their spotters — the platform itself doesn't pay; later supporters do

### The Funding Mechanics (Solutions)

**Drafting a Solution:**
- Anyone can propose a solution to an existing Idea
- Solution drafter pays a small anti-spam fee (1 UPD)
- Drafter sets a **funding goal**, **deadline**, and **funder reward fee**
- Drafter stakes UPD as skin-in-the-game

**Contributions to Solutions:**
- Contributions are split between the drafter (the builder) and previous funders according to the funder reward fee
- Unlike Idea support, contributions to Solutions are **not refundable** if the goal is reached

**Goal Failed:**
- All contributions are refunded
- The drafter's stake is distributed to funders (they get compensated for the drafter's failure)

**Goal Reached:**
- The drafter receives their share of contributions to build
- The solution can continue to receive more funding (goals can be extended)
- Previous funders continue earning from new funders

### Voting (Vote-to-Earn)

Updraft repurposes the same Idea/support mechanics for **voting:**
- Each voting choice is created as an Idea (with special tags linking it to a Campaign)
- Supporting a choice = casting a vote
- Because the funder reward mechanism still applies, **voting on the popular/correct choice earns money**
- This creates prediction-market-like incentives: back what you think will win, and if you're early and right, you profit

Currently used for platform governance decisions (e.g., which blockchains to deploy on, which stablecoins to support).

### Anti-Fraud / Anti-Collusion

Updraft's approach to bribery and collusion is structural rather than rule-based:
- Because **all supporters earn** from an Idea (not just a designated recipient), bribery is less effective — the recipient can just keep their earnings regardless
- Collusion doesn't create extra advantage since every supporter earns their own proportional share
- Users can generate **fresh anonymous wallets** weekly via the faucet, preventing identity-based attacks
- The system is designed as an antidote to problems seen in quadratic funding (Gitcoin, CLR.Fund)

### Campaigns

Campaigns are thematic containers — a DAO or organization creates a Campaign to direct Updraft users' attention toward specific topics. Users then post Ideas tagged with the campaign and the normal funding/support cycle applies.

---

## Part 2: Aura

### What It Is

Aura is a **decentralized peer-evaluation protocol** originally created for BrightID (proof of unique humanity), but designed to be **domain-agnostic**. It can verify:
- Human uniqueness (one person, one account)
- Work performance or eligibility
- Certifications
- Community membership
- Physical residence
- Accomplishments or impact
- Grant eligibility
- Voter eligibility

At its core: **experts evaluate each other and, in turn, evaluate "subjects" who want verification.** The system scales by concentrating sybil defense work among skilled participants rather than burdening all users.

### The Role Hierarchy

Aura defines four roles with distinct responsibilities:

**Subjects** — People or things seeking verification. They don't need to participate in Aura itself; they just want a verification badge (e.g., "this is a unique human" or "this person completed X work").

**Players** — Active participants who evaluate subjects. They analyze the BrightID social graph (or other data) to determine if subjects are legitimate.

**Trainers** — Higher-level participants who evaluate Players. They ensure Players are doing good work and aren't colluding.

**Managers** — The highest tier. They evaluate Trainers and other Managers. Manager "energy" (their trust score) flows via a **weighted SybilRank algorithm**, with team captains as seeds.

### The Scoring System

Each participant's score is computed as:

$$score = \sum_{n=1}^{num\_evaluators} \max(score_n \cdot confidence_n \cdot sign_n, \ cap)$$

Where:
- $score_n$ = the evaluator's own score (received from *their* evaluators)
- $confidence_n$ = evaluation confidence (1–4 scale)
- $sign_n$ = +1 (positive) or −1 (negative)
- $cap$ = maximum contribution by a single evaluator (prevents dominance)

This creates **transitive trust**: your score depends on who vouches for you, and their scores depend on who vouches for *them*, all the way back to team captains.

### Levels

Subjects, Players, Trainers, and Managers achieve numbered levels (0, 1, 2, 3, 4, or −1 for negatively-scored participants):

- **Level 0** — Provisional. Anyone can claim a provisional role, but positive-numbered levels require evaluations
- **Level 1–4** — Progressively higher quality, requiring higher scores and evaluations from higher-level participants
- **Level −1** — Negative score; participant has been evaluated poorly (indicating mistakes or attacks)

Example requirements (BrightID team):
- Level 1: one low+ confidence evaluation from one level 1+ player
- Level 3: one high+ confidence evaluation from a level 2+ player OR two medium evaluations from two level 2+ players
- Level 4: one high+ confidence evaluation from a level 3+ player

### Teams and Leagues

**Teams** are independent groups of Aura participants, each with their own "energy" (trust flow). Team captains seed the trust algorithm. Multiple teams provide **resilience**: if one team is compromised, the system continues using others.

**Leagues** aggregate levels from multiple teams into a single set of levels that apps consume. Leagues track which teams are performing well so apps don't have to.

### Accountability and Dispute Resolution

This is Aura's most relevant feature for Kindact comparison:

- **Skin in the game:** Poor performance or participating in attacks results in a negative evaluation, which quickly drops your score. Lose enough score and you lose influence entirely (level −1)
- **Rapid response:** A single evaluation change by a high-level participant can stop a large sybil attack quickly
- **Self-policing:** The evaluator hierarchy means that evaluators who make bad calls get downgraded by *their* evaluators — creating layered accountability
- **No central authority:** There is no appeals board or dispute resolution body. The system self-corrects through the evaluation graph

### How Updraft and Aura Complement Each Other

Adam Stallard explicitly designed them as a complementary pair:
- **Aura** handles expert judgment — "who is trustworthy?"
- **Updraft** handles crowd wisdom — "what does the public think?"
- Together they form a checks-and-balances system: Aura's expert network makes recommendations, Updraft's public voting ratifies which experts/teams to trust
- Updraft is proposed as the mechanism for the public to vote on which Aura node operators are trustworthy

---

## Part 3: Kindact Parallels and Differences

### Issue/Idea Creation

| Dimension | Kindact | Updraft |
|---|---|---|
| **Who can create** | Anyone | Anyone |
| **Spam prevention** | Community moderation; access fees | UPD deposit (1% anti-spam fee) |
| **Enhancement** | AI-assisted (duplicate detection, suggestions, categorization) | Tags, campaigns |
| **Scope** | Problems, questions, proposals with any scope (local to global) | Ideas broadly — anything from personal projects to global problems |
| **Solution coupling** | Issue includes both problem and proposed solution, evolving through deliberation | Ideas and Solutions are separate entities; multiple Solutions can address one Idea |

### Decision-Making: How Is "What Gets Done" Decided?

| Dimension | Kindact | Updraft |
|---|---|---|
| **Mechanism** | Democratic voting (one person, one vote) with delegation, conviction, competence tests | Financial signaling — support (money) = vote |
| **Identity** | Verified identity required (one person, one vote) | Wallet-based (one wallet, one set of funds — no Sybil protection baked in, though BrightID/Aura can layer on top) |
| **Bias reduction** | Anonymized deliberation, randomized display, AI synthesis | None explicit — popularity/money determines visibility (🔥interest) |
| **Who decides** | Stakeholders who pass competence verification | Anyone with UPD tokens |
| **Reversal** | Fluid voting + conviction mechanism (decisions can change but with increasing friction) | Not explicit — Ideas just accumulate or lose support over time |

**Key difference:** Kindact uses *democratic legitimacy* (informed one-person-one-vote); Updraft uses *market signaling* (put your money where your conviction is). Kindact's approach is explicitly egalitarian; Updraft's rewards financial risk-taking and early conviction.

### Token Minting

| Dimension | Kindact ($CC) | Updraft (UPD) |
|---|---|---|
| **How minted** | Created when verified work is completed (work minting) or when bought from reserve (reserve minting) | Pre-minted, fixed supply in liquidity pool |
| **Backed by** | Verified work + fiat reserve (from Hypercert sales) | USDC liquidity pool (AMM pricing) |
| **Supply control** | Demurrage (continuous decay) + multiple burn channels | Fixed supply; anti-spam fees go to faucet (redistributed, not burned) |
| **Inflationary/deflationary** | Structurally capped by demurrage; converges to equilibrium | Fixed supply (neither inflationary nor deflationary) |

**Key difference:** Kindact *creates* value tokens from work — every $CC represents verified real labor. Updraft uses a *pre-existing* token that derives value from market demand. Kindact's model is more ambitious (and riskier) because it must bootstrap value from scratch.

### How the Token Gains Value

| Dimension | Kindact ($CC) | Updraft (UPD) |
|---|---|---|
| **Value source** | Access demand + circulation + Hypercert sales → fiat reserve | Market demand (Uniswap liquidity pool paired with USDC) |
| **External revenue** | Hypercert sales to impact buyers (ESG, carbon offsets, etc.) → reserve deepens | No external revenue mechanism — value is purely from usage demand |
| **Exchange rate** | Algorithmically determined confidence curve approaching $1 as reserve deepens | AMM-determined (market price) |
| **Fiat convertibility** | Through reserve (with flow controls, daily caps, reserve floor) | Through DEX (standard AMM swap) |

### Funding Work / Rewarding Implementation

| Dimension | Kindact | Updraft |
|---|---|---|
| **Who gets paid** | Implementers who complete verified work | Solution drafters who raise funding goals |
| **Funding source** | New $CC minted (work minting) | Other users' UPD contributions to the Solution |
| **Verification** | Multi-layered: photo/video evidence, peer confirmation, third-party auditors, algorithmic consistency checks | Not built-in — the drafter stakes UPD and loses it if the goal fails, but there's no formal verification of work completion |
| **Partial payment** | Yes — rewards for partial/progressive implementation | Yes — goals can be extended after being reached |
| **Risk allocation** | Community bears dilution risk (new tokens created); mitigated by Hypercert flywheel | Funders bear risk (contributions not refundable on goal success); drafter risks stake (lost on goal failure) |

**Key difference:** Kindact has a built-in verification layer (work must be *proven* before tokens are minted). Updraft relies on market discipline — if a drafter doesn't deliver, they lose reputation and future support, but there's no systematic verification mechanism.

### Fraud Prevention / Dispute Resolution

| Dimension | Kindact | Updraft | Aura |
|---|---|---|---|
| **Core approach** | Voter-scaled caps, asymmetric voting, verifier rotation, rate-limited accusations, retroactive penalties | Structural: all supporters earn (bribery is pointless); fresh anonymous wallets via faucet | Peer evaluation with transitive trust; negative evaluations quickly drop attacker scores |
| **Who polices** | The community (via challenge mechanisms and dispute process) | The market (bad actors lose money; good predictors profit) | Expert hierarchy (Managers → Trainers → Players → Subjects) |
| **Dispute process** | Formal: 2% of original voters or 5 people, 80% agreement threshold → penalties including negative balance, restricted access | No formal disputes — market self-corrects | No formal appeals body — evaluation graph self-corrects |
| **Accountability** | Fraudulent implementers face retroactive penalties (reclaimed rewards, platform restrictions) | Failed solutions = lost stake; poor ideas = no supporters | Poor evaluations = negative score = loss of influence |

### Identity / Sybil Resistance

| Dimension | Kindact | Aura/BrightID |
|---|---|---|
| **Core principle** | Verified identity for one-person-one-vote | Proof of unique humanity without revealing personal info |
| **Method** | Not fully specified yet (references verified identity as required) | Peer evaluation by people who already know you; no personal info shared with strangers |
| **Privacy** | Anonymized deliberation (pseudonymous), but platform can identify users for moderation | Privacy-first: verification by acquaintances only; zero-knowledge proofs between domains |
| **Potential synergy** | Kindact could use Aura/BrightID as its identity layer | Aura is designed to plug into any platform needing Sybil resistance |

### Summary: Complementary Strengths

**Updraft brings to the table:**
- A proven, deployed mechanism for turning financial conviction into collective prioritization
- An elegant anti-collusion design (inherent in the funder-reward structure)
- A way for early spotters of good ideas to be financially rewarded (analogous to Kindact's stated goal of rewarding contributors, but for *idea identification* rather than *implementation*)

**Aura brings to the table:**
- A working, domain-agnostic peer verification system that could serve as Kindact's identity and verification backbone
- A self-correcting expert hierarchy that mirrors Kindact's vision for scalable verification
- The ability to verify not just human uniqueness, but also work credentials, impact accomplishments, and eligibility — all domains Kindact cares about

**Kindact adds what neither Updraft nor Aura has:**
- Structured deliberation with bias-reduction (anonymization, randomized display, AI synthesis)
- Democratic legitimacy (one person, one vote rather than one dollar, one vote)
- A two-asset economic model ($CC + Hypercerts) that creates a value flywheel from verified work to fiat backing
- Impact credentials that can be sold to external buyers (ESG, carbon offsets) — an external revenue source neither Updraft nor Aura currently has
- Demurrage as an explicit tool for long-term economic sustainability and circulation incentives
- Comprehensive implementation verification and proof-of-work requirements

---

*Sources: [Updraft Guide](https://guide.updraft.fund/updraft/), [Updraft Blog](https://paragraph.com/@updraft), [Aura Docs](https://brightid.gitbook.io/aura), [Aura Levels](https://hackmd.io/Hz3uGS54Tyel50CjO_Ow7g), [Adam Stallard on Decentralizing BrightID](https://paragraph.com/@adamstallard/decentralizing-brightid-with-collective-intelligence), [Gitcoin Governance Discussion on Aura](https://gov.gitcoin.co/t/what-can-we-learn-from-brightids-aura-sybil-defense-software/11159), [IFT Proposal](https://forum.logos.co/t/ift-proposal-unique-identity-and-other-attestations-by-peer-notaries-aura/1343)*

*Last updated: March 17, 2026*
