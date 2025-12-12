# Local Development

This project uses a FastAPI backend (`backend/src/main.py`) and a Vite + React frontend (`frontend`). The repo now includes helper scripts so you can bootstrap a clean laptop in a couple of commands.

## Quick Start

```bash
# install Python + Node dependencies (creates .venv automatically)
./scripts/setup_local.sh

# terminal 1 – start the API
./scripts/run_backend.sh

# terminal 2 – start the frontend dev server
./scripts/run_frontend.sh
```

- API: http://localhost:8080  
- Website: http://localhost:5173/root  
- Default login: `root` / `admin@5678`

> The backend reads configuration from `backend/.env`. If you don't want to use the committed secrets, copy `backend/.env.example` to `backend/.env` and fill in your own keys before starting the server.

Need more step-by-step context? See `docs/local_run_notes.md`.

## Manual Setup (if you prefer)

### Backend (Python 3.11+)
1. `python3 -m venv .venv`
2. `source .venv/bin/activate`
3. `pip install -r backend/requirements.txt`
4. `cp backend/.env.example backend/.env` and update the values (only needed once)

### Frontend (Node 18+)
1. `cd frontend`
2. `npm install`

## Running Without Scripts

### Backend
1. `source .venv/bin/activate`
2. `python backend/src/main.py`

### Frontend
1. `cd frontend`
2. `npm run dev -- --host`
