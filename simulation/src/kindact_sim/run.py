import pandas as pd
from cadCAD.engine import ExecutionMode, ExecutionContext, Executor

from kindact_sim.config import build_experiment
from kindact_sim.agent_config import AgentConfig


def run_simulation(scenario_name: str, n_runs: int = 1, seed: int = 42,
                   agent_config: AgentConfig | None = None) -> pd.DataFrame:
    """Run simulation and return results as a DataFrame."""
    exp = build_experiment(scenario_name, n_runs=n_runs, seed=seed, agent_config=agent_config)

    exec_mode = ExecutionMode()
    local_ctx = ExecutionContext(context=exec_mode.local_mode)
    executor = Executor(exec_context=local_ctx, configs=exp.configs)
    
    raw_system_events, _, _ = executor.execute()

    df = pd.DataFrame(raw_system_events)

    # Keep only the last substep per timestep per run
    if 'substep' in df.columns:
        max_substep = df['substep'].max()
        df = df[df['substep'] == max_substep].copy()

    # Extract scalar metrics from agent list
    if 'agents' in df.columns:
        df['n_agents'] = df['agents'].apply(len)
        df['avg_confidence'] = df['agents'].apply(
            lambda agents: sum(a.confidence for a in agents) / len(agents) if agents else 0
        )
        df['n_panicking'] = df['agents'].apply(
            lambda agents: sum(1 for a in agents if a.is_panicking)
        )
        df['total_agent_balance'] = df['agents'].apply(
            lambda agents: sum(a.balance for a in agents)
        )

    if 'run' not in df.columns and 'subset' in df.columns:
        df['run'] = df['subset']

    return df.reset_index(drop=True)
