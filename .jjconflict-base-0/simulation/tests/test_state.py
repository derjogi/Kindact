from kindact_sim.state import build_genesis_state, compute_phase, compute_exchange_rate, compute_backing_ratio
from kindact_sim.types import Phase


def test_genesis_state_structure():
    s = build_genesis_state(n_users=50)
    assert s['supply'] == 0.0
    assert s['reserve_fiat'] == 0.0
    assert s['phase'] == Phase.BOOTSTRAP
    assert len(s['agents']) == 50
    assert s['total_minted'] == 0.0
    assert s['timestep'] == 0
    assert isinstance(s['hypercert_portfolio'], list)
    assert isinstance(s['redemption_queue'], list)


def test_phase_bootstrap():
    assert compute_phase(total_minted=50_000, reserve_fiat=0, r_target=1_000_000) == Phase.BOOTSTRAP


def test_phase_growth():
    assert compute_phase(total_minted=150_000, reserve_fiat=500_000, r_target=1_000_000) == Phase.GROWTH


def test_phase_maturity():
    assert compute_phase(total_minted=150_000, reserve_fiat=1_000_000, r_target=1_000_000) == Phase.MATURITY


def test_backing_ratio_zero_supply():
    assert compute_backing_ratio(reserve=1000, supply=0) == 0.0


def test_backing_ratio_normal():
    assert compute_backing_ratio(reserve=100_000, supply=500_000) == 0.2


def test_exchange_rate_low_reserve():
    e = compute_exchange_rate(reserve=30_000, supply=300_000, r_target=1_000_000)
    assert abs(e - 0.1008) < 0.001


def test_exchange_rate_at_target():
    e = compute_exchange_rate(reserve=1_000_000, supply=1_500_000, r_target=1_000_000)
    assert abs(e - 1.0) < 0.01


def test_exchange_rate_mid_range():
    e = compute_exchange_rate(reserve=500_000, supply=1_000_000, r_target=1_000_000)
    assert abs(e - 0.625) < 0.01
