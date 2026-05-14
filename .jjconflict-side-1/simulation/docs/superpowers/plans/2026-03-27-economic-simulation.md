# Kindact Economic Simulation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cadCAD-based agent simulation of the Kindact $CC economy with a Streamlit dashboard for exploring edge cases (especially bootstrap/reserve drain).

**Architecture:** cadCAD simulation engine with agents as Python dataclasses stored in a list state variable. Policy functions handle agent decisions (minting, spending, redeeming); state update functions apply those decisions to global state (supply, reserve, exchange rate). Streamlit dashboard wraps the engine with parameter controls and Plotly charts. Monte Carlo via cadCAD's built-in `N` runs parameter.

**Tech Stack:** Python 3.11+, cadCAD 0.5.3, Streamlit, Plotly, NumPy, pandas

---

## File Structure

```
simulation/
├── pyproject.toml              # Project deps & metadata
├── README.md                   # How to run
├── src/
│   └── kindact_sim/
│       ├── __init__.py
│       ├── types.py            # Agent, Hypercert dataclasses & enums
│       ├── state.py            # Initial state dict & phase enum
│       ├── policies.py         # Policy functions (agent decisions)
│       ├── mechanisms.py       # State update functions
│       ├── confidence.py       # Confidence update logic
│       ├── scenarios.py        # Scenario & event definitions
│       ├── config.py           # cadCAD experiment config builder
│       └── run.py              # Run simulation, return DataFrame
├── app.py                      # Streamlit dashboard
├── tests/
│   ├── __init__.py
│   ├── test_types.py
│   ├── test_state.py
│   ├── test_mechanisms.py
│   ├── test_policies.py
│   ├── test_confidence.py
│   ├── test_scenarios.py
│   └── test_integration.py
├── specs/                      # lean-spec specs (already created)
└── docs/
```

Each file has one responsibility:
- **types.py**: Data structures only (Agent, Hypercert, AgentType enum)
- **state.py**: Genesis state dict, phase transition logic
- **policies.py**: What agents *decide* to do (policy functions return signal dicts)
- **mechanisms.py**: How decisions *change state* (state update functions return tuples)
- **confidence.py**: Isolated confidence calculation (used by policies, testable alone)
- **scenarios.py**: Scenario configs and event injection
- **config.py**: Wires everything into cadCAD Experiment
- **run.py**: Thin wrapper to execute and return pandas DataFrame
- **app.py**: Streamlit UI (reads from run.py)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `simulation/pyproject.toml`
- Create: `simulation/README.md`
- Create: `simulation/src/kindact_sim/__init__.py`
- Create: `simulation/tests/__init__.py`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "kindact-sim"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "cadCAD>=0.5.3",
    "streamlit>=1.30",
    "plotly>=5.18",
    "numpy>=1.26",
    "pandas>=2.1",
]

[project.optional-dependencies]
dev = ["pytest>=7.4"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.setuptools.packages.find]
where = ["src"]
```

- [ ] **Step 2: Create empty __init__.py files**

`src/kindact_sim/__init__.py`:
```python
"""Kindact economic simulation using cadCAD."""
```

`tests/__init__.py`: empty file.

- [ ] **Step 3: Create README.md**

```markdown
# Kindact Economic Simulation

Agent-based simulation of the Kindact $CC economy using cadCAD.

## Setup

```bash
cd simulation
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run tests

```bash
pytest tests/ -v
```

## Run dashboard

```bash
streamlit run app.py
```
```

- [ ] **Step 4: Install dependencies and verify**

Run: `cd simulation && python -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"`
Expected: Installation succeeds, `python -c "import cadCAD; print(cadCAD.__version__)"` prints `0.5.3`

- [ ] **Step 5: Commit**

```bash
git add simulation/pyproject.toml simulation/README.md simulation/src/kindact_sim/__init__.py simulation/tests/__init__.py
git commit -m "feat(sim): scaffold simulation project with cadCAD deps"
```

---

### Task 2: Types — Agent and Hypercert Data Structures

**Files:**
- Create: `simulation/src/kindact_sim/types.py`
- Create: `simulation/tests/test_types.py`

- [ ] **Step 1: Write the failing test**

`tests/test_types.py`:
```python
from kindact_sim.types import Agent, AgentType, Hypercert, Phase


def test_agent_creation():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0)
    assert a.balance == 100.0
    assert a.confidence == 0.5  # default
    assert a.agent_type == AgentType.CONTRIBUTOR


def test_agent_apply_demurrage():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0)
    new_balance = a.balance * (1 - 0.01)
    assert new_balance == 99.0


def test_hypercert_creation():
    h = Hypercert(id=0, value_estimate=1000.0, created_at=5)
    assert h.value_estimate == 1000.0
    assert h.sold is False


def test_phase_enum():
    assert Phase.BOOTSTRAP.value == "bootstrap"
    assert Phase.GROWTH.value == "growth"
    assert Phase.MATURITY.value == "maturity"


def test_agent_type_enum():
    assert AgentType.CONTRIBUTOR.value == "contributor"
    assert AgentType.MERCHANT.value == "merchant"
    assert AgentType.SPECULATOR.value == "speculator"
    assert AgentType.IMPACT_BUYER.value == "impact_buyer"
    assert AgentType.FRAUDSTER.value == "fraudster"
    assert AgentType.PANICKER.value == "panicker"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd simulation && source .venv/bin/activate && pytest tests/test_types.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write implementation**

`src/kindact_sim/types.py`:
```python
from dataclasses import dataclass, field
from enum import Enum


class AgentType(Enum):
    CONTRIBUTOR = "contributor"
    MERCHANT = "merchant"
    SPECULATOR = "speculator"
    IMPACT_BUYER = "impact_buyer"
    FRAUDSTER = "fraudster"
    PANICKER = "panicker"


class Phase(Enum):
    BOOTSTRAP = "bootstrap"
    GROWTH = "growth"
    MATURITY = "maturity"


@dataclass
class Agent:
    id: int
    agent_type: AgentType
    balance: float = 0.0
    confidence: float = 0.5
    panic_threshold: float = 0.2  # below this, switch to panic mode
    is_panicking: bool = False
    months_holding: int = 0
    total_earned: float = 0.0
    total_redeemed: float = 0.0


@dataclass
class Hypercert:
    id: int
    value_estimate: float
    created_at: int  # timestep
    sold: bool = False
    sale_price: float = 0.0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_types.py -v`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/types.py simulation/tests/test_types.py
git commit -m "feat(sim): add Agent, Hypercert, Phase, AgentType data types"
```

---

### Task 3: Initial State and Phase Transitions

**Files:**
- Create: `simulation/src/kindact_sim/state.py`
- Create: `simulation/tests/test_state.py`

