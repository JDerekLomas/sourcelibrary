## Local Setup Snapshot

- `.venv` was recreated with `python3.13` so every backend dependency (FastAPI, Spacy, etc.) now installs cleanly.
- `npm install` already ran inside `frontend`, so `node_modules` is ready to go.
- Helper scripts live under `scripts/` to keep the routine consistent.

### What To Do Next

1. **Activate / reinstall if needed**
   ```bash
   # only rerun if you blow away node_modules or .venv
   PYTHON=python3.13 ./scripts/setup_local.sh
   ```
2. **Start the API (Terminal #1)**
   ```bash
   ./scripts/run_backend.sh
   # optional: ENVIRONMENT=production WORKERS=1 ./scripts/run_backend.sh
   ```
   - Runs `backend/src/main.py` with CORS open to `http://localhost:5173`
   - Needs MongoDB/S3 credentials in `backend/.env` (already populated; swap to `.env.example` if you prefer your own keys)
3. **Start the frontend (Terminal #2)**
   ```bash
   ./scripts/run_frontend.sh
   ```
   - Vite dev server on `http://localhost:5173/root`
4. **Log in and smoke-test**
   - Username `root`
   - Password `admin@5678`
   - Hit Books → Add Book, OCR Translation, etc. to verify API endpoints are reachable.

### Troubleshooting Reminders

- If your default `python3` points to 3.14, export `PYTHON=python3.13` (or install 3.11/3.12) before rerunning the setup script.
- macOS may block FastAPI/Vite from binding to ports the first time; grant your terminal “Full Disk Access” or acknowledge the firewall prompt.
- To avoid auto-reload errors in production-like testing, run the backend with `ENVIRONMENT=production`.

Ping me if you need containerization or Procfile/Compose support later. For now, both services are ready for manual `npm run dev` / `python main.py` workflows. 
