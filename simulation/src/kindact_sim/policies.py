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

    daily_redeem_cap = 0.01 * reserve

    for agent in agents:
        if agent.agent_type == AgentType.CONTRIBUTOR:
            n_issues = rng.poisson(issues_rate)
            minted = n_issues * reward
            work_minting += minted
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            agent_updates.append((agent.id, minted - fee))

        elif agent.agent_type == AgentType.MERCHANT:
            trade_income = rng.uniform(0, 20)
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            redeem_amount = 0.0
            if phase != Phase.BOOTSTRAP and reserve >= 100_000 and agent.balance > 0:
                redeem_frac = rng.uniform(0.1, 0.4)
                desired = agent.balance * redeem_frac
                desired_redemptions += desired
                redeem_amount = min(desired, daily_redeem_cap - redemptions)
                redeem_amount = max(0, redeem_amount)
                redemptions += redeem_amount
            agent_updates.append((agent.id, trade_income - fee - redeem_amount))

        elif agent.agent_type == AgentType.SPECULATOR:
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            demurrage = s['demurrage_rate']
            can_redeem = phase != Phase.BOOTSTRAP and reserve >= 100_000
            if can_redeem:
                if agent.confidence > 0.6 and exchange_rate < 0.8:
                    expected_appreciation = (1.0 - exchange_rate)
                    if expected_appreciation > demurrage * 3:
                        buy_fiat = rng.uniform(50, 200) * (agent.confidence - 0.5) * 2
                        buy_fiat = max(0, buy_fiat)
                        reserve_purchases += buy_fiat
                        cc_received = buy_fiat / max(exchange_rate * 1.03, 0.001)
                        agent_updates.append((agent.id, cc_received - fee))
                    else:
                        agent_updates.append((agent.id, -fee))
                elif agent.confidence < 0.3 and agent.balance > 0:
                    desired = agent.balance * 0.5
                    desired_redemptions += desired
                    redeem_amount = min(desired, daily_redeem_cap - redemptions)
                    redeem_amount = max(0, redeem_amount)
                    redemptions += redeem_amount
                    agent_updates.append((agent.id, -fee - redeem_amount))
                else:
                    agent_updates.append((agent.id, -fee))
            else:
                agent_updates.append((agent.id, -fee))

        elif agent.agent_type == AgentType.IMPACT_BUYER:
            pass

        elif agent.agent_type == AgentType.FRAUDSTER:
            if rng.random() > verification_q:
                fraud_amount = rng.uniform(1, 3) * reward
                fraud_minting += fraud_amount
                agent_updates.append((agent.id, fraud_amount))
            else:
                agent_updates.append((agent.id, 0))

        elif agent.agent_type == AgentType.PANICKER:
            fee = min(agent.balance, 5.0)
            access_fee_burn += fee
            if agent.is_panicking and phase != Phase.BOOTSTRAP and agent.balance > 0:
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
    if whale_redeem > 0 and phase != Phase.BOOTSTRAP:
        desired_redemptions += whale_redeem
        redemptions += min(whale_redeem, daily_redeem_cap - redemptions)

    # Hypercert sales
    hypercert_fiat_sales = 0.0
    sale_prob = params['hypercert_sale_prob']
    sale_price = params['hypercert_avg_price']
    portfolio = s['hypercert_portfolio']
    unsold = [h for h in portfolio if not h.sold]
    for h in unsold:
        if rng.random() < sale_prob:
            hypercert_fiat_sales += sale_price
            h.sold = True
            h.sale_price = sale_price

    new_agents_count = max(0, int(rng.poisson(params['growth_rate'])))

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
    }