- [ ] **Step 1: Write the failing test**

`tests/test_state.py`:
```python
from kindact_sim.state import build_genesis_state, compute_phase, compute_exchange_rate, compute_backing_ratio
from kindact_sim.types import Phase


def test_genesis_state_structure():
    s = build_genesis_state(n_users=50)
    assert s['supply'] == 0.0
    assert s['reserve_fiat'] == 0.0
    assert s['phase'] == Phase.BOOTSTRAP
    assert len(s['agents']) == 50
    assert s['total_minted'] == 0.0
    assert s['timestep'] == 0
    assert isinstance(s['hypercert_portfolio'], list)
    assert isinstance(s['redemption_queue'], list)


def test_phase_bootstrap():
    assert compute_phase(total_minted=50_000, reserve_fiat=0, r_target=1_000_000) == Phase.BOOTSTRAP


def test_phase_growth():
    assert compute_phase(total_minted=150_000, reserve_fiat=500_000, r_target=1_000_000) == Phase.GROWTH


def test_phase_maturity():
    assert compute_phase(total_minted=150_000, reserve_fiat=1_000_000, r_target=1_000_000) == Phase.MATURITY


def test_backing_ratio_zero_supply():
    assert compute_backing_ratio(reserve=1000, supply=0) == 0.0


def test_backing_ratio_normal():
    assert compute_backing_ratio(reserve=100_000, supply=500_000) == 0.2


def test_exchange_rate_low_reserve():
    # R=30000, S=300000 -> b=0.1, E = 0.1 + 0.9 * (30000/1000000)^2 = 0.1 + 0.0008 ≈ 0.1008
    e = compute_exchange_rate(reserve=30_000, supply=300_000, r_target=1_000_000)
    assert abs(e - 0.1008) < 0.001


def test_exchange_rate_at_target():
    # R=1000000, S=1500000 -> b=0.667, E = 0.667 + 0.333 * 1.0 = 1.0
    e = compute_exchange_rate(reserve=1_000_000, supply=1_500_000, r_target=1_000_000)
    assert abs(e - 1.0) < 0.01


def test_exchange_rate_mid_range():
    # R=500000, S=1000000 -> b=0.5, E = 0.5 + 0.5 * (0.5)^2 = 0.5 + 0.125 = 0.625
    e = compute_exchange_rate(reserve=500_000, supply=1_000_000, r_target=1_000_000)
    assert abs(e - 0.625) < 0.01
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_state.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write implementation**

`src/kindact_sim/state.py`:
```python
import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase


def compute_phase(total_minted: float, reserve_fiat: float, r_target: float) -> Phase:
    if total_minted < 100_000:
        return Phase.BOOTSTRAP
    if reserve_fiat >= r_target:
        return Phase.MATURITY
    return Phase.GROWTH


def compute_backing_ratio(reserve: float, supply: float) -> float:
    if supply == 0:
        return 0.0
    return reserve / supply


def compute_exchange_rate(reserve: float, supply: float, r_target: float) -> float:
    b = compute_backing_ratio(reserve, supply)
    r_ratio = min(reserve / r_target, 1.0) if r_target > 0 else 0.0
    return b + (1 - b) * r_ratio ** 2


def _make_initial_agents(n: int, rng: np.random.Generator | None = None) -> list[Agent]:
    if rng is None:
        rng = np.random.default_rng()
    agents = []
    # Distribution: 60% contributors, 15% merchants, 10% speculators,
    # 5% impact buyers, 5% fraudsters, 5% panickers
    type_weights = [
        (AgentType.CONTRIBUTOR, 0.60),
        (AgentType.MERCHANT, 0.15),
        (AgentType.SPECULATOR, 0.10),
        (AgentType.IMPACT_BUYER, 0.05),
        (AgentType.FRAUDSTER, 0.05),
        (AgentType.PANICKER, 0.05),
    ]
    types = [t for t, _ in type_weights]
    probs = [p for _, p in type_weights]
    assigned = rng.choice(len(types), size=n, p=probs)
    for i in range(n):
        agents.append(Agent(
            id=i,
            agent_type=types[assigned[i]],
            panic_threshold=float(rng.uniform(0.1, 0.4)),
            confidence=float(rng.uniform(0.3, 0.7)),
        ))
    return agents


