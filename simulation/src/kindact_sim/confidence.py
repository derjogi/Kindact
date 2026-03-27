from kindact_sim.types import Agent


def update_confidence(
    agent: Agent,
    exchange_rate_trend: float,
    redemption_success_rate: float,
    months_holding: int,
) -> float:
    w_trend = 0.3
    w_redemption = 0.4
    w_holding = 0.1
    w_inertia = 0.2

    trend_signal = max(-1.0, min(1.0, exchange_rate_trend * 5))
    redemption_signal = (redemption_success_rate - 0.5) * 2
    holding_signal = min(1.0, months_holding / 12.0)
    inertia_signal = (agent.confidence - 0.5) * 2

    delta = (
        w_trend * trend_signal
        + w_redemption * redemption_signal
        + w_holding * holding_signal
        + w_inertia * inertia_signal
    )

    new_confidence = agent.confidence + delta * 0.15
    return max(0.0, min(1.0, new_confidence))
