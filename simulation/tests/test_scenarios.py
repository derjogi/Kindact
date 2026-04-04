from kindact_sim.scenarios import SCENARIOS, apply_events, ScenarioConfig


def test_bootstrap_scenario_exists():
    assert 'bootstrap' in SCENARIOS
    s = SCENARIOS['bootstrap']
    assert s.n_users == 50
    assert s.timesteps == 36


def test_bank_run_scenario_exists():
    assert 'bank_run' in SCENARIOS


def test_all_scenarios_exist():
    assert 'hypercert_crash' in SCENARIOS
    assert 'fraud_wave' in SCENARIOS
    assert 'stagnation' in SCENARIOS
    assert 'whale_dump' in SCENARIOS
    assert 'demurrage_evasion' in SCENARIOS


def test_apply_events_no_events():
    scenario = SCENARIOS['bootstrap']
    base_params = {
        'reward_per_issue': 50.0,
        'issues_per_user_month': 2.0,
        'verification_quality': 0.9,
        'growth_rate': 15,
        'hypercert_sale_prob': 0.1,
        'hypercert_avg_price': 1000.0,
    }
    modified = apply_events(scenario, base_params, timestep=0)
    assert modified['reward_per_issue'] == 50.0


def test_apply_events_bank_run():
    scenario = SCENARIOS['bank_run']
    base_params = {'reward_per_issue': 50.0, 'hypercert_sale_prob': 0.1}
    modified = apply_events(scenario, base_params, timestep=18)
    assert '_confidence_shock' in modified
    assert modified['_confidence_shock'] == 0.4


def test_apply_events_hypercert_crash():
    scenario = SCENARIOS['hypercert_crash']
    base_params = {'hypercert_sale_prob': 0.1}
    modified = apply_events(scenario, base_params, timestep=12)
    assert modified['hypercert_sale_prob'] == 0.01


def test_scenario_config_has_events():
    s = ScenarioConfig(
        name='test',
        n_users=50,
        timesteps=36,
        params={'reward_per_issue': 50.0},
        events={10: [{'type': 'hypercert_crash', 'duration': 6}]},
    )
    assert 10 in s.events
