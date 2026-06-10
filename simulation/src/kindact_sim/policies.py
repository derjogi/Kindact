import numpy as np
from kindact_sim.types import Agent, AgentType, Hypercert, Phase
from kindact_sim.scenarios import SCENARIOS, apply_events


def compute_dynamic_issue_rate(
    n_active_users: int,
    total_issues: int,
    base_rate: float = 2.0,
    issues_per_user_target: float = 5.0,
) -> float:
    """Compute issues/user/month based on platform saturation.

    Early (few issues): users create their own → high rate (~base_rate).
    Growing: new issues satisfy multiple users ("sharing") → rate declines.
    Saturated: old issues lose relevance slowly, trickle of new ones.

    Uses sublinear scaling on total_issues to model that older issues
    gradually lose relevance as the community evolves.
    """
    if n_active_users == 0:
        return base_rate

    # Sublinear effective pool: older issues lose relevance
    effective_pool = total_issues ** 0.85

    # How saturated are users' interests?
    desired = n_active_users * issues_per_user_target
    saturation = min(1.0, effective_pool / desired) if desired > 0 else 0.0

    # High rate when unsaturated, drops to ~5% of base at full saturation
    rate = base_rate * (1.0 - saturation * 0.95)
    return max(base_rate * 0.05, rate)


def _get_run_rng(_params: dict, s: dict) -> np.random.Generator:
    """Return the rng for the current cadCAD run, creating it lazily.

    A single shared rng pre-built in config would start from an identical state
    in every run (cadCAD copies/pickles params per run), making Monte Carlo runs
    identical. Instead we seed per run from base_seed + run_index so each run is
    an independent but reproducible stream. The created rng is cached on _params
    so that this run's later substeps and mechanisms reuse the same stream.
    """
    rng = _params.get('rng')
    if rng is None:
        run_index = s.get('run', s.get('subset', 0))
        base_seed = _params.get('_base_seed', 42)
        rng = np.random.default_rng(base_seed + run_index)
        _params['rng'] = rng
    return rng


