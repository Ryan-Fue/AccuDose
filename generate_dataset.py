"""
AccuDose: Pediatric Clinical Trajectory Dataset Generator.

Generates a realistic, full-scale synthetic dataset representing pediatric
clinical scenarios encountered in hospital wards and PICUs (Pediatric Intensive
Care Units).

Stratified Patient Cohorts:
1. Neonates & Preterm Infants (Age: 1-30d, Weight: 1.5-4.5kg, PMA: 26-38w) - 30%
2. Infants with Febrile Stress Episodes (Age: 30-365d, Active Fever) - 35%
3. Organ Impairment & Drug-Interaction Cohort (Renal insufficiency, CYP modulators) - 20%
4. Standard Pediatric Ward Cohort (Age: 1-10y, Normal baselines) - 15%

Outputs:
- data/accudose_train_trajectories.csv
- data/accudose_test_trajectories.csv
- data/accudose_dataset_summary.json
"""

import os
import json
import argparse
import numpy as np
import pandas as pd
from typing import List, Dict, Any

from digital_twin import PediatricPKPDTwin, PatientPhenotype, TwinConfig
from env import PediatricDosingEnv


def sample_field_patient(rng: np.random.Generator, cohort_type: str) -> PatientPhenotype:
    if cohort_type == "neonate":
        age_days = float(rng.uniform(1, 30))
        gestational_age_weeks = float(rng.uniform(26, 38))
        weight_kg = float(np.clip(rng.normal(2.8, 0.8), 1.2, 5.0))
        height_cm = 50.0 + (age_days / 365.0) * 25.0
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        baseline_cyp = float(np.clip(rng.normal(0.25, 0.08), 0.05, 0.50))
        baseline_renal = float(np.clip(rng.normal(0.35, 0.10), 0.10, 0.60))
        modulator = float(rng.choice([-1.0, 0.0, 1.0], p=[0.20, 0.60, 0.20]))

    elif cohort_type == "infant_febrile":
        age_days = float(rng.uniform(30, 365))
        gestational_age_weeks = float(rng.uniform(37, 41))
        weight_kg = float(np.clip(rng.normal(7.5, 1.8), 4.0, 12.0))
        height_cm = 50.0 + (age_days / 365.0) * 25.0
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        baseline_cyp = float(np.clip(rng.normal(0.70, 0.12), 0.30, 1.00))
        baseline_renal = float(np.clip(rng.normal(0.85, 0.10), 0.50, 1.10))
        modulator = float(rng.choice([-1.0, 0.0, 1.0], p=[0.15, 0.55, 0.30]))

    elif cohort_type == "renal_cyp_impaired":
        age_days = float(rng.uniform(180, 2500))
        gestational_age_weeks = float(rng.uniform(36, 41))
        weight_kg = float(np.clip(rng.normal(15.0, 5.0), 6.0, 32.0))
        height_cm = 75.0 + ((age_days / 365.0) - 1.0) * 6.5
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        baseline_cyp = float(np.clip(rng.normal(0.40, 0.15), 0.10, 0.70))
        baseline_renal = float(np.clip(rng.normal(0.30, 0.12), 0.08, 0.55))
        modulator = float(rng.choice([-1.0, 1.0], p=[0.50, 0.50]))

    else:  # standard_pediatric
        age_days = float(rng.uniform(365, 3650))
        gestational_age_weeks = 40.0
        weight_kg = float(np.clip(rng.normal(20.0, 7.0), 8.0, 45.0))
        height_cm = 75.0 + ((age_days / 365.0) - 1.0) * 6.5
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        baseline_cyp = float(np.clip(rng.normal(1.0, 0.15), 0.60, 1.30))
        baseline_renal = float(np.clip(rng.normal(1.0, 0.15), 0.60, 1.30))
        modulator = 0.0

    return PatientPhenotype(
        age_days=age_days,
        weight_kg=weight_kg,
        bsa_m2=float(bsa_m2),
        gestational_age_weeks=gestational_age_weeks,
        baseline_cyp_activity=baseline_cyp,
        baseline_renal_function=baseline_renal,
        concurrent_cyp_modulator=modulator,
    )


