"""Utilities for building sequential AI plans with updated board state."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, List, Protocol, TypeVar

ActionT = TypeVar("ActionT")
BoardStateT = TypeVar("BoardStateT", bound="PlanningBoardState[ActionT]")


class PlanningBoardState(Protocol[ActionT]):
    """Protocol describing the minimum board-state API required for planning."""

    def clone(self: BoardStateT) -> BoardStateT:
        """Return a copy of the current board state for simulation purposes."""

    def apply_action(self, action: ActionT) -> None:
        """Apply an action to mutate the board state."""


class PlanningAI(Protocol[ActionT, BoardStateT]):
    """Protocol for AIs that pick actions based on a board state."""

    def choose_action(self, board_state: BoardStateT) -> ActionT:
        """Return the next action to execute given the supplied board state."""


@dataclass
class PlanResult(Generic[ActionT, BoardStateT]):
    """Result of creating a plan with an AI."""

    actions: List[ActionT]
    resulting_state: BoardStateT


def create_plan(
    ai: PlanningAI[ActionT, BoardStateT],
    board_state: BoardStateT,
    steps: int,
) -> PlanResult[ActionT, BoardStateT]:
    """Create a plan by repeatedly querying the AI and updating the board state.

    A copy of the input board state is produced via :meth:`PlanningBoardState.clone`
    so that the original is untouched during planning. Each action returned by the AI
    is immediately applied to the simulated board state ensuring subsequent
    decisions see the most recent state.

    Args:
        ai: The AI capable of returning sequential actions.
        board_state: The starting board state for planning.
        steps: The number of actions to include in the plan.

    Returns:
        A :class:`PlanResult` containing the generated actions and the resulting
        board state after all actions have been applied.
    """

    simulated_state = board_state.clone()
    actions: List[ActionT] = []

    for _ in range(steps):
        action = ai.choose_action(simulated_state)
        simulated_state.apply_action(action)
        actions.append(action)

    return PlanResult(actions=actions, resulting_state=simulated_state)

