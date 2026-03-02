# Leanne — Feedback Tracker

*Source: [Google Doc comments](https://docs.google.com/document/d/1pZHiKsaYVJtsTvQFSENjb9oK8n7sEhIY6jMt-wdBAl8/edit?usp=sharing), Feb 6 – Feb 18, 2025*

*Status key: ✅ Addressed | 🔶 Partially addressed | ❌ Not yet addressed | ❓ Unclear reference*

---

## Outstanding — Requires Changes or Discussion

### 1. Supply-demand steady-state matching
**Status:** ❌ Not yet addressed
**Leanne's comment:** *"Give me 3 examples of Demand for $CC. And try to match that demand with the supply so that the total amount held/hoarded is constant. This might not make sense — if not we can talk more. But this is the essence of the problem. You are not creating services (except platform membership) that can only be accessed with the tokens and in the process the tokens are burned — need to match issuance with burn in steady state."*
**Current state:** Demand sources and supply sinks are listed separately but never formally shown to balance.

### 2. "Show the math"
**Status:** ❌ Not yet addressed
**Leanne's comment:** *"yes please, show the math"* (in response to Jonas asking what would make the economics clearer.)
**Current state:** Neither document provides a formal mathematical model of token dynamics — even a simplified one. Note that the economic model proposed at that time was only having one $CC token type, which has been split up into $CC & Hypercerts since then.

### 3. 100% backing at mint time
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"As long as you have 100% backing (clearly specified) for each new minted token, then there is no doubts about how the token is designed to have economic value. Else it sounds like a joke."*
**Current state:** The Hypercerts/fiat reserve model builds backing gradually, but at mint time there is no backing. Phase 1 acknowledges "effectively zero monetary value" but this isn't explicitly defended as a deliberate design choice vs. a gap.

### 4. Budget constraint
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"Allowing people to democratically decide how much money to pay themselves is crazy. It won't work. You need a clear budget constraint. This money you are giving away is NOT FREE."*
**Current state:** Voter-scaled caps limit per-issue rewards. The MMT argument in the Economics Deep Dive argues against hard caps. But there's no explicit "budget constraint" mechanism, and the MMT counter doesn't directly rebut her point.

### 5. Retroactive clawbacks as deterrent
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"Sometimes clawbacks are important — scam artists who remain in the community can then have their ill gotten gains removed or go negative, even though it might have been some time ago. Like a fork."* ... *"also acts as a disincentive to even try and scam"*
**Current state:** The statement that they can't be undone was replaced with "or possibly even undone". But no further discussion about clawbacks or what trade-offs are involved.

### 6. Cumulative self-issuance over time
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"But over time they could issue themselves a growing cumulative amount? Quantity and time — both need to be addressed."*
**Current state:** Voter-scaled caps address per-issue limits. Rate-limiting new users is mentioned. But the gaming vector of many small issues accumulated over a long period is not deeply explored.

### 7. Counter-mobilization / faction risk
**Status:** ❌ Not yet addressed
**Leanne's comments:** *"Couldn't the petrol owning car drivers also join together to counter this group and out vote them?"* ... *"What stops reckless actors from also using this platform if they have the votes?"* ... *"Like nation states, isn't this also just another coalition to counter someone else?"*
**Current state:** The metrics requirement (net-positive outcomes only) and competence verification partially address this, but coordinated counter-voting and majoritarian abuse are not explicitly discussed.

### 8. Legal/tax classification
**Status:** 🔶 Partially addressed
**Leanne's comment:** *"These are utility tokens or speculative $CC — tied again to their 'economic value' which so far they seem speculative as no in-kind guaranteed backing. More likely in-kind income and taxable."*
**Current state:** Listed under "Open Questions" in the Economics Deep Dive but not explored.

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

## Unclear Reference — Needs Context from Jonas

### A. "please elaborate"
**Leanne's comment:** *"please elaborate"*
**Context:** Re "What $CC is -> 4. Access right: Platform fees create utility demand"

### B. "really"
**Leanne's comment:** *"really"*
**Context:** to "the platform governs itself". Jonas responded about DAOs: *"Well... in a way. 😅 Same as DAOs, but better..."*

### C. "I don't see how. Explain"
**Leanne's comment:** *"I don't see how. Explain"*
**Context:** Re "Kindact creates incentives to break these traps" in 'Addressing Moloch'. It refers to both, how Kindact creates incentives ($CC = value; already handled) and how it can help to get out of Moloch traps, in this example climate change nobody willing to do the first step. 

### E. "Same for a token, which is why you don't want such an unstable valuation for a token you want to be stable."
**Leanne's comment:** Full text above.
**Context:** "a platform isn’t valuable until it has users, and it won’t get users until it’s valuable."

---

## Additional References Mentioned by Leanne (for research)

- **Sensorica**: *"Sensorica might have some examples. Theirs do have value as they are shares in equity."* — Worth investigating as a comparable model.
- **Will Ruddick's Sarafu**: Referenced for demurrage gaming lessons (circular trades). Already incorporated.
- **GrowGood**: Mentioned as a potential model for automated verification: *"like with growgood"*
- **Steph's LocalScale / Badges**: *"See over in Steph's localscale under Badges."* — Referenced for verification approaches.

---

*Last reviewed: March 3, 2026*
