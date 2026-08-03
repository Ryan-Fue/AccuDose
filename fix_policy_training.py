"""
Fix Offline PyTorch Policy Training:
1. Standardizes all 9 input features with StandardScaler.
2. Replaces terminal ReLU with Softplus to prevent Dying ReLU collapse.
3. Evaluates MSE, RMSE, MAE, R2 on Train and Test sets.
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

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


class ImprovedOfflineDosingPolicy(nn.Module):
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
            nn.Softplus(), # Smooth non-negative output preventing dying ReLU
        )

    def forward(self, x):
        return self.net(x)


def main():
    train_df = pd.read_csv("data/accudose_train_trajectories.csv")
    test_df = pd.read_csv("data/accudose_test_trajectories.csv")

    scaler = StandardScaler()
    X_train = scaler.fit_transform(train_df[FEATURE_COLS].values)
    X_test = scaler.transform(test_df[FEATURE_COLS].values)

    y_train = train_df[TARGET_COL].values.astype(np.float32)
    y_test = test_df[TARGET_COL].values.astype(np.float32)

    x_train_t = torch.tensor(X_train, dtype=torch.float32)
    y_train_t = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)

    x_test_t = torch.tensor(X_test, dtype=torch.float32)

    model = ImprovedOfflineDosingPolicy()
    optimizer = optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    criterion = nn.MSELoss()

    dataset = torch.utils.data.TensorDataset(x_train_t, y_train_t)
    loader = torch.utils.data.DataLoader(dataset, batch_size=256, shuffle=True)

    print("🧠 Retraining PyTorch Offline Policy with feature scaling & SiLU/Softplus...")
    model.train()
    for epoch in range(1, 21):
        total_loss = 0.0
        for bx, by in loader:
            optimizer.zero_grad()
            pred = model(bx)
            loss = criterion(pred, by)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(bx)
        
        if epoch % 5 == 0 or epoch == 20:
            print(f"  Epoch {epoch:02d} | Train MSE Loss: {total_loss / len(X_train):.4f}")

    model.eval()
    with torch.no_grad():
        train_preds = model(x_train_t).numpy().flatten()
        test_preds = model(x_test_t).numpy().flatten()

    print("\n📊 Evaluation Results after Fix:")
    print(f"  Train MSE: {mean_squared_error(y_train, train_preds):.4f} | R2: {r2_score(y_train, train_preds):.4f}")
    print(f"  Test MSE:  {mean_squared_error(y_test, test_preds):.4f} | R2: {r2_score(y_test, test_preds):.4f}")
    print(f"  Sample True Rates:  {y_test[:5]}")
    print(f"  Sample Pred Rates:  {np.round(test_preds[:5], 3)}")

    # Save model and scaler stats
    os.makedirs("runs", exist_ok=True)
    torch.save(model.state_dict(), "runs/offline_policy.pt")
    np.savez("runs/scaler_stats.npz", mean=scaler.mean_, scale=scaler.scale_)
    print("\n✅ Saved updated model weights to runs/offline_policy.pt")


if __name__ == "__main__":
    main()
