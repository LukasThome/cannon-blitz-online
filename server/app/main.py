from __future__ import annotations

import asyncio
import json
from typing import Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .rooms import RoomManager, Room

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
                    name = message.get("name", "Jogador")
                    room = rooms.create_room()
                    player_id = room.game.add_player(name)
                    room.connections[player_id] = ws
                    room_code = room.code
                    await ws.send_json(
                        {"type": "joined", "player_id": player_id, "room_code": room_code}
                    )
                    await broadcast_room(room)
                elif msg_type == "join_room":
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
                    await broadcast_room(room)
                elif msg_type == "reconnect":
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
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    ready = bool(message.get("ready", False))
                    room.game.state.last_message = room.game.set_ready(player_id, ready)
                    await broadcast_room(room)
                elif msg_type == "place_base":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    pos = tuple(message.get("pos", []))
                    room.game.state.last_message = room.game.place_base(player_id, pos)
                    await broadcast_room(room)
                elif msg_type == "buy_base":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    pos = tuple(message.get("pos", []))
                    room.game.state.last_message = room.game.buy_base(player_id, pos)
                    await broadcast_room(room)
                elif msg_type == "shot":
                    if not room_code or not player_id:
                        await ws.send_json({"type": "error", "message": "Nao esta em sala"})
                        continue
                    room = rooms.get_room(room_code)
                    if not room:
                        await ws.send_json({"type": "error", "message": "Sala inexistente"})
                        continue
                    shot_type = message.get("shot_type")
                    msg, impacts = room.game.shot(player_id, shot_type)
                    room.game.state.last_message = msg
                    room.game.state.last_impacts = impacts
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
