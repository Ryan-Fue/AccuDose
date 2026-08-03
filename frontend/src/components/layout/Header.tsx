import React from "react";
import { Activity, ShieldCheck, Sun, Moon, Sparkles, AlertCircle } from "lucide-react";
import type { HealthResponse } from "../../types";

interface HeaderProps {
  health: HealthResponse | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, darkMode, onToggleDarkMode }) => {
  const isOnline = health?.status === "ok";
  const isModelLoaded = health?.model_loaded ?? false;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-choc-600 dark:bg-choc-500 flex items-center justify-center text-white shadow-md shadow-choc-600/20">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                AccuDose <span className="text-choc-600 dark:text-choc-400 font-semibold text-sm px-2 py-0.5 rounded-full bg-choc-50 dark:bg-choc-950 border border-choc-200 dark:border-choc-800">Copilot</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Pediatric Dosing Engine • CHOC Clinical Research Prototype
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-medium">
          
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
            <span>{isOnline ? "API Connected" : "Standalone Preview"}</span>
          </div>

          <div className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full border ${
            isModelLoaded 
              ? "bg-choc-50 dark:bg-choc-950/60 text-choc-700 dark:text-choc-300 border-choc-200 dark:border-choc-800" 
              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
          }`}>
            {isModelLoaded ? <Sparkles className="w-3.5 h-3.5 text-choc-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isModelLoaded ? "PPO Checkpoint Active" : "Heuristic Fallback"}</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Non-Clinical Use</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-choc-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
