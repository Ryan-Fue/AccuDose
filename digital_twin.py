"""
Pediatric PK/PD Digital Twin (Revised)
"""

from __future__ import annotations
import numpy as np
from dataclasses import dataclass


@dataclass
class PatientPhenotype:
    age_days: float
    weight_kg: float
    bsa_m2: float
    gestational_age_weeks: float = 40.0
    baseline_cyp_activity: float = 1.0
    baseline_renal_function: float = 1.0
    concurrent_cyp_modulator: float = 0.0

    @staticmethod
    def sample_random(rng: np.random.Generator) -> "PatientPhenotype":
        age_days = rng.uniform(1, 365 * 12)
        gestational_age_weeks = rng.uniform(24, 42)
        weight_kg = PatientPhenotype._age_to_weight(age_days, rng)
        height_cm = PatientPhenotype._age_to_height_cm(age_days, weight_kg)
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        maturation = PatientPhenotype._cyp_maturation_fraction(age_days, gestational_age_weeks)
        baseline_cyp = np.clip(rng.normal(loc=maturation, scale=0.08), 0.05, 1.30)
        renal_maturation = PatientPhenotype._renal_maturation_fraction(age_days, gestational_age_weeks)
        baseline_renal = np.clip(rng.normal(loc=renal_maturation, scale=0.10), 0.05, 1.30)
        concurrent_mod = rng.choice([-1.0, 0.0, 1.0], p=[0.15, 0.55, 0.30])
        return PatientPhenotype(
            age_days=age_days, weight_kg=weight_kg, bsa_m2=float(bsa_m2),
            gestational_age_weeks=gestational_age_weeks,
            baseline_cyp_activity=float(baseline_cyp),
            baseline_renal_function=float(baseline_renal),
            concurrent_cyp_modulator=float(concurrent_mod),
        )

    @staticmethod
    def from_demographics(age_days: float, weight_kg: float, gestational_age_weeks: float = 40.0,
                           concurrent_cyp_modulator: float = 0.0) -> "PatientPhenotype":
        height_cm = PatientPhenotype._age_to_height_cm(age_days, weight_kg)
        bsa_m2 = 0.007184 * (weight_kg ** 0.425) * (height_cm ** 0.725)
        baseline_cyp = float(np.clip(
            PatientPhenotype._cyp_maturation_fraction(age_days, gestational_age_weeks), 0.05, 1.30))
        baseline_renal = float(np.clip(
            PatientPhenotype._renal_maturation_fraction(age_days, gestational_age_weeks), 0.05, 1.30))
        return PatientPhenotype(
            age_days=age_days, weight_kg=weight_kg, bsa_m2=float(bsa_m2),
            gestational_age_weeks=gestational_age_weeks,
            baseline_cyp_activity=baseline_cyp, baseline_renal_function=baseline_renal,
            concurrent_cyp_modulator=concurrent_cyp_modulator,
        )

    @staticmethod
    def _age_to_weight(age_days: float, rng: np.random.Generator) -> float:
        age_years = age_days / 365.0
        median = 3.3 + age_years * 6.5 if age_years < 1 else 9.8 + (age_years - 1) * 3.0
        return float(np.clip(rng.normal(loc=median, scale=median * 0.15), 1.5, 60.0))

    @staticmethod
    def _age_to_height_cm(age_days: float, weight_kg: float) -> float:
        age_years = age_days / 365.0
        return float(50 + age_years * 25) if age_years < 1 else float(75 + (age_years - 1) * 6.5)

    @staticmethod
    def _cyp_maturation_fraction(age_days: float, gestational_age_weeks: float) -> float:
        pma_weeks = gestational_age_weeks + age_days / 7.0
        return float(1.0 / (1.0 + np.exp(-(pma_weeks - 46.0) / 8.0)))

    @staticmethod
    def _renal_maturation_fraction(age_days: float, gestational_age_weeks: float) -> float:
        pma_weeks = gestational_age_weeks + age_days / 7.0
        return float(1.0 / (1.0 + np.exp(-(pma_weeks - 40.0) / 6.0)))


@dataclass
class TwinConfig:
    dt_minutes: float = 5.0
    v_central_per_kg: float = 0.4
    v_peripheral_per_kg: float = 0.6
    q_inter_compartment: float = 0.08
    vmax_hepatic_per_kg: float = 0.05
    km_hepatic: float = 2.0
    renal_clearance_per_kg: float = 0.01
    enzyme_reversion_rate: float = 0.02
    enzyme_volatility: float = 0.05
    fever_enzyme_gain: float = 0.35
    toxic_threshold_mg_l: float = 8.0
    therapeutic_low_mg_l: float = 2.0
    therapeutic_high_mg_l: float = 6.0


