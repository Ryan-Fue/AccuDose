export interface ForecastPoint {
  time_minutes: number;
  mean: number;
  p10: number;
  p90: number;
}

export interface ForecastResponse {
  points: ForecastPoint[];
}
