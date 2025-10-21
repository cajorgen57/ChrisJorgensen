# SPDX-License-Identifier: MIT
from __future__ import annotations
import math
from typing import Any, Dict, Optional

def _get_active_player(state: Any) -> Optional[str]:
    try:
        return state.active_player or "you"
    except Exception:
        return None

def _get_player(state: Any, pid: Optional[str]) -> Any:
    try:
        return state.players.get(pid) if (pid and state.players) else None
    except Exception:
        return None

def _read_resource(obj: Any, name: str, default: int = 0) -> int:
    # Robustly read obj.name / obj[name] / obj.resources.name, etc.
    try:
        if hasattr(obj, name):
            return int(getattr(obj, name) or 0)
    except Exception:
        pass
    try:
        return int(obj.get(name, 0))  # dict-like
    except Exception:
        pass
    try:
        res = getattr(obj, "resources", None)
        if res and hasattr(res, name):
            return int(getattr(res, name) or 0)
    except Exception:
        pass
    return default

def infer_round_idx(state: Any, default_round: int = 1) -> int:
    for key in ("round_idx", "round", "turn_idx", "turn"):
        try:
            val = getattr(state, key, None)
            if isinstance(val, int) and val >= 1:
                return val
        except Exception:
            pass
        try:
            meta = getattr(state, "meta", None) or {}
            val = meta.get(key)
            if isinstance(val, int) and val >= 1:
                return val
        except Exception:
            pass
    return default_round

def convertible_vp_shadow(state: Any, action: Any, total_rounds: int, round_idx: int) -> float:
    """
    Phase-aware estimate of VP you can still convert from banked & incoming resources.
    Conservative and schema-tolerant (uses getattr/try/except).
    """
    pid = _get_active_player(state)
    me = _get_player(state, pid)

    mats = _read_resource(me, "materials")
    sci  = _read_resource(me, "science")
    money = _read_resource(me, "money")

    rounds_left = max(0, int(total_rounds) - int(round_idx))

    # Baseline: monoliths at 10 mats → 3 VP each (floor)
    vp_mono = 3.0 * (mats // 10)

    # Science: modest VP unless very late (tech track VPs / unlock a battle)
    vp_tech = 0.0
    if rounds_left <= 2:
        vp_tech = 0.2 * (sci // 4)   # small, conservative bump late

    # Money: flexibility (upkeep, grabbing a hex) – small everywhere
    vp_flex = 0.05 * money

    # If it’s truly last round, assume you can liquidate ~70% of leftover mats → VP via ships/battles.
    if rounds_left == 0:
        vp_battleish = 0.7 * (mats % 10) * 0.20  # tiny proxy (0.2 VP per leftover mat)
    else:
        vp_battleish = 0.0

    return float(vp_mono + vp_tech + vp_flex + vp_battleish)
