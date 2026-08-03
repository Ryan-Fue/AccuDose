import type {
  SimulateRequest,
  SimulateResponse,
  ForecastResponse,
  HealthResponse,
  TimePoint,
  ForecastPoint
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch {
    return { status: "fallback_demo", model_loaded: false };
  }
}

export async function runSimulation(req: SimulateRequest): Promise<SimulateResponse> {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Simulation request failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("API unavailable, generating client-side digital twin simulation fallback:", err);
    return generateFallbackSimulation(req);
  }
}

export async function fetchForecast(horizonMinutes: number = 240, nEnsemble: number = 25): Promise<ForecastResponse> {
  try {
    const res = await fetch(`${API_BASE}/forecast?horizon_minutes=${horizonMinutes}&n_ensemble=${nEnsemble}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("Forecast request failed");
    return await res.json();
  } catch (err) {
    console.warn("API forecast unavailable, generating client-side forecast fallback:", err);
    return generateFallbackForecast(horizonMinutes);
  }
}

function generateFallbackSimulation(req: SimulateRequest): SimulateResponse {
  const points: TimePoint[] = [];
  const totalSteps = req.n_steps || 144;
  let conc = 0.5;
  let cyp = 0.85 + (req.age_days / 3650) * 0.3;
  let tox = 0.05;
  let pumpRate = 1.8;
  let cumDose = 0;
  let lowConfEvents = 0;

  for (let i = 0; i < totalSteps; i++) {
    const t = i * 5;
    const fever = req.fever_active && t >= 60 && t <= 300;
    const targetCyp = fever ? 1.25 : 0.85;
    
    cyp += 0.05 * (targetCyp - cyp) + (Math.random() - 0.5) * 0.02;
    cyp = Math.max(0.2, cyp);

    if (conc < 2.0) {
      pumpRate = Math.min(5.0, pumpRate + 0.15);
    } else if (conc > 6.0) {
      pumpRate = Math.max(0.0, pumpRate - 0.2);
    } else {
      pumpRate += (Math.random() - 0.5) * 0.05;
    }

    const isManual = req.mode === "manual";
    const confidence = Math.max(0.2, Math.min(0.98, 0.92 - (fever ? 0.35 : 0.0) + (Math.random() - 0.5) * 0.1));
    
    let effectiveRate = pumpRate;
    if (isManual || confidence < (req.confidence_floor || 0.4)) {
      effectiveRate = 1.0;
      if (confidence < (req.confidence_floor || 0.4)) lowConfEvents++;
    }

    const bolus = (i === 12 || i === 48) ? 5.0 : 0.0;
    cumDose += effectiveRate * 5 + bolus;

    conc += (effectiveRate * 0.12 - conc * (0.04 * cyp)) * 0.5 + (bolus > 0 ? 1.8 : 0);
    conc = Math.max(0.05, conc);

    tox = Math.max(0.0, tox + (conc > 8.0 ? 0.08 : -0.01));

    points.push({
      time_minutes: t,
      true_concentration_mg_l: Number(conc.toFixed(2)),
      obs_drug_concentration_proxy: Number(Math.max(0, conc + (Math.random() - 0.5) * 0.2).toFixed(2)),
      obs_cyp_activity: Number(Math.max(0, cyp + (Math.random() - 0.5) * 0.05).toFixed(2)),
      obs_toxicity_marker: Number(Math.max(0, tox + (Math.random() - 0.5) * 0.02).toFixed(2)),
      last_action_mg_min: Number(effectiveRate.toFixed(2)),
      bolus_given_mg: bolus,
      cumulative_dose_mg: Number(cumDose.toFixed(1)),
      confidence: Number(confidence.toFixed(2)),
    });
  }

  return {
    points,
    terminated_early: false,
    termination_reason: null,
    low_confidence_events: lowConfEvents,
    model_loaded: false,
  };
}

function generateFallbackForecast(horizonMinutes: number): ForecastResponse {
  const points: ForecastPoint[] = [];
  const steps = Math.floor(horizonMinutes / 5);
  let baseConc = 3.8;
  const startTime = 720;

  for (let i = 1; i <= steps; i++) {
    const t = startTime + i * 5;
    baseConc = baseConc * 0.992;
    const spread = 0.2 + (i / steps) * 0.8;

    points.push({
      time_minutes: t,
      mean: Number(baseConc.toFixed(2)),
      p10: Number(Math.max(0.5, baseConc - spread).toFixed(2)),
      p90: Number((baseConc + spread).toFixed(2)),
    });
  }

  return { points };
}
