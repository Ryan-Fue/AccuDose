"""
AccuDose: Pediatric Dosing Copilot -- Streamlit dashboard.

Fixes vs. the original draft:
- All dataframe/dict keys now match what digital_twin.py / env.py actually
  emit (time_minutes, last_action_mg_min -- there was never a
  current_infusion_rate key).
- Uses st.session_state instead of the invalid `st.sidebar.env` pattern.
- Patient demographics are built via PatientPhenotype.from_demographics()
  BEFORE reset(), so enzyme/renal baselines are derived consistently from
  the displayed age/weight rather than left over from a random patient.
- Loads a trained PPO checkpoint if present (runs/accudose_ppo_final.zip);
  falls back to the original heuristic threshold policy if no checkpoint
  exists yet, so the dashboard is usable before you've trained anything.
- Adds the pieces the original app.py described but didn't implement:
  bolus command markers, a real confidence score with clinician hand-back
  gating, and a Monte Carlo trajectory forecast instead of a fixed formula.
"""

import os
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from digital_twin import PatientPhenotype
from env import PediatricDosingEnv
from ensemble_forecast import ensemble_forecast, ConfidenceEstimator

MODEL_PATH = "runs/accudose_ppo_final.zip"
CONFIDENCE_PATH = "runs/confidence_stats.npz"

st.set_page_config(page_title="AccuDose Copilot", layout="wide", page_icon="🩺")

st.title("🩺 AccuDose: Pediatric Dosing Copilot")
st.caption(
    "Real-Time Proteomic Feedback & Generative Trajectory Forecasting Engine "
    "— research prototype, not a clinical device"
)


@st.cache_resource
def load_model():
    try:
        from stable_baselines3 import PPO
        if os.path.exists(MODEL_PATH):
            return PPO.load(MODEL_PATH)
    except Exception:
        pass
    return None


@st.cache_resource
def load_confidence_estimator(n_features: int):
    if os.path.exists(CONFIDENCE_PATH):
        try:
            return ConfidenceEstimator.load(CONFIDENCE_PATH)
        except Exception:
            pass
    return ConfidenceEstimator(n_features=n_features)


model = load_model()
if model is None:
    st.sidebar.warning(
        "No trained checkpoint found at `runs/accudose_ppo_final.zip`. "
        "Falling back to a hand-coded threshold policy. Run `train.py` "
        "to produce a real policy."
    )

st.sidebar.header("Patient Demographics")
age_days = st.sidebar.slider("Age (Days)", 1, 3650, 180)
weight_kg = st.sidebar.slider("Weight (kg)", 2.0, 40.0, 7.5)
gestational_age_weeks = st.sidebar.slider("Gestational Age at Birth (weeks)", 24, 42, 40)
fever_active = st.sidebar.checkbox("Trigger Febrile Episode", value=True)

st.sidebar.header("Copilot Mode")
copilot_mode = st.sidebar.radio(
    "Control Mode",
    ["AI Recommendation (Human Approves)", "Full Manual"],
    index=0,
)
confidence_floor = st.sidebar.slider(
    "Minimum Confidence to Auto-Suggest", 0.0, 1.0, 0.4, 0.05
)

if "env" not in st.session_state:
    st.session_state.env = PediatricDosingEnv()
    st.session_state.confidence_estimator = load_confidence_estimator(
        st.session_state.env.observation_space.shape[0]
    )

env = st.session_state.env
confidence_estimator = st.session_state.confidence_estimator

if st.button("▶ Run Real-Time Simulation Interval (12 Hours)"):
    patient = PatientPhenotype.from_demographics(
        age_days=age_days,
        weight_kg=weight_kg,
        gestational_age_weeks=float(gestational_age_weeks),
    )

    obs, raw_obs = env.reset()
    env.twin.patient = patient
    env.twin.enzyme_activity = patient.baseline_cyp_activity
    env.twin.renal_function = patient.baseline_renal_function
    env.twin._fever_episode_active = fever_active
    env.twin._fever_episode_start = 10.0 if fever_active else None

    history = []
    low_confidence_events = 0

    for step in range(144):
        if model is not None:
            action, _ = model.predict(obs, deterministic=True)
        else:
            c_val = obs[0]
            cyp_val = obs[1]
            if c_val < 2.0:
                action = np.array([0.15, 0.0], dtype=np.float32)
            elif c_val > 6.0:
                action = np.array([-0.20, 0.0], dtype=np.float32)
            else:
                action = np.array([0.01 * (1.0 - cyp_val), 0.0], dtype=np.float32)

        confidence = confidence_estimator.confidence(obs)
        confidence_estimator.update(obs)

        if copilot_mode == "Full Manual" or confidence < confidence_floor:
            action = np.array([0.0, 0.0], dtype=np.float32)  # hold rate, defer to clinician
            if confidence < confidence_floor:
                low_confidence_events += 1

        obs, reward, terminated, truncated, info = env.step(action)
        info["confidence"] = confidence
        history.append(info)

        if terminated:
            st.error(
                f"⚠ Simulation halted at t={info['time_minutes']:.0f} min — "
                "toxicity or concentration safety limit breached."
            )
            break

    st.session_state.history_df = pd.DataFrame(history)
    st.session_state.low_confidence_events = low_confidence_events

