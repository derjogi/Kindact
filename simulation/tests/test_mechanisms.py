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
        '_policy_signals': {},
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
    signals = _make_input(new_agents_count=0, agent_updates=[],
                          redemptions=100, desired_redemptions=5000)
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=1_000, exchange_rate=0.8,  # old rate was 0.8
        r_target=1_000_000, _policy_signals=signals,
    )
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, {})
    # New rate from reserve=1k, supply=200k is near 0 vs old rate 0.8 → big negative trend
    # Plus failed redemptions → confidence should drop
    assert new_agents[0].confidence < 0.5


def test_exchange_rate_trend_positive_raises_confidence():
    """When exchange rate rises, agent confidence should increase."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5)
    # State where reserve/supply gives a higher exchange rate than the stored one
    signals = _make_input(new_agents_count=0, agent_updates=[], redemptions=0, desired_redemptions=0)
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=800_000, exchange_rate=0.1,  # old rate was 0.1
        r_target=1_000_000, _policy_signals=signals,
    )
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, {})
    assert new_agents[0].confidence > 0.5


def test_redemption_success_rate_affects_confidence():
    """When desired redemptions exceed actual (cap hit), confidence drops."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.6)
    # desired=10000 but only 1000 fulfilled → success_rate = 0.1
    signals = _make_input(
        new_agents_count=0, agent_updates=[],
        redemptions=1000, desired_redemptions=10000,
    )
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=50_000, exchange_rate=0.25,
        r_target=1_000_000, _policy_signals=signals,
    )
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, {})
    assert new_agents[0].confidence < 0.6


def test_no_redemption_demand_is_not_treated_as_perfect_success():
    """Absent redemption demand, confidence should not jump just because nobody tried to redeem."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5)
    signals = _make_input(
        new_agents_count=0, agent_updates=[],
        redemptions=0, desired_redemptions=0,
    )
    s = _make_state(
        agents=[agent],
        supply=200_000, reserve_fiat=50_000, exchange_rate=0.25,
        r_target=1_000_000, _policy_signals=signals,
    )
    params = {'rng': np.random.default_rng(42)}
    _, new_agents = update_agents(params, 1, [], s, {})
    assert new_agents[0].confidence <= 0.5


def test_acceptance_willingness_rises_with_exchange_rate():
    """Acceptance willingness should be higher when exchange rate is meaningful."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5,
                  intrinsic_motivation=0.5)
    # Low exchange rate scenario
    signals = _make_input(new_agents_count=0, agent_updates=[])
    s_low = _make_state(agents=[agent], supply=200_000, reserve_fiat=1_000,
                        exchange_rate=0.01, r_target=1_000_000, _policy_signals=signals)
    params = {'rng': np.random.default_rng(42)}
    _, agents_low = update_agents(params, 1, [], s_low, {})

    # High exchange rate scenario
    agent2 = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5,
                   intrinsic_motivation=0.5)
    s_high = _make_state(agents=[agent2], supply=200_000, reserve_fiat=500_000,
                         exchange_rate=0.5, r_target=1_000_000, _policy_signals=signals)
    _, agents_high = update_agents(params, 1, [], s_high, {})

    assert agents_high[0].acceptance_willingness > agents_low[0].acceptance_willingness


def test_early_agents_have_higher_motivation():
    """Genesis agents (Phase 1) should have higher intrinsic motivation on average."""
    from kindact_sim.state import make_agents_from_weights
    from kindact_sim.agent_config import DEFAULT_POPULATION_MIX
    rng = np.random.default_rng(42)
    early = make_agents_from_weights(200, DEFAULT_POPULATION_MIX, rng,
                                     motivation_alpha=5.0, motivation_beta=2.0)
    late = make_agents_from_weights(200, DEFAULT_POPULATION_MIX, rng,
                                    motivation_alpha=2.0, motivation_beta=4.0)
    avg_early = sum(a.intrinsic_motivation for a in early) / len(early)
    avg_late = sum(a.intrinsic_motivation for a in late) / len(late)
    assert avg_early > avg_late
    assert avg_early > 0.6   # skewed high
    assert avg_late < 0.4    # skewed low


