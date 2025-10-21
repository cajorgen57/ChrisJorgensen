# SPDX-License-Identifier: MIT
from __future__ import annotations
from typing import Dict, Any

def merge_breakdown(details: Dict[str, Any],
                    components: Dict[str, float],
                    round_idx: int,
                    total_rounds: int) -> Dict[str, Any]:
    """Attach a stable 'valuation' section to Score.details."""
    d = dict(details or {})
    d.setdefault("valuation", {})
    d["valuation"]["components"] = {k: round(float(v), 3) for k, v in components.items()}
    d["valuation"]["round_idx"] = int(round_idx)
    d["valuation"]["total_rounds"] = int(total_rounds)
    return d
