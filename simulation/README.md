# Kindact Economic Simulation

Agent-based simulation of the Kindact $CC economy using cadCAD.

## Setup

```bash
cd simulation
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Run tests

```bash
pytest tests/ -v
```

## Run dashboard

```bash
streamlit run app.py
```
