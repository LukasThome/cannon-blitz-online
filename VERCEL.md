# Vercel Deploy (Frontend)

## Steps
1. Create a new Vercel project from the GitHub repo.
2. Set **Root Directory** to `web/`.
3. Framework preset: **Other**.
4. Build Command: leave empty.
5. Output Directory: `.`
6. Deploy.

## WebSocket URL
Use one of these to point the frontend to the Railway backend:
- Add `?ws=wss://YOUR-RAILWAY-URL/ws` to the game URL.
- Or paste the WebSocket URL in the lobby `WebSocket URL` field and it will be saved.

Example:
```
https://your-vercel-app.vercel.app/?ws=wss://your-railway-app.up.railway.app/ws
```
