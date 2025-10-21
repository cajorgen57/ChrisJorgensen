# SPDX-License-Identifier: MIT
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class Score:
    expected_vp: float
    risk: float
    details: Dict[str, Any]

def evaluate_action(state: Any, action: Any) -> Score:
    """Baseline evaluator stub returning a neutral score."""
    return Score(expected_vp=0.0, risk=0.0, details={})

# === Phase-aware valuation wrapper (append to end of file) ====================
# This keeps your current evaluate_action() logic intact and post-processes the Score.

try:
    _EVALUATE_ACTION_BASELINE = evaluate_action  # keep a handle

    def evaluate_action(state, action):  # type: ignore[no-redef]
        """
        Wrapper that applies phase-aware, risk-aware valuation on top of
        the baseline Score computed by the original evaluator.
        """
        base = _EVALUATE_ACTION_BASELINE(state, action)
        try:
            from .valuation.engine import apply_phase_valuation
            return apply_phase_valuation(state, action, base)
        except Exception:
            # If anything goes wrong in the new engine, fail open to baseline.
            return base

except Exception:
    # If evaluator was not yet defined for some reason, leave file unchanged.
    pass
# =============================================================================
