#!/usr/bin/env bash
# Run any command inside the simulation venv without activating it in your shell.
# Usage:
#   ./run.sh pytest tests/ -v
#   ./run.sh streamlit run app.py
#   ./run.sh python some_script.py

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
export VIRTUAL_ENV="$DIR/.venv"
export PATH="$DIR/.venv/bin:$PATH"
exec "$@"
