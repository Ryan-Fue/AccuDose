"""
AccuDose: Rigorous Data Leakage & Overfitting Diagnostic Suite.

Tests:
1. Patient-Level Group K-Fold Cross Validation (5 Folds).
2. Behavioral Policy Sub-Group Performance (Heuristic vs Weight-Proportional vs Random Exploration).
3. Permutation Feature Importance.
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold

FEATURE_COLS = [
    "obs_drug_concentration_proxy",
    "obs_cyp_activity",
    "obs_toxicity_marker",
    "obs_core_temp_c",
    "obs_renal_clearance_proxy",
    "cohort_age_days",
    "cohort_weight_kg",
    "cohort_bsa_m2",
    "cumulative_dose_mg",
]

TARGET_COL = "action_infusion_rate_mg_min"


class DiagnosticsPolicy(nn.Module):
    def __init__(self, input_dim: int = 9, hidden_dim: int = 128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.SiLU(),
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, hidden_dim),
            nn.SiLU(),
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, 64),
            nn.SiLU(),
            nn.Linear(64, 1),
            nn.Softplus(),
        )

    def forward(self, x):
        return self.net(x)


def run_diagnostics():
    train_df = pd.read_csv("data/accudose_train_trajectories.csv")
    test_df = pd.read_csv("data/accudose_test_trajectories.csv")
    full_df = pd.concat([train_df, test_df], ignore_index=True)

    print("🔍 DIAGNOSTIC TEST 1: Patient Episode Group K-Fold Cross Validation (5 Folds)...")
    gkf = GroupKFold(n_splits=5)
    fold_r2s = []
    
    for fold, (train_idx, val_idx) in enumerate(gkf.split(full_df, groups=full_df["episode_id"])):
        tr = full_df.iloc[train_idx]
        val = full_df.iloc[val_idx]

        scaler = StandardScaler()
        X_tr = scaler.fit_transform(tr[FEATURE_COLS].values)
        X_val = scaler.transform(val[FEATURE_COLS].values)

        y_tr = tr[TARGET_COL].values.astype(np.float32)
        y_val = val[TARGET_COL].values.astype(np.float32)

        model = DiagnosticsPolicy()
        opt = torch.optim.AdamW(model.parameters(), lr=3e-3)
        crit = nn.MSELoss()

        loader = torch.utils.data.DataLoader(
            torch.utils.data.TensorDataset(torch.tensor(X_tr, dtype=torch.float32), torch.tensor(y_tr, dtype=torch.float32).unsqueeze(1)),
            batch_size=512, shuffle=True
        )

        model.train()
        for epoch in range(10):
            for bx, by in loader:
                opt.zero_grad()
                loss = crit(model(bx), by)
                loss.backward()
                opt.step()

        model.eval()
        with torch.no_grad():
            preds_val = model(torch.tensor(X_val, dtype=torch.float32)).numpy().flatten()
            r2 = r2_score(y_val, preds_val)
            fold_r2s.append(r2)

    print(f"  Group K-Fold Validation R² Scores: {[round(r, 4) for r in fold_r2s]}")
    print(f"  Mean Group K-Fold R²: {np.mean(fold_r2s):.4f} ± {np.std(fold_r2s):.4f}")

    print("\n🔍 DIAGNOSTIC TEST 2: Policy Performance Split by Behavioral Policy Sub-Groups...")
    
    scaler = StandardScaler()
    X_tr = scaler.fit_transform(train_df[FEATURE_COLS].values)
    X_te = scaler.transform(test_df[FEATURE_COLS].values)

    model = DiagnosticsPolicy()
    model.load_state_dict(torch.load("runs/offline_policy.pt"))
    model.eval()

    with torch.no_grad():
        test_preds = model(torch.tensor(X_te, dtype=torch.float32)).numpy().flatten()

    test_df["pred_action"] = test_preds

    for pol in test_df["policy_type"].unique():
        sub = test_df[test_df["policy_type"] == pol]
        r2 = r2_score(sub[TARGET_COL], sub["pred_action"])
        mse = mean_squared_error(sub[TARGET_COL], sub["pred_action"])
        print(f"  Sub-Policy [{pol:20s}] -> Test MSE: {mse:.4f} | R²: {r2:.4f} (Samples: {len(sub)})")

    print("\n🔍 DIAGNOSTIC TEST 3: Feature Importance (Permutation Feature Importance)...")
    baseline_mse = mean_squared_error(test_df[TARGET_COL], test_preds)
    importance = {}

    for col in FEATURE_COLS:
        test_copy = X_te.copy()
        col_idx = FEATURE_COLS.index(col)
        np.random.shuffle(test_copy[:, col_idx])
        with torch.no_grad():
            perm_preds = model(torch.tensor(test_copy, dtype=torch.float32)).numpy().flatten()
        perm_mse = mean_squared_error(test_df[TARGET_COL], perm_preds)
        importance[col] = perm_mse - baseline_mse

    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    for col, imp in sorted_imp:
        print(f"  Feature [{col:30s}] -> MSE Increase when Shuffled: +{imp:.4f}")


if __name__ == "__main__":
    run_diagnostics()
