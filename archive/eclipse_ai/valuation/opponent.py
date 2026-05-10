# SPDX-License-Identifier: MIT
from __future__ import annotations
from typing import Any

def opponent_pressure_proxy(state: Any, action: Any) -> float:
    """
    0..1-ish proxy of how hot the local neighborhood is.
    Falls back to 0 if state schema doesn't expose needed fields.
    """
    # Try to reuse any pressure your evaluator already computed (e.g., research case).
    try:
        # If the caller passed Score.details with "pressure", engine will pick it up separately.
        # Here we only do a coarse fallback on the map if available.
        m = getattr(state, "map", None)
        hexes = getattr(m, "hexes", {}) if m else {}
        contested = 0
        yours = 0
        pid = getattr(state, "active_player", None)
        for hx in getattr(hexes, "values", lambda: [])():
            pieces = getattr(hx, "pieces", {})
            you_here = pid in pieces and any(int(v) > 0 for v in getattr(pieces[pid], "ships", {}).values())
            if you_here:
                yours += 1
                others = sum(int(v) for owner, p in pieces.items() if owner != pid for v in getattr(p, "ships", {}).values()) + int(getattr(p, "starbase", 0))
                if others > 0:
                    contested += 1
        if yours == 0:
            return 0.0
        frac = contested / float(max(1, yours))
        return max(0.0, min(1.0, 0.2 + 0.6 * frac))
    except Exception:
        return 0.0
