from dataclasses import dataclass, field
from typing import Any

from kindact_sim.types import Phase


@dataclass
class ScenarioConfig:
    name: str
    n_users: int
    timesteps: int
    params: dict[str, Any]
    events: dict[int, list[dict]] = field(default_factory=dict)
    conditional_events: list[dict] = field(default_factory=list)
    description: str = ""


def _check_condition(condition: str, state: dict) -> bool:
    """Evaluate a named condition against current simulation state."""
    if condition == 'exchange_open':
        return (state.get('phase', Phase.BOOTSTRAP) != Phase.BOOTSTRAP
                and state.get('reserve_fiat', 0) >= 100_000)
    return False


def apply_events(scenario: ScenarioConfig, base_params: dict, timestep: int,
                 state: dict | None = None) -> dict:
    params = dict(base_params)

    # Collect all events to apply this step
    all_events = list(scenario.events.get(timestep, []))

    # Conditional events: fire once when condition is met or fallback timestep reached
    if state is not None:
        for cond_event in scenario.conditional_events:
            fired_key = f"_fired_{cond_event['type']}"
            if base_params.get(fired_key):
                continue
            condition = cond_event.get('condition')
            fallback = cond_event.get('fallback_timestep')
            trigger = False
            if condition and _check_condition(condition, state):
                trigger = True
            if fallback is not None and timestep >= fallback:
                trigger = True
            if trigger:
                all_events.append(cond_event)
                # Mutate base_params so the flag persists across timesteps
                base_params[fired_key] = True

    if not all_events:
        return params

    for event in all_events:
        etype = event['type']
        if etype == 'hypercert_crash':
            params['hypercert_sale_prob'] = 0.01
        elif etype == 'hypercert_recovery':
            params['hypercert_sale_prob'] = base_params.get('hypercert_sale_prob', 0.1)
        elif etype == 'bank_run':
            params['_confidence_shock'] = event.get('shock_pct', 0.4)
        elif etype == 'whale_dump':
            params['_whale_dump'] = {'pct_supply': event.get('pct_supply', 0.15)}
        elif etype == 'demurrage_evasion':
            params['_demurrage_evasion_pct'] = event.get('evasion_pct', 0.2)
        elif etype == 'demurrage_evasion_end':
            params['_demurrage_evasion_pct'] = 0.0
        elif etype == 'fraud_wave':
            params['verification_quality'] = event.get('quality', 0.5)
        elif etype == 'fraud_wave_end':
            params['verification_quality'] = base_params.get('verification_quality', 0.9)
        elif etype == 'growth_spike':
            params['growth_rate'] = int(base_params.get('growth_rate', 15) * event.get('multiplier', 3))
        elif etype == 'growth_spike_end':
            params['growth_rate'] = base_params.get('growth_rate', 15)
        elif etype == 'stagnation':
            params['growth_rate'] = 0
            params['issues_per_user_month'] = base_params.get('issues_per_user_month', 2.0) * 0.3
        elif etype == 'stagnation_end':
            params['growth_rate'] = base_params.get('growth_rate', 15)
            params['issues_per_user_month'] = base_params.get('issues_per_user_month', 2.0)
        elif etype == 'inflation_spike':
            params['reward_per_issue'] = base_params.get('reward_per_issue', 50.0) * 2.0
        elif etype == 'compounding_inflation':
            rate = event.get('monthly_rate', 0.10)
            months_elapsed = event.get('months_elapsed', 1)
            base_reward = base_params.get('reward_per_issue', 50.0)
            params['reward_per_issue'] = base_reward * (1 + rate) ** months_elapsed
        elif etype == 'compounding_inflation_end':
            params['reward_per_issue'] = base_params.get('reward_per_issue', 50.0)

    return params


def _make_inflation_events(
    start: int, duration_months: int, monthly_rate: float = 0.10
) -> dict[int, list[dict]]:
    """Generate per-month compounding inflation events."""
    events: dict[int, list[dict]] = {}
    for m in range(duration_months):
        events[start + m] = [
            {
                "type": "compounding_inflation",
                "monthly_rate": monthly_rate,
                "months_elapsed": m + 1,
            }
        ]
    events[start + duration_months] = [{"type": "compounding_inflation_end"}]
    return events


_DEFAULT_PARAMS = {
    'reward_per_issue': 50.0,
    'issues_per_user_month': 2.0,
    'verification_quality': 0.9,
    'growth_rate': 15,
    'hypercert_sale_prob': 3.0,
    'hypercert_min_price': 100.0,
    'hypercert_max_price': 2000.0,
    'hypercert_no_sale_months': 5,
    'access_fee_fraction': 0.05,
    'access_fee_amount': 10.0,
}

SCENARIOS: dict[str, ScenarioConfig] = {
    "bootstrap": ScenarioConfig(
        name="bootstrap",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={},
        description="Baseline bootstrap: organic growth, no shocks.",
    ),
    "bank_run": ScenarioConfig(
        name="bank_run",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={},
        conditional_events=[{
            "type": "bank_run",
            "shock_pct": 0.7,
            "condition": "exchange_open",
            "fallback_timestep": 20,
        }],
        description="Bank run fires as soon as exchange opens or at month 20, whichever is earlier.",
    ),
    "hypercert_crash": ScenarioConfig(
        name="hypercert_crash",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            12: [{"type": "hypercert_crash"}],
            18: [{"type": "hypercert_recovery"}],
        },
        description="Hypercert sales crash to near-zero at month 12, recover at month 18.",
    ),
    "fraud_wave": ScenarioConfig(
        name="fraud_wave",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            8: [{"type": "fraud_wave", "quality": 0.5}],
            14: [{"type": "fraud_wave_end"}],
        },
        description="Verification quality drops at month 8, recovers at month 14.",
    ),
    "stagnation": ScenarioConfig(
        name="stagnation",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={15: [{"type": "stagnation"}], 24: [{"type": "stagnation_end"}]},
        description="Growth and activity stagnate from month 15-24.",
    ),
    "whale_dump": ScenarioConfig(
        name="whale_dump",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={16: [{"type": "whale_dump", "pct_supply": 0.15}]},
        description="At month 16, one agent accumulates 15% of supply and redeems all at once.",
    ),
    "demurrage_evasion": ScenarioConfig(
        name="demurrage_evasion",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events={
            10: [{"type": "demurrage_evasion", "evasion_pct": 0.2}],
            20: [{"type": "demurrage_evasion_end"}],
        },
        description="20% of agents evade demurrage via circular transfers from month 10-20.",
    ),
    "cc_inflation": ScenarioConfig(
        name="cc_inflation",
        n_users=50,
        timesteps=36,
        params=dict(_DEFAULT_PARAMS),
        events=_make_inflation_events(start=3, duration_months=12, monthly_rate=0.10),
        description="CC rewards grow ~10% per month (months 3-14), testing demurrage as inflation brake.",
    ),
}
