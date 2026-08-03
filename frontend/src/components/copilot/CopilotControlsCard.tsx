import React from "react";
import { Sliders, Play, ShieldAlert, Cpu, UserCheck, Loader2 } from "lucide-react";
import type { CopilotSettings } from "../../types";

interface CopilotControlsCardProps {
  settings: CopilotSettings;
  onChange: (updated: CopilotSettings) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
}

export const CopilotControlsCard: React.FC<CopilotControlsCardProps> = ({
  settings,
  onChange,
  onRunSimulation,
  isLoading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
      
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2 rounded-lg bg-choc-50 dark:bg-choc-950 text-choc-600 dark:text-choc-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Copilot & Safety Controls</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Autonomy level and confidence floor thresholds</p>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        
        <div className="space-y-2">
          <label className="font-medium text-slate-700 dark:text-slate-300">Control Mode</label>
          
          <div className="grid grid-cols-1 gap-2">
            
            <button
              type="button"
              onClick={() => onChange({ ...settings, mode: "AI Recommendation (Human Approves)" })}
              className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                settings.mode === "AI Recommendation (Human Approves)"
                  ? "bg-choc-50/60 dark:bg-choc-950/40 border-choc-500 text-choc-900 dark:text-choc-100 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Cpu className={`w-4 h-4 mt-0.5 ${settings.mode === "AI Recommendation (Human Approves)" ? "text-choc-600 dark:text-choc-400" : "text-slate-400"}`} />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">AI Copilot (Human Approves)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  PPO RL policy adjusts infusion rate; defers to hold rate if confidence drops below floor.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...settings, mode: "Full Manual" })}
              className={`flex items-start space-x-3 p-3 rounded-xl border text-left transition-all ${
                settings.mode === "Full Manual"
                  ? "bg-choc-50/60 dark:bg-choc-950/40 border-choc-500 text-choc-900 dark:text-choc-100 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <UserCheck className={`w-4 h-4 mt-0.5 ${settings.mode === "Full Manual" ? "text-choc-600 dark:text-choc-400" : "text-slate-400"}`} />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Full Manual Control</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Disables AI adjustments. Infusion rate held constant for full interval.
                </div>
              </div>
            </button>

          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-choc-500" />
              <span>Minimum Auto-Suggest Confidence</span>
            </span>
            <span className="font-semibold text-choc-600 dark:text-choc-400">
              {(settings.confidenceFloor * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.05}
            value={settings.confidenceFloor}
            onChange={(e) => onChange({ ...settings, confidenceFloor: Number(e.target.value) })}
            className="w-full accent-choc-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0% (Permissive)</span>
            <span>40% (Default)</span>
            <span>100% (Strict)</span>
          </div>
        </div>

      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={onRunSimulation}
        className="w-full py-3 px-4 bg-choc-600 hover:bg-choc-700 active:bg-choc-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-choc-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Simulating 12-Hour Telemetry...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Run Real-Time Simulation Interval (12 Hours)</span>
          </>
        )}
      </button>

    </div>
  );
};
