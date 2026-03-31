from kindact_sim.agent_config import AgentConfig, DEFAULT_POPULATION_MIX
from kindact_sim.state import make_agents_from_weights
from kindact_sim.types import AgentType
import numpy as np


def test_default_population_mix_sums_to_one():
    total = sum(DEFAULT_POPULATION_MIX.values())
    assert abs(total - 1.0) < 1e-9


def test_make_agents_from_weights_respects_distribution():
    weights = {"contributor": 1.0, "merchant": 0.0, "speculator": 0.0,
               "impact_buyer": 0.0, "fraudster": 0.0, "panicker": 0.0}
    rng = np.random.default_rng(42)
    agents = make_agents_from_weights(100, weights, rng)
    assert all(a.agent_type == AgentType.CONTRIBUTOR for a in agents)


def test_make_agents_from_weights_start_id():
    rng = np.random.default_rng(42)
    agents = make_agents_from_weights(5, DEFAULT_POPULATION_MIX, rng, start_id=100)
    assert agents[0].id == 100
    assert agents[-1].id == 104


def test_inflow_weights_no_flux():
    config = AgentConfig()
    weights = config.get_inflow_weights(10)
    assert weights == config.population_mix


def test_inflow_weights_before_first_entry():
    config = AgentConfig(flux_schedule=[
        {"month": 6, "weights": {"contributor": 0.8, "panicker": 0.2}},
    ])
    weights = config.get_inflow_weights(0)
    assert abs(weights["contributor"] - 0.8) < 1e-9


def test_inflow_weights_after_last_entry():
    config = AgentConfig(flux_schedule=[
        {"month": 6, "weights": {"contributor": 0.5, "panicker": 0.5}},
        {"month": 12, "weights": {"contributor": 0.3, "panicker": 0.7}},
    ])
    weights = config.get_inflow_weights(20)
    assert abs(weights["contributor"] - 0.3) < 1e-9
    assert abs(weights["panicker"] - 0.7) < 1e-9


def test_inflow_weights_interpolates():
    config = AgentConfig(flux_schedule=[
        {"month": 0, "weights": {"contributor": 1.0, "panicker": 0.0}},
        {"month": 10, "weights": {"contributor": 0.0, "panicker": 1.0}},
    ])
    weights = config.get_inflow_weights(5)
    assert abs(weights["contributor"] - 0.5) < 1e-9
    assert abs(weights["panicker"] - 0.5) < 1e-9


def test_save_and_load(tmp_path, monkeypatch):
    monkeypatch.setattr("kindact_sim.agent_config.CONFIGS_DIR", tmp_path)
    config = AgentConfig(
        name="test",
        population_mix={"contributor": 0.8, "panicker": 0.2},
        flux_schedule=[{"month": 6, "weights": {"contributor": 0.5, "panicker": 0.5}}],
    )
    config.save("test.json")
    loaded = AgentConfig.load("test.json")
    assert loaded.name == "test"
    assert loaded.population_mix == config.population_mix
    assert loaded.flux_schedule == config.flux_schedule