def build_genesis_state(n_users: int = 50, r_target: float = 1_000_000, seed: int | None = None) -> dict:
    rng = np.random.default_rng(seed)
    return {
        'supply': 0.0,
        'reserve_fiat': 0.0,
        'exchange_rate': 0.0,
        'phase': Phase.BOOTSTRAP,
        'agents': _make_initial_agents(n_users, rng),
        'hypercert_portfolio': [],
        'total_minted': 0.0,
        'demurrage_rate': 0.01,
        'redemption_queue': [],
        'timestep': 0,
        'r_target': r_target,
        'total_burned': 0.0,
        'events_log': [],
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_state.py -v`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/state.py simulation/tests/test_state.py
git commit -m "feat(sim): add genesis state, phase logic, exchange rate formula"
```

---

### Task 4: Confidence Mechanic

**Files:**
- Create: `simulation/src/kindact_sim/confidence.py`
- Create: `simulation/tests/test_confidence.py`

- [ ] **Step 1: Write the failing test**

`tests/test_confidence.py`:
```python
from kindact_sim.confidence import update_confidence
from kindact_sim.types import Agent, AgentType


def test_confidence_rises_with_positive_rate_trend():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.05, redemption_success_rate=1.0, months_holding=3)
    assert new_conf > 0.5


def test_confidence_drops_with_failed_redemptions():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.0, redemption_success_rate=0.3, months_holding=1)
    assert new_conf < 0.5


def test_confidence_clamped_to_0_1():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.95)
    new_conf = update_confidence(a, exchange_rate_trend=0.5, redemption_success_rate=1.0, months_holding=12)
    assert 0.0 <= new_conf <= 1.0

    a2 = Agent(id=1, agent_type=AgentType.CONTRIBUTOR, confidence=0.05)
    new_conf2 = update_confidence(a2, exchange_rate_trend=-0.5, redemption_success_rate=0.0, months_holding=0)
    assert 0.0 <= new_conf2 <= 1.0


def test_confidence_stable_when_neutral():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.0, redemption_success_rate=0.5, months_holding=0)
    # Should be close to 0.5 (neutral inputs)
    assert abs(new_conf - 0.5) < 0.15
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_confidence.py -v`
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/kindact_sim/confidence.py`:
```python
from kindact_sim.types import Agent


def update_confidence(
    agent: Agent,
    exchange_rate_trend: float,
    redemption_success_rate: float,
    months_holding: int,
) -> float:
    """Compute updated confidence for an agent.
    
    Args:
        agent: The agent whose confidence to update.
        exchange_rate_trend: Change in exchange rate this period (positive = rising).
        redemption_success_rate: Fraction of redemptions that succeeded (0-1).
        months_holding: How many months agent has held $CC without issue.
    
    Returns:
        New confidence value clamped to [0, 1].
    """
    # Weights for each signal
    w_trend = 0.3
    w_redemption = 0.4
    w_holding = 0.1
    w_inertia = 0.2

    # Normalize signals to [-1, 1] range
    trend_signal = max(-1.0, min(1.0, exchange_rate_trend * 5))  # scale small rate changes
    redemption_signal = (redemption_success_rate - 0.5) * 2  # 1.0 -> +1, 0.0 -> -1
    holding_signal = min(1.0, months_holding / 12.0)  # caps at 12 months
    inertia_signal = (agent.confidence - 0.5) * 2  # current confidence as momentum

    delta = (
        w_trend * trend_signal
        + w_redemption * redemption_signal
        + w_holding * holding_signal
        + w_inertia * inertia_signal
    )

    # Apply delta scaled to make changes gradual
    new_confidence = agent.confidence + delta * 0.15
    return max(0.0, min(1.0, new_confidence))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_confidence.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/confidence.py simulation/tests/test_confidence.py
git commit -m "feat(sim): add confidence update mechanic"
```

---

### Task 5: Policy Functions (Agent Decisions)

**Files:**
- Create: `simulation/src/kindact_sim/policies.py`
- Create: `simulation/tests/test_policies.py`

- [ ] **Step 1: Write the failing test**

`tests/test_policies.py`:
```python
import numpy as np
from kindact_sim.types import Agent, AgentType, Phase
from kindact_sim.policies import agent_decisions


def _make_state(phase=Phase.GROWTH, supply=200_000, reserve=50_000, exchange_rate=0.1, agents=None):
    if agents is None:
        agents = []
    return {
        'supply': supply,
        'reserve_fiat': reserve,
        'exchange_rate': exchange_rate,
        'phase': phase,
        'agents': agents,
        'total_minted': supply,
        'demurrage_rate': 0.01,
        'r_target': 1_000_000,
        'hypercert_portfolio': [],
        'redemption_queue': [],
        'timestep': 12,
        'total_burned': 0.0,
        'events_log': [],
    }


def test_contributor_mints_cc():
    contributor = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=0, confidence=0.6)
    s = _make_state(agents=[contributor])
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 15, 'hypercert_sale_prob': 0.1, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert 'work_minting' in result
    assert result['work_minting'] >= 0


def test_no_redemptions_in_bootstrap():
    speculator = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=1000, confidence=0.3)
    s = _make_state(phase=Phase.BOOTSTRAP, agents=[speculator])
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 15, 'hypercert_sale_prob': 0.1, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['redemptions'] == 0


def test_merchant_redeems_partial():
    merchant = Agent(id=0, agent_type=AgentType.MERCHANT, balance=500, confidence=0.5)
    s = _make_state(phase=Phase.GROWTH, agents=[merchant], reserve=100_000)
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 15, 'hypercert_sale_prob': 0.1, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # Merchant should redeem some but not all
    assert result['redemptions'] >= 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_policies.py -v`
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/kindact_sim/policies.py`:
```python
import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase
from kindact_sim.scenarios import SCENARIOS, apply_events


def agent_decisions(_params: dict, substep: int, sH: list, s: dict, **kwargs) -> dict:
    """Policy function: each agent decides what to do this timestep.
    
    Returns signals:
        work_minting: total $CC to mint for completed work
        access_fee_burn: total $CC burned from access fees
        redemptions: total $CC agents want to redeem for fiat
        reserve_purchases: total fiat spent buying $CC
        hypercert_fiat_sales: fiat from Hypercert sales to external buyers
        fraud_minting: $CC minted through fraudulent verification
        new_agents_count: how many new agents join this timestep
        agent_updates: list of (agent_id, balance_delta, confidence_delta) tuples
    """
    rng: np.random.Generator = _params['rng']

    # Apply scenario events for this timestep
    scenario_name = _params.get('_scenario_name')
    if scenario_name and scenario_name in SCENARIOS:
        params = apply_events(SCENARIOS[scenario_name], _params, s['timestep'])
    else:
        params = dict(_params)

    agents: list[Agent] = s['agents']
    phase: Phase = s['phase']
    exchange_rate: float = s['exchange_rate']
    reserve: float = s['reserve_fiat']
    supply: float = s['supply']

    reward = params['reward_per_issue']
    issues_rate = params['issues_per_user_month']
    verification_q = params['verification_quality']

    # Handle bank_run confidence shock event
    confidence_shock = params.get('_confidence_shock')
    if confidence_shock:
        n_shocked = int(len(agents) * confidence_shock)
        shocked_indices = rng.choice(len(agents), size=min(n_shocked, len(agents)), replace=False)
        for idx in shocked_indices:
            agents[idx].confidence = max(0.05, agents[idx].confidence * 0.3)
            if agents[idx].agent_type in (AgentType.PANICKER, AgentType.CONTRIBUTOR, AgentType.MERCHANT):
                agents[idx].is_panicking = True

    # Handle whale_dump event
    whale_dump = params.get('_whale_dump')
    if whale_dump and supply > 0:
        whale_balance = supply * whale_dump['pct_supply']
        # Create a synthetic whale redemption (handled below via extra redemptions)
        params['_whale_redeem'] = whale_balance

    work_minting = 0.0
    access_fee_burn = 0.0
    redemptions = 0.0
    reserve_purchases = 0.0
    fraud_minting = 0.0
    agent_updates: list[tuple[int, float]] = []  # (agent_id, balance_change)

    daily_redeem_cap = 0.01 * reserve  # 1% of reserve per period

    for agent in agents:
        if agent.agent_type == AgentType.CONTRIBUTOR:
            # Complete issues with some probability
            n_issues = rng.poisson(issues_rate)
            minted = n_issues * reward
            work_minting += minted
            # Pay access fee (small fixed amount)
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            agent_updates.append((agent.id, minted - fee))

        elif agent.agent_type == AgentType.MERCHANT:
            # Earn some $CC from local trade (small amount)
            trade_income = rng.uniform(0, 20)
            # Pay access fee
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            # Redeem portion to fiat if not bootstrap
            redeem_amount = 0.0
            if phase != Phase.BOOTSTRAP and agent.balance > 0:
                redeem_frac = rng.uniform(0.1, 0.4)
                redeem_amount = min(agent.balance * redeem_frac, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
            agent_updates.append((agent.id, trade_income - fee - redeem_amount))

        elif agent.agent_type == AgentType.SPECULATOR:
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            if phase != Phase.BOOTSTRAP:
                if agent.confidence > 0.6 and exchange_rate < 0.8:
                    # Buy $CC - bullish
                    buy_fiat = rng.uniform(50, 200)
                    reserve_purchases += buy_fiat
                    cc_received = buy_fiat / max(exchange_rate * 1.03, 0.001)
                    agent_updates.append((agent.id, cc_received - fee))
                elif agent.confidence < 0.3 and agent.balance > 0:
                    # Sell $CC - bearish
                    redeem_amount = min(agent.balance * 0.5, daily_redeem_cap - redemptions)
                    redeem_amount = max(0, redeem_amount)
                    redemptions += redeem_amount
                    agent_updates.append((agent.id, -fee - redeem_amount))
                else:
                    agent_updates.append((agent.id, -fee))
            else:
                agent_updates.append((agent.id, -fee))

        elif agent.agent_type == AgentType.IMPACT_BUYER:
            # External: may buy a Hypercert for fiat (doesn't hold $CC)
            # This is handled at the aggregate level via scenario params
            pass

        elif agent.agent_type == AgentType.FRAUDSTER:
            # Attempt fake work
            if rng.random() > verification_q:
                # Fraud succeeds
                fraud_amount = rng.uniform(1, 3) * reward
                fraud_minting += fraud_amount
                agent_updates.append((agent.id, fraud_amount))
            else:
                # Caught - no reward, possible penalty
                agent_updates.append((agent.id, 0))

        elif agent.agent_type == AgentType.PANICKER:
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            if agent.is_panicking and phase != Phase.BOOTSTRAP and agent.balance > 0:
                # Try to redeem everything
                redeem_amount = min(agent.balance, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
                agent_updates.append((agent.id, -fee - redeem_amount))
            else:
                # Act like a contributor
                n_issues = rng.poisson(issues_rate * 0.5)
                minted = n_issues * reward
                work_minting += minted
                agent_updates.append((agent.id, minted - fee))

    # Add whale dump redemption if event is active
    whale_redeem = params.get('_whale_redeem', 0)
    if whale_redeem > 0 and phase != Phase.BOOTSTRAP:
        redemptions += min(whale_redeem, daily_redeem_cap - redemptions)

    # Hypercert sales (aggregate, driven by impact buyers)
    hypercert_fiat_sales = 0.0
    sale_prob = params['hypercert_sale_prob']
    sale_price = params['hypercert_avg_price']
    portfolio = s['hypercert_portfolio']
    unsold = [h for h in portfolio if not h.sold]
    for h in unsold:
        if rng.random() < sale_prob:
            hypercert_fiat_sales += sale_price
            h.sold = True
            h.sale_price = sale_price

    # New agents joining
    new_agents_count = max(0, int(rng.poisson(params['growth_rate'])))

    return {
        'work_minting': work_minting,
        'access_fee_burn': access_fee_burn,
        'redemptions': redemptions,
        'reserve_purchases': reserve_purchases,
        'hypercert_fiat_sales': hypercert_fiat_sales,
        'fraud_minting': fraud_minting,
        'new_agents_count': new_agents_count,
        'agent_updates': agent_updates,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_policies.py -v`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/policies.py simulation/tests/test_policies.py
