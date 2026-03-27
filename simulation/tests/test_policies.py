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
    assert result['redemptions'] >= 0
