"""High level decision makers that build plans from planning-capable AIs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

from .planner import PlanResult, PlanningAI, PlanningBoardState, create_plan

ActionT = TypeVar("ActionT")
BoardStateT = TypeVar("BoardStateT", bound="PlanningBoardState[ActionT]")


@dataclass
class NormalDecisionMaker(Generic[ActionT, BoardStateT]):
    """Decision maker that relies on :func:`ai.planner.create_plan` for planning."""

    ai: PlanningAI[ActionT, BoardStateT]

    def make_plan(
        self, board_state: BoardStateT, steps: int
    ) -> PlanResult[ActionT, BoardStateT]:
        """Produce a plan while keeping a cloned board state updated step-by-step."""

        return create_plan(self.ai, board_state, steps)
