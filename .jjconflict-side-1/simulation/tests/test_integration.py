import pandas as pd
from kindact_sim.run import run_simulation


def test_bootstrap_runs_and_returns_dataframe():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert 'supply' in df.columns
    assert 'reserve_fiat' in df.columns
    assert 'exchange_rate' in df.columns
    assert len(df) > 0


def test_supply_never_negative():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert (df['supply'] >= 0).all()


def test_reserve_never_negative():
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    assert (df['reserve_fiat'] >= 0).all()


def test_monte_carlo_multiple_runs():
    df = run_simulation('bootstrap', n_runs=3, seed=42)
    assert df['run'].nunique() == 3


def test_bank_run_scenario_runs():
    df = run_simulation('bank_run', n_runs=1, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0


def test_run_simulation_accepts_timestep_override():
    df = run_simulation('bootstrap', n_runs=1, seed=42, timesteps=48)
    assert df['timestep'].max() == 48
    assert len(df) == 48