def agent_decisions(_params: dict, substep: int, sH: list, s: dict, **kwargs) -> dict:
    rng: np.random.Generator = _get_run_rng(_params, s)

    # Apply scenario events for this timestep
    scenario_name = _params.get('_scenario_name')
    if scenario_name and scenario_name in SCENARIOS:
        params = apply_events(SCENARIOS[scenario_name], _params, s['timestep'], state=s)
    else:
        params = dict(_params)

    agents: list[Agent] = s['agents']
    phase: Phase = s['phase']
    exchange_rate: float = s['exchange_rate']
    reserve: float = s['reserve_fiat']
    supply: float = s['supply']

    # Effective reward applies the endogenous reward-maximization ratchet
    # (reward_multiplier is a state variable updated each timestep; defaults
    # to 1.0 when the ratchet is off or in unit tests that omit it).
    reward = params['reward_per_issue'] * s.get('reward_multiplier', 1.0)
    base_issue_rate = params['issues_per_user_month']
    verification_q = params['verification_quality']
    speculation_intensity = params.get('speculation_intensity', 0.4)

    # Dynamic issue creation rate based on platform saturation
    n_active = sum(1 for a in agents if a.activity_level >= 0.1)
    total_issues_so_far = s.get('total_issues_created', 0)
    issues_rate = compute_dynamic_issue_rate(
        n_active, total_issues_so_far,
        base_rate=base_issue_rate,
        issues_per_user_target=params.get('issues_per_user_target', 5.0),
    )
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
    reserve_mint_cc = 0.0
    fraud_minting = 0.0
    issues_created_count = 0
    agent_updates: list[tuple[int, float]] = []

    exchange_open = phase != Phase.BOOTSTRAP and reserve >= 100_000
    # Cap is 1% of the fiat reserve per timestep, expressed in CC so it can be
    # compared against the CC-denominated `redemptions` accumulator. Redeeming
    # the full cap costs exactly 1% of the reserve in fiat. Redemptions only
    # occur when the exchange is open (reserve >= 100k, non-bootstrap), so the
    # exchange_rate is strictly positive whenever this cap is actually used.
    daily_redeem_cap = (0.01 * reserve / exchange_rate) if exchange_rate > 0 else 0.0

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
            issues_created_count += n_issues
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
            # Speculators act on the expected return to holding $CC, not a fixed
            # price gate. The redemption rate is structurally capped at par
            # (~1.0), so the appreciation runway shrinks to zero as the rate
            # approaches par. Holding costs demurrage every month and buying
            # pays a spread, so the expected return turns negative *before* par.
            # Each speculator has its own holding horizon and risk tolerance, so
            # they enter and exit at different rates (a gradual taper and a flip
            # to selling near par) instead of all switching at one threshold.
            demurrage = s['demurrage_rate']
            spread = 0.03
            reserve_readiness = min(1.0, (reserve / 100_000) ** 0.5) if reserve > 0 else 0.0

            # Belief about the exit price: more confident speculators expect
            # fuller convergence to par; the price can't realistically exceed it.
            expected_exit = exchange_rate + agent.confidence * (1.0 - exchange_rate)
            hold_factor = (1.0 - demurrage) ** agent.holding_horizon

            # Return to buying now (pays the spread) vs. return to keeping units
            # already held (the spread is sunk).
            buy_price = max(exchange_rate * (1.0 + spread), 0.001)
            buy_return = expected_exit * hold_factor / buy_price - 1.0
            hold_return = expected_exit * hold_factor / max(exchange_rate, 0.001) - 1.0

            # Risk-averse speculators demand a larger margin before committing.
            required_margin = 0.15 * (1.0 - agent.risk_tolerance)

            if buy_return > required_margin and reserve_readiness > 0:
                # Buy size scales with the edge over the required margin, so
                # buying tapers smoothly to zero as the rate nears the stop point.
                edge = buy_return - required_margin
                intensity = min(1.0, edge / 0.3)
                conviction = max(0.0, (agent.confidence - 0.5) * 2) * (0.5 + agent.risk_tolerance)
                buy_fiat = (rng.uniform(50, 200) * intensity * conviction
                            * reserve_readiness * speculation_intensity)
                buy_fiat = max(0.0, buy_fiat)
                reserve_purchases += buy_fiat
                cc_received = buy_fiat / buy_price
                # The reserve issues new CC against the incoming fiat, so it
                # must enter total supply (not just the agent wallet).
                reserve_mint_cc += cc_received
                agent_updates.append((agent.id, cc_received - fee))
            elif exchange_open and agent.balance > 0 and hold_return < 0:
                # Near/at par the asset has no upside left but still bleeds
                # demurrage, so rational speculators rotate out. The more
                # risk-averse exit a larger share of their position.
                exit_frac = min(1.0, 0.3 + 0.5 * (1.0 - agent.risk_tolerance))
                desired = agent.balance * exit_frac
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
                issues_created_count += n_issues
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
    # Platform attractiveness ramps slowly: baseline allows rare early sales,
    # track record builds trust over time
    platform_attractiveness = network_scale * (0.1 + 0.9 * track_record)

    # Maturity-dependent price curve
    maturity_factor = min(1.0, (timestep / 24) ** 0.5) if timestep > 0 else 0.0
    base_price = hc_min_price + (hc_max_price - hc_min_price) * track_record * maturity_factor

    # No external sales in early months
    if timestep < no_sale_months:
        expected_sales = 0.0
    else:
        # Demand-driven: expected monthly sales = base_sale_prob × attractiveness.
        # This is independent of unsold pool size — it models buyer demand.
        expected_sales = base_sale_prob * platform_attractiveness

    unsold = [h for h in portfolio if not h.sold]
    if unsold and expected_sales > 0:
        n_market_sales = rng.poisson(expected_sales)
        n_market_sales = min(n_market_sales, len(unsold))
        if n_market_sales > 0:
            chosen = rng.choice(len(unsold), size=n_market_sales, replace=False)
            for idx in chosen:
                h = unsold[idx]
                # Lognormal pricing: most HCs are small bundled issues,
                # some are large standalone projects (right-skewed)
                price_multiplier = float(rng.lognormal(0, 0.6))
                price_multiplier = max(0.3, min(5.0, price_multiplier))
                actual_price = base_price * price_multiplier
                hypercert_fiat_sales += actual_price
                h.sold = True
                h.sale_price = actual_price

    # Community purchases — believers investing in their own ecosystem
    # Cap at 1 community purchase per month (rare, conviction-driven)
    still_unsold = [h for h in portfolio if not h.sold]
    if still_unsold:
        community_buyers = []
        for agent in agents:
            if agent.agent_type == AgentType.IMPACT_BUYER and agent.confidence > 0.4:
                buy_prob = 0.015 * agent.confidence
            elif agent.agent_type == AgentType.CONTRIBUTOR and agent.confidence > 0.7:
                buy_prob = 0.005 * (agent.confidence - 0.5)
            else:
                continue
            if rng.random() < buy_prob:
                community_buyers.append(agent)
        if community_buyers:
            buyer = community_buyers[int(rng.integers(len(community_buyers)))]
            h = still_unsold[int(rng.integers(len(still_unsold)))]
            price_multiplier = float(rng.lognormal(-0.2, 0.5))
            price_multiplier = max(0.2, min(3.0, price_multiplier))
            actual_price = base_price * price_multiplier
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

    hc_sold_count = sum(1 for h in portfolio if h.sold and h.sale_price > 0)

    return {
        'work_minting': work_minting,
        'access_fee_burn': access_fee_burn,
        'redemptions': redemptions,
        'desired_redemptions': desired_redemptions,
        'reserve_purchases': reserve_purchases,
        'reserve_mint_cc': reserve_mint_cc,
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
        'issues_created_count': issues_created_count,
        '_effective_issue_rate': round(issues_rate, 3),
    }
