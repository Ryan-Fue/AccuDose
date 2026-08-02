"""
Trains a PPO policy on PediatricDosingEnv and fits a ConfidenceEstimator
on the observation stream so the dashboard can flag out-of-distribution
physiology at inference time.

Usage:
    python train.py --timesteps 2000000 --n-envs 8 --out runs/
"""

import argparse
import os
import numpy as np

from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import SubprocVecEnv, VecMonitor
from stable_baselines3.common.callbacks import CheckpointCallback

from env import PediatricDosingEnv
from ensemble_forecast import ConfidenceEstimator


def make_env(seed: int):
    def _init():
        return PediatricDosingEnv(seed=seed)
    return _init


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--timesteps", type=int, default=2_000_000)
    parser.add_argument("--n-envs", type=int, default=8)
    parser.add_argument("--out", type=str, default="runs")
    parser.add_argument("--probe-steps", type=int, default=20_000)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    vec_env = SubprocVecEnv([make_env(seed=i) for i in range(args.n_envs)])
    vec_env = VecMonitor(vec_env)

    model = PPO(
        "MlpPolicy",
        vec_env,
        verbose=1,
        n_steps=1024,
        batch_size=1024,
        learning_rate=3e-4,
        gamma=0.995,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.001,
        tensorboard_log=os.path.join(args.out, "tb"),
    )

    checkpoint_cb = CheckpointCallback(
        save_freq=max(50_000 // args.n_envs, 1),
        save_path=os.path.join(args.out, "checkpoints"),
        name_prefix="accudose_ppo",
    )

    model.learn(total_timesteps=args.timesteps, callback=checkpoint_cb)
    model.save(os.path.join(args.out, "accudose_ppo_final"))

    # ---- Fit confidence estimator on a fresh probe rollout ----
    probe_env = PediatricDosingEnv(seed=123)
    obs, _ = probe_env.reset()
    estimator = ConfidenceEstimator(n_features=obs.shape[0])

    for _ in range(args.probe_steps):
        action, _ = model.predict(obs, deterministic=True)
        estimator.update(obs)
        obs, reward, terminated, truncated, info = probe_env.step(action)
        if terminated or truncated:
            obs, _ = probe_env.reset()

    estimator.save(os.path.join(args.out, "confidence_stats.npz"))
    print(f"Training complete. Model + confidence stats saved to {args.out}/")


if __name__ == "__main__":
    main()