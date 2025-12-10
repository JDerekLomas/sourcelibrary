# CodexTranslation2

A minimal end-to-end stack that keeps the translator workflow in focus while sketching the governance, curation, reader, and infrastructure surfaces described in the roadmap. Everything runs locally with a FastAPI backend and a Vite/React frontend so we can evolve the details once the happy-path is working.

## What ships in this skeleton?

- **Program governance hooks** via in-memory role permissions, edit requests, and audit notes that every OCR/translation run emits.
- **Translator workspace** with prompt editing, context-aware panels, simulated OCR/translation runs, comment threads, and version snapshots.
- **Library curation & admin** table to assign DOIs, version IDs, and feature toggles per book.
- **Reader experience** grid with keyword filtering and feature badges.
- **Shared infrastructure view** surfacing version-store/search/automation health plus the pending edit queue.

The backend uses deterministic placeholder text instead of real AI so the pipelines are observable without API keys. Swap in real services later by replacing the generator helpers in `backend/app/storage.py`.

## Getting started

```bash
cd codextranslation2

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/translator (Vite will print the exact URL) and point the frontend to the backend running on http://localhost:8000.

## Next steps

1. Replace in-memory stores with persistence (Mongo/Postgres + S3) and wire the OCR/translation endpoints to real AI providers.
2. Flesh out tenant-specific role settings and authentication so curators/admins/readers have scoped views.
3. Expand the translator diff approvals so edit requests can be approved/merged directly from the UI.
4. Connect the shared infrastructure panel to actual job queues, DOI services, and the version-controlled content store.
