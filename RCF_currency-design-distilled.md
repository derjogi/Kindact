# RCF Currency Design Conversation — Distilled Insights

This document extracts the key design ideas, mechanism proposals, and practical developments from the Discord thread, with personal/interpersonal commentary removed.

## 1) Major Developments

1. **Hypha/Localscale migration work accelerated**: Rainbow + oSwaps features are being migrated to Base with a UI-first integration effort.
2. **Backing architecture became a central design topic**: discussion moved from “fiat redemption by default” toward supporting both fiat and non-fiat-backed models.
3. **Contract flexibility was emphasized**: agreement emerged that communities should be able to run currencies **with or without fiat valuation**, and show/hide reference rates based on actual redeemability.
4. **RCF design scope reaffirmed as pluralistic**: support for multiple models (fiat-backed, mutual credit, voucher-like, and eventually demurrage-bearing systems), rather than a single canonical design.

## 2) Core Design Principles That Emerged

1. **Define purpose before mechanism**: start with the coordination failure to solve (e.g., local trade, regeneration outcomes, employment stability, liquidity constraints), then choose currency architecture.
2. **Separate the money functions explicitly**: unit of account, medium of exchange, store of value, and standard of value should be modeled as distinct design layers.
3. **Distinguish “reference value” from “redeemable value”**: socially agreed rates are not equivalent to guaranteed conversion rates.
4. **Treat backing as operational, not rhetorical**: if a rate is displayed, there should be real mechanisms capable of defending it.
5. **Accept contextual pricing and partial commensurability**: different token ecosystems can coexist without one universal exchange metric.

## 3) High-Value Mechanics Discussed

## A) Backing and Redemption Mechanics

1. **Guaranteed redemption window**: a trusted entity stands ready to convert token ↔ backing asset at defined terms.
2. **Commodity/service backing**: backing can be labor, energy, access rights, or commodity inventory—not only fiat.
3. **Dynamic policy support**: if backing is stressed, governance can use issuance controls, burn/tax rates, or reserve operations.
4. **Voucher-style design**: token value derives from explicit redemption terms (quality, timing, location, rights).

## B) Pegs, Floors, and Reference Rates

1. **“Peg” should be reserved for defendable convertibility** (fixed or policy-managed), not mere social agreement.
2. **Reference (jawboned) rates can be useful**, but only as guidance unless backed by intervention capacity.
3. **Price floors are strongest when arbitrage is possible** between token redemption and external commodity markets.
4. **Asymmetric buy/redeem rates** are a legitimate design lever (e.g., discourage round-tripping, incentivize local spend).

## C) Capital Controls and Club-Boundary Tools

1. **Whitelisting of transfers/membership**.
2. **Whitelisted redemption rights (merchant badging/role-based access)**.
3. **Time locks on redemption**.
4. **Credit limits and max-balance limits**.
5. **Clawbacks/penalties for design-specific misuse**.

These were repeatedly framed as essential for maintaining alternative standards and preventing uncontrolled leakage into fiat arbitrage.

## D) Monetary Policy Inside Community Currency Systems

1. **Demurrage (burn) + issuance control** as a way to prevent hoarding and maintain circulation.
2. **Transaction fees as spending friction** to shape velocity.
3. **Targeting frameworks** can vary: exchange-rate stability, employment, regenerative output, or basket purchasing power.
4. **“Elasticity + discipline” principle**: currency must be issueable when needed, but absorbable under clear rules.

## E) Wallet/UI Mechanics

1. **Do not conflate display value with guaranteed executable value**.
2. **Reference rates should be optional/clearly labeled** if not redeemable.
3. **Support ecosystem partitioning**: users may view “equivalents” only within commensurable token families.
4. **Potential dual display model**: show both declared reference value and official redemption value when both exist.

## 4) Concrete Model Patterns Worth Reusing

1. **Festival/fairground token model**: constrained domain, explicit purpose, optional expiry, strong controls, and potentially no fiat parity requirement.
2. **Merchant-network local currency model**: broad circulation with managed redemption windows and merchant acceptance rules.
3. **Commodity-backed floor model**: redeemability to real assets enables arbitrage-based floor defense.
4. **Employment-targeting model**: fixed token wage for approved work + floating token/fiat rate + countercyclical issuance.

## 5) Key Risks and Failure Modes Identified

1. **Agreement-only currencies without defense mechanisms** can drift toward credibility collapse.
2. **Displayed exchange rates that cannot actually clear** create trust damage.
3. **Unconstrained issuance against finite backing** eventually breaks redemption credibility.
4. **Overly fiat-centric UX/contract assumptions** can suppress non-fiat standards and local policy autonomy.
5. **No boundary controls** can collapse alternative-value systems into dominant fiat pricing logic.

## 6) Practical Implementation Implications

1. **Treat value fields as typed** in contracts/UI: `reference_value`, `official_redemption_value`, `market_observed_value`.
2. **Require explicit metadata for each value**: who sets it, whether it is guaranteed, under what conditions it executes.
3. **Make fiat valuation optional at protocol + wallet layers**.
4. **Design redemption modules as pluggable policy components** (fiat reserve, commodity reserve, service voucher, hybrid).
5. **Add scenario simulation before launch**: issuance/redemption stress, liquidity shocks, and long-run debt/credit balance behavior.

## 7) Open Questions Still Unresolved

1. What terminology should be standardized in UI/contract language (`official`, `face`, `par`, `reference`)?
2. How should wallets present multiple coexisting value notions without misleading users?
3. Which policy targets are primary for a given community (exchange-rate stability, employment, regeneration, inflation control)?
4. What minimum governance and reserve requirements are necessary before displaying any “official” rate?
5. How should bridges to fiat/stablecoins be controlled so they do not undermine the intended local standard?

## 8) Distilled Strategic Takeaway

The strongest throughline is this: **community currencies become robust when their claimed value is operationally defensible**—through redeemability, policy tools, governance discipline, and UI honesty about what is reference versus executable exchange.