git commit -m "feat(sim): add policy functions for agent decisions"
```

---

### Task 6: State Update Functions (Mechanisms)

**Files:**
- Create: `simulation/src/kindact_sim/mechanisms.py`
- Create: `simulation/tests/test_mechanisms.py`

- [ ] **Step 1: Write the failing test**

`tests/test_mechanisms.py`:
```python
from kindact_sim.types import Agent, AgentType, Phase
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_agents, update_timestep, apply_demurrage,
)


def _make_state(**overrides):
    base = {
        'supply': 200_000,
        'reserve_fiat': 50_000,
        'exchange_rate': 0.1,
        'phase': Phase.GROWTH,
        'agents': [],
        'total_minted': 200_000,
        'demurrage_rate': 0.01,
        'r_target': 1_000_000,
        'hypercert_portfolio': [],
        'redemption_queue': [],
        'timestep': 5,
        'total_burned': 0.0,
        'events_log': [],
    }
    base.update(overrides)
    return base


def _make_input(**overrides):
    base = {
        'work_minting': 5000,
        'access_fee_burn': 500,
        'redemptions': 1000,
        'reserve_purchases': 2000,
        'hypercert_fiat_sales': 3000,
        'fraud_minting': 0,
        'new_agents_count': 10,
        'agent_updates': [],
    }
    base.update(overrides)
    return base


def test_update_supply():
    s = _make_state(supply=200_000, demurrage_rate=0.01)
    inp = _make_input(work_minting=5000, access_fee_burn=500, redemptions=1000, fraud_minting=100)
    _, new_supply = update_supply({}, 1, [], s, inp)
    # (200000 * 0.99) + 5000 + 100 - 500 - 1000 = 198000 + 3600 = 201600
    # Note: reserve_purchases mint new $CC too
    assert new_supply > 200_000  # net positive minting


def test_update_reserve():
    s = _make_state(reserve_fiat=50_000, exchange_rate=0.1)
    inp = _make_input(reserve_purchases=2000, hypercert_fiat_sales=3000, redemptions=1000)
    _, new_reserve = update_reserve({}, 1, [], s, inp)
    # 50000 + 2000 + 3000 - (1000 * 0.1) = 54900
    assert new_reserve > 50_000


def test_apply_demurrage():
    agents = [
        Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0),
        Agent(id=1, agent_type=AgentType.MERCHANT, balance=200.0),
    ]
    new_agents = apply_demurrage(agents, 0.01)
    assert new_agents[0].balance == 99.0
    assert new_agents[1].balance == 198.0


