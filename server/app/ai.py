import random
from typing import Optional

from .rooms import Room


def ai_should_act(room: Room) -> bool:
    if not room.ai_player_id:
        return False
    game = room.game
    ai_id = room.ai_player_id
    if game.state.phase == "placement":
        return not game.state.players[ai_id].placement_ready
    if game.state.phase == "battle":
        return game.state.turn_player_id == ai_id
    return False


def _ai_place_bases(room: Room) -> None:
    ai_id = room.ai_player_id
    if not ai_id:
        return
    game = room.game
    bases = game.state.bases[ai_id]
    all_positions = list(game.state.all_positions())
    random.shuffle(all_positions)
    for pos in all_positions:
        if len(bases) >= game.state.max_bases:
            break
        if pos in bases:
            continue
        game.place_base(ai_id, pos)


def _ai_choose_shot(room: Room) -> str:
    game = room.game
    ai = game.state.players[room.ai_player_id]
    saldo = ai.saldo
    difficulty = room.ai_difficulty
    if difficulty == "easy":
        return "normal"
    if difficulty == "hard":
        if saldo >= 3:
            return "strong"
        if saldo >= 1:
            return "precise"
        return "normal"
    # normal
    if saldo >= 1 and random.random() < 0.5:
        return "precise"
    return "normal"


def apply_ai(room: Room) -> bool:
    if not room.ai_player_id:
        return False
    game = room.game
    ai_id = room.ai_player_id

    if game.state.phase == "placement":
        if not game.state.players[ai_id].placement_ready:
            _ai_place_bases(room)
            return True
        return False

    if game.state.phase == "battle" and game.state.turn_player_id == ai_id:
        shot_type = _ai_choose_shot(room)
        game.state.last_message, game.state.last_impacts = game.shot(ai_id, shot_type)
        return True

    return False
