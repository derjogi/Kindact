# Kindact × Hypercerts: Collaboration Strategy

*A roadmap for building a partnership between Kindact and the Hypercerts Foundation*

**Last Updated**: April 14, 2026

---

## Executive Summary

Kindact already positions Hypercerts as one of its two core economic primitives — the non-fungible impact credential that gives $CC its fiat backing through external sales. This isn't a speculative integration idea; Hypercerts are architecturally embedded in Kindact's economic model. A formal collaboration would turn this design dependency into a mutual relationship where both projects benefit.

**The pitch to Hypercerts**: Kindact is a governance and implementation platform that would generate a high volume of structured, community-verified impact records — exactly the demand-side infrastructure Hypercerts needs to grow its ecosystem beyond its current project base.

**The pitch to Kindact**: A formal relationship with Hypercerts gives credibility, technical guidance, and early access to tooling for the credential layer that Kindact's entire economic model depends on.

---

## 1. Strategic Alignment Analysis

### Where the missions overlap

| Dimension | Hypercerts | Kindact | Overlap |
|-----------|-----------|---------|---------|
| **Core problem** | Impact work is undervalued because it lacks shared, trustworthy records | Collective action fails because there's no incentive loop from decision → implementation → reward | Both want to make impact work visible, verifiable, and fundable |
| **Approach** | Open protocol for recording, evaluating, and funding impact | Full-cycle governance platform (deliberate → decide → implement → reward) | Kindact produces the impact; Hypercerts certifies and monetizes it |
| **Economic model** | Impact records attract funders who allocate capital based on evidence | $CC is minted for verified work; Hypercert sales back $CC with fiat | Hypercert sales are the primary mechanism that gives $CC monetary value |
| **Technology** | AT Protocol, open infrastructure, interoperable by default | Blockchain/distributed ledger, modular open-source platform | Both prioritize openness, portability, and avoiding platform lock-in |
| **Ecosystem** | Protocol Labs, Optimism, Gitcoin, Ma Earth, GainForest, Octant | Metagov, Hypha, Localscale, RCF, Grassroots Economics | Complementary networks with some overlap (Gitcoin, Funding the Commons) |

### Why Hypercerts specifically (vs. building your own credential system)

1. **Existing ecosystem**: Hypercerts already has partnerships with Optimism, Gitcoin, Protocol Labs, and others — connecting to funders Kindact would need years to reach independently
2. **Protocol maturity**: Built on AT Protocol with CLI tools, APIs, Hyperindex, and agent APIs already available
3. **Credibility transfer**: Association with Hypercerts Foundation signals seriousness to impact funders
4. **Interoperability**: Hypercerts are portable and not locked to any platform — aligned with Kindact's modular philosophy
5. **Evaluation layer**: Hypercerts' evaluator model (domain experts add evidence and trust signals) complements Kindact's community verification

---

## 2. What Kindact Brings to Hypercerts

This is what you need to articulate clearly — why should Hypercerts care?

### 2a. Demand-side infrastructure

Hypercerts is a protocol — it needs platforms that *generate* impact records at scale. Kindact's full governance cycle (identify → deliberate → decide → implement → verify → reward) produces a continuous stream of community-verified impact work. Each completed Kindact issue is a natural candidate for a Hypercert.

**Scale projection**: Even at modest adoption (Phase 2, ~5,000 users), Kindact could generate ~500 completed issues/month → 500 potential Hypercerts/month across multiple domains (environment, education, infrastructure, care work, civic projects).

### 2b. Structured verification data

Kindact's implementation reports (especially if built on ValueFlows vocabulary) provide exactly the structured input that Hypercerts' evaluation layer needs:
- Who did what
- What resources were consumed/produced
- What community verified the work
- What voting threshold was met
- What metrics were projected vs. achieved

This is richer provenance data than most Hypercerts currently contain.

### 2c. Multi-domain expansion

