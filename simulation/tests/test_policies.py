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


def test_speculator_tiny_purchase_when_reserve_very_low():
    """Speculators buy only a tiny amount when reserve is very small (readiness ≈ 0.1)."""
    spec = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)
    s = _make_state(phase=Phase.BOOTSTRAP, agents=[spec], reserve=1_000, exchange_rate=0.1)
    s['demurrage_rate'] = 0.01
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # reserve_readiness = sqrt(1000/100000) ≈ 0.1, so purchase is ~10% of full size
    assert result['reserve_purchases'] < 20


def test_speculator_moderate_purchase_at_half_reserve():
    """Speculators buy a moderate amount when reserve is at 50k (readiness ≈ 0.71)."""
    spec = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)
    s = _make_state(phase=Phase.GROWTH, agents=[spec], reserve=50_000, exchange_rate=0.1)
    s['demurrage_rate'] = 0.01
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['reserve_purchases'] > 0


def test_speculator_full_purchase_when_reserve_funded():
    """Speculators buy at full size when reserve >= 100k (readiness = 1.0)."""
    spec = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)
    s = _make_state(phase=Phase.GROWTH, agents=[spec], reserve=200_000, exchange_rate=0.1)
    s['demurrage_rate'] = 0.01
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result_full = agent_decisions(params, 1, [], s)
    # Compare: same setup but reserve=50k
    s2 = _make_state(phase=Phase.GROWTH, agents=[Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)],
                     reserve=50_000, exchange_rate=0.1)
    s2['demurrage_rate'] = 0.01
    result_half = agent_decisions(params, 1, [], s2)
    assert result_full['reserve_purchases'] > result_half['reserve_purchases']


def test_speculator_no_buy_when_rate_near_parity():
    """Speculators shouldn't buy when exchange rate is high (no appreciation left above demurrage)."""
    spec = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)
    s = _make_state(phase=Phase.GROWTH, agents=[spec], reserve=200_000, exchange_rate=0.98)
    s['demurrage_rate'] = 0.01
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # exchange_rate 0.98 → expected appreciation = 0.02 < demurrage*3 = 0.03
    assert result['reserve_purchases'] == 0


def test_speculator_no_purchase_when_reserve_zero():
    """Speculators should not buy when reserve is zero."""
    spec = Agent(id=0, agent_type=AgentType.SPECULATOR, balance=0, confidence=0.9)
    s = _make_state(phase=Phase.BOOTSTRAP, agents=[spec], reserve=0, exchange_rate=0.0)
    s['demurrage_rate'] = 0.01
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['reserve_purchases'] == 0


def test_desired_redemptions_tracked():
    """Policy output includes desired_redemptions separate from actual."""
    panicker = Agent(id=0, agent_type=AgentType.PANICKER, balance=50_000, confidence=0.1,
                     panic_threshold=0.2, is_panicking=True)
    s = _make_state(phase=Phase.GROWTH, agents=[panicker], reserve=10_000)
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # Panicker wants to redeem full balance (50k) but cap is 0.01*10k = 100
    assert result['desired_redemptions'] >= result['redemptions']
    assert result['desired_redemptions'] > result['redemptions']  # cap must be binding
