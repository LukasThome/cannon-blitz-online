import asyncio

from server.app.game import GameManager
from server.app.rooms import Room
from server.app.ai import ai_should_act


def test_ai_should_act_battle_turn():
    room = Room(code="TEST")
    room.ai_player_id = room.game.add_ai_player("CPU")
    player = room.game.add_player("P1")
    room.game.state.phase = "battle"
    room.game.state.turn_player_id = room.ai_player_id
    assert ai_should_act(room) is True


def test_ai_should_act_in_placement():
    room = Room(code="TEST")
    room.ai_player_id = room.game.add_ai_player("CPU")
    room.game.add_player("P1")
    room.game.state.phase = "placement"
    room.game.state.players[room.ai_player_id].placement_ready = False
    assert ai_should_act(room) is True
