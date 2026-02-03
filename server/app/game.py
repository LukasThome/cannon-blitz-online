from __future__ import annotations

import random
import uuid
from typing import Dict, List, Optional, Tuple

from .models import GameState, Player, Position


class GameManager:
    def __init__(self) -> None:
        self.state = GameState()

    def add_player(self, name: str) -> str:
        player_id = str(uuid.uuid4())
        self.state.players[player_id] = Player(player_id=player_id, name=name)
        self.state.bases[player_id] = set()
        self.state.normal_candidates[player_id] = self.state.all_positions()

        if len(self.state.players) == 1:
            self.state.phase = "lobby"
            self.state.last_message = "Sala criada. Aguardando outro jogador"
        elif len(self.state.players) == 2:
            self.state.phase = "lobby"
            self.state.last_message = "Dois jogadores conectados. Marquem pronto"
        else:
            self.state.last_message = "Sala cheia"

        return player_id

    def remove_player(self, player_id: str) -> None:
        if player_id in self.state.players:
            self.state.players[player_id].connected = False
            self.state.phase = "ended"
            self.state.winner_id = self.state.enemy_id(player_id)
            self.state.last_message = "Oponente desistiu"

    def disconnect_player(self, player_id: str) -> None:
        player = self.state.players.get(player_id)
        if not player:
            return
        player.connected = False
        self.state.last_message = "Oponente desconectou"

    def reconnect_player(self, player_id: str) -> None:
        player = self.state.players.get(player_id)
        if not player:
            return
        player.connected = True
        self.state.last_message = "Oponente reconectou"

    def set_ready(self, player_id: str, ready: bool) -> str:
        if self.state.phase != "lobby":
            return "Nao e possivel alterar pronto agora"
        player = self.state.players.get(player_id)
        if not player:
            return "Jogador invalido"
        player.ready = ready
        if self._both_lobby_ready():
            self._start_placement()
            return "Jogadores prontos. Coloquem suas bases"
        return "Pronto atualizado"

    def place_base(self, player_id: str, pos: Position) -> str:
        if self.state.phase != "placement":
            return "A partida nao esta em fase de colocacao"

        bases = self.state.bases[player_id]
        if pos in bases:
            return "Posicao ocupada"
        if len(bases) >= self.state.max_bases:
            return "Limite de bases atingido"

        bases.add(pos)
        if len(bases) == self.state.max_bases:
            self.state.players[player_id].placement_ready = True

        if self._both_placement_ready():
            self._start_battle()

        return "Base colocada"

    def buy_base(self, player_id: str, pos: Position) -> str:
        if self.state.phase != "battle":
            return "A partida precisa estar em andamento"

        player = self.state.players[player_id]
        if player.saldo < 2:
            return "Saldo insuficiente"
        if pos in self.state.bases[player_id]:
            return "Posicao ocupada"

        player.saldo -= 2
        self.state.bases[player_id].add(pos)
        self._end_turn()
        return "Base comprada"

    def shot(self, player_id: str, shot_type: str) -> Tuple[str, List[Position]]:
        if self.state.phase != "battle":
            return "A partida precisa estar em andamento", []
        if self.state.turn_player_id != player_id:
            return "Nao e seu turno", []

        player = self.state.players[player_id]
        if shot_type == "normal":
            impacts = self._shot_normal(player_id)
        elif shot_type == "precise":
            if player.saldo < 1:
                return "Saldo insuficiente", []
            player.saldo -= 1
            impacts = self._shot_precise(player_id)
        elif shot_type == "strong":
            if player.saldo < 3:
                return "Saldo insuficiente", []
            player.saldo -= 3
            impacts = self._shot_strong(player_id)
        else:
            return "Tipo de tiro invalido", []

        self.state.last_shooter_id = player_id
        self._apply_impacts(player_id, impacts)
        self._check_victory(player_id)
        if self.state.phase != "ended":
            self._end_turn()
        return "Tiro efetuado", impacts

    def serialize(self) -> Dict:
        players = [
            {
                "id": p.player_id,
                "name": p.name,
                "saldo": p.saldo,
                "ready": p.ready,
                "placement_ready": p.placement_ready,
                "connected": p.connected,
            }
            for p in self.state.players.values()
        ]

        return {
            "rows": self.state.rows,
            "cols": self.state.cols,
            "max_bases": self.state.max_bases,
            "phase": self.state.phase,
            "turn_player_id": self.state.turn_player_id,
            "winner_id": self.state.winner_id,
            "players": players,
            "bases": {pid: list(bases) for pid, bases in self.state.bases.items()},
            "last_impacts": self.state.last_impacts,
            "message": self.state.last_message,
            "last_shooter_id": self.state.last_shooter_id,
        }

    def _both_lobby_ready(self) -> bool:
        if len(self.state.players) < 2:
            return False
        return all(p.ready for p in self.state.players.values())

    def _both_placement_ready(self) -> bool:
        if len(self.state.players) < 2:
            return False
        return all(p.placement_ready for p in self.state.players.values())

    def _start_placement(self) -> None:
        self.state.phase = "placement"
        for p in self.state.players.values():
            p.placement_ready = False
        self.state.last_message = "Coloquem suas bases"

    def _start_battle(self) -> None:
        self.state.phase = "battle"
        self.state.turn_player_id = random.choice(list(self.state.players.keys()))
        self.state.last_message = "Partida iniciada"

    def _end_turn(self) -> None:
        enemy_id = self.state.enemy_id(self.state.turn_player_id or "")
        if enemy_id:
            self.state.turn_player_id = enemy_id

    def _shot_normal(self, player_id: str) -> List[Position]:
        enemy_id = self.state.enemy_id(player_id)
        if not enemy_id:
            return []
        candidates = self.state.normal_candidates[player_id]
        if not candidates:
            candidates = self.state.all_positions()
            self.state.normal_candidates[player_id] = candidates

        pos = random.choice(tuple(candidates))
        # If miss, remove this position to improve accuracy over time.
        if pos not in self.state.bases[enemy_id]:
            candidates.discard(pos)
        else:
            # Reset on hit to mimic recalibration.
            self.state.normal_candidates[player_id] = self.state.all_positions()
        return [pos]

    def _shot_precise(self, player_id: str) -> List[Position]:
        enemy_id = self.state.enemy_id(player_id)
        if not enemy_id:
            return []
        enemy_bases = list(self.state.bases[enemy_id])
        if enemy_bases and random.random() < 0.5:
            return [random.choice(enemy_bases)]

        # Miss: choose a random empty spot if possible
        empty = list(self.state.all_positions() - self.state.bases[enemy_id])
        if empty:
            return [random.choice(empty)]
        return [random.choice(tuple(self.state.all_positions()))]

    def _shot_strong(self, player_id: str) -> List[Position]:
        enemy_id = self.state.enemy_id(player_id)
        if not enemy_id:
            return []
        center = random.choice(tuple(self.state.all_positions()))
        cr, cc = center
        impacts = []
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                r, c = cr + dr, cc + dc
                if 0 <= r < self.state.rows and 0 <= c < self.state.cols:
                    impacts.append((r, c))
        return impacts

    def _apply_impacts(self, player_id: str, impacts: List[Position]) -> None:
        enemy_id = self.state.enemy_id(player_id)
        if not enemy_id:
            return

        hits = 0
        for pos in impacts:
            if pos in self.state.bases[enemy_id]:
                self.state.bases[enemy_id].remove(pos)
                hits += 1
        if hits:
            self.state.players[player_id].saldo += hits

        self.state.last_impacts = impacts

    def _check_victory(self, player_id: str) -> None:
        enemy_id = self.state.enemy_id(player_id)
        if not enemy_id:
            return
        if not self.state.bases[enemy_id]:
            self.state.phase = "ended"
            self.state.winner_id = player_id
            self.state.last_message = "Partida encerrada"
