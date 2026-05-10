# SPDX-License-Identifier: MIT
from __future__ import annotations
from dataclasses import dataclass

@dataclass
class PhaseConfig:
    total_rounds: int = 9         # Eclipse standard
    early_until_round: int = 6    # 1–6 = growth mode; 7–9 = VP mode
    taper_rounds: int = 2         # smooth handoff 6→8

@dataclass
class PhaseWeights:
    # weights applied to normalized/heuristic features (NOT counting vp_now)
    convertible_vp: float
    econ_growth: float
    tech_power: float
    fleet_power: float
    map_control: float
    risk_penalty: float   # subtractive
    opp_pressure: float   # subtractive

EARLY = PhaseWeights(
    convertible_vp=0.45,
    econ_growth=1.00,
    tech_power=0.70,
    fleet_power=0.30,
    map_control=0.55,
    risk_penalty=0.15,
    opp_pressure=0.10,
)

LATE = PhaseWeights(
    convertible_vp=0.95,
    econ_growth=0.15,
    tech_power=0.20,
    fleet_power=0.90,
    map_control=0.45,
    risk_penalty=0.40,
    opp_pressure=0.25,
)

def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t

def _blend(a: PhaseWeights, b: PhaseWeights, t: float) -> PhaseWeights:
    return PhaseWeights(**{
        k: _lerp(getattr(a, k), getattr(b, k), t) for k in a.__dict__.keys()
    })

def weights_for_round(round_idx: int, cfg: PhaseConfig) -> PhaseWeights:
    # Hard late if past early cutoff
    if round_idx > cfg.early_until_round:
        return LATE
    # Taper into LATE during the final "taper_rounds" of early
    start = max(1, cfg.early_until_round - cfg.taper_rounds + 1)
    if round_idx < start:
        return EARLY
    span = max(1, cfg.early_until_round - start + 1)
    t = (round_idx - start) / float(span)  # 0..1 across taper
    return _blend(EARLY, LATE, t)
