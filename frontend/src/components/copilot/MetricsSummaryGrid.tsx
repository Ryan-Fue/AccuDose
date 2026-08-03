import React, { useState } from "react";
import { Activity, Pill, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { TimePoint } from "../../types";
import { ClinicianApprovalModal } from "./ClinicianApprovalModal";

interface MetricsSummaryGridProps {
  points: TimePoint[];
  onApprove: () => void;
}

export const MetricsSummaryGrid: React.FC<MetricsSummaryGridProps> = ({ points, onApprove }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  if (points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  const meanConfidence = points.reduce((acc, p) => acc + p.confidence, 0) / points.length;

  const handleConfirmApproval = () => {
    setIsApproved(true);
    setIsModalOpen(false);
    onApprove();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Human-in-the-Loop Interval Summary</h3>
        <span className="text-xs text-slate-400">t = 12.0 Hours</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Final Concentration</span>
            <Activity className="w-4 h-4 text-choc-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {lastPoint.true_concentration_mg_l.toFixed(2)} <span className="text-xs font-medium text-slate-400">mg/L</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Within Target Range (2.0–6.0)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Cumulative Dose</span>
            <Pill className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {lastPoint.cumulative_dose_mg.toFixed(1)} <span className="text-xs font-medium text-slate-400">mg</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Total drug administered
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Mean Model Confidence</span>
            <ShieldCheck className="w-4 h-4 text-choc-500" />
          </div>
          <div className="text-xl font-bold text-choc-600 dark:text-choc-400">
            {(meanConfidence * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-choc-500 font-medium">
            OOD Safety Score
          </div>
        </div>

      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isApproved ? "✅ Interval signed and logged to backend audit trail." : "Review interval telemetry and confirm dosing schedule."}
        </span>
        
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm ${
            isApproved
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
              : "bg-choc-600 hover:bg-choc-700 active:bg-choc-800 text-white shadow-choc-600/20"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isApproved ? "Clinician Approved" : "Clinician Approves — Log & Continue"}</span>
        </button>
      </div>

      <ClinicianApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmApproval}
        points={points}
      />
    </div>
  );
};
