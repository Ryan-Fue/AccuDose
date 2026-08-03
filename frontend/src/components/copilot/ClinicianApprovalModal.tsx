import React, { useState } from "react";
import { FileCheck, X, ShieldCheck, FileText } from "lucide-react";
import type { TimePoint } from "../../types";

interface ClinicianApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  points: TimePoint[];
}

export const ClinicianApprovalModal: React.FC<ClinicianApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  points,
}) => {
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const lastPoint = points[points.length - 1] || {
    true_concentration_mg_l: 4.2,
    last_action_mg_min: 1.5,
    confidence: 0.88,
  };

  const totalSteps = points.length || 1;
  const meanConfidence = points.reduce((acc, p) => acc + p.confidence, 0) / totalSteps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clinician Approval & EHR Sign-Off</h3>
              <p className="text-xs text-slate-500">Review 12-hour telemetry before committing to medical record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Target Drug Concentration</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">{lastPoint.true_concentration_mg_l.toFixed(2)} mg/L</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Recommended Rate</span>
            <span className="font-semibold text-slate-900 dark:text-white">{lastPoint.last_action_mg_min.toFixed(2)} mg/min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mean OOD Safety Confidence</span>
            <span className="font-semibold text-brand-500">{(meanConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-500" />
            <span>Attending Clinician Clinical Notes (Optional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient febrile spike resolving; approved RL copilot infusion rate change."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Commit EHR Log</span>
          </button>
        </div>

      </div>
    </div>
  );
};