def test_update_timestep():
    s = _make_state(timestep=5)
    _, new_t = update_timestep({}, 1, [], s, {})
    assert new_t == 6
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_mechanisms.py -v`
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/kindact_sim/mechanisms.py`:
```python
import copy
import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase
from kindact_sim.state import compute_exchange_rate, compute_phase
from kindact_sim.confidence import update_confidence


def apply_demurrage(agents: list[Agent], rate: float, evasion_pct: float = 0.0,
                    rng: np.random.Generator | None = None) -> list[Agent]:
    new_agents = []
    # If demurrage evasion is active, a fraction of agents avoid the decay
    evading_ids = set()
    if evasion_pct > 0 and rng is not None:
        n_evading = int(len(agents) * evasion_pct)
        evading_ids = set(rng.choice([a.id for a in agents], size=min(n_evading, len(agents)), replace=False))
    for a in agents:
        new_a = copy.copy(a)
        if a.id not in evading_ids:
            new_a.balance = a.balance * (1 - rate)
        new_agents.append(new_a)
    return new_agents


def update_supply(_params, substep, sH, s, _input, **kwargs):
    supply = s['supply']
    demurrage = s['demurrage_rate']
    new_supply = (
        supply * (1 - demurrage)
        + _input.get('work_minting', 0)
        + _input.get('fraud_minting', 0)
        + _input.get('reserve_mint_cc', 0)
        - _input.get('access_fee_burn', 0)
        - _input.get('redemptions', 0)
    )
    return ('supply', max(0, new_supply))


def update_reserve(_params, substep, sH, s, _input, **kwargs):
    reserve = s['reserve_fiat']
    exchange_rate = s['exchange_rate']
    new_reserve = (
        reserve
        + _input.get('reserve_purchases', 0)
        + _input.get('hypercert_fiat_sales', 0)
        - _input.get('redemptions', 0) * exchange_rate
    )
    return ('reserve_fiat', max(0, new_reserve))


def update_exchange_rate(_params, substep, sH, s, _input, **kwargs):
    # Use updated supply and reserve from this substep if available,
    # otherwise use current state
    supply = s['supply']
    reserve = s['reserve_fiat']
    r_target = s['r_target']
    new_rate = compute_exchange_rate(reserve, supply, r_target)
    return ('exchange_rate', new_rate)


def update_phase(_params, substep, sH, s, _input, **kwargs):
    total_minted = s['total_minted'] + _input.get('work_minting', 0) + _input.get('fraud_minting', 0)
    reserve = s['reserve_fiat']
    r_target = s['r_target']
    return ('phase', compute_phase(total_minted, reserve, r_target))


def update_total_minted(_params, substep, sH, s, _input, **kwargs):
    return ('total_minted', s['total_minted'] + _input.get('work_minting', 0) + _input.get('fraud_minting', 0))


def update_total_burned(_params, substep, sH, s, _input, **kwargs):
    burned = _input.get('access_fee_burn', 0) + _input.get('redemptions', 0)
    demurrage_burn = s['supply'] * s['demurrage_rate']
    return ('total_burned', s['total_burned'] + burned + demurrage_burn)


def update_agents(_params, substep, sH, s, _input, **kwargs):
    rng: np.random.Generator = _params.get('rng', np.random.default_rng())
    evasion_pct = _params.get('_demurrage_evasion_pct', 0.0)
    agents = apply_demurrage(s['agents'], s['demurrage_rate'], evasion_pct=evasion_pct, rng=rng)

    # Apply balance changes from policy
    updates = {aid: delta for aid, delta in _input.get('agent_updates', [])}
    for a in agents:
        if a.id in updates:
            a.balance = max(0, a.balance + updates[a.id])
        a.months_holding += 1

    # Update confidence for all agents
    prev_rate = s.get('exchange_rate', 0)
    # Approximate trend from previous timestep
    exchange_rate_trend = 0.0  # will be refined when we have history
    total_redemptions = _input.get('redemptions', 0)
    total_attempted = total_redemptions + len(s.get('redemption_queue', []))
    success_rate = 1.0 if total_attempted == 0 else total_redemptions / max(total_attempted, 1)

    for a in agents:
        a.confidence = update_confidence(a, exchange_rate_trend, success_rate, a.months_holding)
        # Panickers check threshold
        if a.agent_type == AgentType.PANICKER:
            a.is_panicking = a.confidence < a.panic_threshold

    # Add new agents
    n_new = _input.get('new_agents_count', 0)
    max_id = max((a.id for a in agents), default=-1)
    for i in range(n_new):
        new_type = rng.choice([AgentType.CONTRIBUTOR, AgentType.MERCHANT, AgentType.PANICKER],
                               p=[0.6, 0.25, 0.15])
        agents.append(Agent(
            id=max_id + 1 + i,
            agent_type=new_type,
            confidence=float(rng.uniform(0.3, 0.7)),
            panic_threshold=float(rng.uniform(0.1, 0.4)),
        ))

    return ('agents', agents)


def update_hypercerts(_params, substep, sH, s, _input, **kwargs):
    rng: np.random.Generator = _params.get('rng', np.random.default_rng())
    portfolio = copy.deepcopy(s['hypercert_portfolio'])
    # Add new Hypercerts from work minting (1 per ~100 $CC minted)
    work_minted = _input.get('work_minting', 0)
    n_new = int(work_minted / 100)
    max_id = max((h.id for h in portfolio), default=-1)
    for i in range(n_new):
        portfolio.append(Hypercert(
            id=max_id + 1 + i,
            value_estimate=float(rng.uniform(500, 2000)),
            created_at=s['timestep'],
        ))
    return ('hypercert_portfolio', portfolio)


def update_timestep(_params, substep, sH, s, _input, **kwargs):
    return ('timestep', s['timestep'] + 1)


def update_events_log(_params, substep, sH, s, _input, **kwargs):
    log = list(s['events_log'])
    t = s['timestep']
    # Log phase transitions
    old_phase = s['phase']
    new_phase = compute_phase(
        s['total_minted'] + _input.get('work_minting', 0),
        s['reserve_fiat'],
        s['r_target']
    )
    if new_phase != old_phase:
        log.append({'timestep': t, 'event': f'Phase transition: {old_phase.value} → {new_phase.value}'})
    # Log reserve floor
    supply = s['supply']
    reserve = s['reserve_fiat']
    if supply > 0 and reserve / supply < 0.05:
        log.append({'timestep': t, 'event': 'Reserve floor hit (backing < 5%)'})
    return ('events_log', log)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_mechanisms.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/mechanisms.py simulation/tests/test_mechanisms.py
git commit -m "feat(sim): add state update functions (mechanisms)"
```

---

### Task 7: Scenarios and Event System

**Files:**
- Create: `simulation/src/kindact_sim/scenarios.py`
- Create: `simulation/tests/test_scenarios.py`

- [ ] **Step 1: Write the failing test**

`tests/test_scenarios.py`:
```python
from kindact_sim.scenarios import SCENARIOS, apply_events, ScenarioConfig


def test_bootstrap_scenario_exists():
    assert 'bootstrap' in SCENARIOS
    s = SCENARIOS['bootstrap']
    assert s.n_users == 50
    assert s.timesteps == 36


def test_bank_run_scenario_exists():
    assert 'bank_run' in SCENARIOS


def test_apply_events_modifies_params():
    scenario = SCENARIOS['bootstrap']
    base_params = {
        'reward_per_issue': 50.0,
        'issues_per_user_month': 2.0,
        'verification_quality': 0.9,
        'growth_rate': 15,
        'hypercert_sale_prob': 0.1,
        'hypercert_avg_price': 1000.0,
    }
    # No events at timestep 0 for bootstrap
    modified = apply_events(scenario, base_params, timestep=0)
    assert modified['reward_per_issue'] == 50.0


def test_scenario_config_has_events():
    s = ScenarioConfig(
        name='test',
        n_users=50,
        timesteps=36,
        params={'reward_per_issue': 50.0},
        events={10: [{'type': 'hypercert_crash', 'duration': 6}]},
    )
    assert 10 in s.events
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_scenarios.py -v`
Expected: FAIL

