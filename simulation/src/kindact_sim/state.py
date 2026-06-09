import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase


def compute_phase(total_minted: float, reserve_fiat: float, r_target: float) -> Phase:
    if total_minted < 100_000:
        return Phase.BOOTSTRAP
    if reserve_fiat >= r_target:
        return Phase.MATURITY
    return Phase.GROWTH


def compute_backing_ratio(reserve: float, supply: float) -> float:
    if supply == 0:
        return 0.0
    return reserve / supply


def compute_exchange_rate(reserve: float, supply: float, r_target: float) -> float:
    b = compute_backing_ratio(reserve, supply)
    r_ratio = min(reserve / r_target, 1.0) if r_target > 0 else 0.0
    return b + (1 - b) * r_ratio ** 2


def make_agents_from_weights(
    n: int,
    weights: dict[str, float],
    rng: np.random.Generator,
    start_id: int = 0,
    motivation_alpha: float = 5.0,
    motivation_beta: float = 2.0,
) -> list[Agent]:
    """Create n agents sampled from the given type weights dict.

    weights: mapping of AgentType.value -> probability (e.g. {"contributor": 0.6, ...}).
    motivation_alpha/beta: Beta distribution params for intrinsic_motivation.
        Early adopters: (5, 2) → skewed high. Later: (2, 4) → skewed low.
    """
    types = [AgentType(k) for k in weights]
    probs = np.array([weights[k] for k in weights])
    probs = probs / probs.sum()  # normalize
    assigned = rng.choice(len(types), size=n, p=probs)
    motivations = rng.beta(motivation_alpha, motivation_beta, size=n)
    agents = []
    for i in range(n):
        agents.append(Agent(
            id=start_id + i,
            agent_type=types[assigned[i]],
            panic_threshold=float(rng.uniform(0.1, 0.4)),
            confidence=float(rng.uniform(0.3, 0.7)),
            intrinsic_motivation=float(motivations[i]),
            holding_horizon=float(rng.uniform(3.0, 18.0)),
            risk_tolerance=float(rng.uniform(0.2, 0.9)),
        ))
    return agents


def build_genesis_state(n_users: int = 50, r_target: float = 1_000_000, seed: int | None = None,
                        population_mix: dict[str, float] | None = None) -> dict:
    from kindact_sim.agent_config import DEFAULT_POPULATION_MIX
    if population_mix is None:
        population_mix = DEFAULT_POPULATION_MIX
    rng = np.random.default_rng(seed)
    return {
        'supply': 0.0,
        'reserve_fiat': 0.0,
        'exchange_rate': 0.0,
        'phase': Phase.BOOTSTRAP,
        'agents': make_agents_from_weights(n_users, population_mix, rng),
        'hypercert_portfolio': [],
        'total_minted': 0.0,
        'demurrage_rate': 0.01,
        'redemption_queue': [],
        'timestep': 0,
        'r_target': r_target,
        'total_burned': 0.0,
        'total_issues_created': 0,
        'events_log': [],
        '_policy_signals': {},
    }
