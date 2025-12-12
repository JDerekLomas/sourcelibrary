#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Run scripts/setup_local.sh first." >&2
  exit 1
fi

npm run dev -- --host
