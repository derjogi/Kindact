# RCF Currency Design Discussion — Summary & Relevance to Kindact

*Distilled from the #currency-design channel on the RCF (Regen Currency Federation) Discord, Feb 15 – Mar 11, 2026. ~960 lines of conversation between Chuck Harrison, Leanne Ussher, Basma Symington, Kimberley Burton, Steph Osmont (localscale), Alex Bernat, Leo, Alexia, lynnfoster, and others.*

---

## Part 1: What Was Discussed — Core Ideas and References

### The Four Functions of Money

Leanne lays out a framework that structures most of the subsequent debate. She distinguishes four functions of money (not the usual three):

1. **Unit of account** — a measuring stick (kg, meters, dollars). People will keep thinking in their national currency for a long time, possibly forever, even while using a local token.
2. **Medium of exchange** — overcoming barter; enabling multilateral clearing of trade positions.
3. **Store of value** — connected to speculation, savings, liquidity. Leanne argues this function is in *tension* with medium of exchange: when money becomes a thing to hoard, it creates zero-sum dynamics. She draws on Perry Mehrling's "Money View" and Hyman Minsky.
4. **Standard of value** — an anchor for exchange rates and deferred payments. This is the function most economists collapse into "unit of account," but Leanne separates it. She argues currencies should be anchored to something real (commodity baskets, labor time, regenerative capacity, CPI targets) rather than to the USD. She names several economists pursuing alternatives: Joseph Potvin (Earth Reserve Assurance), Delton Chen (carbon), Benjamin Graham (commodity baskets), and others.

Chuck largely agrees but is more pragmatic — he thinks displacing the national currency as unit of account is an edge case, and that most community currencies will and should peg to national fiat for practical reasons.

### The Berkshares Deep Dive

A large portion of the conversation is a detailed case study of **Berkshares**, a community currency in Great Barrington, Massachusetts. The key facts and arguments:

- **How Berkshares work**: You buy 100 Berkshares from a participating bank for $95. When converting back, 100 Berkshares return $95. So the bank's guaranteed exchange rate is $0.95, not $1.00. There is an *agreed* or *cultural* expectation that merchants accept 1 Berkshare = $1, but this is not guaranteed by anyone.
- **Leanne's field observation**: Most merchants do *not* accept Berkshares 1:1 for full purchases. They limit acceptance to 20%, 50%, or sale items only. The one exception was the local grocery co-op, which accepted them freely because it could buy local produce with Berkshares and redeem the rest at the bank (absorbing the 5% cost as a marketing expense to capture market share).
- **The core disagreement**: Chuck calls the 1B = $1 rate a meaningful "reference value" or "face value" that shapes behavior. Leanne calls it an unstable social convention that only survives because the bank's $0.95 redemption floor provides real institutional discipline. She argues the *real* exchange rate gravitates to the floor, not the agreed reference.
- **Leanne's conclusion**: The Berkshare is stable not because of agreement, but because the bank stands ready to buy back. Without that institutional backing, the "agreement" would collapse — as it did with other currencies like the Hudson Valley Current (which had an agreed 1:1 rate but no backing, and effectively became worthless in practice).

### The SEEDS Cautionary Tale

Multiple participants reference **SEEDS** (a regenerative crypto project several of them were involved in) as a failure case. Kimberley Burton notes SEEDS "ignored 7 billion people and only addressed people who had enough resources to contemplate forming DAOs." Leanne references SEEDS' bonding curve period where the redemption rate was wildly different from the 1:1 Sarafu:Shillings rate that 99% of users relied on — and the system only stabilized when Will Ruddick switched to defending the 1:1 rate with capital controls and actual redemption. The lesson drawn: social agreement alone cannot sustain a currency; discipline (institutional backing, redeemability) is what kept even the "agreement" alive.

### The Compost-Backed Currency Model

Leanne constructs an extended thought experiment about a **compost-backed local currency**. It's the most technically developed argument in the thread:

- A central compost warehouse guarantees 1 token = 1 bag of compost (redemption promise).
- A greenery store sells the same compost for $0.50/bag, creating a reference price.
- If the community over-issues tokens and the token's market value drops below $0.50, arbitrageurs can redeem tokens for compost and sell it for dollars — risk-free profit that automatically removes tokens from circulation and pushes the price back up.
- **Key insight**: $0.50 becomes a *price floor* defended by arbitrage, not by agreement. But it only works as long as the compost warehouse has actual compost. If tokens are issued faster than compost is produced, redemption stops, arbitrage collapses, and the peg breaks.
- **One-sentence summary** (Leanne's own): "A compost-backed token can maintain a target USD exchange rate through arbitrage as long as redemption into compost is credible and supply-constrained; uncontrolled token issuance eventually breaks that credibility."

She then extends this into a **jobs-guarantee variant**: instead of targeting a USD exchange rate, the compost bank targets *employment* — anyone willing to do regenerative work earns tokens at a posted wage. Token supply expands and contracts countercyclically. Compost shifts from being the primary peg to a secondary discipline. The standard of value becomes labor, not dollars. She frames this through Mehrling's Money View: "Money is about elasticity and discipline. Someone must stand ready to issue currency. Someone must stand ready to absorb it."

### The Festival Token Model

Leanne describes the **O+ Festival** (a real arts/health festival) as an example of "segmented thinking." Festival organizers pay volunteers in O+ tokens; those tokens buy concert entry, food, health services within the festival. Key insights:

- Within the festival, people think in O+ tokens, not dollars. They don't calculate opportunity cost in USD — they just assess whether the O+ they earn is enough for the experiences they want.
- When they leave the festival, they're back in "dollar land." The two value systems coexist without needing conversion.
- Design features that make this work: tokens expire at end of festival (demurrage), merchants are whitelisted (capital controls), tokens can be clawed back if transferred to non-merchant wallets.
- **The deeper point**: You don't need to *replace* fiat thinking. You can create bounded contexts where a different token is required and where fiat is irrelevant.

### Leanne's Two Theories of Currency Value

Near the end of the discussion, Leanne crystallizes the entire debate into two opposing design philosophies:

**Theory 1A — Money value as agreement/convention (supply-side)**. Value comes from shared belief: community members agree to accept the token at a stated rate. Self-reinforcing expectation loop. This is the Austrian School view (Carl Menger), and also how many crypto projects think about value. Leanne's verdict: *inherently unstable*. It can work during initial excitement, but once enthusiasm fades, nothing structural forces people to keep wanting the tokens. "This was the same mistake with SEEDS."

**Theory 1B — Money value from cost of production (also supply-side)**. Tokens are valuable because producing them requires effort (proof-of-work, proof-of-plant, proof-of-kindness). Leanne's verdict: *false*. "If I burn $10 of electricity to generate a useless token, the token does not become worth $10. Demand comes first; production adjusts afterward."

**Theory 2 — Institutional demand and constraints (demand-side)**. Value comes from structural mechanisms that *force* or *incentivize* acceptance: redemption windows, monopoly control of key resources, tax obligations, arbitrage constraints. This is the chartalist/institutional view. Leanne's verdict: *this is how currencies actually work*. State currencies have value because of tax obligations. Commodity-redeemable currencies have value because of convertibility. "Without these structural mechanisms, tying the issuance of money to a virtuous activity — whether by computation, tree planting, or compost production — does not by itself create demand."

### Chuck's Response: Circular Flows Matter More Than Backing

Chuck pushes back, not by rejecting Leanne's demand-side point, but by reframing the goal. He argues the ultimate aim is **locally recirculating value flows** ("flow around"), not primarily backing and redemption ("flow through"). He references Will Ruddick's "string game": if a currency flows around a community — from implementers to merchants to other contributors and back — then it can sustain itself even without heavy institutional backing. The key challenge is "gap-filling": bringing enough goods and services providers into the currency circle that people can actually spend their tokens.

He acknowledges Leanne's point that stabilizing mechanisms are essential, but argues they are *subsidiary* to the greater goal of establishing circular flows. Leanne's final response: "In order to have 'flow around' you need to have 'flow through'" — meaning you can't build circular flows without first having institutional demand that gives the token credible value.

### The Hypha/Wallet Design Problem

A practical thread runs throughout: the **Hypha platform** (being built by LocalScale/Steph) is migrating Rainbow and oSwaps contracts to Base blockchain. The contracts currently tie token prices to USD, which Chuck finds limiting. Key tensions:

- Hypha's wallet shows users their token balances converted to fiat equivalent. Leanne objects: this trains users to think of tokens as dollar-denominated instruments and destroys any alternative value framing.
- Chuck wants the contracts to support non-fiat-priced tokens (e.g., a token valued in compost, or in a basket of community goods) — but current on-chain forex data is limited to 6 currencies.
- The Rainbow contract was more flexible (valuation could be any text label, e.g., "browniepoints"), but Hypha's new contracts hardcode USD as the reference.
- Chuck is pushing for features like: incommensurable value families in wallets, optional fiat display, community-controlled reference rates.

### Other Notable References and Side Threads

- **Balinese currency system** (Lietaer & DeMeulenaere paper): Bali has traditional time-based community labor currencies (banjar system). Poorer communities relied on these time currencies; wealthier ones substituted fiat. Referenced Foa & Foa's social resource typology suggesting different resource types (love, status, information, money, goods, services) have different substitutability — possibly arguing for multiple specialized currencies rather than one general-purpose one.
- **Irish Bank Strike (1970)**: During months-long bank closures, Irish communities created informal IOUs that circulated as currency, sustained by social trust within tight-knit communities. Chuck cites the Antoin Murphy academic paper documenting this.
- **MiCA regulations**: Under EU's MiCA 2026 framework, crypto community currencies may require fiat backing. Steph (localscale) confirms this is the reality in France and says it stifles CC innovation — the Clarine intentionally has no backing, relying on technology being ahead of legislation.
- **OpenBadges**: Steph deployed an OpenBadge framework on the RCF website for issuing standardized credentials (importable to LinkedIn, blockchain wallets). Proposed a "Currency Designer" badge as a prerequisite for deploying local currencies.
- **Community size**: Basma suggests the Dunbar number (~150) as a limit for trust-based currency systems. Leanne and Chuck argue currencies are specifically designed to *transcend* social trust limits — that's their whole point. Leanne recommends narrowly-defined special-purpose tokens starting small, with institutional backing, rather than trying to design for a specific population size.
- **Leo's LoRaWAN/telecom currency experiment**: Leo documents experiences trying to use decentralized tokens for public sensor data networks. Found that businesses refused anything not fixed to USD because they can't account for non-fiat assets. Concluded "humanity does not seem ready" for such systems in highly regulated sectors like telecom.
- **Historical coinage and seigniorage**: Chuck and Leanne discuss how pre-modern mints charged merchants 8% to convert silver into coins (Adam Smith, *Wealth of Nations*). The resulting coins had less silver than their face value, yet circulated at face value — sustained by legal tender laws and the "convenience premium" of having standardized currency. Leanne draws parallels to Berkshares' seigniorage structure.
- **CoFi (Collaborative Finance)**: Alexia suggests bringing the Chuck/Leanne debate to the CoFi Telegram group (~300 members, annual conference). Leanne names Dil Green as her favorite CoFi expert and mentions Matt Slater's "Trading Floor" monetary simulation game.
- **Alex Bernat's currency design principles**: Currencies should be generated by completing essential work; denominated in person-centered need-fulfillment units (Day, Week, Month, Year); decay through demurrage calibrated to real-economy value loss; scale modularly per person added; balance spending pressure (demurrage) against spending friction (transaction fees).

---

## Part 2: Relevance to Kindact

Here are the most relevant takeaways from this RCF discussion for Kindact, organized by theme:

1. "Agreed value" without redeemability is fragile — Kindact's biggest vulnerability

Leanne's central thesis (lines 890–942) is that currencies cannot sustain value through social convention alone. She explicitly argues that proof-of-work/proof-of-kindness narratives don't create demand (line 927): "If I burn $10 of electricity to generate a useless token, the token does not become worth $10. Demand comes first; production adjusts afterward."

This directly challenges Kindact's Phase 1–2 model where $CC is "backed by verified work" but not yet redeemable. Kindact's economics doc acknowledges this but somewhat hand-waves it by saying "social value first, monetary value later." Leanne's Berkshares analysis shows that even with institutional backing, the actual exchange rate gravitates to the floor set by redeemability, not to any "agreed" or "reference" value. Implication for Kindact: The transition from Phase 1 (social value only) to Phase 2 (real economic value) may be harder than described. You may want to explicitly plan for how $CC avoids the SEEDS/Ithaca Hours failure pattern — where tokens accumulate in pockets with no one wanting them.

2. Demand-side design, not just supply-side

Leanne repeatedly stresses (lines 896–901, 954–962) that supply-side issuance ("mint tokens when work is done") is insufficient. Hyman Minsky's quote is apt: "Anyone can create money; the problem lies in getting it accepted." Kindact currently emphasizes supply mechanisms (work minting, voter-scaled caps) but is lighter on structural demand creation beyond access fees and Hypercert sales. The access fee mechanism is good (it's a form of institutional demand), but Leanne's framework suggests Kindact needs more "pull" mechanisms — things that require $CC and can't be substituted with fiat.

