# SPDX-License-Identifier: MIT
from __future__ import annotations
import os
from dataclasses import dataclass
from typing import Any, Dict

from .phase import PhaseConfig, weights_for_round
from .risk import RiskProfile, penalty_from_scalar_risk
from .resource_prices import convertible_vp_shadow, infer_round_idx
from .opponent import opponent_pressure_proxy
from .features import build_features
from .explain import merge_breakdown

@dataclass
class ValuationConfig:
    phase: PhaseConfig = PhaseConfig()
    risk: RiskProfile = RiskProfile()

def _read_env_int(name: str, default_val: int) -> int:
    try:
        if name in os.environ:
            return int(os.environ[name])
    except Exception:
        pass
    return default_val

def _coerce_score(obj: Any, expected_vp: float, details: Dict[str, Any]) -> Any:
    """
    Try to mutate Score in-place; fall back to creating a new Score-compatible object.
    """
    try:
        obj.expected_vp = float(expected_vp)
        obj.details = details
        return obj
    except Exception:
        try:
            cls = obj.__class__
            return cls(expected_vp=float(expected_vp), risk=getattr(obj, "risk", 0.0), details=details)
        except Exception:
            # Worst case: return original, unmodified
            return obj

def apply_phase_valuation(state: Any, action: Any, base_score: Any,
                          cfg: ValuationConfig = ValuationConfig()) -> Any:
    """
    Phase-aware post-processor for your existing evaluator Score.

    It DOES NOT re-simulate. It:
      - Detects round (or uses env overrides)
      - Computes features from (state, action, base_score.details)
      - Applies early/late weights
      - Adds a transparent breakdown into Score.details["valuation"]
      - Returns a Score-like object with adjusted expected_vp
    """
    total_rounds = _read_env_int("ECLIPSE_TOTAL_ROUNDS", cfg.phase.total_rounds)
    round_idx = _read_env_int("ECLIPSE_ROUND", infer_round_idx(state, default_round=1))

    # Phase weights
    W = weights_for_round(round_idx, PhaseConfig(
        total_rounds=total_rounds,
        early_until_round=cfg.phase.early_until_round,
        taper_rounds=cfg.phase.taper_rounds,
    ))

    # Shadow VP from resources
    cvp = convertible_vp_shadow(state, action, total_rounds=total_rounds, round_idx=round_idx)

    # Risk & pressure proxies
    risk_scalar = penalty_from_scalar_risk(getattr(base_score, "risk", 0.0), cfg.risk)
    opp = opponent_pressure_proxy(state, action)

    # Assemble features
    F = build_features(state, action, base_score, cvp, opp, risk_scalar)

    # IMPORTANT: `vp_now` (baseline EV) is already inside base_score.expected_vp
    # We add only the *bonus/malus* components around it.
    components = {
        "vp_now": F.vp_now,  # for transparency only; not added again
        "convertible_vp": W.convertible_vp * F.convertible_vp,
        "econ_growth":    W.econ_growth * F.econ_growth,
        "tech_power":     W.tech_power * F.tech_power,
        "fleet_power":    W.fleet_power * F.fleet_power,
        "map_control":    W.map_control * F.map_control,
        "risk_penalty":  -W.risk_penalty * F.risk_penalty,
        "opp_pressure":  -W.opp_pressure * F.opp_pressure,
    }

    bonus = sum(v for k, v in components.items() if k != "vp_now")
    new_vp = float(F.vp_now + bonus)

    # Merge explainable breakdown
    details = merge_breakdown(getattr(base_score, "details", {}) or {}, components, round_idx, total_rounds)

    # Return an updated Score
    return _coerce_score(base_score, expected_vp=new_vp, details=details)
