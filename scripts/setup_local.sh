#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

VENV_DIR=".venv"
PYTHON_BIN="${PYTHON:-python3}"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Error: python3 is required but was not found in PATH" >&2
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment in $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
else
  echo "Virtual environment already exists at $VENV_DIR"
fi

PYTHON_BIN="$VENV_DIR/bin/python"
PIP_CMD=("$PYTHON_BIN" -m pip)

echo "Installing backend dependencies"
"${PIP_CMD[@]}" install --upgrade pip
"${PIP_CMD[@]}" install -r backend/requirements.txt

if [ -d "frontend" ]; then
  echo "Installing frontend dependencies"
  (cd frontend && npm install)
else
  echo "Warning: frontend directory not found, skipping npm install"
fi

echo "Local setup complete"
