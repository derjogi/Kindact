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


@dataclass
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


@dataclass
class Hypercert:
    id: int
    value_estimate: float
    created_at: int
    sold: bool = False
    sale_price: float = 0.0
