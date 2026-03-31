import numpy as np
from kindact_sim.types import Agent, AgentType, Phase
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_agents, update_timestep, apply_demurrage,
    update_redemption_queue,
)


def _make_state(**overrides):
    base = {
        'supply': 200_000, 'reserve_fiat': 50_000, 'exchange_rate': 0.1,
        'phase': Phase.GROWTH, 'agents': [], 'total_minted': 200_000,
        'demurrage_rate': 0.01, 'r_target': 1_000_000, 'hypercert_portfolio': [],
        'redemption_queue': [], 'timestep': 5, 'total_burned': 0.0, 'events_log': [],
    }
    base.update(overrides)
    return base

def _make_input(**overrides):
    base = {
        'work_minting': 5000, 'access_fee_burn': 500, 'redemptions': 1000,
        'reserve_purchases': 2000, 'hypercert_fiat_sales': 3000, 'fraud_minting': 0,
        'new_agents_count': 10, 'agent_updates': [],
    }
    base.update(overrides)
    return base

def test_update_supply():
    s = _make_state(supply=200_000, demurrage_rate=0.01)
    inp = _make_input(work_minting=5000, access_fee_burn=500, redemptions=1000, fraud_minting=100)
    _, new_supply = update_supply({}, 1, [], s, inp)
    assert new_supply > 200_000

def test_update_reserve():
    s = _make_state(reserve_fiat=50_000, exchange_rate=0.1)
    inp = _make_input(reserve_purchases=2000, hypercert_fiat_sales=3000, redemptions=1000)
    _, new_reserve = update_reserve({}, 1, [], s, inp)
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


def test_exchange_rate_trend_affects_confidence():
    """When exchange rate drops sharply, agent confidence should decrease."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5,
                  months_holding=0)
    # State where reserve/supply gives a much lower exchange rate than the stored one
    # and also pair with failed redemptions so other signals don't compensate
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=1_000, exchange_rate=0.8,  # old rate was 0.8
        r_target=1_000_000,
    )
    inp = _make_input(new_agents_count=0, agent_updates=[],
                      redemptions=100, desired_redemptions=5000)
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, inp)
    # New rate from reserve=1k, supply=200k is near 0 vs old rate 0.8 → big negative trend
    # Plus failed redemptions → confidence should drop
    assert new_agents[0].confidence < 0.5


def test_exchange_rate_trend_positive_raises_confidence():
    """When exchange rate rises, agent confidence should increase."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5)
    # State where reserve/supply gives a higher exchange rate than the stored one
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=800_000, exchange_rate=0.1,  # old rate was 0.1
        r_target=1_000_000,
    )
    inp = _make_input(new_agents_count=0, agent_updates=[], redemptions=0, desired_redemptions=0)
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, inp)
    assert new_agents[0].confidence > 0.5


def test_redemption_success_rate_affects_confidence():
    """When desired redemptions exceed actual (cap hit), confidence drops."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.6)
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=50_000, exchange_rate=0.25,
        r_target=1_000_000,
    )
    # desired=10000 but only 1000 fulfilled → success_rate = 0.1
    inp = _make_input(
        new_agents_count=0, agent_updates=[],
        redemptions=1000, desired_redemptions=10000,
    )
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, inp)
    assert new_agents[0].confidence < 0.6


def test_redemption_queue_tracks_unfulfilled():
    """When desired > actual, unfulfilled amount is queued."""
    s = _make_state(timestep=5, redemption_queue=[])
    inp = {'desired_redemptions': 5000, 'redemptions': 1000}
    _, queue = update_redemption_queue({}, 1, [], s, inp)
    assert len(queue) == 1
    assert queue[0]['amount'] == 4000
    assert queue[0]['timestep'] == 5


def test_redemption_queue_empty_when_fully_served():
    """No queue entry when all redemptions are fulfilled."""
    s = _make_state(timestep=5, redemption_queue=[])
    inp = {'desired_redemptions': 1000, 'redemptions': 1000}
    _, queue = update_redemption_queue({}, 1, [], s, inp)
    assert len(queue) == 0


def test_redemption_queue_expires_old_entries():
    """Queue entries older than 3 months are removed."""
    old_entries = [
        {'timestep': 1, 'amount': 500},
        {'timestep': 3, 'amount': 300},
    ]
    s = _make_state(timestep=5, redemption_queue=old_entries)
    inp = {'desired_redemptions': 0, 'redemptions': 0}
    _, queue = update_redemption_queue({}, 1, [], s, inp)
    # timestep 1 is 4 months ago (>= 3), should be expired
    # timestep 3 is 2 months ago (< 3), should remain
    assert len(queue) == 1
    assert queue[0]['timestep'] == 3
