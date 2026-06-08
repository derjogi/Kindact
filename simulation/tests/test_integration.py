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


def test_monte_carlo_runs_are_not_identical():
    """Each run must use an independent rng stream, otherwise the dashboard's
    confidence bands would be zero-width (regression for the per-run seeding fix)."""
    df = run_simulation('bank_run', n_runs=3, seed=42)
    final_supply = df.groupby('run')['supply'].last()
    assert final_supply.nunique() == 3


def test_supply_tracks_agent_balances():
    """Total supply should stay close to the sum of agent wallet balances.

    Regression for the bug where speculator-purchased CC was credited to agent
    wallets but never added to `supply` (drift grew to ~2x). A small residual is
    expected from demurrage-ordering clamping, so we allow a modest tolerance.
    """
    df = run_simulation('bootstrap', n_runs=1, seed=42)
    last = df.iloc[-1]
    supply = last['supply']
    balances = last['total_agent_balance']
    assert supply > 0
    drift = abs(balances - supply) / supply
    assert drift < 0.05, f"supply/balance drift {drift:.1%} exceeds tolerance"


def test_bank_run_scenario_runs():
    df = run_simulation('bank_run', n_runs=1, seed=42)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0


def test_run_simulation_accepts_timestep_override():
    df = run_simulation('bootstrap', n_runs=1, seed=42, timesteps=48)
    assert df['timestep'].max() == 48
    assert len(df) == 48