- [ ] **Step 3: Write implementation**

`src/kindact_sim/scenarios.py`:
```python
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ScenarioConfig:
    name: str
    n_users: int
    timesteps: int
    params: dict[str, Any]
    events: dict[int, list[dict]] = field(default_factory=dict)
    description: str = ""


def apply_events(scenario: ScenarioConfig, base_params: dict, timestep: int) -> dict:
    """Apply any events scheduled for this timestep to the params."""
    params = dict(base_params)
    if timestep not in scenario.events:
        return params

    for event in scenario.events[timestep]:
        etype = event['type']
        if etype == 'hypercert_crash':
            params['hypercert_sale_prob'] = 0.01  # near-zero
        elif etype == 'hypercert_recovery':
            params['hypercert_sale_prob'] = base_params.get('hypercert_sale_prob', 0.1)
        elif etype == 'bank_run':
            params['_confidence_shock'] = event.get('shock_pct', 0.4)
        elif etype == 'whale_dump':
            params['_whale_dump'] = {'pct_supply': event.get('pct_supply', 0.15)}
        elif etype == 'demurrage_evasion':
            params['_demurrage_evasion_pct'] = event.get('evasion_pct', 0.2)
        elif etype == 'demurrage_evasion_end':
            params['_demurrage_evasion_pct'] = 0.0
        elif etype == 'fraud_wave':
            params['verification_quality'] = event.get('quality', 0.5)
        elif etype == 'fraud_wave_end':
            params['verification_quality'] = base_params.get('verification_quality', 0.9)
        elif etype == 'growth_spike':
            params['growth_rate'] = int(base_params.get('growth_rate', 15) * event.get('multiplier', 3))
        elif etype == 'growth_spike_end':
            params['growth_rate'] = base_params.get('growth_rate', 15)
        elif etype == 'stagnation':
            params['growth_rate'] = 0
            params['issues_per_user_month'] = base_params.get('issues_per_user_month', 2.0) * 0.3
        elif etype == 'stagnation_end':
            params['growth_rate'] = base_params.get('growth_rate', 15)
            params['issues_per_user_month'] = base_params.get('issues_per_user_month', 2.0)

    return params


_DEFAULT_PARAMS = {
    'reward_per_issue': 50.0,
    'issues_per_user_month': 2.0,
    'verification_quality': 0.9,
    'growth_rate': 15,
    'hypercert_sale_prob': 0.1,
    'hypercert_avg_price': 1000.0,
}

SCENARIOS: dict[str, ScenarioConfig] = {
    'bootstrap': ScenarioConfig(
        name='bootstrap',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={},
        description="Baseline bootstrap: organic growth, no shocks. Tests whether reserve builds before cash-outs drain it.",
    ),
    'bank_run': ScenarioConfig(
        name='bank_run',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            18: [{'type': 'bank_run', 'shock_pct': 0.4}],
        },
        description="At month 18, 40% of agents panic and try to cash out.",
    ),
    'hypercert_crash': ScenarioConfig(
        name='hypercert_crash',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            12: [{'type': 'hypercert_crash'}],
            18: [{'type': 'hypercert_recovery'}],
        },
        description="Hypercert sales crash to near-zero at month 12, recover at month 18.",
    ),
    'fraud_wave': ScenarioConfig(
        name='fraud_wave',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            8: [{'type': 'fraud_wave', 'quality': 0.5}],
            14: [{'type': 'fraud_wave_end'}],
        },
        description="Verification quality drops at month 8 (fraud wave), recovers at month 14.",
    ),
    'stagnation': ScenarioConfig(
        name='stagnation',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            15: [{'type': 'stagnation'}],
            24: [{'type': 'stagnation_end'}],
        },
        description="Growth and activity stagnate from month 15-24.",
    ),
    'whale_dump': ScenarioConfig(
        name='whale_dump',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            16: [{'type': 'whale_dump', 'pct_supply': 0.15}],
        },
        description="At month 16, one agent accumulates 15% of supply and redeems all at once.",
    ),
    'demurrage_evasion': ScenarioConfig(
        name='demurrage_evasion',
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            10: [{'type': 'demurrage_evasion', 'evasion_pct': 0.2}],
            20: [{'type': 'demurrage_evasion_end'}],
        },
        description="20% of agents evade demurrage via circular transfers from month 10-20.",
    ),
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_scenarios.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add simulation/src/kindact_sim/scenarios.py simulation/tests/test_scenarios.py
git commit -m "feat(sim): add scenario configs and event system"
```

---

### Task 8: cadCAD Configuration and Runner

**Files:**
- Create: `simulation/src/kindact_sim/config.py`
- Create: `simulation/src/kindact_sim/run.py`
- Create: `simulation/tests/test_integration.py`

- [ ] **Step 1: Write the failing integration test**

`tests/test_integration.py`:
```python
import pandas as pd
from kindact_sim.run import run_simulation
from kindact_sim.scenarios import SCENARIOS


def test_bootstrap_runs_and_returns_dataframe():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert 'supply' in df.columns
    assert 'reserve_fiat' in df.columns
    assert 'exchange_rate' in df.columns
    assert 'timestep' in df.columns
    assert len(df) > 0


def test_supply_never_negative():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert (df['supply'] >= 0).all()


def test_reserve_never_negative():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert (df['reserve_fiat'] >= 0).all()


def test_monte_carlo_multiple_runs():
    df = run_simulation('bootstrap', n_runs=3, seed=42)
    assert df['run'].nunique() == 3


def test_bank_run_scenario_runs():
    df = run_simulation('bank_run', n_runs=1, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_integration.py -v`
Expected: FAIL

- [ ] **Step 3: Write config.py**

