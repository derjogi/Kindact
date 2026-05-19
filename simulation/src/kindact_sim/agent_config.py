"""Population mix and flux schedule configuration for agent types."""

import json
from dataclasses import dataclass, field, asdict
from pathlib import Path
from kindact_sim.types import AgentType

CONFIGS_DIR = Path(__file__).resolve().parent.parent.parent / "agent_configs"

# Default initial population weights (must sum to 1.0)
DEFAULT_POPULATION_MIX: dict[str, float] = {
    AgentType.CONTRIBUTOR.value: 0.60,
    AgentType.MERCHANT.value: 0.15,
    AgentType.SPECULATOR.value: 0.10,
    AgentType.IMPACT_BUYER.value: 0.05,
    AgentType.FRAUDSTER.value: 0.05,
    AgentType.PANICKER.value: 0.05,
}

# Default flux: same mix at all timesteps (no change over time)
DEFAULT_FLUX_SCHEDULE: list[dict] = []


@dataclass
class AgentConfig:
    """Configuration for agent population mix and inflow flux over time.

    population_mix: weights for initial population (agent_type.value -> float).
    flux_schedule: list of {"month": int, "weights": {type_value: float}} entries,
        sorted by month. Between entries, weights are linearly interpolated.
        If empty, population_mix is used for all new agent inflow.
    """
    name: str = "default"
    population_mix: dict[str, float] = field(default_factory=lambda: dict(DEFAULT_POPULATION_MIX))
    flux_schedule: list[dict] = field(default_factory=lambda: list(DEFAULT_FLUX_SCHEDULE))

    def get_inflow_weights(self, timestep: int) -> dict[str, float]:
        """Get agent type weights for new agents joining at the given timestep.

        If no flux schedule is defined, returns population_mix.
        Otherwise interpolates between the two nearest schedule entries.
        """
        if not self.flux_schedule:
            return dict(self.population_mix)

        schedule = sorted(self.flux_schedule, key=lambda e: e['month'])

        # Before first entry: use first entry's weights
        if timestep <= schedule[0]['month']:
            return dict(schedule[0]['weights'])

        # After last entry: use last entry's weights
        if timestep >= schedule[-1]['month']:
            return dict(schedule[-1]['weights'])

        # Find surrounding entries and interpolate
        for i in range(len(schedule) - 1):
            lo, hi = schedule[i], schedule[i + 1]
            if lo['month'] <= timestep <= hi['month']:
                span = hi['month'] - lo['month']
                t = (timestep - lo['month']) / span if span > 0 else 0.0
                all_types = set(lo['weights'].keys()) | set(hi['weights'].keys())
                result = {}
                for atype in all_types:
                    lo_w = lo['weights'].get(atype, 0.0)
                    hi_w = hi['weights'].get(atype, 0.0)
                    result[atype] = lo_w + t * (hi_w - lo_w)
                # Normalize to sum to 1.0
                total = sum(result.values())
                if total > 0:
                    result = {k: v / total for k, v in result.items()}
                return result

        return dict(self.population_mix)

    def save(self, filename: str | None = None) -> Path:
        CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
        fname = filename or f"{self.name}.json"
        path = CONFIGS_DIR / fname
        path.write_text(json.dumps(asdict(self), indent=2))
        return path

    @classmethod
    def load(cls, filename: str) -> "AgentConfig":
        path = CONFIGS_DIR / filename
        data = json.loads(path.read_text())
        return cls(**data)

    @classmethod
    def list_saved(cls) -> list[str]:
        CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
        return [p.name for p in CONFIGS_DIR.glob("*.json")]
