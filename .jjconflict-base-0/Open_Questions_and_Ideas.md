# Kindact — Open Questions and Ideas

A living document for thoughts, ideas, and unresolved questions that don't yet belong in the main documents.

---

## Token Design

### Time-based currency calibration
**Idea:** Calibrate $CC so that 1 $CC ≈ 1 minute of community-approved work. This would make the currency intuitive (1 hour = 60 $CC) and conceptually links to timebanking traditions where all labor is valued equally per unit of time.

**Open questions:**
- Does equal-time-equal-value hold for Kindact, or should some tasks be worth more per minute (skilled labor, dangerous work, unpleasant tasks)?
- If rewards vary per task type, the 1 $CC = 1 minute anchor becomes approximate rather than definitional — is that OK?
- How does this interact with Hypercert-based external valuation, where the market may price impact differently from time invested?
- Timebanking literature (Edgar Cahn's work) may have relevant lessons on how time-based currencies handle skill differentials

**Related:** This affects the calibration discussion in the Economics Deep Dive (reward amounts, access fees, demurrage rates — all become more intuitive if anchored to time).

---

## Platform Modules

### Assurance Contracts / Threshold Mechanisms
**Idea:** Support Dominant Assurance Contracts (Tabarrok) as an optional module. "I will if you will" — people pledge to perform a task only if enough others also pledge.

Thresholds could unlock various things beyond just pledges:
- **Kickstarter-style backing:** An issue only activates if enough people commit resources or signal demand
- **Coordinated action:** "Switch to renewable energy" only triggers if 500 households in the district sign up
- **Funding releases:** Reward tranches unlock at participation milestones

This eliminates the risk of acting alone by enabling synchronized commitment. Natural fit for Kindact's modular design — could be turned on per issue.

**Related:** Strengthens the Moloch/coordination trap argument (see Leanne Feedback Tracker, item C).

---

*Last updated: March 3, 2026*
