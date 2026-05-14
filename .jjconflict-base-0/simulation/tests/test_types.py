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
