# Cannon Blitz Web - Multiplayer Lobby Plan

This plan tracks the work to add a multiplayer lobby with room codes for the PixiJS + FastAPI WebSocket rebuild.

## Goals
- Allow multiple rooms (matches) to run in parallel.
- Players can create or join a room via a short code.
- Keep current game rules intact and isolate state per room.
- Provide clean UX for lobby flow (create, join, ready, start).

## Scope
- Backend: room manager, per-room game state, WebSocket routing.
- Frontend: lobby UI, room code entry, status views.
- Networking: message schema updates, per-room broadcast.
- Testing: basic manual flows and edge cases.

## Tasks
1. Backend architecture
1. Implement `RoomManager` to create and track rooms
1. Generate short room codes (e.g., 5-6 chars)
1. Store `GameManager` per room
1. Add room lifecycle: empty room cleanup

2. WebSocket protocol
1. Define message types: `create_room`, `join_room`, `leave_room`, `room_state`
1. Update server to route messages by room
1. Update broadcast to only room participants
1. Include `room_code` in `joined` response

3. Lobby flow
1. Create frontend lobby overlay (create/join)
1. Add input for room code
1. Show player list + ready status
1. Add ready toggle
1. Auto-start game when 2 players ready

4. Game state isolation
1. Ensure actions are rejected when not in a room
1. Ensure actions are rejected when phase is `lobby`
1. Reset UI on room leave/disconnect

5. UX polish
1. Add clear errors for invalid/expired rooms
1. Add reconnect handling (optional)
1. Add copy-to-clipboard room code

6. Manual test checklist
1. Create room -> second player joins -> both ready -> game starts
1. Create room -> creator leaves -> room closes
1. Join invalid room -> error
1. Two rooms running simultaneously

## Decisions Needed
- Room code format: numeric vs alphanumeric
- Max rooms / max players per room
- Ready rules: auto-ready on join or manual

## Progress Log
- 2026-02-02: Plan created, work queued.
- 2026-02-02: Implemented room manager, lobby protocol, and basic UI overlay.