Hypercerts' current ecosystem is concentrated in climate/regeneration (Ma Earth, GainForest, Silvi) and open-source (Optimism, Gitcoin). Kindact would bring Hypercerts into new domains: community governance, care work, civic infrastructure, education, local economic development — significantly broadening the protocol's reach.

### 2d. Built-in economic demand for Hypercerts

Kindact's design creates *automatic demand* for Hypercerts through the fiat reserve mechanism. External buyers purchasing Kindact-generated Hypercerts directly fund the $CC reserve, creating a financial feedback loop that incentivizes Kindact communities to produce more high-quality impact records.

---

## 3. What Kindact Needs from Hypercerts

### 3a. Technical integration support

- Guidance on mapping Kindact's implementation reports to Hypercert record structures
- Access to Hypercerts CLI and API for programmatic Hypercert creation
- Help designing the automated pipeline: Kindact issue verified → Hypercert minted
- Advice on AT Protocol integration patterns

### 3b. Ecosystem access

- Introduction to impact funders in the Hypercerts network (Optimism RetroPGF, Gitcoin, Octant)
- Connection to domain evaluators who could add credibility signals to Kindact-generated Hypercerts
- Visibility in Hypercerts' ecosystem communications (blog, events, partner listings)

### 3c. Credibility and co-branding

- Recognition as a Hypercerts ecosystem partner/domain partner
- Joint communication about the integration (what it means for impact funding)
- Participation in Funding the Commons events and similar venues

### 3d. Protocol input

- Ability to provide input on Hypercert record structure evolution (especially for governance/civic impact domains that are less represented today)
- Feedback channel for protocol features that would support Kindact's use case

---

## 4. Collaboration Models (Options)

### Option A: Technical Integration Partner (Recommended starting point)

**What it means**: Kindact builds on Hypercerts' public tools (CLI, API, Hyperindex) to generate Hypercerts for completed issues. No formal partnership agreement needed initially.

**Actions**:
1. Build a proof-of-concept: manually create Hypercerts for 3–5 completed Kindact pilot issues
2. Share the results with the Hypercerts team for feedback
3. Document the mapping: Kindact issue fields → Hypercert record structure
4. Develop automated pipeline as Kindact's platform matures

**Pros**: Low commitment, can start immediately, demonstrates value before asking for anything
**Cons**: No formal relationship, no ecosystem access beyond public tools

### Option B: Domain Partner (Medium-term goal)

**What it means**: Formal recognition as a domain partner in the Hypercerts ecosystem (similar to Silvi, Regen Foundation). Involves regular communication, joint problem-solving, and ecosystem visibility.

**Actions**:
1. Present Kindact's use case to the Hypercerts team
2. Establish regular check-ins (monthly or quarterly)
3. Collaborate on defining impact dimensions for governance/civic domains
4. Co-author a case study or blog post about the integration
5. Present jointly at Funding the Commons or similar events

**Pros**: Ecosystem credibility, direct access to team, joint visibility
**Cons**: Requires Kindact to have enough substance to be a credible partner

### Option C: Core Contributor (Long-term aspiration)

**What it means**: Active contribution to the Hypercerts protocol itself, similar to Ma Earth and GainForest's role. Involves contributing code, protocol design input, and shared R&D.

