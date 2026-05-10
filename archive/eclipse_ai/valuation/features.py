# SPDX-License-Identifier: MIT
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict
from ..game_models import ActionType  # enum in your repo

@dataclass
class Features:
    vp_now: float                 # baseline EV from legacy evaluator
    convertible_vp: float         # shadow VP from resources
    econ_growth: float            # heuristic for engine building
    tech_power: float             # heuristic for impactful techs
    fleet_power: float            # heuristic for builds/upgrades/move-to-fight
    map_control: float            # adjacency/safe hex positional value
    risk_penalty: float           # scalar risk mapped to penalty (0..1)
    opp_pressure: float           # threat/pressure proxy (0..1)
    raw: Dict[str, float]         # for debugging/explain

def _lower(s: str) -> str:
    return (s or "").lower()

def _payload_tech_name(action: Any) -> str:
    try:
        return str(action.payload.get("tech", "") or "")
    except Exception:
        return ""

def _econ_tech_score(name_lower: str) -> float:
    keys = ("advanced mining", "advanced labs", "nanorobots")
    return 1.0 if any(k in name_lower for k in keys) else 0.0

def _combat_tech_score(name_lower: str) -> float:
    keys = ("plasma", "positron", "gauss", "ion", "shield", "drive", "hull", "starbase")
    return 1.0 if any(k in name_lower for k in keys) else 0.0

def build_features(state: Any, action: Any, base_score: Any,
                   convertible_vp: float,
                   opponent_pressure: float,
                   risk_penalty_scalar: float) -> Features:
    t = getattr(action, "type", None)
    details = getattr(base_score, "details", {}) or {}
    vp_now = float(getattr(base_score, "expected_vp", 0.0))

    econ_growth = 0.0
    tech_power = 0.0
    fleet_power = 0.0
    map_control = 0.0

    # Simple, robust, action-aware heuristics
    if t == ActionType.EXPLORE:
        econ_growth += 0.8
        map_control += 0.4
    elif t == ActionType.INFLUENCE:
        econ_growth += 0.6
        map_control += 0.3
    elif t == ActionType.RESEARCH:
        name = _lower(_payload_tech_name(action))
        econ_growth += 0.7 * _econ_tech_score(name)
        tech_power += 0.7 * _combat_tech_score(name) + 0.3 * _econ_tech_score(name)
    elif t == ActionType.BUILD:
        # Weight heavier ships a bit higher (mirrors your evaluator’s proxy)
        ships = {}
        try:
            ships = dict(action.payload.get("ships", {}))
        except Exception:
            pass
        fleet_power += 0.15 * int(ships.get("interceptor", 0))
        fleet_power += 0.45 * int(ships.get("cruiser", 0))
        fleet_power += 0.90 * int(ships.get("dreadnought", 0))
        tech_power += 0.15  # building usually pairs with upgrades later
    elif t == ActionType.UPGRADE:
        fleet_power += 0.35
        tech_power += 0.25
    elif t == ActionType.MOVE:
        if details.get("positional"):
            # reward good positional moves
            map_control += 0.3 + 0.2 * float(details.get("territory_ev", 0.0))
        # if we have win prob from combat sim, reflect it
        pwin = float(details.get("combat_win_prob", 0.0))
        fleet_power += 1.2 * pwin

    # risk penalty scalar is already 0..1-ish
    risk_penalty = float(risk_penalty_scalar)

    # If your evaluator filled in a map pressure, reuse it
    opp_pressure = float(details.get("pressure", opponent_pressure))

    return Features(
        vp_now=vp_now,
        convertible_vp=float(convertible_vp),
        econ_growth=float(econ_growth),
        tech_power=float(tech_power),
        fleet_power=float(fleet_power),
        map_control=float(map_control),
        risk_penalty=risk_penalty,
        opp_pressure=opp_pressure,
        raw={
            "vp_now": vp_now,
            "risk": float(getattr(base_score, "risk", 0.0)),
        },
    )
