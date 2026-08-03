export interface SimulateRequest {
  age_days: number;
  weight_kg: number;
  gestational_age_weeks?: number;
  fever_active?: boolean;
  mode?: "ai" | "manual";
  confidence_floor?: number;
  n_steps?: number;
}

export interface TimePoint {
  time_minutes: number;
  true_concentration_mg_l: number;
  obs_drug_concentration_proxy: number;
  obs_cyp_activity: number;
  obs_toxicity_marker: number;
  last_action_mg_min: number;
  bolus_given_mg: number;
  cumulative_dose_mg: number;
  confidence: number;
}

export interface SimulateResponse {
  points: TimePoint[];
  terminated_early: boolean;
  termination_reason?: string | null;
  low_confidence_events: number;
  model_loaded: boolean;
}