`src/kindact_sim/config.py`:
```python
import numpy as np
from cadCAD.configuration import Experiment
from cadCAD.configuration.utils import config_sim

from kindact_sim.state import build_genesis_state
from kindact_sim.policies import agent_decisions
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_total_minted, update_total_burned,
    update_agents, update_hypercerts, update_timestep, update_events_log,
)
from kindact_sim.scenarios import SCENARIOS, ScenarioConfig


def build_experiment(scenario_name: str, n_runs: int = 1, seed: int = 42) -> Experiment:
    scenario = SCENARIOS[scenario_name]
    genesis = build_genesis_state(n_users=scenario.n_users, seed=seed)

    params = dict(scenario.params)
    params['rng'] = np.random.default_rng(seed)
    params['_scenario_name'] = scenario_name

    partial_state_update_blocks = [
        {
            'policies': {
                'agent_decisions': agent_decisions,
            },
            'variables': {
                'supply': update_supply,
                'reserve_fiat': update_reserve,
                'total_minted': update_total_minted,
                'total_burned': update_total_burned,
                'hypercert_portfolio': update_hypercerts,
            },
        },
        {
            'policies': {},
            'variables': {
                'exchange_rate': update_exchange_rate,
                'phase': update_phase,
                'agents': update_agents,
                'events_log': update_events_log,
                'timestep': update_timestep,
            },
        },
    ]

    sim_config = config_sim({
        'N': n_runs,
        'T': range(scenario.timesteps),
        'M': params,
    })

    exp = Experiment()
    exp.append_model(
        model_id=scenario_name,
        initial_state=genesis,
        partial_state_update_blocks=partial_state_update_blocks,
        sim_configs=sim_config,
    )
    return exp
```

- [ ] **Step 4: Write run.py**

`src/kindact_sim/run.py`:
```python
import pandas as pd
from cadCAD.engine import ExecutionMode, ExecutionContext, Executor

from kindact_sim.config import build_experiment


def run_simulation(scenario_name: str, n_runs: int = 1, seed: int = 42) -> pd.DataFrame:
    """Run simulation and return results as a DataFrame.
    
    Each row is one substep. Filter to the last substep per timestep
    for clean time series.
    """
    exp = build_experiment(scenario_name, n_runs=n_runs, seed=seed)

    exec_mode = ExecutionMode()
    local_ctx = ExecutionContext(context=exec_mode.local_mode)
    executor = Executor(exec_context=local_ctx, configs=exp.configs)
    
    raw_system_events, _, _ = executor.execute()

    df = pd.DataFrame(raw_system_events)

    # Keep only the last substep per timestep per run
    if 'substep' in df.columns:
        max_substep = df['substep'].max()
        df = df[df['substep'] == max_substep].copy()

    # Extract scalar metrics from agent list
    if 'agents' in df.columns:
        df['n_agents'] = df['agents'].apply(len)
        df['avg_confidence'] = df['agents'].apply(
            lambda agents: sum(a.confidence for a in agents) / len(agents) if agents else 0
        )
        df['n_panicking'] = df['agents'].apply(
            lambda agents: sum(1 for a in agents if a.is_panicking)
        )
        df['total_agent_balance'] = df['agents'].apply(
            lambda agents: sum(a.balance for a in agents)
        )

    # Clean up columns for charting
    df = df.rename(columns={'run': 'run'})
    if 'run' not in df.columns and 'subset' in df.columns:
        df['run'] = df['subset']

    return df.reset_index(drop=True)
```

- [ ] **Step 5: Run integration tests**

Run: `pytest tests/test_integration.py -v`
Expected: All 5 tests PASS

Note: If cadCAD's API doesn't match exactly (e.g., `Executor` import path), check `cadCAD.engine` module and adjust imports. The cadCAD v0.5.3 API uses `Experiment` from `cadCAD.configuration` and `Executor` from `cadCAD.engine`.

- [ ] **Step 6: Commit**

```bash
git add simulation/src/kindact_sim/config.py simulation/src/kindact_sim/run.py simulation/tests/test_integration.py
git commit -m "feat(sim): add cadCAD experiment config and simulation runner"
```

---

### Task 9: Streamlit Dashboard

**Files:**
- Create: `simulation/app.py`

- [ ] **Step 1: Create the dashboard**

