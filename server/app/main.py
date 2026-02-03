from __future__ import annotations

import asyncio
import json
import random
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .rooms import RoomManager, Room
from .auth import verify_id_token

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "https://cannon-blitz-online.vercel.app",
    ],
    allow_origin_regex=r"^https://.*\\.vercel\\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

rooms = RoomManager()
lock = asyncio.Lock()


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


def _apply_ai(room: Room) -> None:
    if not room.ai_player_id:
        return
    game = room.game
    ai_id = room.ai_player_id

    if game.state.phase == "placement":
        if not game.state.players[ai_id].placement_ready:
            _ai_place_bases(room)
        return

    if game.state.phase == "battle" and game.state.turn_player_id == ai_id:
        shot_type = _ai_choose_shot(room)
        game.state.last_message, game.state.last_impacts = game.shot(ai_id, shot_type)


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


async def broadcast_room(room: Room) -> None:
    state = room.game.serialize()
    payload = {"type": "room_state", "data": state, "room_code": room.code}
    for ws in list(room.connections.values()):
        await ws.send_json(payload)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    player_id = None
    room_code = None
    try:
        while True:
            raw = await ws.receive_text()
            message = json.loads(raw)
            msg_type = message.get("type")

            async with lock:
                if msg_type == "create_room":
                    token = message.get("idToken")
                    verify_id_token(token)
                    name = message.get("name", "Jogador")
                    room = rooms.create_room()
                    player_id = room.game.add_player(name)
                    room.connections[player_id] = ws
                    room_code = room.code
                    await ws.send_json(
                        {"type": "joined", "player_id": player_id, "room_code": room_code}
                    )
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "create_ai_room":
                    token = message.get("idToken")
                    verify_id_token(token)
                    name = message.get("name", "Jogador")
                    difficulty = message.get("difficulty", "normal")
                    room = rooms.create_room()
                    room.ai_difficulty = difficulty
                    player_id = room.game.add_player(name)
                    room.ai_player_id = room.game.add_ai_player("CPU")
                    room.connections[player_id] = ws
                    room_code = room.code
                    room.game.set_ready(player_id, True)
                    room.game.set_ready(room.ai_player_id, True)
                    _apply_ai(room)
                    await ws.send_json(
                        {"type": "joined", "player_id": player_id, "room_code": room_code}
                    )
                    await broadcast_room(room)
                elif msg_type == "join_room":
                    token = message.get("idToken")
                    verify_id_token(token)
                    name = message.get("name", "Jogador")
                    code = (message.get("room_code") or "").upper()
                    room = rooms.get_room(code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    if room.is_full():
                        await ws.send_json({"type": "error", "message": "Sala cheia"})
                        continue
                    player_id = room.game.add_player(name)
                    room.connections[player_id] = ws
                    room_code = room.code
                    await ws.send_json(
                        {"type": "joined", "player_id": player_id, "room_code": room_code}
                    )
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "reconnect":
                    token = message.get("idToken")
                    verify_id_token(token)
                    code = (message.get("room_code") or "").upper()
                    reconnect_id = message.get("player_id")
                    room = rooms.get_room(code)
                    if not room or reconnect_id not in room.game.state.players:
                        await ws.send_json({"type": "error", "message": "Reconexao invalida"})
                        continue
                    player_id = reconnect_id
                    room_code = room.code
                    room.connections[player_id] = ws
                    room.game.reconnect_player(player_id)
                    await ws.send_json(
                        {"type": "joined", "player_id": player_id, "room_code": room_code}
                    )
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "leave_room":
                    if room_code and player_id:
                        room = rooms.get_room(room_code)
                        if room:
                            room.game.remove_player(player_id)
                            room.connections.pop(player_id, None)
                            await broadcast_room(room)
                            if room.is_empty():
                                rooms.remove_room(room_code)
                            room_code = None
                            player_id = None
                elif msg_type == "ready":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    token = message.get("idToken")
                    verify_id_token(token)
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    ready = bool(message.get("ready", False))
                    room.game.state.last_message = room.game.set_ready(player_id, ready)
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "place_base":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    token = message.get("idToken")
                    verify_id_token(token)
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    pos = tuple(message.get("pos", []))
                    room.game.state.last_message = room.game.place_base(player_id, pos)
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "buy_base":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    token = message.get("idToken")
                    verify_id_token(token)
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    pos = tuple(message.get("pos", []))
                    room.game.state.last_message = room.game.buy_base(player_id, pos)
                    _apply_ai(room)
                    await broadcast_room(room)
                elif msg_type == "shot":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    token = message.get("idToken")
                    verify_id_token(token)
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    shot_type = message.get("shot_type")
                    msg, impacts = room.game.shot(player_id, shot_type)
                    room.game.state.last_message = msg
                    room.game.state.last_impacts = impacts
                    _apply_ai(room)
                    await broadcast_room(room)
                else:
                    await ws.send_json({"type": "error", "message": "Mensagem invalida"})
    except WebSocketDisconnect:
        if player_id and room_code:
            async with lock:
                room = rooms.get_room(room_code)
                if room:
                    room.game.disconnect_player(player_id)
                    room.connections.pop(player_id, None)
                    await broadcast_room(room)
