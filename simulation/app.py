import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import copy

from kindact_sim.run import run_simulation
from kindact_sim.scenarios import SCENARIOS
from kindact_sim.config import build_experiment
from kindact_sim.state import build_genesis_state

st.set_page_config(page_title="Kindact Economy Simulator", layout="wide")
st.title("🌱 Kindact Economy Simulator")

# --- Sidebar Controls ---
with st.sidebar:
    st.header("Scenario")
    scenario_name = st.selectbox(
        "Preset scenario",
        options=list(SCENARIOS.keys()),
        format_func=lambda x: f"{x} — {SCENARIOS[x].description[:60]}...",
    )

    st.header("Parameters")
    demurrage = st.slider("Demurrage rate (%/month)", 0.1, 5.0, 1.0, 0.1) / 100
    reward = st.slider("Reward per issue ($CC)", 10, 200, 50, 10)
    issues_rate = st.slider("Issues per user/month", 0.5, 5.0, 2.0, 0.5)
    growth_rate = st.slider("New users/month (avg)", 0, 50, 15, 1)
    verification_q = st.slider("Verification quality", 0.5, 1.0, 0.9, 0.05)
    hypercert_prob = st.slider("Hypercert sale probability", 0.0, 0.5, 0.1, 0.01)
    hypercert_price = st.slider("Avg Hypercert price ($)", 100, 5000, 1000, 100)

    st.header("Simulation")
    n_runs = st.slider("Monte Carlo runs", 1, 100, 1)
    seed = st.number_input("Random seed", value=42, step=1)

    run_button = st.button("▶ Run Simulation", type="primary", use_container_width=True)


def _run_custom(scenario_name: str, n_runs: int, seed: int,
                demurrage_rate: float, param_overrides: dict) -> pd.DataFrame:
    """Run simulation with custom parameter and state overrides."""
    custom_scenario = copy.deepcopy(SCENARIOS[scenario_name])
    custom_scenario.params.update(param_overrides)

    SCENARIOS['_custom'] = custom_scenario

    # Monkey-patch genesis builder to inject custom demurrage_rate
    _orig_build = build_genesis_state.__wrapped__ if hasattr(build_genesis_state, '__wrapped__') else build_genesis_state

    def _patched_genesis(n_users=50, r_target=1_000_000, seed=None):
        state = _orig_build(n_users=n_users, r_target=r_target, seed=seed)
        state['demurrage_rate'] = demurrage_rate
        return state

    import kindact_sim.config as config_mod
    orig_fn = config_mod.build_genesis_state
    config_mod.build_genesis_state = _patched_genesis
    try:
        df = run_simulation('_custom', n_runs=n_runs, seed=seed)
    finally:
        config_mod.build_genesis_state = orig_fn
        SCENARIOS.pop('_custom', None)
    return df


# --- Run simulation ---
if run_button:
    param_overrides = {
        'reward_per_issue': float(reward),
        'issues_per_user_month': float(issues_rate),
        'verification_quality': float(verification_q),
        'growth_rate': int(growth_rate),
        'hypercert_sale_prob': float(hypercert_prob),
        'hypercert_avg_price': float(hypercert_price),
    }

    with st.spinner("Running simulation..."):
        df = _run_custom(scenario_name, n_runs=n_runs, seed=int(seed),
                         demurrage_rate=float(demurrage), param_overrides=param_overrides)

    st.session_state['df'] = df
    st.session_state['scenario_name'] = scenario_name
    st.session_state['n_runs'] = n_runs