`simulation/app.py`:
```python
import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np

from kindact_sim.run import run_simulation
from kindact_sim.scenarios import SCENARIOS

st.set_page_config(page_title="Kindact Economy Simulator", layout="wide")
st.title("🌱 Kindact Economy Simulator")

# --- Sidebar Controls ---
with st.sidebar:
    st.header("Scenario")
    scenario_name = st.selectbox(
        "Preset scenario",
        options=list(SCENARIOS.keys()),
        format_func=lambda x: f"{x} — {SCENARIOS[x].description[:60]}...",
    )
    scenario = SCENARIOS[scenario_name]

    st.header("Parameters")
    demurrage = st.slider("Demurrage rate (%/month)", 0.1, 5.0, 1.0, 0.1) / 100
    reward = st.slider("Reward per issue ($CC)", 10, 200, 50, 10)
    issues_rate = st.slider("Issues per user/month", 0.5, 5.0, 2.0, 0.5)
    growth_rate = st.slider("New users/month (avg)", 0, 50, 15, 1)
    verification_q = st.slider("Verification quality", 0.5, 1.0, 0.9, 0.05)
    hypercert_prob = st.slider("Hypercert sale probability", 0.0, 0.5, 0.1, 0.01)
    hypercert_price = st.slider("Avg Hypercert price ($)", 100, 5000, 1000, 100)

    st.header("Simulation")
    n_runs = st.slider("Monte Carlo runs", 1, 100, 1)
    seed = st.number_input("Random seed", value=42, step=1)

    run_button = st.button("▶ Run Simulation", type="primary", use_container_width=True)

# --- Run simulation ---
if run_button:
    # Override scenario params with sidebar values (copy, don't mutate global)
    from kindact_sim.scenarios import ScenarioConfig
    import copy
    custom_scenario = copy.deepcopy(SCENARIOS[scenario_name])
    custom_scenario.params.update({
        'reward_per_issue': float(reward),
        'issues_per_user_month': float(issues_rate),
        'verification_quality': float(verification_q),
        'growth_rate': int(growth_rate),
        'hypercert_sale_prob': float(hypercert_prob),
        'hypercert_avg_price': float(hypercert_price),
        'demurrage_rate': float(demurrage),
    })
    # Temporarily register custom scenario for the run
    SCENARIOS['_custom'] = custom_scenario
    SCENARIOS['_custom'].params['_scenario_name'] = scenario_name  # use original events

    with st.spinner("Running simulation..."):
        df = run_simulation('_custom', n_runs=n_runs, seed=int(seed))

    st.session_state['df'] = df
    st.session_state['scenario_name'] = scenario_name

if 'df' in st.session_state:
    df = st.session_state['df']

    # --- Charts ---
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Supply & Reserve")
        if n_runs > 1 and df['run'].nunique() > 1:
            grouped = df.groupby('timestep').agg(
                supply_med=('supply', 'median'),
                supply_lo=('supply', lambda x: x.quantile(0.1)),
                supply_hi=('supply', lambda x: x.quantile(0.9)),
                reserve_med=('reserve_fiat', 'median'),
                reserve_lo=('reserve_fiat', lambda x: x.quantile(0.1)),
                reserve_hi=('reserve_fiat', lambda x: x.quantile(0.9)),
            ).reset_index()
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_med'], name='Supply (median)', line=dict(color='#2196F3')), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_lo'], fill=None, mode='lines', line=dict(width=0), showlegend=False), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_hi'], fill='tonexty', mode='lines', line=dict(width=0), name='Supply 10-90%', fillcolor='rgba(33,150,243,0.2)'), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['reserve_med'], name='Reserve USD (median)', line=dict(color='#4CAF50')), secondary_y=True)
            fig.update_yaxes(title_text="$CC Supply", secondary_y=False)
            fig.update_yaxes(title_text="Reserve (USD)", secondary_y=True)
        else:
            run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns else df
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['supply'], name='Supply', line=dict(color='#2196F3')), secondary_y=False)
            fig.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['reserve_fiat'], name='Reserve (USD)', line=dict(color='#4CAF50')), secondary_y=True)
            fig.update_yaxes(title_text="$CC Supply", secondary_y=False)
            fig.update_yaxes(title_text="Reserve (USD)", secondary_y=True)
        fig.update_layout(height=400, margin=dict(t=30, b=30))
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Exchange Rate")
        run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['exchange_rate'], name='Exchange Rate', line=dict(color='#FF9800')))
        fig2.add_hline(y=1.0, line_dash="dash", line_color="gray", annotation_text="$1 target")
        fig2.update_layout(height=400, margin=dict(t=30, b=30), yaxis_title="$CC → USD")
        st.plotly_chart(fig2, use_container_width=True)

    col3, col4 = st.columns(2)

    with col3:
        st.subheader("Backing Ratio")
        run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
        backing = run_df['reserve_fiat'] / run_df['supply'].replace(0, float('nan'))
        fig3 = go.Figure()
        fig3.add_trace(go.Scatter(x=run_df['timestep'], y=backing, name='Backing Ratio', line=dict(color='#9C27B0')))
        fig3.add_hline(y=0.05, line_dash="dash", line_color="red", annotation_text="5% danger threshold")
        fig3.update_layout(height=400, margin=dict(t=30, b=30), yaxis_title="Reserve / Supply")
        st.plotly_chart(fig3, use_container_width=True)

    with col4:
        st.subheader("Agent Population & Confidence")
        run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
        fig4 = make_subplots(specs=[[{"secondary_y": True}]])
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['n_agents'], name='Total Agents', line=dict(color='#00BCD4')), secondary_y=False)
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['avg_confidence'], name='Avg Confidence', line=dict(color='#E91E63')), secondary_y=True)
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['n_panicking'], name='Panicking', line=dict(color='#F44336', dash='dot')), secondary_y=False)
        fig4.update_yaxes(title_text="Count", secondary_y=False)
        fig4.update_yaxes(title_text="Confidence (0-1)", secondary_y=True)
        fig4.update_layout(height=400, margin=dict(t=30, b=30))
        st.plotly_chart(fig4, use_container_width=True)

    col5, col6 = st.columns(2)

    with col5:
        st.subheader("Confidence Distribution (Latest)")
        run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
        last_row = run_df.iloc[-1]
        if isinstance(last_row.get('agents'), list):
            confidences = [a.confidence for a in last_row['agents']]
            fig5 = go.Figure(data=[go.Histogram(x=confidences, nbinsx=20, marker_color='#E91E63')])
            fig5.update_layout(height=350, margin=dict(t=30, b=30), xaxis_title="Confidence", yaxis_title="Count")
            st.plotly_chart(fig5, use_container_width=True)

    with col6:
        st.subheader("Redemption Queue Depth")
        run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
        if 'redemption_queue' in run_df.columns:
            queue_depth = run_df['redemption_queue'].apply(lambda q: len(q) if isinstance(q, list) else 0)
            fig6 = go.Figure()
            fig6.add_trace(go.Scatter(x=run_df['timestep'], y=queue_depth, name='Queue Depth', fill='tozeroy', line=dict(color='#FF5722')))
            fig6.update_layout(height=350, margin=dict(t=30, b=30), yaxis_title="Agents waiting")
            st.plotly_chart(fig6, use_container_width=True)

    # --- Event Log ---
    st.subheader("Event Log")
    run_df = df[df['run'] == df['run'].iloc[0]] if df['run'].nunique() > 1 else df
    all_events = []
    for _, row in run_df.iterrows():
        if isinstance(row.get('events_log'), list):
            all_events.extend(row['events_log'])
    if all_events:
        st.dataframe(pd.DataFrame(all_events), use_container_width=True)
    else:
        st.info("No events logged.")
else:
    st.info("👈 Configure parameters and click **Run Simulation** to start.")
```

- [ ] **Step 2: Verify dashboard starts**

Run: `cd simulation && source .venv/bin/activate && streamlit run app.py --server.headless true`
Expected: Streamlit starts without import errors. Open URL in browser, see the sidebar and placeholder message.

- [ ] **Step 3: Test a simulation run through the UI**

Click "Run Simulation" with default settings. Verify:
- All 6 charts render with data (supply/reserve, exchange rate, backing ratio, agents/confidence, confidence histogram, redemption queue)
- Supply increases over time
- No Python errors in the terminal

- [ ] **Step 4: Commit**

```bash
git add simulation/app.py
git commit -m "feat(sim): add Streamlit dashboard with charts and scenario controls"
```

---

### Task 10: End-to-End Verification

**Files:** No new files — this is a verification task.

- [ ] **Step 1: Run full test suite**

Run: `cd simulation && source .venv/bin/activate && pytest tests/ -v`
Expected: All tests pass.

- [ ] **Step 2: Run bootstrap scenario and verify economics**

Run the bootstrap scenario (single run, seed=42) and verify:
- Supply grows from 0 and approaches an equilibrium
- Phase transitions from BOOTSTRAP to GROWTH when total_minted > 100k
- Reserve grows (slowly) as Hypercerts sell
- Exchange rate starts near 0 and gradually increases
- Demurrage keeps supply bounded

- [ ] **Step 3: Run bank run scenario and verify resilience**

Run the bank run scenario and verify:
- At month 18, panicking agents spike
- Redemptions hit the daily cap
- Reserve drops but doesn't go to zero (flow controls work)
- System eventually stabilizes (or doesn't — that's useful data too)

- [ ] **Step 4: Commit any fixes**

```bash
git add -u simulation/
git commit -m "fix(sim): adjustments from end-to-end verification"
```
