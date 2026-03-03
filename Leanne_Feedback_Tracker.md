# Leanne — Feedback Tracker

*Source: [Google Doc comments](https://docs.google.com/document/d/1pZHiKsaYVJtsTvQFSENjb9oK8n7sEhIY6jMt-wdBAl8/edit?usp=sharing), Feb 6 – Feb 18, 2025*

*Status key: ✅ Addressed | 🔶 Partially addressed | ❌ Not yet addressed | ❓ Unclear reference*

---

## Outstanding — Requires Changes or Discussion

### 1. Supply-demand steady-state matching
**Status:** ❌ Not yet addressed
**Leanne's comment:** *"Give me 3 examples of Demand for $CC. And try to match that demand with the supply so that the total amount held/hoarded is constant. This might not make sense — if not we can talk more. But this is the essence of the problem. You are not creating services (except platform membership) that can only be accessed with the tokens and in the process the tokens are burned — need to match issuance with burn in steady state."*
**Current state:** Demand sources and supply sinks are listed separately but never formally shown to balance.
**Response:** Demurrage mathematically guarantees a finite equilibrium supply. If the monthly minting rate is **M** and the monthly demurrage rate is **d**, supply converges to **S* = M / d**. At 1% monthly demurrage and 1,000 $CC minted/month, equilibrium is 100,000 $CC — at that point demurrage burns exactly as much as minting creates. This is self-correcting: if supply overshoots, demurrage burns more than minting adds, pulling it back automatically. Transaction fees and access fee burns tighten the equilibrium further. For a reactive version, the demurrage rate can auto-adjust (e.g., if circulating supply exceeds target by X%, demurrage increases by Y basis points) — but even a fixed rate guarantees convergence at any scale. This directly answers Leanne's request: issuance and burn *do* match in steady state, provably.

### 2. "Show the math"
**Status:** ❌ Not yet addressed
**Leanne's comment:** *"yes please, show the math"* (in response to Jonas asking what would make the economics clearer.)
**Current state:** Neither document provides a formal mathematical model of token dynamics — even a simplified one. Note that the economic model proposed at that time was only having one $CC token type, which has been split up into $CC & Hypercerts since then.
**Response:** Draft for a new Economics Deep Dive section below. Also addresses #1 (steady-state matching) and Leanne's request for 3 demand examples.

#### Model Variables
- **S(t)** = total $CC supply at time t
- **M** = monthly minting (new $CC from verified work)
- **d** = monthly demurrage rate (e.g., 0.01 = 1%)
- **A** = monthly access fee burn = users x fee per user
- **F** = monthly transaction fee burn (roughly proportional to economic activity)
- **H** = monthly Hypercert-purchase burn (external entities buying Hypercerts with $CC)

#### Supply Dynamics
Each month: **S(t+1) = S(t) x (1 - d) + M - A - F - H**

Steady state (S(t+1) = S(t) = S*): **S* = (M - A - F - H) / d**

If S > S*, demurrage burns more than minting adds, pulling supply back down. If S < S*, the opposite. Supply always converges to S*. It cannot grow without bound as long as d > 0.

From a starting supply of 0: **S(t) = S* x (1 - (1-d)^t)**

#### Three Demand Examples (Leanne's ask: "give me 3 examples of Demand")

1. **Access fees (utility demand, burned):** Platform participation requires periodic $CC payment. Creates steady demand proportional to the user base. Like a subscription payable only in $CC. This is the baseline demand that exists from day one.

2. **Hypercert purchases in $CC (impact demand, burned):** External entities — carbon offset buyers, ESG-reporting corporations, impact funds — can purchase Hypercerts with $CC. The $CC used is burned, creating demand from *outside* the system. This emerges in Phase 2–3 as Kindact builds a track record of verified impact.

3. **Contributor trade (circulation demand, not burned):** Community members acquire $CC to purchase goods/services from contributors within the ecosystem. A local business accepts $CC because customers earn it; a freelancer prices services in $CC. This doesn't burn tokens but creates transaction velocity and demand for working balances.

All three match issuance with either burn (1 & 2) or absorption into active circulation (3).

#### Worked Example: Phase 1 (0–1,000 users, year 1)
Calibration anchor: 1 $CC ≈ 1 minute of work. Access fee = 10 $CC/user/month (~10 min of contribution).
- 200 users, 50 issues completed/month, avg reward 100 $CC (~100 min work) → **M = 5,000 $CC/month**
- **d = 1%/month**
- **A = 200 users x 10 $CC = 2,000/month**
- **F = 50/month** (low transaction volume early on)
- **H = 0** (no external buyers yet)
- **S* = (5,000 - 2,000 - 50) / 0.01 = 295,000 $CC**

| Month | Supply | Demurrage burn | Net change |
|-------|--------|---------------|------------|
| 1 | 2,950 | 0 | +2,950 |
| 6 | ~17,264 | ~170 | +2,780 |
| 12 | ~33,518 | ~332 | +2,618 |
| 24 | ~63,314 | ~627 | +2,323 |
| 60 | ~133,576 | ~1,323 | +1,627 |
| 120 | ~206,707 | ~2,047 | +903 |

Supply grows rapidly early, then decelerates as demurrage catches up. It approaches but never exceeds 295,000 — even after 10 years of constant minting. Note how access fees are a significant sink here (2,000/month vs. 5,000 minted), absorbing 40% of new issuance before demurrage even kicks in.

#### Worked Example: Phase 2 (1,000–10,000 users)
- 5,000 users, 500 issues/month, avg reward 150 $CC → **M = 75,000/month**
- A = 50,000, F = 2,500, H = 1,000 (first Hypercert buyers)
- **S* = (75,000 - 50,000 - 2,500 - 1,000) / 0.01 = 2,150,000 $CC**
- Access fees now absorb 67% of minting — the system is increasingly self-funding.

#### Worked Example: Phase 3 (10,000–100,000 users)
- 50,000 users, 5,000 issues/month, avg reward 200 $CC → **M = 1,000,000/month**
- A = 500,000, F = 25,000, H = 100,000 (growing Hypercert market)
- **S* = (1,000,000 - 500,000 - 25,000 - 100,000) / 0.01 = 37,500,000 $CC**

#### Key Properties
1. **Supply always converges** — cannot grow infinitely at any scale
2. **Self-correcting** — overshooting triggers stronger demurrage burn, undershooting weakens it
3. **External demand (H) actively shrinks equilibrium** — more Hypercert sales = tighter supply = higher $CC value = virtuous cycle
4. **The demurrage rate d is the primary dial** — doubling d halves S*
5. **Stock-flow consistent** — every $CC comes from somewhere (minting) and goes somewhere (burning or circulation), matching Leanne's ValueFlows framing

### 3. 100% backing at mint time
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"As long as you have 100% backing (clearly specified) for each new minted token, then there is no doubts about how the token is designed to have economic value. Else it sounds like a joke."*
**Current state:** The Hypercerts/fiat reserve model builds backing gradually, but at mint time there is no backing. Phase 1 acknowledges "effectively zero monetary value" but this isn't explicitly defended as a deliberate design choice vs. a gap.
**Response:** Respectful disagreement with the premise. Three counterpoints:
1. **The work IS the backing.** Each $CC is minted against verified, community-approved work. The backing isn't fiat — it's demonstrated real-world output, formalized via Hypercerts. This is arguably stronger than "full faith and credit" backing of fiat currencies, which is essentially trust in *future* productivity, whereas $CC is backed by *verified past* productivity.
2. **Requiring 100% fiat backing at mint would make $CC a stablecoin**, requiring startup capital and defeating the purpose of a community currency that emerges from contribution.
3. **Every successful community currency started without fiat backing** — WIR, Sarafu, Ithaca Hours all began with social value. The blog post's Growth Stages model already describes this trajectory honestly.
The documents should more explicitly *defend* the lack of initial backing as a deliberate design choice rather than leaving it as an apparent gap. The phased value evolution (social → local utility → external demand) should be framed as the intended path, not a weakness.

### 4. Budget constraint
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"Allowing people to democratically decide how much money to pay themselves is crazy. It won't work. You need a clear budget constraint. This money you are giving away is NOT FREE."*
**Current state:** Voter-scaled caps limit per-issue rewards. The MMT argument in the Economics Deep Dive argues against hard caps. But there's no explicit "budget constraint" mechanism, and the MMT counter doesn't directly rebut her point.
**Response:** Leanne's concern is valid — a naive "people vote on their own pay" system would fail. But Kindact's design is structurally different from that framing:

**The real Budget Constraint is the Verification process.** Unlike a government printing money (which costs nothing), every $CC requires real labor. "Too much minting" literally means "too much verified real work is being rewarded" — and if the work is genuine, it creates a Hypercert that represents tangible value, deepening the community's reserves. Over-minting only occurs if verification fails, which is a fraud problem, not a budget problem. The "Budget" is effectively the total amount of good the community is willing to verify and pay for with their own currency's stability.

This is enforced through:
1. **Voter-scaled caps:** Implementers typically vote on their own issues, but they're a minority of the voter pool — the cap ensures that self-dealing alone can never unlock meaningful rewards. Small collusion rings hit the same ceiling.
2. **Soft economic pressure:** No individual voter's approval meaningfully affects total supply, so this isn't a primary safeguard (cf. Caplan's *Myth of the Rational Voter*). However, at scale, large $CC holders have a collective incentive to monitor reward levels, creating a natural constituency for fiscal discipline — a weak but real corrective force.
3. **The Challenge Mechanism:** Any member can "pause" a reward they deem excessive, forcing a secondary audit. This provides a concrete check against inflated rewards without requiring a global budget.
4. **Demurrage equilibrium:** Even if minting runs hot, total supply converges to S* = (M - sinks) / d. The system self-corrects structurally.

**Idea also considered: sink-funded minting budget.** Monthly budget = last period's total burns × multiplier + growth allowance. Issues compete for shares by approval score. Gives an explicit constraint, but doesn't scale well across many independent communities (global bottleneck, batch timing friction). A softer variant — a per-voter reward contribution (PVC) multiplier that auto-adjusts based on system-wide minting vs. target — avoids the bottleneck but adds complexity. Worth revisiting at scale if the above mechanisms prove insufficient.

**Crucially, the platform governs itself.** If the above mechanisms prove insufficient at scale, the community can vote to introduce additional controls — PVC auto-adjustment, minting ceilings, sink-funded budgets, or mechanisms not yet conceived — through the same issue-based process used for everything else. The system is designed to start minimal and add complexity as needed, not to lock in a predetermined monetary policy.

### 5. Retroactive clawbacks as deterrent
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"Sometimes clawbacks are important — scam artists who remain in the community can then have their ill gotten gains removed or go negative, even though it might have been some time ago. Like a fork."* ... *"also acts as a disincentive to even try and scam"*
**Current state:** The statement that they can't be undone was replaced with "or possibly even undone". But no further discussion about clawbacks or what trade-offs are involved.
**Response:** Agree with Leanne — clawbacks should be supported, with guardrails:
- **Scope:** Clawbacks apply only to the scammer's own wallet. Tokens already traded to innocent third parties are not pursued.
- **Negative balance:** If the wallet is empty or insufficient, the balance goes negative. The scammer cannot participate (propose, vote, implement, earn) until the debt is repaid. This deters even if tokens have already been spent.
- **Risks (mob justice, political targeting, chilling effect)** are real but are calibration problems, not fundamental blockers. The existing challenge mechanism already has the right shape: accusation requires a $CC deposit, wrong accusations trigger exponential cooldowns, and a community quorum determines the verdict. Extending this to include clawback as a possible verdict outcome is a natural fit.
- **Key calibration question:** Finding the right balance so that false accusations are too costly to weaponize, but legitimate accusations are rewarding enough to incentivize fraud detection. The exponential backoff on wrong accusations already addresses this asymmetrically.
- **Action needed:** The documents should explicitly describe clawback + negative balance as a supported outcome of the dispute resolution process, not just "possibly even undone."

### 6. Cumulative self-issuance over time
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"But over time they could issue themselves a growing cumulative amount? Quantity and time — both need to be addressed."*
**Current state:** Voter-scaled caps address per-issue limits. Rate-limiting new users is mentioned. But the gaming vector of many small issues accumulated over a long period is not deeply explored.
**Response:** Not a significant concern once existing mechanisms are connected:
1. **Demurrage** erodes hoarded tokens — accumulation decays continuously, preventing indefinite stockpiling.
2. **Voter-scaled caps** mean each small issue yields small rewards — grinding requires many separate issues with separate voter pools.
3. **Verification** means each issue requires real work — grinding small issues still means doing real, verified work.
4. **Verifier rotation / same-voter-circle limits** prevent reusing the same collusion ring.
The remaining case — someone doing lots of *legitimate* small tasks — isn't a problem; that person is genuinely contributing, and demurrage prevents unhealthy accumulation regardless. If cumulative issuance does become a problem at scale, the community can flag it and address it by updating the corresponding mechanisms through the normal governance process.

### 7. Counter-mobilization / faction risk
**Status:** ❌ Not yet addressed
**Leanne's comments:** *"Couldn't the petrol owning car drivers also join together to counter this group and out vote them?"* ... *"What stops reckless actors from also using this platform if they have the votes?"* ... *"Like nation states, isn't this also just another coalition to counter someone else?"*
**Current state:** The metrics requirement (net-positive outcomes only) and competence verification partially address this, but coordinated counter-voting and majoritarian abuse are not explicitly discussed.
**Response:** Partly addressed by existing mechanisms, partly by design philosophy:
1. **Metrics requirement** is the strongest structural defense: issues can only proceed to voting if projected outcomes are net-positive across social and planetary boundaries. A coalition can't vote through harmful proposals if the metrics show net harm.
2. **Competence verification** filters out drive-by voting — participants need a stake in or understanding of the issue.
3. **Anonymized deliberation** makes faction coordination harder during discussion — you don't know who's "on your side."
4. **By design:** If a large group genuinely believes something is beneficial and it passes metrics, them organizing to vote for it isn't a bug — it's democracy working. Kindact doesn't claim to eliminate disagreement; it claims to structure it better, with better information, less bias, and a hard floor of "no net harm."
The documents should make this argument explicitly in a section addressing faction dynamics.

### 8. Legal/tax classification
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"These are utility tokens or speculative $CC — tied again to their 'economic value' which so far they seem speculative as no in-kind guaranteed backing. More likely in-kind income and taxable."*
**Current state:** Listed under "Open Questions" in the Economics Deep Dive but not explored.
**Response:** Valid concern, but premature to resolve in detail — depends heavily on jurisdiction and how the token functions in practice. Keep as an acknowledged open question, but strengthen the language in the Economics Deep Dive to show awareness of the specific dimensions: securities law (is $CC a security?), money transmission regulations, and tax treatment of earned vs. purchased tokens. No need to solve now.

---

## Already Addressed in Current Documents

### 9. ValueFlows integration for implementation reports
**Leanne's comment:** *"At GG we are hoping that this could be automated if there was a valueflows network."* ... *"In valueflows accounting it rests on holistic accounting. That is — quadruple entry bookkeeping..."*
**Where addressed:** Blog post, Step 4: Implementation Reports (lines 225–227). ValueFlows explicitly integrated as the vocabulary for structured resource-flow data.

### 10. Verification of reports
**Leanne's comment:** *"Reports need to be verified?"*
**Where addressed:** Blog post, Verification Mechanisms section (lines 229–238).

### 11. How $CC gets economic value / demand sources
**Leanne's comment:** *"only if the $CC is of economic value"* ... *"Only traceable if accepted by others for economic value. You don't yet say how you make it desirable or demanded."*
**Where addressed:** Blog post, Token Value section (lines 265–286) — Hypercerts, fiat reserve, impact marketplace. Economics Deep Dive, Demand Anchor section (lines 206–262).

### 12. Explain value before rewards (structural suggestion)
**Leanne's comment:** *"You should say before how the $CC has economic value and then talk about rewards after. Otherwise a statement like this can be easily discounted."*
**Where addressed:** Blog post now leads with "What $CC Is" (roles and priorities) before "How Tokens Are Created", then "Token Value." The structure was reworked.

### 13. Demurrage gaming via circular trades
**Leanne's comment:** *"In Will Ruddick's sarafu, when he had demurrage he had people gaming the system by spending with each other in a circle of 3 people. So you need to connect transactions with real trade."*
**Where addressed:** Economics Deep Dive, "Why Both Demurrage AND Transaction Fees?" (lines 111–114). Small transaction fees make circular gaming costly.

### 14. Concrete fraud prevention (not just "the community will figure it out")
**Leanne's comment:** *"Never do this 'but I'm counting on the flexibility of the platform and help of the good members of the community to find ways to prevent these.'"*
**Where addressed:** Blog post, Fraud Prevention section (lines 299–308). Six concrete safeguards listed.

### 15. One-person-one-vote clarification
**Leanne's comment:** *"So far we spoke about rewards $CC, not votes. Are votes one person one vote or proxy. Does buying mean they are transferable?"*
**Where addressed:** Blog post clearly separates voting (1-person-1-vote, lines 172–191) from token economics. Voting power is not tied to $CC holdings.

### 16. Challenge cooldowns to prevent abuse
**Leanne's comment:** *"Seems like those rich in $CC could really piss off their enemies with false challenges."*
**Where addressed:** Blog post, Fraud Prevention (line 305): "Rate-limited accusations: Wrong accusations trigger exponential cooldown periods."

### 17. Platform funding mechanism
**Leanne's comment:** *"what funding?? doesn't make sense"*
**Where addressed:** Blog post, Platform Funding section (lines 319–321). Economics Deep Dive, Platform Funding section (lines 183–202).

### 18. Fluid vs. liquid/proxy voting terminology
**Leanne's comment:** *"above you mention fluid as proxy voting?"* ... *"seems to be mixing terms"*
**Where addressed:** Blog post now separates "Fluid and Ongoing" voting (line 172) from "Delegated Voting (Liquid Democracy)" (line 183) as distinct subsections.

### 19. Algorithmic vs. discretionary monetary policy
**Leanne's comment:** *"automated means non-discretionary. A smart contract that is programmed... This is a big argument among central bankers."*
**Where addressed:** Blog post (line 296) and Economics Deep Dive (line 88) now say "algorithmic and transparent" rather than comparing to central bank discretion.

### 20. Herd behavior
**Leanne's comment:** *"do you also stop herd behavior?"*
**Where addressed:** Blog post, anonymization and randomized display mechanisms (lines 122–128) reduce herding by hiding author identity and not sorting by pure popularity.

---

## Resolved — Originally Unclear, Now Assessed

### A. "please elaborate" — ✅ Addressed
**Leanne's comment:** *"please elaborate"*
**Context:** Re "Access right: Platform fees create utility demand."
**Assessment:** Access fees are now explained in the blog post (line 252: monthly contribution in $CC) and Economics Deep Dive (access fees as a demand source, lines 94, 215–216).

### B. "really" — ✅ Addressed
**Leanne's comment:** *"really"*
**Context:** Re "the platform governs itself."
**Assessment:** Self-governance is now explicitly described in the blog post (lines 64–66): platform changes follow the same issue-based process, with constitutional-level changes requiring supermajority quorums.

### C. "I don't see how. Explain" — 🔶 Partially addressed
**Leanne's comment:** *"I don't see how. Explain"*
**Context:** Re "Kindact creates incentives to break these traps" in the 'Addressing Moloch' section — specifically how Kindact helps overcome coordination failures like climate change where nobody is willing to take the first step.
**Assessment:** The $CC incentive mechanism is well-explained, but the specific argument for *how* tokenized rewards break coordination traps (Moloch problems) could be stronger.
**Response:** The Moloch section should be strengthened with four arguments (assumes Phase 3+ maturity, which should be stated):
1. **Internalizing externalities (primary argument):** Positive externalities (cleaning a river, insulating a house) go uncompensated in current systems. Kindact's $CC minting process "internalizes" that value — you produce a public benefit, Kindact quantifies it and mints $CC directly to you. You're not sacrificing for the planet; you're producing a valuable asset. Private incentive aligns with public good.
2. **First-mover protection via Hypercerts:** The "after you" problem (nobody wants to be the sucker who acts alone) is broken because the first mover's reward doesn't depend on others following. They act, produce verified impact, earn $CC + a Hypercert. External funders can buy that Hypercert retroactively — the first mover is compensated regardless of whether their neighbor joins in.
3. **Potential module — Assurance Contracts / threshold mechanisms:** Kindact's modular design could support Dominant Assurance Contract modules: "I will if you will." People pledge to perform a task only if enough others also pledge — like Kickstarter for collective action. Thresholds could unlock various things: backing/demand signals, coordinated action, or funding releases. Eliminates the risk of acting alone through synchronized commitment.
4. **Reducing action paralysis:** Massive problems (climate change) are broken into thousands of small, verifiable, rewarded tasks. You don't need to "solve the climate" — you do one task, get rewarded. This reduces the cognitive load that causes inaction.
**Action needed:** Rewrite the Moloch section of the blog post with these four arguments. Add a note that this section describes Phase 3+ dynamics.

### E. "Same for a token..." — ✅ Addressed
**Leanne's comment:** *"Same for a token, which is why you don't want such an unstable valuation for a token you want to be stable."*
**Context:** Re the chicken-and-egg problem: "a platform isn't valuable until it has users, and it won't get users until it's valuable."
**Assessment:** The Growth Stages section in the Economics Deep Dive (lines 285–324) explicitly addresses this by defining four phases where early value is social/reputational and monetary value emerges gradually. The blog post's Token Value section (lines 265–268) also covers the phased evolution.

---

## Additional References Mentioned by Leanne (for research)

- **Sensorica**: *"Sensorica might have some examples. Theirs do have value as they are shares in equity."* — Worth investigating as a comparable model.
- **Will Ruddick's Sarafu**: Referenced for demurrage gaming lessons (circular trades). Already incorporated.
- **GrowGood**: Mentioned as a potential model for automated verification: *"like with growgood"*
- **Steph's LocalScale / Badges**: *"See over in Steph's localscale under Badges."* — Referenced for verification approaches.

---

*Last reviewed: March 3, 2026*
