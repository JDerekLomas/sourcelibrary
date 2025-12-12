#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

VENV_DIR=".venv"
PYTHON_BIN="$VENV_DIR/bin/python"

if [ ! -x "$PYTHON_BIN" ]; then
  echo "Error: $PYTHON_BIN not found. Run scripts/setup_local.sh first." >&2
  exit 1
fi

source "$VENV_DIR/bin/activate"
trap 'deactivate >/dev/null 2>&1 || true' EXIT

export ENVIRONMENT=${ENVIRONMENT:-development}
python backend/src/main.py
