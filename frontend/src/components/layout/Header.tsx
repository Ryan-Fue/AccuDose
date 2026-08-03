import React from "react";
import { Activity, ShieldCheck, Sun, Moon, Sparkles, AlertCircle, LayoutDashboard, Home } from "lucide-react";
import type { HealthResponse } from "../../types";

interface HeaderProps {
  health: HealthResponse | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeView: "landing" | "dashboard";
  onSelectView: (view: "landing" | "dashboard") => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  darkMode,
  onToggleDarkMode,
  activeView,
  onSelectView,
}) => {
  const isOnline = health?.status === "ok";
  const isModelLoaded = health?.model_loaded ?? false;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Navigation Tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectView("landing")}>
            <div className="w-10 h-10 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  AccuDose <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800">Copilot</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Pediatric Dosing Engine • Clinical Research Prototype
              </p>
            </div>
          </div>

          {/* Navigation View Selector Tabs */}
          <nav className="hidden sm:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onSelectView("landing")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === "landing"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => onSelectView("dashboard")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === "dashboard"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Interactive Copilot</span>
            </button>
          </nav>

        </div>

        {/* Right: API Health, Model Badge, Theme Toggle */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
            <span>{isOnline ? "API Connected" : "Standalone Preview"}</span>
          </div>

          <div className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full border ${
            isModelLoaded 
              ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800" 
              : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
          }`}>
            {isModelLoaded ? <Sparkles className="w-3.5 h-3.5 text-brand-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isModelLoaded ? "PPO Checkpoint Active" : "Heuristic Fallback"}</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Educational Use</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
