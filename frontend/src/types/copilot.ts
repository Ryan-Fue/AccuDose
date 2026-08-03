export type ControlMode = "AI Recommendation (Human Approves)" | "Full Manual";

export interface CopilotSettings {
  mode: ControlMode;
  confidenceFloor: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
}
