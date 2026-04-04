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
    assert abs(new_conf - 0.5) < 0.15