if "history_df" in st.session_state:
    df = st.session_state.history_df

    if st.session_state.get("low_confidence_events", 0) > 0:
        st.warning(
            f"🟡 Model confidence dropped below threshold on "
            f"{st.session_state.low_confidence_events} of {len(df)} steps — "
            "control defaulted to a held rate, pending clinician review, "
            "during those intervals."
        )

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Live Proteomic Stream & Drug Concentration")
        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(
            x=df["time_minutes"], y=df["obs_drug_concentration_proxy"],
            name="Observed Drug Conc (mg/L)", line=dict(color="#2563eb"),
        ))
        fig1.add_trace(go.Scatter(
            x=df["time_minutes"], y=df["obs_cyp_activity"],
            name="CYP Enzyme Activity", line=dict(color="#f97316", dash="dash"),
        ))
        fig1.add_hrect(y0=2.0, y1=6.0, fillcolor="green", opacity=0.12,
                        line_width=0, annotation_text="Therapeutic Range")
        fig1.update_layout(xaxis_title="Time (min)", legend=dict(orientation="h"))
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        st.subheader("Smart Infusion Pump Output & Organ Biomarkers")
        fig2 = go.Figure()
        fig2.add_trace(go.Scatter(
            x=df["time_minutes"], y=df["last_action_mg_min"],
            name="Infusion Rate (mg/min)", line=dict(color="#16a34a"),
        ))
        fig2.add_trace(go.Scatter(
            x=df["time_minutes"], y=df["obs_toxicity_marker"],
            name="Toxicity Marker (AKI)", line=dict(color="#dc2626"),
        ))
        if "bolus_given_mg" in df.columns and (df["bolus_given_mg"] > 0).any():
            bolus_rows = df[df["bolus_given_mg"] > 0]
            fig2.add_trace(go.Scatter(
                x=bolus_rows["time_minutes"], y=[0] * len(bolus_rows),
                mode="markers",
                marker=dict(symbol="triangle-up", size=12, color="black"),
                name="Bolus Given",
            ))
        fig2.update_layout(xaxis_title="Time (min)", legend=dict(orientation="h"))
        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Model Confidence Over Time")
    fig_conf = go.Figure()
    fig_conf.add_trace(go.Scatter(
        x=df["time_minutes"], y=df["confidence"],
        name="Confidence Score", line=dict(color="#7c3aed"),
    ))
    fig_conf.add_hline(y=confidence_floor, line_dash="dot",
                        annotation_text="Auto-suggest floor")
    fig_conf.update_layout(xaxis_title="Time (min)", yaxis_range=[0, 1])
    st.plotly_chart(fig_conf, use_container_width=True)

    st.subheader("Generative 4-Hour Trajectory Forecast & Uncertainty")
    st.caption(
        "Forecast is a Monte Carlo rollout of the digital twin under the "
        "last-held infusion rate, not a fixed formula — the band width "
        "reflects the model's actual stochastic dynamics."
    )
    forecast = ensemble_forecast(env.twin, horizon_minutes=240.0, n_ensemble=25)

    fig3 = go.Figure()
    fig3.add_trace(go.Scatter(
        x=forecast["times"], y=forecast["mean"],
        name="Predicted Mean Concentration", line=dict(color="#7c3aed"),
    ))
    fig3.add_trace(go.Scatter(
        x=np.concatenate([forecast["times"], forecast["times"][::-1]]),
        y=np.concatenate([forecast["p90"], forecast["p10"][::-1]]),
        fill="toself", fillcolor="rgba(124,58,237,0.15)",
        line=dict(color="rgba(255,255,255,0)"),
        name="P10–P90 Range",
    ))
    fig3.add_hrect(y0=2.0, y1=6.0, fillcolor="green", opacity=0.08, line_width=0)
    fig3.update_layout(xaxis_title="Time (min)", yaxis_title="Predicted Conc (mg/L)")
    st.plotly_chart(fig3, use_container_width=True)

    st.subheader("Human-in-the-Loop Review")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Final Concentration (mg/L)", f"{df['true_concentration_mg_l'].iloc[-1]:.2f}")
    with c2:
        st.metric("Cumulative Dose (mg)", f"{df['cumulative_dose_mg'].iloc[-1]:.1f}")
    with c3:
        st.metric("Mean Confidence", f"{df['confidence'].mean():.2f}")

    if st.button("✅ Clinician Approves — Log & Continue"):
        st.success("Interval approved and logged. (Wire this to your EHR/audit backend.)")
else:
    st.info("Set patient demographics in the sidebar, then run a simulation interval.")

st.markdown("---")
st.caption(
    "⚠ Research prototype for simulating RL dosing policies against a synthetic "
    "digital twin. Not validated for clinical use. All 'patients' here are "
    "simulated, not real."
)