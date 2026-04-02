import copy
import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase
from kindact_sim.state import compute_exchange_rate, compute_phase, make_agents_from_weights
from kindact_sim.confidence import update_confidence


def apply_demurrage(agents: list[Agent], rate: float, evasion_pct: float = 0.0,
                    rng: np.random.Generator | None = None) -> list[Agent]:
    new_agents = []
    evading_ids = set()
    if evasion_pct > 0 and rng is not None:
        n_evading = int(len(agents) * evasion_pct)
        evading_ids = set(rng.choice([a.id for a in agents], size=min(n_evading, len(agents)), replace=False))
    for a in agents:
        new_a = copy.copy(a)
        if a.id not in evading_ids:
            new_a.balance = a.balance * (1 - rate)
        new_agents.append(new_a)
    return new_agents


def update_supply(_params, substep, sH, s, _input, **kwargs):
    supply = s['supply']
    demurrage = s['demurrage_rate']
    new_supply = (
        supply * (1 - demurrage)
        + _input.get('work_minting', 0)
        + _input.get('fraud_minting', 0)
        + _input.get('reserve_mint_cc', 0)
        - _input.get('access_fee_burn', 0)
        - _input.get('redemptions', 0)
    )
    return ('supply', max(0, new_supply))


def update_reserve(_params, substep, sH, s, _input, **kwargs):
    reserve = s['reserve_fiat']
    exchange_rate = s['exchange_rate']
    new_reserve = (
        reserve
        + _input.get('reserve_purchases', 0)
        + _input.get('hypercert_fiat_sales', 0)
        - _input.get('redemptions', 0) * exchange_rate
    )
    return ('reserve_fiat', max(0, new_reserve))


def update_exchange_rate(_params, substep, sH, s, _input, **kwargs):
    supply = s['supply']
    reserve = s['reserve_fiat']
    r_target = s['r_target']
    return ('exchange_rate', compute_exchange_rate(reserve, supply, r_target))


def update_phase(_params, substep, sH, s, _input, **kwargs):
    total_minted = s['total_minted'] + _input.get('work_minting', 0) + _input.get('fraud_minting', 0)
    return ('phase', compute_phase(total_minted, s['reserve_fiat'], s['r_target']))


def update_total_minted(_params, substep, sH, s, _input, **kwargs):
    return ('total_minted', s['total_minted'] + _input.get('work_minting', 0) + _input.get('fraud_minting', 0))


def update_total_burned(_params, substep, sH, s, _input, **kwargs):
    burned = _input.get('access_fee_burn', 0) + _input.get('redemptions', 0)
    demurrage_burn = s['supply'] * s['demurrage_rate']
    return ('total_burned', s['total_burned'] + burned + demurrage_burn)


