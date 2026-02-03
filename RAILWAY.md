# Railway Deploy (Backend)

## Steps
1. Create a new Railway project.
2. Add a new service from this repo.
3. Set the service root to `server/`.
4. Set start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Deploy.

## Notes
- WebSockets are used, so keep the service on an always-on plan if possible.
- Use Railway's public URL for the frontend WebSocket URL.
