from kindact_sim.confidence import update_confidence
from kindact_sim.types import Agent, AgentType


def test_confidence_rises_with_positive_rate_trend():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.05, redemption_success_rate=1.0, months_holding=3)
    assert new_conf > 0.5


def test_confidence_drops_with_zero_redemptions():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.0, redemption_success_rate=0.0, months_holding=1)
    assert new_conf < 0.5


def test_partial_redemption_is_positive():
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    new_conf = update_confidence(a, exchange_rate_trend=0.0, redemption_success_rate=0.3, months_holding=1)
    assert new_conf >= 0.5


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
    assert abs(new_conf - 0.5) < 0.15


def test_panicker_drifts_lower_than_contributor():
    """Given identical neutral conditions, panickers trend lower than contributors."""
    p = Agent(id=0, agent_type=AgentType.PANICKER, confidence=0.5)
    c = Agent(id=1, agent_type=AgentType.CONTRIBUTOR, confidence=0.5)
    p_conf = update_confidence(p, exchange_rate_trend=0.0, redemption_success_rate=None, months_holding=6)
    c_conf = update_confidence(c, exchange_rate_trend=0.0, redemption_success_rate=None, months_holding=6)
    assert p_conf < c_conf


def test_mean_reversion_pulls_low_confidence_up():
    """An agent with very low confidence gets a mild upward pull."""
    a = Agent(id=0, agent_type=AgentType.CONTRIBUTOR, confidence=0.1)
    new_conf = update_confidence(a, exchange_rate_trend=0.0, redemption_success_rate=None, months_holding=6)
    assert new_conf > 0.1


def test_panicker_mean_reverts_to_lower_baseline():
    """Panickers revert toward 0.25, not 0.5 — they stay more anxious."""
    p = Agent(id=0, agent_type=AgentType.PANICKER, confidence=0.4)
    new_conf = update_confidence(p, exchange_rate_trend=0.0, redemption_success_rate=None, months_holding=6)
    # Inertia pulls toward 0.25, so confidence should decrease
    assert new_conf < 0.4
