"""Tests to ensure sequential planning keeps the board state up to date."""
from __future__ import annotations

import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ai import NormalDecisionMaker, PlanResult, create_plan


@dataclass
class DummyBoardState:
    """Simple board representation for testing sequential decisions."""

    moves: List[str]

    def apply_action(self, action: str) -> None:
        """Apply the provided action to the board."""
        self.moves.append(action)

    def clone(self) -> "DummyBoardState":
        """Return a copy so planning can simulate future turns."""
        return DummyBoardState(moves=self.moves.copy())


class DummyAI:
    """AI that returns a predetermined sequence of actions."""

    def __init__(self, planned_actions: List[str]) -> None:
        self._planned_actions = planned_actions
        self.observed_move_counts: List[int] = []

    def choose_action(self, board_state: DummyBoardState) -> str:
        """Select the next action based on the current board state."""
        index = len(board_state.moves)
        self.observed_move_counts.append(index)
        return self._planned_actions[index]


def test_board_state_is_updated_after_each_action() -> None:
    """Ensure board_state.apply_action is called after every AI move."""
    planned_actions = ["move_a", "move_b", "move_c"]
    board_state = DummyBoardState(moves=[])
    ai = DummyAI(planned_actions)

    first_action = ai.choose_action(board_state)
    board_state.apply_action(first_action)

    second_action = ai.choose_action(board_state)
    board_state.apply_action(second_action)

    third_action = ai.choose_action(board_state)
    board_state.apply_action(third_action)

    assert board_state.moves == planned_actions


def test_create_plan_updates_planning_board_state() -> None:
    """Planning must update the simulated board state after each action."""
    planned_actions = ["move_a", "move_b", "move_c"]
    board_state = DummyBoardState(moves=[])
    ai = DummyAI(planned_actions)

    result: PlanResult[str, DummyBoardState] = create_plan(
        ai=ai,
        board_state=board_state,
        steps=len(planned_actions),
    )

    assert result.actions == planned_actions
    assert result.resulting_state.moves == planned_actions
    assert ai.observed_move_counts == [0, 1, 2]
    assert board_state.moves == []  # The original board remains untouched.


def test_orion_round_one_case_updates_planning_state() -> None:
    """The Orion round 1 scenario keeps the simulated board in sync while planning."""

    planned_actions = ["orion_round1_move_a", "orion_round1_move_b"]
    board_state = DummyBoardState(moves=[])
    ai = DummyAI(planned_actions)
    decision_maker = NormalDecisionMaker(ai=ai)

    plan = decision_maker.make_plan(board_state=board_state, steps=len(planned_actions))

    assert plan.actions == planned_actions
    assert plan.resulting_state.moves == planned_actions
    assert ai.observed_move_counts == [0, 1]
    assert (
        board_state.moves == []
    )  # Planning should use a clone leaving the live board unaffected.
