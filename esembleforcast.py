"""
Generative trajectory forecasting + confidence scoring.

Two independent pieces the dashboard needs, per the project spec:

1. ensemble_forecast(): the "Projected Dosing Curve" -- a real, model-derived
   forecast of where drug concentration is headed over the next N hours,
   with an uncertainty band that comes from actually resampling the twin's
   stochastic dynamics (enzyme volatility, temperature noise, observation
   noise), rather than a fixed exponential-decay formula with an arbitrary
   growing band.

2. ConfidenceEstimator: the "Uncertainty / Confidence Score" safety metric --
   a lightweight out-of-distribution detector over the *policy's* observation
   space. It tracks running mean/variance of features seen during training
   and scores new observations by how far they fall from that distribution.
   This is a proxy, not a learned uncertainty estimate; a natural upgrade
   path is ensemble Q-value disagreement (train k critics, disagreement =
   uncertainty) or a VAE reconstruction-error detector over the state
   history. Swap it in behind the same .confidence(obs) interface.
"""

import copy
import numpy as np
from typing import Dict, Optional

from digital_twin import PediatricPKPDTwin


def ensemble_forecast(
    twin: PediatricPKPDTwin,
    horizon_minutes: float = 240.0,
    n_ensemble: int = 25,
    held_infusion_rate: Optional[float] = None,
    seed: Optional[int] = None,
) -> Dict[str, np.ndarray]:
    """
    Roll `n_ensemble` independently-noised copies of the current twin state
    forward under a held infusion rate (defaults to the last commanded
    rate) to produce a generative forecast with a model-derived uncertainty
    band.

    Note: this deep-copies the twin `n_ensemble` times and steps each one
    `horizon_minutes / dt` times, so cost scales as O(n_ensemble * n_steps).
    For dt=5min and a 4h horizon that's 48 steps/copy -- cheap enough to run
    per dashboard refresh, but don't call this inside the training loop.
    """
    rng = np.random.default_rng(seed)
    dt = twin.cfg.dt_minutes
    n_steps = int(horizon_minutes // dt)
    rate = held_infusion_rate if held_infusion_rate is not None else twin.last_action_mg_min

    trajectories = np.zeros((n_ensemble, n_steps))
    times = twin.t_minutes + np.arange(1, n_steps + 1) * dt

    for i in range(n_ensemble):
        sim = copy.deepcopy(twin)
        sim.rng = np.random.default_rng(rng.integers(0, 2**31 - 1))
        for s in range(n_steps):
            obs = sim.step(infusion_rate_mg_min=rate)
            trajectories[i, s] = obs["true_concentration_mg_l"]

    return {
        "times": times,
        "mean": trajectories.mean(axis=0),
        "std": trajectories.std(axis=0),
        "p10": np.percentile(trajectories, 10, axis=0),
        "p90": np.percentile(trajectories, 90, axis=0),
        "all_trajectories": trajectories,
    }


class ConfidenceEstimator:
    """
    Running (mean, var) tracker over the policy's flattened observation
    vector, used to score how "in-distribution" a live observation is
    relative to what was seen during training. Confidence is squashed to
    (0, 1] via exp(-mahalanobis_like_distance / 2).

    Use .update(obs) during training rollouts (or a dedicated probe
    rollout) to build up statistics, then .confidence(obs) at inference
    time. Save/load lets you ship the fitted stats alongside a trained
    policy checkpoint.
    """

    def __init__(self, n_features: int, decay: float = 0.001):
        self.mean = np.zeros(n_features)
        self.var = np.ones(n_features)
        self.count = 1e-4
        self.decay = decay

    def update(self, x: np.ndarray) -> None:
        x = np.asarray(x, dtype=np.float64)
        self.count += 1
        delta = x - self.mean
        self.mean += delta / self.count
        delta2 = x - self.mean
        self.var = (1 - self.decay) * self.var + self.decay * (delta * delta2)
        self.var = np.maximum(self.var, 1e-6)

    def confidence(self, x: np.ndarray) -> float:
        x = np.asarray(x, dtype=np.float64)
        z = (x - self.mean) / np.sqrt(self.var)
        dist = float(np.sqrt(np.mean(z ** 2)))
        return float(np.exp(-dist / 2.0))

    def save(self, path: str) -> None:
        np.savez(path, mean=self.mean, var=self.var, count=self.count)

    @classmethod
    def load(cls, path: str) -> "ConfidenceEstimator":
        data = np.load(path)
        est = cls(n_features=len(data["mean"]))
        est.mean = data["mean"]
        est.var = data["var"]
        est.count = float(data["count"])
        return est