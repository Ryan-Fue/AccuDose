import React from "react";
import { CheckCircle2, ShieldCheck, X, FileText } from "lucide-react";
import type { TimePoint } from "../../types";

interface ClinicianApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  points: TimePoint[];
}

export const ClinicianApprovalModal: React.FC<ClinicianApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  points,
}) => {
  if (!isOpen || points.length === 0) return null;

  const lastPoint = points[points.length - 1];
  const meanConfidence = points.reduce((acc, p) => acc + p.confidence, 0) / points.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-choc-50 dark:bg-choc-950 text-choc-600 dark:text-choc-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinician Review & Approval Sign-Off</h3>
              <p className="text-xs text-slate-500">Sign and commit 12-hour simulation telemetry to EHR audit log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3 text-xs border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Interval Duration</span>
            <span className="font-medium text-slate-900 dark:text-white">12.0 Hours (144 Steps)</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Final Observed Drug Conc</span>
            <span className="font-semibold text-choc-600 dark:text-choc-400">{lastPoint.true_concentration_mg_l.toFixed(2)} mg/L</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Cumulative Dose Administered</span>
            <span className="font-semibold text-slate-900 dark:text-white">{lastPoint.cumulative_dose_mg.toFixed(1)} mg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mean Copilot Confidence</span>
            <span className="font-semibold text-choc-500">{(meanConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5 text-choc-500" />
            <span>Attending Clinician Audit Note (Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="E.g., Dose protocol reviewed and accepted. Patient fever resolving..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-choc-500 text-xs"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-choc-600 hover:bg-choc-700 text-white font-semibold text-xs shadow-md shadow-choc-600/20 flex items-center justify-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Sign-Off</span>
          </button>
        </div>

      </div>
    </div>
  );
};
