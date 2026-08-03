import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import type { TimePoint } from "../../types";

interface PumpToxicityChartProps {
  data: TimePoint[];
}

export const PumpToxicityChart: React.FC<PumpToxicityChartProps> = ({ data }) => {
  const bolusPoints = data.filter((d) => d.bolus_given_mg > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Smart Infusion Pump Output & Organ Biomarkers
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Micro-adjusted infusion rate & acute renal toxicity monitoring
          </p>
        </div>
      </div>

      <div className="w-full h-[280px] min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="time_minutes"
              unit="m"
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#cbd5e1"
            />
            <YAxis
              yAxisId="left"
              domain={[0, "auto"]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#cbd5e1"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, "auto"]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#cbd5e1"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />

            <Line
              yAxisId="left"
              type="stepAfter"
              dataKey="last_action_mg_min"
              name="Infusion Rate (mg/min)"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="obs_toxicity_marker"
              name="Toxicity Marker (AKI)"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={false}
            />

            {bolusPoints.length > 0 && (
              <Scatter
                yAxisId="left"
                data={bolusPoints}
                name="Bolus Push (5mg)"
                fill="#0f172a"
                shape="triangle"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
