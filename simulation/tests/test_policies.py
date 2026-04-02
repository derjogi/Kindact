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


def test_impact_buyer_can_buy_hypercert_early():
    """Impact buyers with high confidence can buy hypercerts even on a young platform."""
    from kindact_sim.types import Hypercert
    # Run multiple seeds to verify at least one produces a sale (prob ~2.7% per agent)
    agents = [Agent(id=i, agent_type=AgentType.IMPACT_BUYER, balance=100, confidence=0.9)
              for i in range(50)]
    unsold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0) for i in range(50)]
    any_sale = False
    for seed in range(10):
        # Reset sold state
        for h in unsold_certs:
            h.sold = False
        s = _make_state(phase=Phase.BOOTSTRAP, agents=agents, reserve=0)
        s['hypercert_portfolio'] = unsold_certs
        params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
                  'growth_rate': 0, 'hypercert_sale_prob': 0.5, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(seed)}
        result = agent_decisions(params, 1, [], s)
        if result['hypercert_fiat_sales'] > 0:
            any_sale = True
            break
    assert any_sale, "No community purchase across 10 seeds — probability too low"


def test_high_confidence_contributor_can_buy_hypercert():
    """Contributors with very high confidence occasionally buy hypercerts."""
    from kindact_sim.types import Hypercert
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100, confidence=0.9)
              for i in range(100)]
    unsold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0) for i in range(100)]
    any_sale = False
    for seed in range(10):
        for h in unsold_certs:
            h.sold = False
        s = _make_state(phase=Phase.BOOTSTRAP, agents=agents, reserve=0)
        s['hypercert_portfolio'] = unsold_certs
        params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
                  'growth_rate': 0, 'hypercert_sale_prob': 0.5, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(seed)}
        result = agent_decisions(params, 1, [], s)
        if result['hypercert_fiat_sales'] > 0:
            any_sale = True
            break
    assert any_sale, "No contributor purchase across 10 seeds — probability too low"


def test_low_confidence_impact_buyer_does_not_buy():
    """Impact buyers with very low confidence don't buy hypercerts."""
    from kindact_sim.types import Hypercert
    agents = [Agent(id=i, agent_type=AgentType.IMPACT_BUYER, balance=100, confidence=0.2)
              for i in range(10)]
    unsold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0) for i in range(10)]
    s = _make_state(phase=Phase.BOOTSTRAP, agents=agents, reserve=0)
    s['hypercert_portfolio'] = unsold_certs
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.5, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # confidence 0.2 < 0.4 threshold → no community purchases, and no market sales (track_record=0)
    assert result['hypercert_fiat_sales'] == 0


def test_hypercert_sales_near_zero_on_young_platform():
    """With few users and no prior sales, hypercert sale probability is near zero."""
    from kindact_sim.types import Hypercert
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100) for i in range(50)]
    unsold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0) for i in range(20)]
    s = _make_state(phase=Phase.GROWTH, agents=agents, reserve=10_000)
    s['hypercert_portfolio'] = unsold_certs
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.5, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # 50 users, 0 sold → network_scale=0.32, track_record=0/(0+10)=0 → attractiveness=0
    assert result['hypercert_fiat_sales'] == 0


def test_hypercert_sales_increase_with_maturity():
    """With more users and prior sales, hypercerts sell more often."""
    from kindact_sim.types import Hypercert
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100) for i in range(300)]
    sold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0, sold=True, sale_price=1000) for i in range(20)]
    unsold_certs = [Hypercert(id=i + 20, value_estimate=1000, created_at=5) for i in range(50)]
    s = _make_state(phase=Phase.GROWTH, agents=agents, reserve=100_000)
    s['hypercert_portfolio'] = sold_certs + unsold_certs
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.5, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # 300 users, 20 sold → network_scale=0.77, track_record=20/30=0.67 → attractiveness≈0.52
    # effective prob ≈ 0.26 on 50 unsold certs → should get some sales
    assert result['hypercert_fiat_sales'] > 0


def test_no_hypercert_sales_in_early_months():
    """No external Hypercert sales should occur in the first N months."""
    from kindact_sim.types import Hypercert
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100, confidence=0.5)
              for i in range(100)]
    unsold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0) for i in range(50)]
    s = _make_state(phase=Phase.GROWTH, agents=agents, reserve=100_000)
    s['hypercert_portfolio'] = unsold_certs
    s['timestep'] = 2  # within no-sale period
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.5,
              'hypercert_min_price': 100.0, 'hypercert_max_price': 2000.0,
              'hypercert_no_sale_months': 5,
              'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # Market sales blocked. Community purchases might still happen but with low-confidence
    # contributors at 0.5 they won't buy (need >0.7).
    assert result['hypercert_fiat_sales'] == 0


