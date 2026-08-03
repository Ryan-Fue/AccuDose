import React from "react";
import { Lock, X, ShieldCheck } from "lucide-react";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Policy</h3>
              <p className="text-xs text-slate-500">Data handling, ephemeral processing, and privacy disclosures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-start space-x-3 text-brand-900 dark:text-brand-200">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-brand-900 dark:text-brand-100">
                Zero Personal Data Storage
              </h4>
              <p className="mt-1 text-[11px] text-brand-800 dark:text-brand-300">
                AccuDose does NOT collect, store, track, sell, or log any Personally Identifiable Information (PII) or Protected Health Information (PHI). All simulation inputs remain ephemeral.
              </p>
            </div>
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Inputted Data & Accountability</h4>
            <p>
              Any demographic parameters (age, weight, gestational age) entered into this app are processed transiently to compute digital twin simulation math. We do NOT store your input data, and we hold **zero accountability or liability for any data entered onto this website**.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Non-HIPAA Compliant System</h4>
            <p>
              This website is a demonstration prototype and is **NOT HIPAA-compliant**. Users must never enter real patient names, medical record numbers (MRNs), or actual protected health data. All inputs should remain synthetic.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Local Storage & Session State</h4>
            <p>
              The application may store temporary UI state (such as light/dark mode preference) in your browser's local storage (`localStorage`). No tracking cookies or advertising pixels are utilized.
            </p>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-md shadow-brand-600/20"
          >
            Close Privacy Policy
          </button>
        </div>

      </div>
    </div>
  );
};
