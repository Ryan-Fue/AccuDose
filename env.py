"""
Gymnasium environment wrapping the PediatricPKPDTwin as a POMDP.

Design choices, matching the project spec:

- Observation: the agent never sees the true latent state directly
  (true_concentration_mg_l, true_enzyme_activity, etc.) -- only the noisy
  obs_* proxies plus demographics/pump state. To give the agent a chance
  at filtering the hidden state from noisy sparse-feeling signals, the
  last `history_len` raw observations are stacked, giving it short-term
  temporal context instead of a single Markov-looking snapshot.

- Action: a single continuous Box with two dimensions:
    action[0] -- delta infusion rate (mg/min), the micro-adjustment control
    action[1] -- bolus signal in [0, 1]; crossing BOLUS_ACTION_THRESHOLD
                 triggers a fixed-size bolus push. Kept as a continuous
                 dimension (rather than a Dict/Discrete mix) so standard
                 SB3 algorithms (PPO, SAC, TD3) work out of the box.

- Reward: R_t = w1 * TTR_t - w2 * Toxicity_t - w3 * |a_t - a_{t-1}|
  implemented below as ttr / tox_penalty / chatter_penalty.
"""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from collections import deque
from typing import Dict, Any, Tuple, Optional

from digital_twin import PediatricPKPDTwin, PatientPhenotype, TwinConfig


RAW_FEATURE_NAMES = [
    "obs_drug_concentration_proxy",
    "obs_cyp_activity",
    "obs_toxicity_marker",
    "obs_core_temp_c",
    "obs_renal_clearance_proxy",
    "age_days_norm",
    "weight_kg",
    "bsa_m2",
    "last_action_mg_min",
    "cumulative_dose_mg_norm",
]

N_RAW_FEATURES = len(RAW_FEATURE_NAMES)


class PediatricDosingEnv(gym.Env):
    metadata = {"render_modes": []}

    BOLUS_MG = 5.0
    BOLUS_ACTION_THRESHOLD = 0.5  # action[1] above this fires a bolus

    def __init__(
        self,
        config: Optional[TwinConfig] = None,
        max_steps: int = 288,
        history_len: int = 6,
        reward_weights: Tuple[float, float, float] = (1.0, 0.5, 0.1),
        fixed_patient: Optional[PatientPhenotype] = None,
        seed: Optional[int] = None,
    ):
        super().__init__()
        self.twin = PediatricPKPDTwin(config=config, seed=seed)
        self.max_steps = max_steps
        self.history_len = history_len
        self.w1, self.w2, self.w3 = reward_weights
        self.fixed_patient = fixed_patient
        self.current_step = 0
        self._history: deque = deque(maxlen=history_len)
        self._last_action = np.zeros(2, dtype=np.float32)

        self.action_space = spaces.Box(
            low=np.array([-0.5, 0.0], dtype=np.float32),
            high=np.array([0.5, 1.0], dtype=np.float32),
        )

        self.observation_space = spaces.Box(
            low=-np.inf, high=np.inf,
            shape=(N_RAW_FEATURES * history_len,), dtype=np.float32
        )

    # -----------------------------------------------------------------
    def _raw_features(self, obs_dict: Dict[str, Any]) -> np.ndarray:
        return np.array([
            obs_dict["obs_drug_concentration_proxy"],
            obs_dict["obs_cyp_activity"],
            obs_dict["obs_toxicity_marker"],
            obs_dict["obs_core_temp_c"],
            obs_dict["obs_renal_clearance_proxy"],
            obs_dict["age_days"] / 365.0,
            obs_dict["weight_kg"],
            obs_dict["bsa_m2"],
            obs_dict["last_action_mg_min"],
            obs_dict["cumulative_dose_mg"] / 100.0,
        ], dtype=np.float32)

    def _stacked_obs(self) -> np.ndarray:
        return np.concatenate(list(self._history), axis=0).astype(np.float32)

    # -----------------------------------------------------------------
    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        super().reset(seed=seed)
        patient = self.fixed_patient

        if seed is not None:
            self.twin = PediatricPKPDTwin(config=self.twin.cfg, seed=seed)

        raw_obs = self.twin.reset(patient=patient)
        self.current_step = 0
        self._last_action = np.zeros(2, dtype=np.float32)

        feats = self._raw_features(raw_obs)
        self._history.clear()
        for _ in range(self.history_len):
            self._history.append(feats.copy())

        return self._stacked_obs(), raw_obs

    # -----------------------------------------------------------------
    def step(self, action: np.ndarray):
        self.current_step += 1
        action = np.asarray(action, dtype=np.float32)

        delta_rate = float(np.clip(action[0], -0.5, 0.5))
        bolus_signal = float(action[1]) if len(action) > 1 else 0.0
        bolus_mg = self.BOLUS_MG if bolus_signal > self.BOLUS_ACTION_THRESHOLD else 0.0

        new_rate = float(np.clip(self.twin.last_action_mg_min + delta_rate, 0.0, 5.0))
        raw_obs = self.twin.step(infusion_rate_mg_min=new_rate, bolus_mg=bolus_mg)

        true_c = raw_obs["true_concentration_mg_l"]
        true_tox = raw_obs["true_toxicity_marker"]
        cfg = self.twin.cfg

        # ---- Time-in-therapeutic-range component ----
        if cfg.therapeutic_low_mg_l <= true_c <= cfg.therapeutic_high_mg_l:
            ttr = 1.0
        elif true_c < cfg.therapeutic_low_mg_l:
            ttr = -0.5 * (cfg.therapeutic_low_mg_l - true_c)
        else:
            ttr = -0.3 * (true_c - cfg.therapeutic_high_mg_l)

        # ---- Toxicity component (severe, disproportionate) ----
        tox_penalty = 10.0 * true_tox
        if true_c > cfg.toxic_threshold_mg_l:
            tox_penalty += 5.0 * (true_c - cfg.toxic_threshold_mg_l)

        # ---- Chattering / erratic-adjustment component ----
        action_delta = np.abs(action - self._last_action).sum()
        chatter_penalty = float(action_delta)
        self._last_action = action.copy()

        reward = self.w1 * ttr - self.w2 * tox_penalty - self.w3 * chatter_penalty

        terminated = bool(true_tox > 2.0 or true_c > 15.0)
        truncated = bool(self.current_step >= self.max_steps)

        self._history.append(self._raw_features(raw_obs))

        info = dict(raw_obs)
        info["bolus_given_mg"] = bolus_mg
        info["reward"] = reward
        info["reward_components"] = {
            "ttr": ttr,
            "tox_penalty": tox_penalty,
            "chatter_penalty": chatter_penalty,
        }

        return self._stacked_obs(), reward, terminated, truncated, info