def update_agents(_params, substep, sH, s, _input, **kwargs):
    rng: np.random.Generator = _params.get('rng', np.random.default_rng())
    evasion_pct = _params.get('_demurrage_evasion_pct', 0.0)
    agents = apply_demurrage(s['agents'], s['demurrage_rate'], evasion_pct=evasion_pct, rng=rng)

    updates = {aid: delta for aid, delta in _input.get('agent_updates', [])}
    for a in agents:
        if a.id in updates:
            a.balance = max(0, a.balance + updates[a.id])
        a.months_holding += 1

    # Compute actual exchange rate trend from previous vs current state
    new_rate = compute_exchange_rate(s['reserve_fiat'], s['supply'], s['r_target'])
    old_rate = s['exchange_rate']
    exchange_rate_trend = new_rate - old_rate

    # Compute redemption success rate from desired vs actual
    desired = _input.get('desired_redemptions', 0)
    actual = _input.get('redemptions', 0)
    success_rate = 1.0 if desired == 0 else actual / desired

    for a in agents:
        a.confidence = update_confidence(a, exchange_rate_trend, success_rate, a.months_holding)
        a.is_panicking = a.confidence < a.panic_threshold

    # Compute acceptance_willingness for each agent
    n_agents = len(agents)
    n_accepting = sum(1 for a in agents if a.acceptance_willingness > 0.3)
    merchant_density = n_accepting / n_agents if n_agents > 0 else 0.0
    new_rate = compute_exchange_rate(s['reserve_fiat'], s['supply'], s['r_target'])
    exchange_rate_signal = min(1.0, new_rate * 2)  # 0 at rate=0, saturates at rate=0.5+

    for a in agents:
        a.acceptance_willingness = max(0.0, min(1.0,
            0.35 * a.intrinsic_motivation
            + 0.25 * exchange_rate_signal
            + 0.20 * merchant_density
            + 0.20 * a.confidence
        ))

    # Update activity_level based on confidence, earnings, and motivation
    earned_this_step = _input.get('work_minting', 0)
    has_earnings = earned_this_step > 0
    for a in agents:
        earned_signal = 0.3 if (has_earnings and a.agent_type in (AgentType.CONTRIBUTOR, AgentType.PANICKER)) else -0.1
        activity_delta = (
            0.35 * (a.confidence - 0.5)
            + 0.25 * earned_signal
            + 0.25 * (a.intrinsic_motivation - 0.5)
            + 0.15 * (a.activity_level - 0.5)
        )
        a.activity_level = max(0.0, min(1.0, a.activity_level + activity_delta * 0.1))

        # Track dormancy
        if a.activity_level < 0.1:
            a.months_dormant += 1
        else:
            a.months_dormant = 0

    # Remove agents who have been dormant for 3+ consecutive months (exit)
    # Their balance decays via demurrage but effectively leaves circulation
    agents = [a for a in agents if a.months_dormant < 3]

    n_new = _input.get('new_agents_count', 0)
    if n_new > 0:
        max_id = max((a.id for a in agents), default=-1)
        agent_config = _params.get('_agent_config')
        if agent_config is not None:
            inflow_weights = agent_config.get_inflow_weights(s['timestep'])
        else:
            from kindact_sim.agent_config import DEFAULT_POPULATION_MIX
            inflow_weights = DEFAULT_POPULATION_MIX
        # Later joiners have lower intrinsic motivation
        phase = s['phase']
        if phase == Phase.BOOTSTRAP:
            m_alpha, m_beta = 5.0, 2.0    # idealists
        elif phase == Phase.GROWTH:
            m_alpha, m_beta = 3.0, 3.0    # mixed
        else:
            m_alpha, m_beta = 2.0, 4.0    # need monetary incentive
        new_agents = make_agents_from_weights(
            n_new, inflow_weights, rng, start_id=max_id + 1,
            motivation_alpha=m_alpha, motivation_beta=m_beta,
        )
        agents.extend(new_agents)
    return ('agents', agents)


def update_hypercerts(_params, substep, sH, s, _input, **kwargs):
    rng: np.random.Generator = _params.get('rng', np.random.default_rng())
    portfolio = copy.deepcopy(s['hypercert_portfolio'])
    work_minted = _input.get('work_minting', 0)
    n_new = int(work_minted / 100)
    max_id = max((h.id for h in portfolio), default=-1)
    for i in range(n_new):
        portfolio.append(Hypercert(
            id=max_id + 1 + i,
            value_estimate=float(rng.uniform(500, 2000)),
            created_at=s['timestep'],
        ))
    return ('hypercert_portfolio', portfolio)


def update_redemption_queue(_params, substep, sH, s, _input, **kwargs):
    desired = _input.get('desired_redemptions', 0)
    actual = _input.get('redemptions', 0)
    unfulfilled = max(0, desired - actual)
    queue = list(s['redemption_queue'])
    if unfulfilled > 0:
        queue.append({'timestep': s['timestep'], 'amount': unfulfilled})
    # Expire entries older than 3 months
    queue = [e for e in queue if s['timestep'] - e['timestep'] < 3]
    return ('redemption_queue', queue)


def update_timestep(_params, substep, sH, s, _input, **kwargs):
    return ('timestep', s['timestep'] + 1)


def update_events_log(_params, substep, sH, s, _input, **kwargs):
    log = list(s['events_log'])
    t = s['timestep']
    old_phase = s['phase']
    new_phase = compute_phase(
        s['total_minted'] + _input.get('work_minting', 0),
        s['reserve_fiat'], s['r_target']
    )
    if new_phase != old_phase:
        log.append({'timestep': t, 'event': f'Phase transition: {old_phase.value} -> {new_phase.value}'})
    supply = s['supply']
    reserve = s['reserve_fiat']
    if supply > 0 and reserve / supply < 0.05:
        log.append({'timestep': t, 'event': 'Reserve floor hit (backing < 5%)'})
    return ('events_log', log)
