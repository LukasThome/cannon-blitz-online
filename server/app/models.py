from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple


Position = Tuple[int, int]


@dataclass
class Player:
    player_id: str
    name: str
    saldo: int = 0
    ready: bool = False
    placement_ready: bool = False
    connected: bool = True


@dataclass
class GameState:
    rows: int = 3
    cols: int = 5
    max_bases: int = 5
    phase: str = "lobby"  # lobby | placement | battle | ended
    turn_player_id: Optional[str] = None
    winner_id: Optional[str] = None
    players: Dict[str, Player] = field(default_factory=dict)
    bases: Dict[str, Set[Position]] = field(default_factory=dict)
    normal_candidates: Dict[str, Set[Position]] = field(default_factory=dict)
    last_impacts: List[Position] = field(default_factory=list)
    last_message: str = ""
    last_shooter_id: Optional[str] = None

    def all_positions(self) -> Set[Position]:
        return {(r, c) for r in range(self.rows) for c in range(self.cols)}

    def enemy_id(self, player_id: str) -> Optional[str]:
        for pid in self.players:
            if pid != player_id:
                return pid
        return None
