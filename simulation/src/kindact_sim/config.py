import numpy as np
from cadCAD.configuration import Experiment
from cadCAD.configuration.utils import config_sim

from kindact_sim.state import build_genesis_state
from kindact_sim.policies import agent_decisions
from kindact_sim.mechanisms import (
    update_supply, update_reserve, update_exchange_rate,
    update_phase, update_total_minted, update_total_burned,
    update_total_issues,
    update_agents, update_hypercerts, update_redemption_queue,
    update_timestep, update_events_log, store_policy_signals,
)
from kindact_sim.scenarios import SCENARIOS, ScenarioConfig
from kindact_sim.agent_config import AgentConfig


def build_experiment(scenario_name: str, n_runs: int = 1, seed: int = 42,
                     agent_config: AgentConfig | None = None,
                     timesteps: int | None = None,
                     progress_cb=None) -> Experiment:
    if agent_config is None:
        agent_config = AgentConfig()
    scenario = SCENARIOS[scenario_name]
    scenario_timesteps = scenario.timesteps if timesteps is None else timesteps
    genesis = build_genesis_state(n_users=scenario.n_users, seed=seed,
                                  population_mix=agent_config.population_mix)

    params = dict(scenario.params)
    # Store the base seed instead of a shared rng object. cadCAD copies the
    # params (and pickles them for parallel runs), so a single pre-built rng
    # would start from an identical state in every run, making Monte Carlo runs
    # byte-for-byte identical. The rng is created lazily per run from
    # base_seed + run_index (see policies.agent_decisions).
    params['_base_seed'] = seed
    params['_scenario_name'] = scenario_name
    params['_agent_config'] = agent_config
    params['_progress_cb'] = progress_cb
    params['_total_timesteps'] = scenario_timesteps

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
                'total_issues_created': update_total_issues,
                'hypercert_portfolio': update_hypercerts,
                'events_log': update_events_log,
                '_policy_signals': store_policy_signals,
            },
        },
        {
            'policies': {},
            'variables': {
                'exchange_rate': update_exchange_rate,
                'phase': update_phase,
                'agents': update_agents,
                'redemption_queue': update_redemption_queue,
                'timestep': update_timestep,
            },
        },
    ]

    sim_config = config_sim({
        'N': n_runs,
        'T': range(scenario_timesteps),
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
