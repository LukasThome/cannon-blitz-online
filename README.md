# Cannon Blitz (Web)

Retro pixel-art rebuild of Cannon Blitz for browser multiplayer.

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