def test_dormant_agent_skips_actions():
    """An agent with activity_level < 0.1 should produce no work or fees."""
    from kindact_sim.policies import agent_decisions
    dormant = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=100.0, confidence=0.5,
                    activity_level=0.05)
    s = _make_state(agents=[dormant])
    params = {'reward_per_issue': 50.0, 'issues_per_user_month': 2.0, 'verification_quality': 0.9,
              'growth_rate': 0, 'hypercert_sale_prob': 0.0, 'hypercert_avg_price': 1000.0,
              'access_fee_fraction': 1.0, 'access_fee_amount': 10.0,
              'rng': np.random.default_rng(42)}
    result = agent_decisions(params, 1, [], s)
    assert result['work_minting'] == 0
    assert result['access_fee_burn'] == 0


def test_low_confidence_agent_becomes_dormant():
    """An agent with sustained low confidence should see activity_level drop."""
    agent = Agent(id=0, agent_type=AgentType.MERCHANT, balance=10.0, confidence=0.1,
                  intrinsic_motivation=0.2, activity_level=0.5)
    signals = _make_input(new_agents_count=0, agent_updates=[], work_minting=0)
    s = _make_state(agents=[agent], supply=200_000, reserve_fiat=1_000,
                    exchange_rate=0.01, r_target=1_000_000, _policy_signals=signals)
    params = {'rng': np.random.default_rng(42)}
    _, updated = update_agents(params, 1, [], s, {})
    assert updated[0].activity_level < 0.5  # should have dropped


def test_high_motivation_resists_dormancy():
    """An agent with high intrinsic motivation should resist going dormant."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=10.0, confidence=0.3,
                  intrinsic_motivation=0.9, activity_level=0.8)
    signals = _make_input(new_agents_count=0, agent_updates=[], work_minting=100)
    s = _make_state(agents=[agent], supply=200_000, reserve_fiat=1_000,
                    exchange_rate=0.01, r_target=1_000_000, _policy_signals=signals)
    params = {'rng': np.random.default_rng(42)}
    _, updated = update_agents(params, 1, [], s, {})
    assert updated[0].activity_level > 0.5  # motivation keeps them active


def test_agent_exits_after_prolonged_dormancy():
    """Agents dormant for 3+ months should be removed."""
    agent = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, balance=10.0, confidence=0.05,
                  intrinsic_motivation=0.05, activity_level=0.01, months_dormant=2)
    signals = _make_input(new_agents_count=0, agent_updates=[], work_minting=0)
    s = _make_state(agents=[agent], supply=200_000, reserve_fiat=1_000,
                    exchange_rate=0.01, r_target=1_000_000, _policy_signals=signals)
    params = {'rng': np.random.default_rng(42)}
    _, updated = update_agents(params, 1, [], s, {})
    # months_dormant was 2, activity stays <0.1, increments to 3 → agent removed
    assert len(updated) == 0


def test_redemption_queue_tracks_unfulfilled():
    """When desired > actual, unfulfilled amount is queued."""
    signals = {'desired_redemptions': 5000, 'redemptions': 1000}
    s = _make_state(timestep=5, redemption_queue=[], _policy_signals=signals)
    _, queue = update_redemption_queue({}, 1, [], s, {})
    assert len(queue) == 1
    assert queue[0]['amount'] == 4000
    assert queue[0]['timestep'] == 5


def test_redemption_queue_empty_when_fully_served():
    """No queue entry when all redemptions are fulfilled."""
    signals = {'desired_redemptions': 1000, 'redemptions': 1000}
    s = _make_state(timestep=5, redemption_queue=[], _policy_signals=signals)
    _, queue = update_redemption_queue({}, 1, [], s, {})
    assert len(queue) == 0


def test_redemption_queue_expires_old_entries():
    """Queue entries older than 3 months are removed."""
    old_entries = [
        {'timestep': 1, 'amount': 500},
        {'timestep': 3, 'amount': 300},
    ]
    signals = {'desired_redemptions': 0, 'redemptions': 0}
    s = _make_state(timestep=5, redemption_queue=old_entries, _policy_signals=signals)
    _, queue = update_redemption_queue({}, 1, [], s, {})
    # timestep 1 is 4 months ago (>= 3), should be expired
    # timestep 3 is 2 months ago (< 3), should remain
    assert len(queue) == 1
    assert queue[0]['timestep'] == 3
