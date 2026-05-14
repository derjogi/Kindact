import pandas as pd
from cadCAD.engine import ExecutionMode, ExecutionContext, Executor

from kindact_sim.config import build_experiment
from kindact_sim.agent_config import AgentConfig


def run_simulation(scenario_name: str, n_runs: int = 1, seed: int = 42,
                   agent_config: AgentConfig | None = None,
                   timesteps: int | None = None,
                   progress_cb=None) -> pd.DataFrame:
    """Run simulation and return results as a DataFrame.

    Args:
        progress_cb: Optional callback called as progress_cb(timestep, total_timesteps)
                     each simulation step. Injected via cadCAD params dict.
    """
    exp = build_experiment(
        scenario_name,
        n_runs=n_runs,
        seed=seed,
        agent_config=agent_config,
        timesteps=timesteps,
        progress_cb=progress_cb,
    )

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
        df['avg_acceptance'] = df['agents'].apply(
            lambda agents: sum(a.acceptance_willingness for a in agents) / len(agents) if agents else 0
        )
        df['n_dormant'] = df['agents'].apply(
            lambda agents: sum(1 for a in agents if a.activity_level < 0.1)
        )
        df['avg_activity'] = df['agents'].apply(
            lambda agents: sum(a.activity_level for a in agents) / len(agents) if agents else 0
        )

    if 'run' not in df.columns and 'subset' in df.columns:
        df['run'] = df['subset']

    # Reassemble the full events_log on the last row of each run.
    # Each row stores only its own step's entry (to avoid O(n²) state copying
    # inside cadCAD). Here we collect them back into a single list.
    if 'events_log' in df.columns:
        run_col = 'run' if 'run' in df.columns else None
        if run_col and df[run_col].nunique() > 1:
            for run_id, group in df.groupby(run_col):
                full_log = []
                for entry_list in group['events_log']:
                    if isinstance(entry_list, list):
                        full_log.extend(entry_list)
                last_idx = group.index[-1]
                df.at[last_idx, 'events_log'] = full_log
        else:
            full_log = []
            for entry_list in df['events_log']:
                if isinstance(entry_list, list):
                    full_log.extend(entry_list)
            last_idx = df.index[-1]
            df.at[last_idx, 'events_log'] = full_log

    return df.reset_index(drop=True)
