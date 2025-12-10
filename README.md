# One Time Setup (Mac)

### Backend Setup
1. Open Terminal.
2. Create virtual environment: `python3 -m venv .venv`
3. Activate the virtual environment: `source .venv/bin/activate`
4. On successful activation, `(.venv)` would appear on the left of the terminal command line.
   - (Optional) Further verify succesful activation:
     - Type command: `which python`
     - It should show the path of python in the newly created `.venv` directory.
     - Example Output: `<Path>/<Of>/<Your>/<Project>/.venv/bin/python`
5. Install packages: `pip install -r ./backend/requirements.txt`

### Frontend Setup
1. Open new Terminal.
2. Go to the _frontend_ directory: `cd frontend`
3. Install packages: `npm install`

---
# Running Server + Website Locally

### Backend
1. Open Terminal.
2. Activate the virtual environment: `source .venv/bin/activate`
3. Start server: `python backend/src/main.py`

### Frontend
1. Go to the _frontend_ directory: `cd frontend`
2. Run command: `npm run dev`

---
##### Website URL: http://localhost:5173/root
**User Name:** `root` | **Password:** `admin@5678`