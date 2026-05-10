# SPDX-License-Identifier: MIT
from __future__ import annotations
from dataclasses import dataclass

@dataclass
class RiskProfile:
    mode: str = "balanced"  # "greedy" | "balanced" | "safe"

def penalty_from_scalar_risk(risk_0_to_1: float, profile: RiskProfile) -> float:
    """Map your existing scalar Score.risk (0..1) to a penalty we can subtract."""
    r = max(0.0, min(1.0, float(risk_0_to_1)))
    if profile.mode == "greedy":
        return 0.10 * r
    if profile.mode == "safe":
        return 0.75 * r
    return 0.35 * r
