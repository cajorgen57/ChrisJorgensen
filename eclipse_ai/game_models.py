# SPDX-License-Identifier: MIT
from __future__ import annotations
from enum import Enum, auto

class ActionType(Enum):
    EXPLORE = auto()
    INFLUENCE = auto()
    RESEARCH = auto()
    BUILD = auto()
    UPGRADE = auto()
    MOVE = auto()