def generate_episode_trajectory(
    twin: PediatricPKPDTwin,
    patient: PatientPhenotype,
    episode_id: int,
    policy_type: str,
    steps: int = 144,
    rng: np.random.Generator = None,
) -> List[Dict[str, Any]]:
    if rng is None:
        rng = np.random.default_rng()

    twin.reset(patient=patient)
    twin._fever_episode_active = (patient.age_days > 14 and rng.random() < 0.40)
    twin._fever_episode_start = rng.uniform(30, 300) if twin._fever_episode_active else None

    records = []
    current_rate = 1.0

    for s in range(steps):
        # Determine policy action depending on behavioral mixture
        if policy_type == "heuristic":
            c_val = twin.c_central
            if c_val < 2.0:
                current_rate = min(5.0, current_rate + 0.15)
                bolus = 5.0 if (s % 36 == 0 and c_val < 1.0) else 0.0
            elif c_val > 6.0:
                current_rate = max(0.0, current_rate - 0.20)
                bolus = 0.0
            else:
                current_rate = max(0.0, min(5.0, current_rate + 0.01 * (1.0 - twin.enzyme_activity)))
                bolus = 0.0

        elif policy_type == "weight_proportional":
            base_target = 0.2 * patient.weight_kg
            current_rate = float(np.clip(base_target + rng.normal(0, 0.1), 0.1, 5.0))
            bolus = 5.0 if s == 0 else 0.0

        else:  # exploratory_random
            current_rate = float(np.clip(current_rate + rng.normal(0, 0.25), 0.0, 5.0))
            bolus = 5.0 if rng.random() < 0.05 else 0.0

        obs = twin.step(infusion_rate_mg_min=current_rate, bolus_mg=bolus)

        # Build clean observation row
        row = {
            "episode_id": episode_id,
            "step": s,
            "time_minutes": obs["time_minutes"],
            "cohort_age_days": patient.age_days,
            "cohort_weight_kg": patient.weight_kg,
            "cohort_gestational_age_weeks": patient.gestational_age_weeks,
            "cohort_bsa_m2": patient.bsa_m2,
            "cohort_cyp_modulator": patient.concurrent_cyp_modulator,
            "true_concentration_mg_l": obs["true_concentration_mg_l"],
            "true_peripheral_conc_mg_l": obs["true_peripheral_concentration_mg_l"],
            "true_enzyme_activity": obs["true_enzyme_activity"],
            "true_renal_function": obs["true_renal_function"],
            "true_toxicity_marker": obs["true_toxicity_marker"],
            "obs_drug_concentration_proxy": obs["obs_drug_concentration_proxy"],
            "obs_cyp_activity": obs["obs_cyp_activity"],
            "obs_toxicity_marker": obs["obs_toxicity_marker"],
            "obs_core_temp_c": obs["obs_core_temp_c"],
            "obs_renal_clearance_proxy": obs["obs_renal_clearance_proxy"],
            "action_infusion_rate_mg_min": obs["last_action_mg_min"],
            "action_bolus_given_mg": bolus,
            "cumulative_dose_mg": obs["cumulative_dose_mg"],
            "is_therapeutic": (2.0 <= obs["true_concentration_mg_l"] <= 6.0),
            "is_toxic": (obs["true_concentration_mg_l"] > 8.0 or obs["true_toxicity_marker"] > 0.5),
        }
        records.append(row)

        if row["is_toxic"] and twin.c_central > 15.0:
            break

    return records


def generate_dataset(n_episodes: int, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    twin = PediatricPKPDTwin(seed=seed)
    all_records = []

    cohort_distribution = [
        ("neonate", 0.30),
        ("infant_febrile", 0.35),
        ("renal_cyp_impaired", 0.20),
        ("standard_pediatric", 0.15),
    ]
    cohort_names = [c[0] for c in cohort_distribution]
    cohort_probs = [c[1] for c in cohort_distribution]

    policies = ["heuristic", "weight_proportional", "exploratory_random"]
    policy_probs = [0.60, 0.25, 0.15]

    for ep_idx in range(n_episodes):
        cohort = rng.choice(cohort_names, p=cohort_probs)
        policy = rng.choice(policies, p=policy_probs)
        patient = sample_field_patient(rng, cohort)
        ep_rows = generate_episode_trajectory(twin, patient, ep_idx, policy, steps=144, rng=rng)
        
        for r in ep_rows:
            r["cohort_type"] = cohort
            r["policy_type"] = policy
        
        all_records.extend(ep_rows)

    return pd.DataFrame(all_records)


def main():
    parser = argparse.ArgumentParser(description="Generate full-scale pediatric clinical dataset")
    parser.add_argument("--n-train", type=int, default=1500, help="Number of training patient episodes")
    parser.add_argument("--n-test", type=int, default=300, help="Number of testing patient episodes")
    parser.add_argument("--out-dir", type=str, default="data", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    print(f"🏥 Generating {args.n_train} training episodes...")
    train_df = generate_dataset(n_episodes=args.n_train, seed=42)
    train_path = os.path.join(args.out_dir, "accudose_train_trajectories.csv")
    train_df.to_csv(train_path, index=False)
    print(f" Saved train dataset to {train_path} ({len(train_df)} time-series steps)")

    print(f"\n🧪 Generating {args.n_test} evaluation/test episodes...")
    test_df = generate_dataset(n_episodes=args.n_test, seed=999)
    test_path = os.path.join(args.out_dir, "accudose_test_trajectories.csv")
    test_df.to_csv(test_path, index=False)
    print(f" Saved test dataset to {test_path} ({len(test_df)} time-series steps)")

    # Compute Summary Statistics
    summary = {
        "total_episodes": args.n_train + args.n_test,
        "train_steps": len(train_df),
        "test_steps": len(test_df),
        "train_cohort_breakdown": train_df["cohort_type"].value_counts().to_dict(),
        "train_policy_breakdown": train_df["policy_type"].value_counts().to_dict(),
        "overall_time_in_therapeutic_range": float(train_df["is_therapeutic"].mean()),
        "toxicity_event_rate": float((train_df["true_toxicity_marker"] > 0.5).mean()),
        "age_range_days": [float(train_df["cohort_age_days"].min()), float(train_df["cohort_age_days"].max())],
        "weight_range_kg": [float(train_df["cohort_weight_kg"].min()), float(train_df["cohort_weight_kg"].max())],
    }

    summary_path = os.path.join(args.out_dir, "accudose_dataset_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n📊 Summary report saved to {summary_path}:")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
