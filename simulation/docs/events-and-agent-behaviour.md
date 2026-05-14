# Kindact Simulation — Events & Agent Behaviour Reference

A comprehensive reference for all events in the simulation, how they affect agent behaviour, and the psychological model underpinning agent decisions.

> **Code vs. Intent:** Where current implementation diverges from the scenario descriptions, both are noted. Most paired start/end events are **not persistent across timesteps** — params rebuild from base each step. Only `compounding_inflation` achieves true multi-month persistence by generating per-month events.

---

## Table of Contents

1. [Agent Types & Behaviours](#1-agent-types--behaviours)
2. [Psychological Model (Confidence)](#2-psychological-model-confidence)
3. [Acceptance Willingness](#3-acceptance-willingness)
4. [Activity & Dormancy](#4-activity--dormancy)
5. [Scenario Events](#5-scenario-events)
6. [System-Level Mechanisms](#6-system-level-mechanisms)

---

## 1. Agent Types & Behaviours

Each agent has a type that determines their primary economic role. All active agents (activity_level ≥ 0.1) share some universal behaviours:

- **Access fees:** ~5% of active agents pay a fee each month (min of balance or $10 CC). This is *not* type-specific — it applies to all active agents equally.
- **Panic override:** Any agent with `is_panicking = True` (regardless of type) abandons their normal role and attempts to redeem their entire balance, subject to exchange availability and the redemption cap. This overrides all type-specific logic except for the PANICKER type which has its own panic branch.

### CONTRIBUTOR (default 60% of population)

| Aspect | Detail |
|---|---|
| **Primary action** | Creates issues and earns $CC rewards |
| **Issue rate** | `dynamic_issue_rate × max(0.2, acceptance_willingness)` — always retains ≥20% of base capacity |
| **Earnings** | `n_issues × reward_per_issue` (Poisson-distributed issue count) |
| **Secondary** | Can make community hypercert purchases if confidence > 0.7 (rare, ~0.5% chance per month) |
| **Psychology** | High intrinsic motivation early (Beta 5,2 in bootstrap). Acceptance willingness and issue rate decline together if the system loses credibility |

### MERCHANT (default 15%)

| Aspect | Detail |
|---|---|
| **Primary action** | Earns trade income in $CC, partially redeems for fiat |
| **Trade income** | `uniform(0, 20) × acceptance_willingness` per month |
| **Redemption** | If exchange is open, redeems a random 10–40% of balance each month |
| **Psychology** | Willingness to accept $CC is the key lever — low willingness means near-zero trade income. Represents real-world merchants who need liquidity and only accept $CC if it's reliably convertible |

### SPECULATOR (default 10%)

| Aspect | Detail |
|---|---|
| **Buy condition** | `confidence > 0.6` AND `exchange_rate < 0.8` AND expected appreciation > `demurrage × 3` |
| **Buy size** | `uniform(50, 200) × (confidence - 0.5) × 2 × reserve_readiness`, where reserve_readiness = `sqrt(reserve / 100k)` capped at 1.0 |
| **Buy mechanics** | Purchases $CC with fiat at a 3% spread (`exchange_rate × 1.03`), adding fiat to reserve |
| **Sell condition** | `confidence < 0.3` and exchange open → redeems 50% of balance |
| **Psychology** | Rational profit-seekers. Buy the dip when confident, sell on loss of confidence. Require the system to have substantial reserves before committing large sums (reserve_readiness) |

### IMPACT_BUYER (default 5%)

| Aspect | Detail |
|---|---|
| **Primary action** | Mostly passive in monthly $CC flows |
| **Unique role** | Can make community hypercert purchases if confidence > 0.4 (probability ~1.5% × confidence per month) — the most likely hypercert community buyer |
| **Psychology** | Mission-driven buyers who believe in the platform's impact. Their hypercert purchases bring external fiat into the reserve *without reducing their $CC balance* — modelling philanthropic/impact investment |

### FRAUDSTER (default 5%)

| Aspect | Detail |
|---|---|
| **Primary action** | Attempts fraudulent minting every active month |
| **Success rate** | `1 - verification_quality` (default 10%, rises to 50% during fraud wave events) |
| **Fraud amount** | `uniform(1, 3) × reward_per_issue` — scales with reward levels, so inflation events also increase fraud value |
| **Psychology** | Pure exploiter archetype. Represents bad actors gaming the verification system for unearned rewards |

### PANICKER (default 5%)

| Aspect | Detail |
|---|---|
| **Normal behaviour** | Works like a contributor but at half rate (`issues_rate × 0.5`), *not* scaled by acceptance_willingness |
| **Panic behaviour** | When `is_panicking = True` and exchange is open, attempts to redeem 100% of balance |
| **Psychology** | Represents anxiety-prone participants. Lower confidence baseline (0.25 vs 0.5), gain less psychological comfort from holding time. Naturally gravitates toward panic. Models the real-world segment that joins out of curiosity but is quick to flee at signs of instability |

---

## 2. Psychological Model (Confidence)

Confidence is the central psychological variable. It drives panic, redemption, purchasing, and activity. Updated every timestep via four weighted signals:

### Confidence Update Formula

```
delta = 0.3 × trend_signal
      + 0.4 × redemption_signal
      + 0.1 × holding_signal
      + 0.2 × inertia_signal

new_confidence = confidence + delta × 0.15
```

The `× 0.15` dampening factor prevents wild swings — confidence evolves gradually.

### Signal Breakdown

| Signal | Weight | Computation | Psychological Rationale |
|---|---|---|---|
| **Exchange rate trend** | 0.30 | Relative % change in exchange rate, clamped ±1.0 (saturates at ±50% move) | "Is my money gaining or losing value?" — the most visible and emotionally salient signal for any currency holder |
| **Redemption success** | 0.40 | `None` → 0.0 (neutral); `0` → −1.0 (catastrophic); `> 0` → positive (min +0.1) | **Asymmetric by design:** any partial redemption success is reassuring; only total failure is devastating. Models the "bank run psychology" — if the ATM gives you *some* money, you're somewhat relieved, but if it gives you *nothing*, trust collapses |
| **Holding time** | 0.10 | `min(1.0, months_holding / 12)` — grows linearly over a year | Familiarity breeds comfort. Longer exposure normalises participation. Never penalises — only adds confidence. Panickers gain only 30% of this benefit |
| **Inertia** | 0.20 | `(baseline − confidence) × 2`, where baseline = 0.5 (or 0.25 for panickers) | Mean-reversion toward a type-specific "resting state." Prevents both runaway optimism and permanent despair. Models the human tendency to return to a psychological set-point after shocks |

### Panic Triggering

Two paths to panic:

1. **Organic panic:** After each confidence update, if `confidence < panic_threshold` → `is_panicking = True`. Panic threshold is per-agent, randomised between 0.1 and 0.4 at creation.
2. **Forced panic (bank_run event only):** Selected contributors, merchants, and panickers are directly set to `is_panicking = True` in addition to having their confidence crushed.

### Panicker-Specific Psychology

Panickers differ in three ways:
- **Lower baseline** (0.25 vs 0.5) — their "natural resting state" is anxious
- **Less holding comfort** (30% of normal) — time doesn't calm them as effectively
- **Lower mean-reversion target** — inertia pulls them toward anxiety, not neutrality

---

## 3. Acceptance Willingness

Determines how willing an agent is to earn/accept $CC. Affects contributor issue rates and merchant trade income.

```
acceptance_willingness = 0.35 × intrinsic_motivation
                       + 0.25 × exchange_rate_signal
                       + 0.20 × merchant_density
                       + 0.20 × confidence
```

| Factor | Weight | Computation | Rationale |
|---|---|---|---|
| **Intrinsic motivation** | 0.35 | Fixed per agent at creation, drawn from Beta distribution | Core belief in the mission. Largest single factor — idealists keep working even when the economics look shaky |
| **Exchange rate signal** | 0.25 | `min(1.0, exchange_rate × 2)` — saturates at rate ≥ 0.5 | "Can I actually convert this to real money?" — a rational economic signal |
| **Merchant density** | 0.20 | Fraction of *all* agents with acceptance_willingness > 0.3 (not just merchants) | Network effect: "Are other people accepting this?" — social proof drives individual willingness |
| **Confidence** | 0.20 | Agent's current confidence level | Personal trust in the system amplifies willingness |

### Intrinsic Motivation by Phase

New agents arriving in different phases have different motivation distributions:

| Phase | Beta params | Meaning |
|---|---|---|
| Bootstrap | (5, 2) | Skewed high — early adopters are idealists |
| Growth | (3, 3) | Symmetric — mixed motivations |
| Maturity | (2, 4) | Skewed low — later joiners need monetary incentive |

---

## 4. Activity & Dormancy

Activity level determines whether an agent participates at all. Below 0.1, agents are **dormant** and skip all actions (though demurrage still erodes their balance).

### Activity Update

```
activity_delta = 0.35 × (confidence − 0.5)
               + 0.25 × earned_signal
               + 0.25 × (intrinsic_motivation − 0.5)
               + 0.15 × (activity_level − 0.5)

activity_level += activity_delta × 0.1
```

- **Earned signal:** +0.3 for contributors/panickers if any system-wide work minting occurred; −0.1 otherwise. Note: this is a **system-level proxy**, not individual earnings.
- **Dormancy exit:** 3 consecutive months dormant → agent is permanently removed from the simulation (models user churn).

---

## 5. Scenario Events

### Event Persistence Model

⚠️ **Critical implementation detail:** Scenario params are rebuilt from base params each timestep. Most events only apply for the **single timestep** they are mapped to, unless they are repeated for every month in the range (as `compounding_inflation` does). Paired start/end events (like `fraud_wave` / `fraud_wave_end`) as currently coded are effectively **single-month shocks** at the start month, with the end event being a no-op since the base params already resumed.

The scenario descriptions below note both the **intended narrative** and the **implemented reality**.

---

### 5.1 Bank Run (`bank_run`)

| Property | Value |
|---|---|
| **Trigger** | Conditional: fires once when exchange opens OR at month 20 (whichever first) |
| **Mechanism** | Confidence shock to 70% of agents: `confidence = max(0.05, confidence × 0.3)`. Contributors, merchants, and panickers in the shocked group are force-panicked immediately |
| **Duration** | One-timestep shock, but aftereffects persist through the confidence/panic model |

**Behavioural cascade:**
1. Shocked agents' confidence collapses to ~30% of prior value (floor 0.05)
2. Force-panicked agents immediately attempt full redemption
3. Redemption cap (1% of reserve) creates a bottleneck → unfulfilled demand
4. Unfulfilled redemptions feed back into redemption_success_rate = 0 or near-0
5. Low redemption success rate further erodes confidence for *all* agents next timestep
6. Spiral continues until mean-reversion and holding-time signals stabilise confidence

**Psychological insight:** Models a classic bank run where fear is contagious. The redemption cap is the circuit breaker — it prevents instant collapse but creates a queue that itself generates anxiety.

---

### 5.2 Whale Dump (`whale_dump`)

| Property | Value |
|---|---|
| **Trigger** | Fixed timestep (month 16 in default scenario) |
| **Mechanism** | Exogenous redemption request equal to 15% of current supply. Not an actual tracked agent — modelled as a synthetic sell order |
| **Constraint** | Only effective if exchange is open; capped by 1% of reserve |

**Behavioural effects:**
1. Massive desired-but-unfulfilled redemptions → poor redemption_success_rate
2. Reserve drain (limited by cap) → lower backing ratio → lower exchange rate
3. Lower exchange rate → speculators lose confidence, may sell; or opportunistic speculators buy the dip
4. Confidence cascade via redemption failure signal

**Psychological insight:** Tests the system's resilience to concentration risk. A single large holder can create panic not through the volume they actually redeem (capped) but through the signal their *attempt* sends to the market.

---

### 5.3 Hypercert Crash / Recovery (`hypercert_crash`, `hypercert_recovery`)

| Property | Value |
|---|---|
| **Intended duration** | Month 12–18 (crash period), recovery at month 18 |
| **Implemented reality** | Single-month shock at month 12 only; month 18 recovery is a no-op |
| **Mechanism** | Sets `hypercert_sale_prob` from 3.0 (base) to 0.01 — effectively kills external market sales |

**Behavioural effects:**
1. External hypercert sales dry up → reserve stops receiving fiat from this channel
2. Community purchases (impact buyers, high-confidence contributors) remain possible but rare
3. Without new fiat inflow, backing ratio and exchange rate stagnate or decline
4. Declining exchange rate erodes confidence and acceptance willingness
5. Contributors produce fewer issues, merchants accept less $CC

**Psychological insight:** Models external market failure (e.g., impact investment downturn). Reveals whether the system can survive on internal conviction (community purchases) alone when external validation disappears.

---

### 5.4 Fraud Wave (`fraud_wave`, `fraud_wave_end`)

| Property | Value |
|---|---|
| **Intended duration** | Month 8–14 |
| **Implemented reality** | Single-month shock at month 8 only |
| **Mechanism** | Drops `verification_quality` from 0.9 to 0.5 → fraud success rate rises from 10% to 50% |

**Behavioural effects:**
1. Fraudulent minting surges — fraud_minting can exceed 10% of work_minting
2. Additional supply without corresponding value creation → inflationary pressure
3. Dilutes backing ratio → exchange rate drops
4. Legitimate contributors' rewards buy less real value → potential disengagement

**Psychological insight:** Tests the immune system. Fraud doesn't directly erode confidence (agents don't "see" fraud), but its inflationary side effects indirectly damage confidence through exchange rate decline.

---

### 5.5 Demurrage Evasion (`demurrage_evasion`, `demurrage_evasion_end`)

| Property | Value |
|---|---|
| **Intended effect** | 20% of agents evade demurrage via circular transfers (month 10–20) |
| **Implemented reality** | ⚠️ **Likely non-functional.** Event sets `_demurrage_evasion_pct` in per-step policy params, but `update_agents()` reads from `_params` (global base params), where the key is never set by the event system |

**Intended behavioural effects (if fixed):**
1. Evading agents accumulate more $CC than peers → inequality grows
2. Demurrage's anti-hoarding function is weakened → velocity drops
3. Supply decays slower than designed → inflationary overhang

---

### 5.6 Stagnation (`stagnation`, `stagnation_end`)

| Property | Value |
|---|---|
| **Intended duration** | Month 15–24 |
| **Implemented reality** | Single-month shock at month 15 only |
| **Mechanism** | `growth_rate = 0`, `issues_per_user_month × 0.3` |

**Behavioural effects:**
1. No new users join → network stops growing
2. Issue creation rate drops to 30% of base (further reduced by dynamic saturation)
3. Less minting → less work_minting → activity_level erodes for contributors
4. Fewer active agents → merchant_density declines → acceptance_willingness falls
5. Spiral: less willingness → less work → less minting → lower exchange rate → lower confidence

**Psychological insight:** Models platform fatigue or external competition. Tests whether the existing community's intrinsic motivation and holding comfort can sustain the system without fresh blood.

---

### 5.7 CC Inflation / Compounding Inflation (`compounding_inflation`, `compounding_inflation_end`)

| Property | Value |
|---|---|
| **Duration** | Month 3–14 (12 months), **truly persistent** — helper generates per-month events |
| **Mechanism** | `reward_per_issue = base_reward × (1 + 0.10)^months_elapsed` |

**Behavioural effects:**
1. Reward per issue grows ~10%/month → by month 14, reward is ~3.1× baseline
2. Massive supply inflation without proportional reserve growth
3. Demurrage (1%/month) is insufficient to counteract 10%/month reward inflation
4. Backing ratio collapses → exchange rate drops
5. Fraudsters also benefit proportionally (fraud amount scales with reward)
6. Tests whether demurrage can serve as an automatic inflation brake (it cannot at 10%/month)

**Psychological insight:** Models governance failure — rewards are set too generously. Reveals the system's sensitivity to the reward-to-demurrage ratio and whether market signals (declining exchange rate) naturally reduce participation before hyperinflation sets in.

---

### 5.8 Growth Spike (`growth_spike`, `growth_spike_end`)

| Property | Value |
|---|---|
| **Availability** | Defined as an event type but **not used** in any current scenario |
| **Mechanism** | `growth_rate = base × multiplier` (default 3×) |

**Intended behavioural effects:**
1. Surge of new users → rapid community expansion
2. New users in growth/maturity phase have lower intrinsic motivation
3. More agents → more issue demand → higher minting → supply pressure
4. But also more potential merchants → higher merchant_density → higher acceptance willingness
5. Tests whether the system can absorb rapid scaling

---

### 5.9 Inflation Spike (`inflation_spike`)

| Property | Value |
|---|---|
| **Availability** | Defined as an event type but **not used** in current scenarios |
| **Mechanism** | `reward_per_issue = base × 2.0` for one timestep |

---

## 6. System-Level Mechanisms

### 6.1 Exchange Gating & Redemption Cap

All redemptions require:
- Phase is NOT Bootstrap
- Reserve ≥ $100,000

Even when open, actual redemptions per timestep are capped at **1% of reserve**. This is the system's primary circuit breaker against bank runs.

**Unfulfilled redemptions** are logged in a redemption queue (entries expire after 3 months). The queue is informational only — unfulfilled demand is *not* automatically processed later.

### 6.2 Demurrage

All balances decay by `demurrage_rate` (default 1%) per timestep. Applied to both individual agent balances and total supply. Serves three purposes:
1. Anti-hoarding incentive (encourages circulation)
2. Passive inflation control (burns supply)
3. Wealth decay (balances converge toward zero without active participation)

### 6.3 Dynamic Issue Rate (Platform Saturation)

Issue creation rate declines as the platform matures:
```
effective_pool = total_issues ^ 0.85   (sublinear: old issues lose relevance)
saturation = effective_pool / (n_active_users × issues_per_user_target)
rate = base_rate × (1 - saturation × 0.95)   (floor: 5% of base)
```

**Rationale:** Early platforms have few issues → everyone creates their own. As the pool grows, existing issues satisfy user needs → fewer new issues are needed.

### 6.4 Hypercert Sales (Dual Channel)

**External market sales:**
- Probability scales with platform attractiveness = `network_scale × (0.1 + 0.9 × track_record)`
- Price scales with maturity and track record (lognormal variation)
- No sales in first 5 months
- Brings fiat into the reserve

**Community purchases:**
- Impact buyers (confidence > 0.4) or contributors (confidence > 0.7)
- Capped at 1 per month
- Also bring fiat into the reserve
- **Do not deduct from agent CC balances** — modelled as exogenous fiat investment

### 6.5 Phase Transitions

| Phase | Condition | Meaning |
|---|---|---|
| Bootstrap | total_minted < 100,000 | No exchange, no redemptions. Building initial supply |
| Growth | total_minted ≥ 100,000 AND reserve < r_target | Exchange opens when reserve ≥ 100k. Active growth period |
| Maturity | reserve ≥ r_target (default $1M) | Full backing target achieved |

### 6.6 Exchange Rate

```
backing_ratio = reserve / supply
r_ratio = min(reserve / r_target, 1.0)
exchange_rate = backing_ratio + (1 - backing_ratio) × r_ratio²
```

At full backing, exchange rate approaches 1.0. Below target, it blends actual backing with a "trust premium" from reserve progress.
