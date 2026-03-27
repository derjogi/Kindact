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


def _make_initial_agents(n: int, rng: np.random.Generator | None = None) -> list[Agent]:
    if rng is None:
        rng = np.random.default_rng()
    agents = []
    type_weights = [
        (AgentType.CONTRIBUTOR, 0.60),
        (AgentType.MERCHANT, 0.15),
        (AgentType.SPECULATOR, 0.10),
        (AgentType.IMPACT_BUYER, 0.05),
        (AgentType.FRAUDSTER, 0.05),
        (AgentType.PANICKER, 0.05),
    ]
    types = [t for t, _ in type_weights]
    probs = [p for _, p in type_weights]
    assigned = rng.choice(len(types), size=n, p=probs)
    for i in range(n):
        agents.append(Agent(
            id=i,
            agent_type=types[assigned[i]],
            panic_threshold=float(rng.uniform(0.1, 0.4)),
            confidence=float(rng.uniform(0.3, 0.7)),
        ))
    return agents


def build_genesis_state(n_users: int = 50, r_target: float = 1_000_000, seed: int | None = None) -> dict:
    rng = np.random.default_rng(seed)
    return {
        'supply': 0.0,
        'reserve_fiat': 0.0,
        'exchange_rate': 0.0,
        'phase': Phase.BOOTSTRAP,
        'agents': _make_initial_agents(n_users, rng),
        'hypercert_portfolio': [],
        'total_minted': 0.0,
        'demurrage_rate': 0.01,
        'redemption_queue': [],
        'timestep': 0,
        'r_target': r_target,
        'total_burned': 0.0,
        'events_log': [],
    }
