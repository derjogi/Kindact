import numpy as np
from cadCAD.configuration import Experiment
from cadCAD.configuration.utils import config_sim

from kindact_sim.state import build_genesis_state
from kindact_sim.policies import agent_decisions
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_total_minted, update_total_burned,
    update_agents, update_hypercerts, update_redemption_queue,
    update_timestep, update_events_log,
)
from kindact_sim.scenarios import SCENARIOS, ScenarioConfig


def build_experiment(scenario_name: str, n_runs: int = 1, seed: int = 42) -> Experiment:
    scenario = SCENARIOS[scenario_name]
    genesis = build_genesis_state(n_users=scenario.n_users, seed=seed)

    params = dict(scenario.params)
    params['rng'] = np.random.default_rng(seed)
    params['_scenario_name'] = scenario_name

    partial_state_update_blocks = [
        {
            'policies': {
                'agent_decisions': agent_decisions,
            },
            'variables': {
                'supply': update_supply,
                'reserve_fiat': update_reserve,
                'total_minted': update_total_minted,
                'total_burned': update_total_burned,
                'hypercert_portfolio': update_hypercerts,
            },
        },
        {
            'policies': {},
            'variables': {
                'exchange_rate': update_exchange_rate,
                'phase': update_phase,
                'agents': update_agents,
                'redemption_queue': update_redemption_queue,
                'events_log': update_events_log,
                'timestep': update_timestep,
            },
        },
    ]

    sim_config = config_sim({
        'N': n_runs,
        'T': range(scenario.timesteps),
        'M': params,
    })

    exp = Experiment()
    exp.append_model(
        model_id=scenario_name,
        initial_state=genesis,
        partial_state_update_blocks=partial_state_update_blocks,
        sim_configs=sim_config,
    )
    return exp
