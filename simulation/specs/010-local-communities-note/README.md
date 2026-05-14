---
status: planned
created: '2026-04-02'
tags: [future, research, M11]
priority: low
---

# Local Community Network Effects (Research Note)

> **Status**: planned · **Priority**: low · **Created**: 2026-04-02

## Overview

The current simulation treats all agents as existing in a flat, undifferentiated space. In reality, community currencies succeed or fail *locally* — a café in a specific neighborhood, a community garden in a specific town. Network density, clustering, and geographic concentration of acceptance are probably the most important predictors of community currency survival.

This spec documents the research question and design considerations for a future major simulation extension.

**This is NOT ready for implementation** — it would require a near-complete simulation redesign.

## Research Questions

1. How does local clustering of merchants and contributors affect overall currency viability?
2. Can a currency survive with 3 thriving local communities and 10 dead ones? Or does the dead weight kill it?
3. How does the "shared global currency" model interact with local adoption dynamics? Does a global Hypercert sale in one community boost confidence in another?
4. What minimum local network density is needed for a community currency to sustain circulation?

## Possible Design Approaches

### Multi-Community Agent Model

- Agents belong to one or more `Community` objects
- Trade happens primarily within communities (80% local, 20% cross-community)
- Merchant acceptance is local: a merchant in Community A accepting $CC doesn't help a contributor in Community B spend theirs
- Hypercert sales and reserve dynamics remain global (shared reserve)
- Confidence has both local and global components

### Simplified Approach (If Full Model Too Complex)

- Model 3–5 communities as separate populations sharing one currency
- Each community has its own merchant density / acceptance willingness
- Cross-community trade is a configurable parameter
- Observe whether strong communities can carry weak ones, or whether weak communities drag down the whole system

### Key Factors That Are Hard to Model

- Geographic proximity and physical accessibility
- Cultural differences in trust and cooperation
- Local economic conditions (disposable income, existing alternatives)
- Community leadership quality (one good organizer can make or break a local currency)
- Information flow between communities

## Notes

- This is the most important gap in the simulation for realistic prediction, but also the hardest to address.
- Real-world data from Sarafu, Chiemgauer, and WIR could help calibrate local adoption parameters.
- Consider whether a separate, simpler simulation focused *only* on local adoption dynamics (ignoring the $CC token mechanics) would be more useful than bolting network effects onto the current ABM.
- Literature review: Ussher et al. (2021) "Complementary Currencies and Community Development" has relevant network analysis.
