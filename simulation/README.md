# Kindact Economic Simulation

Agent-based simulation of the Kindact $CC economy using cadCAD.

## Setup

```bash
cd simulation
python -m venv .venv
./run.sh pip install -e ".[dev]"
```

## Run tests

```bash
./run.sh pytest tests/ -v
```

## Run dashboard

```bash
./run.sh streamlit run app.py
```

> **Note:** `run.sh` runs commands inside the `.venv` without activating it in your shell. You can use it for any command, e.g. `./run.sh python some_script.py`.
