import copy
from kindact_sim.run import run_simulation
from kindact_sim.agent_config import AgentConfig
from kindact_sim.scenarios import SCENARIOS

cfg = AgentConfig.load("pessimistic.json")


def run_with(overrides, label):
    sc = copy.deepcopy(SCENARIOS["bootstrap"])
    sc.params.update(overrides)
    SCENARIOS["_tmp"] = sc
    try:
        df = run_simulation("_tmp", n_runs=1, seed=42, agent_config=cfg, timesteps=120)
    finally:
        SCENARIOS.pop("_tmp")
    log = df.iloc[-1]["events_log"]
    print(f"\n=== {label} ===")
    for e in log:
        t = e["timestep"]
        if t in (12, 24, 48, 72, 96, 119):
            print(f"  t={t:3d} supply={e['supply_before']:11.0f} "
                  f"reward_mult={e.get('reward_multiplier'):.3f} "
                  f"work_mint={e['work_minting']:8.0f} "
                  f"spec_fiat_in={e['reserve_in_purchases']:8.0f} "
                  f"phase={e['phase']}")


def test_default():
  # Default: ratchet off (pressure=0), speculation_intensity=0.4
  run_with({}, "DEFAULT (ratchet off, spec=0.4)")
 
def test_runaway():  
  # Ratchet on, low internalization -> runaway
  run_with({"reward_pressure": 0.03, "commons_internalization": 0.1}, "RATCHET pressure=3%/mo, internalize=0.1 (runaway)")

def test_restrained():
  # Ratchet on, high internalization -> restrained
  run_with({"reward_pressure": 0.03, "commons_internalization": 0.9, "reward_brake_strength": 1.0}, "RATCHET pressure=3%/mo, internalize=0.9 (restrained)")