Implication: Consider whether Kindact's access fees are sufficient structural demand, or whether additional "you must use $CC for this" mechanisms are needed early on. The festival token model (lines 250–262) is instructive — it works because within a bounded context, you need the token and can't substitute dollars.

3. Capital controls matter — fiat offramps can destroy alternative value systems

Leanne is emphatic (lines 462–466): "Redemption in USDC stablecoins is same as redemption in fiat. And allowing a market in fiat will destroy an alternative standard... Capital controls are king." She argues that if people can always convert to USD, the token will always be mentally priced in USD and can never escape the dollar's gravitational pull.

Implication for Kindact: Your Phase 2 reserve mechanism (where $CC can be exchanged for fiat) is in tension with the goal of creating a currency that represents a different value system. The RCF discussion suggests this is a conscious design trade-off worth acknowledging more explicitly. Is $CC meant to be an alternative value system, or is it ultimately just denominated in impact-dollars? Your confidence curve blending toward $1 suggests the latter.

4. The "store of value vs. medium of exchange" tension is real

Leanne's point (lines 315–321) that store of value and medium of exchange are opposites is worth internalizing. She argues that when money becomes a "thing" to hoard, it creates zero-sum dynamics and imbalances. Kindact's demurrage mechanism addresses this, and the RCF discussion validates that approach. But the discussion also reveals that demurrage alone won't create circulation if nobody wants the token in the first place (line 897).

