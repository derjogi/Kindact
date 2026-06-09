from dataclasses import dataclass, field
from enum import Enum


class AgentType(Enum):
    CONTRIBUTOR = "contributor"
    MERCHANT = "merchant"
    SPECULATOR = "speculator"
    IMPACT_BUYER = "impact_buyer"
    FRAUDSTER = "fraudster"
    PANICKER = "panicker"


class Phase(Enum):
    BOOTSTRAP = "bootstrap"
    GROWTH = "growth"
    MATURITY = "maturity"


@dataclass(slots=True)
class Agent:
    id: int
    agent_type: AgentType
    balance: float = 0.0
    confidence: float = 0.5
    panic_threshold: float = 0.2
    is_panicking: bool = False
    months_holding: int = 0
    total_earned: float = 0.0
    total_redeemed: float = 0.0
    intrinsic_motivation: float = 0.5
    acceptance_willingness: float = 0.5
    activity_level: float = 1.0
    months_dormant: int = 0
    # Speculator traits: expected months they plan to hold (drives sensitivity
    # to demurrage) and risk tolerance (lower → demands a bigger return margin
    # before buying, exits faster). Heterogeneity makes them enter/exit at
    # different exchange rates instead of all flipping at one fixed threshold.
    holding_horizon: float = 6.0
    risk_tolerance: float = 0.5


@dataclass(slots=True)
class Hypercert:
    id: int
    value_estimate: float
    created_at: int
    sold: bool = False
    sale_price: float = 0.0
