from kindact_sim.types import Agent, AgentType


def update_confidence(
    agent: Agent,
    exchange_rate_trend: float,
    redemption_success_rate: float | None,
    months_holding: int,
) -> float:
    w_trend = 0.3
    w_redemption = 0.4
    w_holding = 0.1
    w_inertia = 0.2

    # 1. Trend signal: uses relative (%) change, ±50% saturates
    trend_signal = max(-1.0, min(1.0, exchange_rate_trend * 2))

    # 2. Redemption signal: any payout is positive, only total failure is negative
    if redemption_success_rate is None:
        redemption_signal = 0.0
    elif redemption_success_rate == 0:
        redemption_signal = -1.0
    else:
        redemption_signal = max(0.1, min(1.0, redemption_success_rate * 2))

    # 3. Holding signal: familiarity grows over time, never penalizes.
    #    Panickers gain less comfort from holding — they remain anxious.
    holding_progress = min(1.0, months_holding / 12.0)
    if agent.agent_type == AgentType.PANICKER:
        holding_signal = holding_progress * 0.3
    else:
        holding_signal = holding_progress

    # 4. Inertia: mild mean-reversion toward a baseline.
    #    Panickers revert toward a lower baseline (naturally anxious).
    if agent.agent_type == AgentType.PANICKER:
        baseline = 0.25
    else:
        baseline = 0.5
    inertia_signal = (baseline - agent.confidence) * 2

    delta = (
        w_trend * trend_signal
        + w_redemption * redemption_signal
        + w_holding * holding_signal
        + w_inertia * inertia_signal
    )

    new_confidence = agent.confidence + delta * 0.15
    return max(0.0, min(1.0, new_confidence))