5. The compost-backed currency model has parallels to Hypercerts

Leanne's compost bank model (lines 651–703) is surprisingly analogous to Kindact's Hypercert reserve model. Both involve a real-world backing asset (compost / verified impact credentials) that creates a floor for the token's value. Her key warning applies directly: "If token issuance is not constrained by roughly matching it to [backing asset] production... the system becomes unstable." For Kindact, this means the rate of $CC minting must remain plausible relative to the rate of Hypercert sales. If minting vastly outpaces Hypercert demand, the backing ratio collapses.

6. The "institutional defender" role is crucial and currently missing from Kindact

Leanne's analysis of Berkshares (lines 296–307) shows that even in a well-designed system, value stability depended on a single actor (the grocery co-op) functioning as an automatic stabilizer — absorbing excess tokens and defending the price. Kindact's design relies on the reserve mechanism and demurrage, but doesn't identify who or what plays this stabilizer role in practice.

Implication: Consider whether Kindact needs an explicit "market maker" or institutional partner early on — someone who commits to accepting $CC at a stated rate, even at a loss, to establish a credible floor.

7. ValueFlows connection is validated

The RCF discussion frequently references ValueFlows (lines 21, 427, 484) as essential for tracking real-side resource flows. Kindact already plans to use VF for implementation reports. The discussion reinforces this choice — Chuck and Leanne both see VF as critical for making goods and service flows visible, which is exactly what Kindact's verification system needs.

8. "Segmented thinking" — the festival token insight

Leanne's festival token analysis (lines 250–264) offers a powerful framing that Kindact could use: people can think in two currencies simultaneously without converting between them. Within the Kindact context, this suggests that for local communities, $CC doesn't need to "compete" with USD — it just needs to be the required currency within the Kindact sphere. This validates the access-fee-in-$CC approach and suggests pushing it further.

9. Legal/regulatory reality check (MiCA)

The discussion about MiCA regulations (lines 37–39) and the French requirement for fiat backing of community currencies is a concrete regulatory concern that Kindact's "Legal and Regulatory Uncertainty" section should address more specifically.

---

Bottom line: The most actionable insight is Leanne's demand-side critique. Kindact's economics document is strong on supply management (demurrage, burns, voter-scaled caps) but comparatively thin on why anyone would want $CC in the first place beyond access fees and speculative Hypercert-driven appreciation. The RCF discussion suggests that without robust, structural, non-voluntary demand mechanisms, $CC risks the same fate as SEEDS and Ithaca Hours: initial enthusiasm followed by circulation collapse