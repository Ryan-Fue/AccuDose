import React from "react";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  LineChart,
  Lock,
  Scale,
  AlertTriangle,
} from "lucide-react";

interface LandingViewProps {
  onLaunchApp: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLaunchApp,
  onOpenTerms,
  onOpenPrivacy,
}) => {
  return (
    <div className="space-y-12 py-4 max-w-5xl mx-auto">
      
      {/* Minimal Hero Section */}
      <section className="text-center space-y-6 py-8">
        
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-medium">
          <span>Pediatric PK/PD Digital Twin • Educational Research Prototype</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Precision Pediatric Dosing Copilot
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A closed-loop simulation prototype exploring non-linear pediatric pharmacokinetics, generative 4-hour trajectory forecasting, and out-of-distribution safety gating.
        </p>

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLaunchApp}
            className="py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-600/20 flex items-center space-x-2 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>Open Interactive Copilot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </section>

      {/* Minimal 3-Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">PK/PD Digital Twin</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Models CYP3A4 enzyme maturation, GFR clearance, and 39.2°C febrile temperature spikes.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <LineChart className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">Generative Forecasting</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Monte Carlo rollout projections predicting concentration curves with P10–P90 uncertainty ribbons.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">OOD Safety Gating</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Mahalanobis distance estimator that decays during acute stress to hand back control to clinicians.
          </p>
        </div>

      </section>

      {/* Minimal Footer */}
      <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs text-slate-500">
        
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Educational Project Disclaimer:</strong> AccuDose is an educational demonstration built on synthetic simulation trajectories. It is not an FDA-cleared medical device and does not provide clinical advice. Authors hold zero accountability for its usage or data entered.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <span>AccuDose • Educational Prototype</span>
          <div className="flex space-x-4">
            <button onClick={onOpenTerms} className="hover:text-brand-600 flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5" />
              <span>Terms of Use & Disclaimers</span>
            </button>
            <button onClick={onOpenPrivacy} className="hover:text-brand-600 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>

      </footer>

    </div>
  );
};
