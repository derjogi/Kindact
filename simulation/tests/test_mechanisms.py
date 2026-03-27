from kindact_sim.types import Agent, AgentType, Phase
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_agents, update_timestep, apply_demurrage,
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