if 'df' in st.session_state:
    df = st.session_state['df']
    stored_n_runs = st.session_state.get('n_runs', 1)

    # --- Charts ---
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Supply & Reserve")
        if stored_n_runs > 1 and 'run' in df.columns and df['run'].nunique() > 1:
            grouped = df.groupby('timestep').agg(
                supply_med=('supply', 'median'),
                supply_lo=('supply', lambda x: x.quantile(0.1)),
                supply_hi=('supply', lambda x: x.quantile(0.9)),
                reserve_med=('reserve_fiat', 'median'),
                reserve_lo=('reserve_fiat', lambda x: x.quantile(0.1)),
                reserve_hi=('reserve_fiat', lambda x: x.quantile(0.9)),
            ).reset_index()
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_med'], name='Supply (median)', line=dict(color='#2196F3')), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_lo'], fill=None, mode='lines', line=dict(width=0), showlegend=False), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['supply_hi'], fill='tonexty', mode='lines', line=dict(width=0), name='Supply 10-90%', fillcolor='rgba(33,150,243,0.2)'), secondary_y=False)
            fig.add_trace(go.Scatter(x=grouped['timestep'], y=grouped['reserve_med'], name='Reserve USD (median)', line=dict(color='#4CAF50')), secondary_y=True)
            fig.update_yaxes(title_text="$CC Supply", secondary_y=False)
            fig.update_yaxes(title_text="Reserve (USD)", secondary_y=True)
        else:
            run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns else df
            fig = make_subplots(specs=[[{"secondary_y": True}]])
            fig.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['supply'], name='Supply', line=dict(color='#2196F3')), secondary_y=False)
            fig.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['reserve_fiat'], name='Reserve (USD)', line=dict(color='#4CAF50')), secondary_y=True)
            fig.update_yaxes(title_text="$CC Supply", secondary_y=False)
            fig.update_yaxes(title_text="Reserve (USD)", secondary_y=True)
        fig.update_layout(height=400, margin=dict(t=30, b=30))
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("Exchange Rate")
        run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['exchange_rate'], name='Exchange Rate', line=dict(color='#FF9800')))
        fig2.add_hline(y=1.0, line_dash="dash", line_color="gray", annotation_text="$1 target")
        fig2.update_layout(height=400, margin=dict(t=30, b=30), yaxis_title="$CC → USD")
        st.plotly_chart(fig2, use_container_width=True)

    col3, col4 = st.columns(2)

    with col3:
        st.subheader("Backing Ratio")
        run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
        backing = run_df['reserve_fiat'] / run_df['supply'].replace(0, float('nan'))
        fig3 = go.Figure()
        fig3.add_trace(go.Scatter(x=run_df['timestep'], y=backing, name='Backing Ratio', line=dict(color='#9C27B0')))
        fig3.add_hline(y=0.05, line_dash="dash", line_color="red", annotation_text="5% danger threshold")
        fig3.update_layout(height=400, margin=dict(t=30, b=30), yaxis_title="Reserve / Supply")
        st.plotly_chart(fig3, use_container_width=True)

    with col4:
        st.subheader("Agent Population & Confidence")
        run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
        fig4 = make_subplots(specs=[[{"secondary_y": True}]])
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['n_agents'], name='Total Agents', line=dict(color='#00BCD4')), secondary_y=False)
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['avg_confidence'], name='Avg Confidence', line=dict(color='#E91E63')), secondary_y=True)
        fig4.add_trace(go.Scatter(x=run_df['timestep'], y=run_df['n_panicking'], name='Panicking', line=dict(color='#F44336', dash='dot')), secondary_y=False)
        fig4.update_yaxes(title_text="Count", secondary_y=False)
        fig4.update_yaxes(title_text="Confidence (0-1)", secondary_y=True)
        fig4.update_layout(height=400, margin=dict(t=30, b=30))
        st.plotly_chart(fig4, use_container_width=True)

    col5, col6 = st.columns(2)

    with col5:
        st.subheader("Confidence Distribution (Latest)")
        run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
        last_row = run_df.iloc[-1]
        if isinstance(last_row.get('agents'), list):
            confidences = [a.confidence for a in last_row['agents']]
            fig5 = go.Figure(data=[go.Histogram(x=confidences, nbinsx=20, marker_color='#E91E63')])
            fig5.update_layout(height=350, margin=dict(t=30, b=30), xaxis_title="Confidence", yaxis_title="Count")
            st.plotly_chart(fig5, use_container_width=True)

    with col6:
        st.subheader("Redemption Queue Depth")
        run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
        if 'redemption_queue' in run_df.columns:
            queue_depth = run_df['redemption_queue'].apply(lambda q: len(q) if isinstance(q, list) else 0)
            fig6 = go.Figure()
            fig6.add_trace(go.Scatter(x=run_df['timestep'], y=queue_depth, name='Queue Depth', fill='tozeroy', line=dict(color='#FF5722')))
            fig6.update_layout(height=350, margin=dict(t=30, b=30), yaxis_title="Agents waiting")
            st.plotly_chart(fig6, use_container_width=True)

    # --- Event Log ---
    st.subheader("Event Log")
    run_df = df[df['run'] == df['run'].iloc[0]] if 'run' in df.columns and df['run'].nunique() > 1 else df
    all_events = []
    for _, row in run_df.iterrows():
        if isinstance(row.get('events_log'), list):
            all_events.extend(row['events_log'])
    if all_events:
        st.dataframe(pd.DataFrame(all_events), use_container_width=True)
    else:
        st.info("No events logged.")
else:
    st.info("👈 Configure parameters and click **Run Simulation** to start.")