class PediatricPKPDTwin:
    def __init__(self, config: TwinConfig | None = None, seed: int | None = None):
        self.cfg = config or TwinConfig()
        self.rng = np.random.default_rng(seed)
        self.patient: PatientPhenotype | None = None
        self.t_minutes = 0.0
        self.c_central = 0.0
        self.c_peripheral = 0.0
        self.enzyme_activity = 1.0
        self.renal_function = 1.0
        self.core_temp_c = 37.0
        self.toxicity_marker = 0.0
        self.cumulative_dose_mg = 0.0
        self.last_action_mg_min = 0.0
        self._fever_episode_active = False
        self._fever_episode_start: float | None = None
        self._fever_episode_duration = 120.0

    def reset(self, patient: PatientPhenotype | None = None) -> dict:
        self.patient = patient or PatientPhenotype.sample_random(self.rng)
        self.t_minutes = 0.0
        self.c_central = 0.0
        self.c_peripheral = 0.0
        self.enzyme_activity = self.patient.baseline_cyp_activity
        self.renal_function = self.patient.baseline_renal_function
        self.core_temp_c = float(self.rng.normal(37.0, 0.2))
        self.toxicity_marker = 0.0
        self.cumulative_dose_mg = 0.0
        self.last_action_mg_min = 0.0
        self._fever_episode_active = self.rng.random() < 0.25
        self._fever_episode_start = self.rng.uniform(0, 240) if self._fever_episode_active else None
        self._fever_episode_duration = self.rng.uniform(60, 360)
        return self._observe()

    def step(self, infusion_rate_mg_min: float, bolus_mg: float = 0.0) -> dict:
        assert self.patient is not None, "call reset() first"
        dt = self.cfg.dt_minutes
        p = self.patient
        w = p.weight_kg
        infusion_rate_mg_min = max(0.0, float(infusion_rate_mg_min))
        bolus_mg = max(0.0, float(bolus_mg))
        self.last_action_mg_min = infusion_rate_mg_min
        v_central = self.cfg.v_central_per_kg * w
        v_peripheral = self.cfg.v_peripheral_per_kg * w
        q = self.cfg.q_inter_compartment * w
        self._update_temperature(dt)
        fever_delta = max(0.0, self.core_temp_c - 37.0)
        set_point = (p.baseline_cyp_activity * (1.0 + self.cfg.fever_enzyme_gain * fever_delta)
                     * (1.0 + 0.25 * p.concurrent_cyp_modulator))
        set_point = max(0.02, set_point)
        d_enzyme = self.cfg.enzyme_reversion_rate * (set_point - self.enzyme_activity) * dt
        d_enzyme += self.cfg.enzyme_volatility * np.sqrt(dt) * self.rng.normal()
        self.enzyme_activity = max(0.02, self.enzyme_activity + d_enzyme)
        renal_drift = (-0.002 * max(0.0, self.toxicity_marker - 0.3)
                       + 0.0005 * (p.baseline_renal_function - self.renal_function)) * dt
        self.renal_function = float(np.clip(self.renal_function + renal_drift, 0.05, 1.30))
        Cc = max(0.0, self.c_central)
        Cp = max(0.0, self.c_peripheral)
        vmax = self.cfg.vmax_hepatic_per_kg * w * self.enzyme_activity
        hepatic_elim = vmax * Cc / (self.cfg.km_hepatic + Cc)
        renal_elim = self.cfg.renal_clearance_per_kg * w * self.renal_function * Cc
        intercomp_flow = q * (Cc - Cp)
        dose_input = infusion_rate_mg_min * dt + bolus_mg
        d_central_mg = dose_input - hepatic_elim * dt - renal_elim * dt - intercomp_flow * dt
        d_peripheral_mg = intercomp_flow * dt
        central_amount = max(0.0, Cc * v_central + d_central_mg)
        peripheral_amount = max(0.0, Cp * v_peripheral + d_peripheral_mg)
        self.c_central = central_amount / v_central
        self.c_peripheral = peripheral_amount / v_peripheral
        overage = max(0.0, self.c_central - self.cfg.toxic_threshold_mg_l)
        tox_drive = overage * (1.5 - self.renal_function)
        self.toxicity_marker = max(0.0, self.toxicity_marker
                                    + (0.01 * tox_drive - 0.005 * self.toxicity_marker) * dt)
        self.cumulative_dose_mg += dose_input
        self.t_minutes += dt
        return self._observe()

    def _update_temperature(self, dt: float):
        target = 37.0
        if (self._fever_episode_active and self._fever_episode_start is not None
                and self._fever_episode_start <= self.t_minutes
                <= self._fever_episode_start + self._fever_episode_duration):
            target = 39.2
        self.core_temp_c += 0.01 * (target - self.core_temp_c) * dt
        self.core_temp_c += 0.02 * np.sqrt(dt) * self.rng.normal()
        self.core_temp_c = float(np.clip(self.core_temp_c, 35.0, 41.5))

    def _observe(self) -> dict:
        noise = lambda s: self.rng.normal(0.0, s)
        return {
            "true_concentration_mg_l": self.c_central,
            "true_peripheral_concentration_mg_l": self.c_peripheral,
            "true_enzyme_activity": self.enzyme_activity,
            "true_renal_function": self.renal_function,
            "true_toxicity_marker": self.toxicity_marker,
            "obs_drug_concentration_proxy": max(0.0, self.c_central + noise(0.15)),
            "obs_cyp_activity": max(0.0, self.enzyme_activity + noise(0.05)),
            "obs_toxicity_marker": max(0.0, self.toxicity_marker + noise(0.02)),
            "obs_core_temp_c": self.core_temp_c + noise(0.05),
            "obs_renal_clearance_proxy": max(0.0, self.renal_function + noise(0.05)),
            "time_minutes": self.t_minutes,
            "last_action_mg_min": self.last_action_mg_min,
            "cumulative_dose_mg": self.cumulative_dose_mg,
            "age_days": self.patient.age_days,
            "gestational_age_weeks": self.patient.gestational_age_weeks,
            "weight_kg": self.patient.weight_kg,
            "bsa_m2": self.patient.bsa_m2,
        }


if __name__ == "__main__":
    twin = PediatricPKPDTwin(seed=42)
    obs = twin.reset()
    for _ in range(12):
        obs = twin.step(infusion_rate_mg_min=2.0)
    print(obs)
