from __future__ import annotations

import random
import string
from dataclasses import dataclass, field
from typing import Dict, Optional

from .game import GameManager


def _generate_code(length: int = 5) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


@dataclass
class Room:
    code: str
    game: GameManager = field(default_factory=GameManager)
    connections: Dict[str, object] = field(default_factory=dict)
    max_players: int = 2
    ai_player_id: Optional[str] = None
    ai_difficulty: str = "normal"

    def is_full(self) -> bool:
        return len(self.game.state.players) >= self.max_players

    def is_empty(self) -> bool:
        return len(self.connections) == 0

    def all_disconnected(self) -> bool:
        return all(not p.connected for p in self.game.state.players.values())


class RoomManager:
    def __init__(self) -> None:
        self.rooms: Dict[str, Room] = {}

    def create_room(self) -> Room:
        while True:
            code = _generate_code()
            if code not in self.rooms:
                break
        room = Room(code=code)
        self.rooms[code] = room
        return room

    def get_room(self, code: str) -> Optional[Room]:
        return self.rooms.get(code)

    def remove_room(self, code: str) -> None:
        self.rooms.pop(code, None)
