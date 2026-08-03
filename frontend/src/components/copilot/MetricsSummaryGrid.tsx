import React, { useState } from "react";
import { Activity, ShieldCheck, CheckCircle2, FileCheck } from "lucide-react";
import type { TimePoint } from "../../types";
import { ClinicianApprovalModal } from "./ClinicianApprovalModal";

interface MetricsSummaryGridProps {
  points: TimePoint[];
  onApprove: (notes: string) => void;
}

export const MetricsSummaryGrid: React.FC<MetricsSummaryGridProps> = ({ points, onApprove }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const totalSteps = points.length || 1;
  const therapeuticCount = points.filter(
    (p) => p.true_concentration_mg_l >= 2.0 && p.true_concentration_mg_l <= 6.0
  ).length;
  const ttrPercentage = (therapeuticCount / totalSteps) * 100;

  const confSum = points.reduce((acc, p) => acc + p.confidence, 0);
  const meanConfidence = (confSum / totalSteps) * 100;

  const toxicCount = points.filter((p) => p.true_concentration_mg_l > 8.0 || p.obs_toxicity_marker > 0.5).length;
  const toxicPercentage = (toxicCount / totalSteps) * 100;

  const handleConfirmApproval = (notes: string) => {
    setIsApproved(true);
    setIsModalOpen(false);
    onApprove(notes);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Clinical Efficacy & Audit Summary</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Interval metrics for 12-hour simulation window</p>
          </div>

          <div className="flex items-center space-x-2">
            {isApproved ? (
              <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>EHR Log Committed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center space-x-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Sign & Commit to EHR</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Time-in-Range (TTR)</span>
              <Activity className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {ttrPercentage.toFixed(1)}%
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {ttrPercentage >= 70 ? "Target Met (≥70%)" : "Sub-optimal Exposure"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Mean OOD Confidence</span>
              <ShieldCheck className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
              {meanConfidence.toFixed(1)}%
            </div>
            <div className="text-[10px] text-brand-500 font-medium">
              Ensemble Distance Stable
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Toxic Over-Exposure</span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <div className={`text-xl font-bold ${toxicPercentage > 5 ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
              {toxicPercentage.toFixed(1)}%
            </div>
            <div className={`text-[10px] font-medium ${toxicPercentage > 5 ? "text-rose-500" : "text-emerald-600"}`}>
              {toxicPercentage > 5 ? "Toxicity Alert" : "Zero Toxicity Events"}
            </div>
          </div>

        </div>
      </div>

      <ClinicianApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmApproval}
        points={points}
      />
    </>
  );
};
