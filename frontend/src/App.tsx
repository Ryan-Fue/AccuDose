import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { LandingView } from "./components/landing/LandingView";
import { PatientDemographicsCard } from "./components/demographics/PatientDemographicsCard";
import { CopilotControlsCard } from "./components/copilot/CopilotControlsCard";
import { SafetyAlertBanner } from "./components/copilot/SafetyAlertBanner";
import { ConcentrationChart } from "./components/charts/ConcentrationChart";
import { PumpToxicityChart } from "./components/charts/PumpToxicityChart";
import { ConfidenceChart } from "./components/charts/ConfidenceChart";
import { ForecastChart } from "./components/charts/ForecastChart";
import { MetricsSummaryGrid } from "./components/copilot/MetricsSummaryGrid";
import { TermsOfUseModal } from "./components/legal/TermsOfUseModal";
import { PrivacyPolicyModal } from "./components/legal/PrivacyPolicyModal";

import type {
  PatientDemographics,
  CopilotSettings,
  SimulateResponse,
  ForecastResponse,
  HealthResponse,
} from "./types";
import { fetchHealth, runSimulation, fetchForecast } from "./services/api";
import { AlertTriangle, Lock, Scale } from "lucide-react";

export function App() {
  const [activeView, setActiveView] = useState<"landing" | "dashboard">("landing");
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [health, setHealth] = useState<HealthResponse | null>(null);
  
  const [demographics, setDemographics] = useState<PatientDemographics>({
    ageDays: 180,
    weightKg: 7.5,
    gestationalAgeWeeks: 40,
    feverActive: true,
  });

  const [copilotSettings, setCopilotSettings] = useState<CopilotSettings>({
    mode: "AI Recommendation (Human Approves)",
    confidenceFloor: 0.4,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulateResponse | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    fetchHealth().then(setHealth);
  }, []);

  const handleRunSimulation = useCallback(async () => {
    setIsLoading(true);
    try {
      const modeParam = copilotSettings.mode === "Full Manual" ? "manual" : "ai";
      const sim = await runSimulation({
        age_days: demographics.ageDays,
        weight_kg: demographics.weightKg,
        gestational_age_weeks: demographics.gestationalAgeWeeks,
        fever_active: demographics.feverActive,
        mode: modeParam,
        confidence_floor: copilotSettings.confidenceFloor,
      });

      setSimResult(sim);

      const fc = await fetchForecast(240, 25);
      setForecastResult(fc);
    } catch (err) {
      console.error("Failed to run simulation:", err);
    } finally {
      setIsLoading(false);
    }
  }, [demographics, copilotSettings]);

  useEffect(() => {
    handleRunSimulation();
  }, [handleRunSimulation]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      <Header
        health={health}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeView={activeView}
        onSelectView={setActiveView}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {activeView === "landing" ? (
          <LandingView
            onLaunchApp={() => setActiveView("dashboard")}
            onOpenTerms={() => setIsTermsOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        ) : (
          <>
            <SafetyAlertBanner simulation={simResult} totalSteps={simResult?.points.length || 144} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-4 space-y-6">
                <PatientDemographicsCard
                  demographics={demographics}
                  onChange={setDemographics}
                  disabled={isLoading}
                />

                <CopilotControlsCard
                  settings={copilotSettings}
                  onChange={setCopilotSettings}
                  onRunSimulation={handleRunSimulation}
                  isLoading={isLoading}
                />
              </div>

              <div className="lg:col-span-8 space-y-6">
                {simResult && simResult.points.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ConcentrationChart data={simResult.points} />
                      <PumpToxicityChart data={simResult.points} />
                    </div>

                    <ConfidenceChart
                      data={simResult.points}
                      confidenceFloor={copilotSettings.confidenceFloor}
                    />

                    {forecastResult && forecastResult.points.length > 0 && (
                      <ForecastChart data={forecastResult.points} />
                    )}

                    <MetricsSummaryGrid
                      points={simResult.points}
                      onApprove={() => console.log("Logged and approved by clinician")}
                    />
                  </>
                ) : (
                  <div className="h-96 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <p className="text-sm font-medium">Click "Run Real-Time Simulation Interval" to start telemetry stream.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Dashboard Bottom Legal Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl space-y-4 text-xs text-slate-500">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>⚠️ Legal Disclaimer:</strong> AccuDose is an educational research prototype and fun demonstration project. It is not an FDA-cleared medical device and does not provide clinical advice. Authors hold zero accountability for usage or data entered.
                </p>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span>AccuDose Copilot • Demonstration Project</span>
                <div className="flex space-x-4">
                  <button onClick={() => setIsTermsOpen(true)} className="hover:text-brand-600 flex items-center space-x-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Terms of Use & Disclaimers</span>
                  </button>
                  <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-brand-600 flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Privacy Policy</span>
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}

      </main>

      {/* Global Legal Modals */}
      <TermsOfUseModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

    </div>
  );
}

export default App;
