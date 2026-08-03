"""
AccuDose API -- FastAPI backend wrapping the PK/PD digital twin, the
POMDP dosing env, and the Monte Carlo forecaster, so a separately-hosted
frontend (e.g. a Lovable app) can drive the simulator over HTTP instead
of embedding Python.

Run locally:
    uvicorn api:app --reload --port 8000

Endpoints:
    GET  /health
    POST /simulate   -- run a 12-hour interval for a given patient, returns
                         the full time series (concentration, enzyme
                         activity, toxicity, infusion rate, confidence).
    GET  /forecast    -- Monte Carlo 4-hour forecast from the *last*
                         simulated state (call /simulate first).

State model: this demo keeps a single in-memory session (one active twin)
for simplicity, matching the original Streamlit app's behavior. For real
multi-user use, key `SESSION` by a session/user id passed from the
frontend and store one twin + confidence estimator per key instead of a
single global.
"""

import os
from typing import List, Optional
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AccuDose API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safely import custom modules
try:
    from digital_twin import PatientPhenotype
    from env import PediatricDosingEnv
    from ensemble_forecast import ensemble_forecast, ConfidenceEstimator
    IMPORTS_OK = True
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    IMPORTS_OK = False

@app.get("/health")
def health():
    return {"status": "ok", "imports_loaded": IMPORTS_OK}

import os
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from digital_twin import PatientPhenotype
from env import PediatricDosingEnv
from ensemble_forecast import ensemble_forecast, ConfidenceEstimator

MODEL_PATH = "runs/accudose_ppo_final.zip"
CONFIDENCE_PATH = "runs/confidence_stats.npz"

app = FastAPI(title="AccuDose API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_model():
    try:
        from stable_baselines3 import PPO
        if os.path.exists(MODEL_PATH):
            return PPO.load(MODEL_PATH)
    except Exception:
        pass
    return None


def _load_confidence_estimator(n_features: int) -> ConfidenceEstimator:
    if os.path.exists(CONFIDENCE_PATH):
        try:
            return ConfidenceEstimator.load(CONFIDENCE_PATH)
        except Exception:
            pass
    return ConfidenceEstimator(n_features=n_features)


_MODEL = _load_model()

SESSION = {
    "env": PediatricDosingEnv(),
    "confidence_estimator": None,
}
SESSION["confidence_estimator"] = _load_confidence_estimator(
    SESSION["env"].observation_space.shape[0]
)


class SimulateRequest(BaseModel):
    age_days: float
    weight_kg: float
    gestational_age_weeks: float = 40.0
    fever_active: bool = True
    mode: str = "ai"
    confidence_floor: float = 0.4
    n_steps: int = 144


class TimePoint(BaseModel):
    time_minutes: float
    true_concentration_mg_l: float
    obs_drug_concentration_proxy: float
    obs_cyp_activity: float
    obs_toxicity_marker: float
    last_action_mg_min: float
    bolus_given_mg: float
    cumulative_dose_mg: float
    confidence: float


class SimulateResponse(BaseModel):
    points: List[TimePoint]
    terminated_early: bool
    termination_reason: Optional[str] = None
    low_confidence_events: int
    model_loaded: bool


class ForecastPoint(BaseModel):
    time_minutes: float
    mean: float
    p10: float
    p90: float


class ForecastResponse(BaseModel):
    points: List[ForecastPoint]


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _MODEL is not None}


@app.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    if req.mode not in ("ai", "manual"):
        raise HTTPException(400, "mode must be 'ai' or 'manual'")

    env = SESSION["env"]
    confidence_estimator = SESSION["confidence_estimator"]

    patient = PatientPhenotype.from_demographics(
        age_days=req.age_days,
        weight_kg=req.weight_kg,
        gestational_age_weeks=req.gestational_age_weeks,
    )

    obs, raw_obs = env.reset()
    env.twin.patient = patient
    env.twin.enzyme_activity = patient.baseline_cyp_activity
    env.twin.renal_function = patient.baseline_renal_function
    env.twin._fever_episode_active = req.fever_active
    env.twin._fever_episode_start = 10.0 if req.fever_active else None

    points: List[TimePoint] = []
    low_confidence_events = 0
    terminated_early = False
    termination_reason = None

    for _ in range(req.n_steps):
        if _MODEL is not None:
            action, _ = _MODEL.predict(obs, deterministic=True)
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

        if req.mode == "manual" or confidence < req.confidence_floor:
            action = np.array([0.0, 0.0], dtype=np.float32)
            if confidence < req.confidence_floor:
                low_confidence_events += 1

        obs, reward, terminated, truncated, info = env.step(action)

        points.append(TimePoint(
            time_minutes=info["time_minutes"],
            true_concentration_mg_l=info["true_concentration_mg_l"],
            obs_drug_concentration_proxy=info["obs_drug_concentration_proxy"],
            obs_cyp_activity=info["obs_cyp_activity"],
            obs_toxicity_marker=info["obs_toxicity_marker"],
            last_action_mg_min=info["last_action_mg_min"],
            bolus_given_mg=info["bolus_given_mg"],
            cumulative_dose_mg=info["cumulative_dose_mg"],
            confidence=confidence,
        ))

        if terminated:
            terminated_early = True
            termination_reason = "toxicity_or_concentration_safety_limit_breached"
            break

    return SimulateResponse(
        points=points,
        terminated_early=terminated_early,
        termination_reason=termination_reason,
        low_confidence_events=low_confidence_events,
        model_loaded=_MODEL is not None,
    )


@app.get("/forecast", response_model=ForecastResponse)
def forecast(horizon_minutes: float = 240.0, n_ensemble: int = 25):
    env = SESSION["env"]
    if env.twin.patient is None:
        raise HTTPException(400, "No active simulation. Call /simulate first.")

    result = ensemble_forecast(
        env.twin, horizon_minutes=horizon_minutes, n_ensemble=n_ensemble
    )

    points = [
        ForecastPoint(
            time_minutes=float(t),
            mean=float(m),
            p10=float(p10),
            p90=float(p90),
        )
        for t, m, p10, p90 in zip(
            result["times"], result["mean"], result["p10"], result["p90"]
        )
    ]
    return ForecastResponse(points=points)
