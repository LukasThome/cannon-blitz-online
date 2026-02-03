# Cannon Blitz (Web)

Retro pixel-art rebuild of Cannon Blitz for browser multiplayer.

## CI
- GitHub Actions runs the test suite on every push and pull request.

## Deploy
### Vercel (Frontend)
- Import the GitHub repo.
- Set **Root Directory** to `web/`.
- Framework: **Other**
- Build Command: empty
- Output Directory: `.`

### Railway (Backend)
- Create a Railway project from this repo.
- Set service root to `server/`.
- Start command:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### One-click deploy
- Vercel:
  [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/LukasThome/cannon-blitz-online&root-directory=web)
- Railway:
  [Deploy on Railway](https://railway.app/new/template?template=https://github.com/LukasThome/cannon-blitz-online&rootDirectory=server)

### WebSocket URL
You can pass the backend URL via query string or the lobby input:
```text
https://your-vercel-app.vercel.app/?ws=wss://your-railway-app.up.railway.app/ws
```

## UX Notes
- Sounds are opt-in via the `Som: Off/On` toggle.
- Popups guide the player at key moments: placement start, battle start, victory, and defeat.
- Single Player: click `Single Player` in the lobby and choose difficulty (Easy/Normal/Hard).

## Structure
- `docs/` Original UML and requirements
- `server/` FastAPI + WebSockets multiplayer backend
- `web/` PixiJS frontend

## Quick Start

### Backend
```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
Open `web/index.html` in a local static server (recommended) so WebSockets work consistently.
For example:
```bash
cd web
python -m http.server 5173
```
Then open `http://localhost:5173` in a browser.

## Notes
This is a new repo built from the requirements in `docs/Especificação de Requisitos Cannon Blitz .pdf` and the UML diagrams in `docs/*.drawio`.
