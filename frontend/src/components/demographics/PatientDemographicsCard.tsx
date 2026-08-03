import React from "react";
import { User, Flame, Scale, Calendar, Dna, Info } from "lucide-react";
import type { PatientDemographics } from "../../types";

interface PatientDemographicsCardProps {
  demographics: PatientDemographics;
  onChange: (updated: PatientDemographics) => void;
  disabled?: boolean;
}

export const PatientDemographicsCard: React.FC<PatientDemographicsCardProps> = ({
  demographics,
  onChange,
  disabled = false,
}) => {
  const ageYears = demographics.ageDays / 365.0;
  const estimatedHeightCm = ageYears < 1 ? 50 + ageYears * 25 : 75 + (ageYears - 1) * 6.5;
  const bsaM2 = 0.007184 * Math.pow(demographics.weightKg, 0.425) * Math.pow(estimatedHeightCm, 0.725);
  
  const pmaWeeks = demographics.gestationalAgeWeeks + demographics.ageDays / 7.0;
  const cypMaturation = 1.0 / (1.0 + Math.exp(-(pmaWeeks - 46.0) / 8.0));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
      
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Patient Phenotype & Demographics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure pediatric physiological baselines</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        
        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>Age</span>
            </span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {demographics.ageDays} Days ({(demographics.ageDays / 30.4).toFixed(1)} mos)
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={3650}
            step={1}
            value={demographics.ageDays}
            disabled={disabled}
            onChange={(e) => onChange({ ...demographics, ageDays: Number(e.target.value) })}
            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Neonatal (1d)</span>
            <span>Infant (1y)</span>
            <span>Child (10y)</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-brand-500" />
              <span>Weight</span>
            </span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {demographics.weightKg.toFixed(1)} kg
            </span>
          </div>
          <input
            type="range"
            min={2.0}
            max={40.0}
            step={0.5}
            value={demographics.weightKg}
            disabled={disabled}
            onChange={(e) => onChange({ ...demographics, weightKg: Number(e.target.value) })}
            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>2.0 kg</span>
            <span>20.0 kg</span>
            <span>40.0 kg</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
            <span className="flex items-center space-x-1">
              <Dna className="w-3.5 h-3.5 text-brand-500" />
              <span>Gestational Age at Birth</span>
            </span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {demographics.gestationalAgeWeeks} Weeks
            </span>
          </div>
          <input
            type="range"
            min={24}
            max={42}
            step={1}
            value={demographics.gestationalAgeWeeks}
            disabled={disabled}
            onChange={(e) => onChange({ ...demographics, gestationalAgeWeeks: Number(e.target.value) })}
            className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>24w (Preterm)</span>
            <span>37w (Term)</span>
            <span>42w (Postterm)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Flame className={`w-4 h-4 ${demographics.feverActive ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200">Febrile Stress Episode</span>
              <p className="text-[10px] text-slate-500">Simulate 39.2°C temperature spike & CYP induction</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={demographics.feverActive}
            disabled={disabled}
            onClick={() => onChange({ ...demographics, feverActive: !demographics.feverActive })}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              demographics.feverActive ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                demographics.feverActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

      </div>

      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-brand-500" />
            Body Surface Area
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {bsaM2.toFixed(2)} m²
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Dna className="w-3 h-3 text-brand-500" />
            CYP Maturation
          </span>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {(cypMaturation * 100).toFixed(0)}% Baseline
          </span>
        </div>
      </div>

    </div>
  );
};
