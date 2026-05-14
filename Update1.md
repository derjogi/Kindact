# Kindact Economic Model Update: Summary of Refinements

This document summarizes the economic model refinements developed through analysis of Will Ruddick's mutual credit systems, Bernard Lietaer's complementary currency theory, and the Potvin/ERA framework.

---

## Key Decisions

### 1. Single Token ($CC) — Dual-Token Split Rejected

After exploring a Rep/CC split (soulbound reputation + tradeable currency), we concluded that:
- The split cleanly solved the "can you buy reputation?" problem but **weakened CC's demand** since Rep-weighted voting created no CC demand
- With one-person-one-vote governance, the main reason for the split (preventing vote-buying) disappears
- Provenance transparency (distinguishing earned from purchased tokens) handles the reputation signal within a single token
- The verified impact marketplace model works better with a single token, since buyers want CC *with its provenance* — splitting Rep from CC would strip the impact credentials from the tradeable token

### 2. The Verified Impact Marketplace (Long-Term Demand Driver)

$CC's value follows a phased trajectory:

**Phase 1 (0–2 years): Social value.** $CC has near-zero monetary value. Functions as recognition and community coordination. Internal circulation between members.

**Phase 2 (2–5 years): Local economic utility.** Local businesses accept $CC. Internal circulation creates velocity. Access fees and reward bonding create modest demand.

**Phase 3 (5–10 years): Credibility threshold.** Kindact's auditable track record enables the **verified impact marketplace**: external entities (carbon offset buyers, corporations needing ESG documentation, impact funds) purchase $CC from contributors as verified impact credentials. Money flows to contributors *after* the community independently decided what work matters.

**Phase 4 (10+ years): Established marketplace.** Mature institutional demand. Stable $CC value. Self-reinforcing: more verified impact → more demand → higher value → more contributors.

### 3. Reward Bonding (Not Proposal Gating)

- Anyone can propose issues freely, regardless of $CC balance
- Staking $CC on an issue increases its maximum possible reward, signaling community confidence
- Bonded $CC returned on success; slashed if flagged as spam/fraud
- This creates internal demand for $CC without blocking newcomers

### 4. Access: Buy Wall as Secondary Price Floor

- Extended platform access (beyond a generous free tier) requires spending a small amount of $CC
- If $CC's exchange price drops too low, users buy it cheaply for access, creating a natural price floor
- This is a secondary demand mechanism, not the primary value story

---

## Theoretical Foundations

- **Bernard Lietaer**: Demurrage as long-term investment incentive (historical precedent from Egypt and medieval Europe); complementary currencies should avoid artificial scarcity; $CC as a cooperative complement to competitive national currencies
- **Will Ruddick / Grassroots Economics**: Mutual credit validated for local reciprocal exchange; Kindact's minting model is necessary for non-excludable public goods where no individual counter-party can redeem
- **MMT framing**: Tokens minted against verified real-world production don't inherently inflate if verification is sound

---

## What Was Explored and Set Aside

- **Dual-token (Rep + CC)**: Clean reputation separation but weakened CC demand; unnecessary if governance stays 1p1v
- **Rep-weighted voting (logarithmic scaling)**: Defensible but created tension with 1p1v values and didn't generate CC demand after the Rep/CC split
- **Rep from buying CC (10:1 ratio)**: Would create some demand but re-opens "can you buy influence?" problem; double compression (10:1 + log) makes it practically resistant but narratively messy
- **Linear decay over fixed window**: Explored for Rep in a dual-token model; not applicable to a combined CC since tokens need to retain spendable value
