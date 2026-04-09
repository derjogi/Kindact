import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase
from kindact_sim.scenarios import SCENARIOS, apply_events


def agent_decisions(_params: dict, substep: int, sH: list, s: dict, **kwargs) -> dict:
    rng: np.random.Generator = _params['rng']

    # Apply scenario events for this timestep
    scenario_name = _params.get('_scenario_name')
    if scenario_name and scenario_name in SCENARIOS:
        params = apply_events(SCENARIOS[scenario_name], _params, s['timestep'])
    else:
        params = dict(_params)

    agents: list[Agent] = s['agents']
    phase: Phase = s['phase']
    exchange_rate: float = s['exchange_rate']
    reserve: float = s['reserve_fiat']
    supply: float = s['supply']

    reward = params['reward_per_issue']
    issues_rate = params['issues_per_user_month']
    verification_q = params['verification_quality']
    access_fee_fraction = params.get('access_fee_fraction', 0.05)
    access_fee_amount = params.get('access_fee_amount', 10.0)

    # Pre-determine which agents pay access fees this month
    _fee_rolls = rng.random(len(agents))

    # Handle bank_run confidence shock event
    confidence_shock = params.get('_confidence_shock')
    if confidence_shock:
        n_shocked = int(len(agents) * confidence_shock)
        shocked_indices = rng.choice(len(agents), size=min(n_shocked, len(agents)), replace=False)
        for idx in shocked_indices:
            agents[idx].confidence = max(0.05, agents[idx].confidence * 0.3)
            if agents[idx].agent_type in (AgentType.PANICKER, AgentType.CONTRIBUTOR, AgentType.MERCHANT):
                agents[idx].is_panicking = True

    # Handle whale_dump event
    whale_dump = params.get('_whale_dump')
    if whale_dump and supply > 0:
        whale_balance = supply * whale_dump['pct_supply']
        params['_whale_redeem'] = whale_balance

    work_minting = 0.0
    access_fee_burn = 0.0
    redemptions = 0.0
    desired_redemptions = 0.0
    reserve_purchases = 0.0
    fraud_minting = 0.0
    agent_updates: list[tuple[int, float]] = []

    exchange_open = phase != Phase.BOOTSTRAP and reserve >= 100_000
    daily_redeem_cap = 0.01 * reserve

    for idx, agent in enumerate(agents):
        # Dormant agents do nothing (still lose to demurrage in mechanisms)
        if agent.activity_level < 0.1:
            agent_updates.append((agent.id, 0))
            continue

        # Determine access fee for this agent (only ~5% pay each month)
        fee = min(agent.balance, access_fee_amount) if _fee_rolls[idx] < access_fee_fraction else 0.0
        access_fee_burn += fee

        # Any panicking agent (regardless of type) tries to cash out
        # But only if exchange is open (post-bootstrap + sufficient reserve)
        if agent.is_panicking and agent.agent_type != AgentType.PANICKER:
            if agent.balance > fee and exchange_open:
                desired = agent.balance - fee
                desired_redemptions += desired
                redeem_amount = min(desired, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
                agent_updates.append((agent.id, -fee - redeem_amount))
            else:
                agent_updates.append((agent.id, -fee))
            continue

        if agent.agent_type == AgentType.CONTRIBUTOR:
            # Willingness to work for $CC depends on acceptance_willingness
            effective_rate = issues_rate * max(0.2, agent.acceptance_willingness)
            n_issues = rng.poisson(effective_rate)
            minted = n_issues * reward
            work_minting += minted
            agent_updates.append((agent.id, minted - fee))

        elif agent.agent_type == AgentType.MERCHANT:
            # Trade income scales with merchant's willingness to accept $CC
            trade_income = rng.uniform(0, 20) * agent.acceptance_willingness
            redeem_amount = 0.0
            if exchange_open and agent.balance > 0:
                redeem_frac = rng.uniform(0.1, 0.4)
                desired = agent.balance * redeem_frac
                desired_redemptions += desired
                redeem_amount = min(desired, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
            agent_updates.append((agent.id, trade_income - fee - redeem_amount))

        elif agent.agent_type == AgentType.SPECULATOR:
            demurrage = s['demurrage_rate']
            reserve_readiness = min(1.0, (reserve / 100_000) ** 0.5) if reserve > 0 else 0.0
            can_redeem = exchange_open
            if agent.confidence > 0.6 and exchange_rate < 0.8:
                expected_appreciation = (1.0 - exchange_rate)
                if expected_appreciation > demurrage * 3:
                    buy_fiat = rng.uniform(50, 200) * (agent.confidence - 0.5) * 2 * reserve_readiness
                    buy_fiat = max(0, buy_fiat)
                    reserve_purchases += buy_fiat
                    cc_received = buy_fiat / max(exchange_rate * 1.03, 0.001)
                    agent_updates.append((agent.id, cc_received - fee))
                else:
                    agent_updates.append((agent.id, -fee))
            elif can_redeem and agent.confidence < 0.3 and agent.balance > 0:
                desired = agent.balance * 0.5
                desired_redemptions += desired
                redeem_amount = min(desired, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
                agent_updates.append((agent.id, -fee - redeem_amount))
            else:
                agent_updates.append((agent.id, -fee))

        elif agent.agent_type == AgentType.IMPACT_BUYER:
            agent_updates.append((agent.id, -fee))

        elif agent.agent_type == AgentType.FRAUDSTER:
            if rng.random() > verification_q:
                fraud_amount = rng.uniform(1, 3) * reward
                fraud_minting += fraud_amount
                agent_updates.append((agent.id, fraud_amount - fee))
            else:
                agent_updates.append((agent.id, -fee))

        elif agent.agent_type == AgentType.PANICKER:
            if agent.is_panicking and agent.balance > 0 and exchange_open:
                desired = agent.balance
                desired_redemptions += desired
                redeem_amount = min(desired, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
                agent_updates.append((agent.id, -fee - redeem_amount))
            else:
                n_issues = rng.poisson(issues_rate * 0.5)
                minted = n_issues * reward
                work_minting += minted
                agent_updates.append((agent.id, minted - fee))

    # Add whale dump redemption if event is active
    whale_redeem = params.get('_whale_redeem', 0)
    if whale_redeem > 0 and exchange_open:
        desired_redemptions += whale_redeem
        redemptions += min(whale_redeem, daily_redeem_cap - redemptions)

    # Hypercert sales — two channels:
    # 1. Market sales: probability scaled by platform maturity (external investors)
    # 2. Community purchases: impact buyers and high-confidence contributors
    hypercert_fiat_sales = 0.0
    timestep = s['timestep']
    base_sale_prob = params['hypercert_sale_prob']
    hc_min_price = params.get('hypercert_min_price', 100.0)
    hc_max_price = params.get('hypercert_max_price', 2000.0)
    no_sale_months = params.get('hypercert_no_sale_months', 5)
    # For backward compat: if old flat price param is present, use it as max
    if 'hypercert_avg_price' in params and 'hypercert_min_price' not in params:
        hc_max_price = params['hypercert_avg_price']
        hc_min_price = hc_max_price * 0.1
    portfolio = s['hypercert_portfolio']
    n_agents = len(agents)
    sold_count = sum(1 for h in portfolio if h.sold)
    network_scale = min(1.0, (n_agents / 500) ** 0.5)
    track_record = sold_count / (sold_count + 10)
    # Baseline attractiveness so first sales can happen even with no track record
    platform_attractiveness = network_scale * (0.01 + 0.99 * track_record)

    # Maturity-dependent price curve
    maturity_factor = min(1.0, (timestep / 24) ** 0.5) if timestep > 0 else 0.0
    base_price = hc_min_price + (hc_max_price - hc_min_price) * track_record * maturity_factor

    # No external sales in early months
    if timestep < no_sale_months:
        sale_prob = 0.0
    else:
        sale_prob = base_sale_prob * platform_attractiveness

    unsold = [h for h in portfolio if not h.sold]
    for h in unsold:
        if rng.random() < sale_prob:
            actual_price = base_price * float(rng.uniform(0.7, 1.3))
            hypercert_fiat_sales += actual_price
            h.sold = True
            h.sale_price = actual_price

    # Community purchases — believers investing in their own ecosystem
    still_unsold = [h for h in unsold if not h.sold]
    if still_unsold:
        for agent in agents:
            if agent.agent_type == AgentType.IMPACT_BUYER and agent.confidence > 0.4:
                buy_prob = 0.03 * agent.confidence
            elif agent.agent_type == AgentType.CONTRIBUTOR and agent.confidence > 0.7:
                buy_prob = 0.01 * (agent.confidence - 0.5)
            else:
                continue
            if rng.random() < buy_prob and still_unsold:
                h = still_unsold.pop(0)
                actual_price = base_price * float(rng.uniform(0.5, 1.0))
                hypercert_fiat_sales += actual_price
                h.sold = True
                h.sale_price = actual_price

    new_agents_count = max(0, int(rng.poisson(params['growth_rate'])))

    # --- Collect per-agent-type stats for the event log ---
    type_counts = {}
    type_panicking = {}
    type_confidence_sum = {}
    type_confidence_count = {}
    for agent in agents:
        t = agent.agent_type.value
        type_counts[t] = type_counts.get(t, 0) + 1
        if agent.is_panicking:
            type_panicking[t] = type_panicking.get(t, 0) + 1
        type_confidence_sum[t] = type_confidence_sum.get(t, 0.0) + agent.confidence
        type_confidence_count[t] = type_confidence_count.get(t, 0) + 1

    n_panicking_total = sum(1 for a in agents if a.is_panicking)
    n_dormant = sum(1 for a in agents if a.activity_level < 0.1)
    confidences = [a.confidence for a in agents]
    confidence_min = min(confidences) if confidences else 0.0
    confidence_max = max(confidences) if confidences else 0.0

    # Count hypercerts sold this timestep
    hc_sold_this_step = sum(1 for h in portfolio if h.sold and h.sale_price > 0
                           and h not in unsold)  # approximate: sold ones that were in unsold list
    # Better: count based on fiat sales
    hc_sold_count = 0
    for h in portfolio:
        if h.sold and h.sale_price > 0:
            hc_sold_count += 1

    return {
        'work_minting': work_minting,
        'access_fee_burn': access_fee_burn,
        'redemptions': redemptions,
        'desired_redemptions': desired_redemptions,
        'reserve_purchases': reserve_purchases,
        'hypercert_fiat_sales': hypercert_fiat_sales,
        'fraud_minting': fraud_minting,
        'new_agents_count': new_agents_count,
        'agent_updates': agent_updates,
        # Detailed stats for the event log
        '_type_counts': type_counts,
        '_type_panicking': type_panicking,
        '_n_panicking_total': n_panicking_total,
        '_n_dormant': n_dormant,
        '_confidence_min': confidence_min,
        '_confidence_max': confidence_max,
        '_confidence_shock_applied': confidence_shock is not None,
        '_whale_dump_applied': whale_dump is not None,
        '_hc_sold_count': hc_sold_count,
    }
