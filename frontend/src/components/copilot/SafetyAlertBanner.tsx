import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { SimulateResponse } from "../../types";

interface SafetyAlertBannerProps {
  simulation: SimulateResponse | null;
  totalSteps: number;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ simulation, totalSteps }) => {
  if (!simulation) return null;

  const lowConfEvents = simulation.low_confidence_events;
  const terminatedEarly = simulation.terminated_early;

  if (lowConfEvents === 0 && !terminatedEarly) return null;

  return (
    <div className="space-y-3">
      {terminatedEarly && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start space-x-3 text-rose-900 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-rose-900 dark:text-rose-100">
              Simulation Halted — Safety Threshold Exceeded
            </h4>
            <p className="mt-0.5 text-rose-700 dark:text-rose-300">
              Toxicity marker or drug concentration breached safety limits. Control was locked to zero infusion rate.
            </p>
          </div>
        </div>
      )}

      {lowConfEvents > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
              Model Confidence Gating Active ({lowConfEvents} / {totalSteps} intervals)
            </h4>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              Model confidence dropped below the safety floor during {lowConfEvents} intervals. Autonomous control defaulted to a held rate, deferring to clinician review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
