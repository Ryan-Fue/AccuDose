"""
Generative trajectory forecasting + confidence scoring.
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