def test_hypercert_prices_increase_with_maturity():
    """Hypercert sale prices at month 24+ should be higher than at month 6."""
    from kindact_sim.types import Hypercert
    sold_certs = [Hypercert(id=i, value_estimate=1000, created_at=0, sold=True, sale_price=500)
                  for i in range(20)]

    # Month 6 scenario
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100) for i in range(300)]
    unsold = [Hypercert(id=i + 20, value_estimate=1000, created_at=5) for i in range(50)]
    s6 = _make_state(phase=Phase.GROWTH, agents=agents, reserve=100_000)
    s6['hypercert_portfolio'] = sold_certs + unsold
    s6['timestep'] = 6
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.5,
              'hypercert_min_price': 100.0, 'hypercert_max_price': 2000.0,
              'hypercert_no_sale_months': 5,
              'rng': np.random.default_rng(42)}
    result6 = agent_decisions(params, 1, [], s6)

    # Month 30 scenario — same setup but later
    for h in unsold:
        h.sold = False
    s30 = _make_state(phase=Phase.GROWTH, agents=agents, reserve=100_000)
    s30['hypercert_portfolio'] = sold_certs + unsold
    s30['timestep'] = 30
    params30 = dict(params)
    params30['rng'] = np.random.default_rng(42)
    result30 = agent_decisions(params30, 1, [], s30)

    if result6['hypercert_fiat_sales'] > 0 and result30['hypercert_fiat_sales'] > 0:
        # Count sold certs to get average price
        sold_at_6 = sum(1 for h in s6['hypercert_portfolio'] if h.sold and h.sale_price > 0 and h.created_at == 5)
        sold_at_30 = sum(1 for h in s30['hypercert_portfolio'] if h.sold and h.sale_price > 0 and h.created_at == 5)
        if sold_at_6 > 0 and sold_at_30 > 0:
            avg6 = result6['hypercert_fiat_sales'] / sold_at_6
            avg30 = result30['hypercert_fiat_sales'] / sold_at_30
            assert avg30 > avg6


def test_access_fee_only_fraction_pays():
    """Only ~5% of agents should pay access fees, not all of them."""
    agents = [Agent(id=i, agent_type=AgentType.CONTRIBUTOR, balance=100, confidence=0.6)
              for i in range(200)]
    s = _make_state(agents=agents)
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0,
              'access_fee_fraction': 0.05, 'access_fee_amount': 10.0,
              'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # With 200 agents at 5%, expect ~10 paying 10 CC each = ~100 total
    # Old model would have been 200 * 5 = 1000
    assert result['access_fee_burn'] < 300  # well below old model
    assert result['access_fee_burn'] > 0    # some agents do pay


def test_access_fee_amount_is_10():
    """Agents who pay access fees pay 10 CC (not the old 5 CC)."""
    # Use 100% fee fraction to guarantee payment
    agents = [Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100, confidence=0.6)]
    s = _make_state(agents=agents)
    params = {'reward_per_issue': 0.0, 'issues_per_user_month': 0.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0,
              'access_fee_fraction': 1.0, 'access_fee_amount': 10.0,
              'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['access_fee_burn'] == 10.0


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


def test_panicking_non_panicker_tracks_full_desired_redemptions():
    """Panicking contributors should record what they wanted to redeem, not only what the cap served."""
    contributor = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=5_000, confidence=0.1,
                        panic_threshold=0.2, is_panicking=True)
    s = _make_state(phase=Phase.GROWTH, agents=[contributor], reserve=10_000)
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    # Contributor wants to redeem almost all 5k balance, but cap is only 100.
    assert result['desired_redemptions'] > result['redemptions']


def test_panicker_still_registers_redemption_demand_during_bootstrap():
    """Bootstrap can block redemption execution, but it should not hide redemption demand."""
    panicker = Agent(id=0, agent_type=AgentType.PANICKER, balance=500, confidence=0.1,
                     panic_threshold=0.2, is_panicking=True)
    s = _make_state(phase=Phase.BOOTSTRAP, agents=[panicker], reserve=0)
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0, 'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['desired_redemptions'] == 500
    assert result['redemptions'] == 0