**Actions**:
1. Contribute to Hypercerts protocol development (especially governance/civic domain support)
2. Build shared tooling (e.g., Kindact's verification data as a reusable evaluation module)
3. Joint research on impact valuation across diverse domains
4. Potential co-development of evaluation frameworks for non-environmental impact

**Pros**: Deep integration, protocol influence, strongest credibility signal
**Cons**: Significant engineering investment, requires Kindact to be much more mature

---

## 5. Key Questions You Need to Think Through

### 5a. Technical readiness

- **How far along is Kindact's implementation?** Hypercerts will want to know if this is a design document or a working platform. If it's pre-MVP, focus on Option A with manual proof-of-concept Hypercerts.
- **Can you produce structured implementation reports today?** Even manually, for pilot projects?
- **Are you committed to AT Protocol compatibility?** Hypercerts has moved to AT Protocol — you need to be comfortable building on it (or bridging to it).

### 5b. Impact measurement clarity

- **How will Kindact issues map to Hypercert dimensions?** Each Hypercert records: what was done, by whom, when, where, and with what impact. Kindact issues need to produce data that fills all these fields.
- **Who are the evaluators?** Hypercerts' model separates the *claim* (project says "we did X") from the *evaluation* (expert says "yes, X is credible"). Kindact's community verification is one form of evaluation, but external evaluators add more credibility. How will you attract them?
- **How do you handle impact domains where measurement is hard?** Carbon is relatively easy to quantify. Care work, civic participation, and community governance are much harder. What's your approach?

### 5c. Economic model dependencies

- **What if Hypercerts change their protocol significantly?** Kindact's economic model depends heavily on Hypercerts. What's your contingency if the protocol evolves in directions that don't serve Kindact?
- **Who owns the Hypercerts generated from Kindact issues?** Your current design says "held by Kindact as a platform asset." Is this compatible with Hypercerts' ownership model? On AT Protocol, records are owned by their creators.
- **How do you price Kindact-generated Hypercerts?** The fiat reserve depends on Hypercert sales. But who sets the price? Market dynamics? Fixed pricing? Auction?

### 5d. Governance and values alignment

- **How does Kindact's governance model interact with Hypercerts' foundation governance?** If there's a disagreement about protocol direction, how does Kindact respond?
- **Open source compatibility**: Both projects are open-source, but licensing details matter. Verify compatibility.
- **Data sovereignty**: Hypercerts on AT Protocol means records are creator-owned and portable. This aligns with Kindact's values but has implications for how the platform "holds" Hypercerts.

---

## 6. Conversation Starters and Talking Points

### For an initial outreach email/message

**Subject**: Kindact — governance platform generating structured impact records for Hypercerts

**Key points to hit**:
1. "We're building a governance and implementation platform where communities identify issues, deliberate, decide, implement, and get rewarded for verified impact work."
2. "Hypercerts are already central to our economic design — completed Kindact issues generate Hypercerts as impact credentials, and their sale to external buyers is what gives our community currency ($CC) its fiat backing."
3. "We'd love to explore how to make this integration as strong as possible — starting with a technical proof-of-concept mapping our implementation reports to Hypercert records."
4. "At scale, Kindact could generate hundreds of Hypercerts monthly across domains you're not currently well-represented in: civic governance, care work, community infrastructure, education."
5. "We'd appreciate feedback on our approach and would love to discuss how we might fit into the Hypercerts ecosystem."

### Questions to ask them

1. "What does a good integration partner look like to you? What would make Kindact a valuable addition to the ecosystem?"
2. "How should we think about mapping governance/civic impact to Hypercert record structures? Your current ecosystem is strong in climate/regeneration — what would it take to expand into other domains?"
3. "What's the best way to get started technically? We're looking at the CLI and API — any patterns or anti-patterns you've seen from other integrators?"
4. "Are there upcoming events (Funding the Commons, etc.) where we could present Kindact's use case to the broader ecosystem?"
5. "How do you think about Hypercert ownership for platform-generated credentials? Our model has Kindact holding Hypercerts as platform assets for sale — does that align with AT Protocol's ownership model?"

---

## 7. Concrete Next Steps

### Immediate (next 2 weeks)

- [ ] **Research contacts**: Identify the right person at Hypercerts Foundation to reach out to. Key people: @holke.xyz (appears frequently in talks/blog), @bitbeckers, @sharfyae. Check Bluesky, Telegram (+YF9AYb6zCv1mNDJi), and the contact form on hypercerts.org.
- [ ] **Draft outreach message**: Use the talking points above, keep it concise, lead with what Kindact brings (demand-side infrastructure), not what you need.
- [ ] **Read Hypercerts docs thoroughly**: Understand the record structure, AT Protocol integration, and evaluation model in detail (https://docs.hypercerts.org).
- [ ] **Join Hypercerts Telegram**: https://t.me/+YF9AYb6zCv1mNDJi — observe conversations, understand community norms before reaching out.

### Short-term (next 1–2 months)

- [ ] **Create manual proof-of-concept**: Pick 2–3 concrete examples of what Kindact issues would look like and manually create Hypercerts for them using the CLI. This demonstrates commitment and surfaces technical questions.
- [ ] **Map data structures**: Document how Kindact implementation reports (especially ValueFlows-structured ones) map to Hypercert record fields.
- [ ] **Prepare a 1-pager**: A concise document specifically for the Hypercerts team explaining: what Kindact is, why Hypercerts matter to it, and what Kindact brings to the Hypercerts ecosystem.
- [ ] **Attend a Funding the Commons event or watch recent talks**: Understand the community's language, priorities, and current conversations.

### Medium-term (next 3–6 months)

- [ ] **Build automated integration**: Once Kindact has a working platform (even MVP), build the pipeline from verified issue → Hypercert creation.
- [ ] **Seek Domain Partner status**: After demonstrating working integration, propose formal partnership.
- [ ] **Co-author content**: Blog post or case study about the Kindact × Hypercerts integration pattern.
- [ ] **Explore joint funding**: Apply together for grants from Optimism, Gitcoin, or other aligned funders.

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Hypercerts protocol pivots away from Kindact's needs** | High — economic model depends on Hypercerts | Design Kindact's credential layer as an abstraction that can support alternative providers. Keep the Hypercert dependency at the integration layer, not the core logic. |
| **Kindact is too early-stage for Hypercerts to take seriously** | Medium — wasted outreach effort | Lead with technical proof-of-concept (manual Hypercerts for example issues) rather than asking for partnership upfront. Show, don't tell. |
| **AT Protocol vs. Kindact's blockchain assumptions** | Medium — potential architectural tension | Kindact's chain-agnostic design principle should accommodate AT Protocol. Investigate AT Protocol's record ownership model early. |
| **Impact measurement in non-environmental domains is immature** | Medium — Hypercerts may not have evaluation frameworks for civic/care work | Frame this as an opportunity, not a problem: Kindact can help *develop* these frameworks collaboratively. |
| **Hypercert ownership model conflicts with "platform holds Hypercerts"** | Medium — AT Protocol records are creator-owned | Explore options: Kindact as the "creator" account, or a custodial model, or platform-managed wallets. Clarify with Hypercerts team early. |
| **No one at Hypercerts responds** | Low — but possible | Multiple channels exist (Telegram, Bluesky, contact form, GitHub, events). If cold outreach fails, meet them at events (Funding the Commons). |

---

## 9. Reference: Key Hypercerts Ecosystem Contacts & Resources

### People
- **@holke.xyz** — Appears in most Hypercerts talks and blog posts; likely a founder/lead
- **@bitbeckers** — Active in demos and development
- **@sharfyae** — Conference speaker, development team

### Channels
- **Telegram**: https://t.me/+YF9AYb6zCv1mNDJi (general), https://t.me/+FODiLtCV2TgwNzRi (support)
- **Bluesky**: https://bsky.app/profile/hypercerts.org
- **Twitter**: https://twitter.com/hypercerts
- **GitHub**: https://github.com/hypercerts-org
- **Contact form**: https://hypercerts.org (bottom of page)

### Technical Resources
- **Documentation**: https://docs.hypercerts.org
- **Hyperscan** (explorer): https://hyperscan.dev
- **Certified** (impact profile): https://certified.app
- **Scaffold App** (reference app): https://github.com/hypercerts-org/hypercerts-scaffold-atproto
- **CLI**: https://github.com/GainForest/hypercerts-cli
- **Agent API**: https://www.hyperscan.dev/agents/page
- **Hyperindex** (data API): docs.hypercerts.org/tools/hyperindex

### Events
- **Funding the Commons** — recurring conference series; next events likely in 2026. Check https://fundingthecommons.io
- **EthCC**, **Devcon** — Hypercerts team presents regularly

---

*This document is a living strategy. Update it as conversations with Hypercerts progress and as Kindact's platform matures.*
