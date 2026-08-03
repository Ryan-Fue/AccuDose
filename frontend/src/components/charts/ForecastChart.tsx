import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import type { ForecastPoint } from "../../types";

interface ForecastChartProps {
  data: ForecastPoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    ...d,
    range: [d.p10, d.p90],
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-choc-600 dark:bg-choc-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Generative 4-Hour Trajectory Forecast & Uncertainty Band
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monte Carlo rollout of digital twin under last-held rate (P10–P90 stochastic dynamics)
          </p>
        </div>
      </div>

      <div className="w-full h-[280px] min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="time_minutes"
              unit="m"
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#cbd5e1"
            />
            <YAxis
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

            <ReferenceArea
              y1={2.0}
              y2={6.0}
              fill="#10b981"
              fillOpacity={0.08}
              stroke="#10b981"
              strokeDasharray="2 2"
              strokeOpacity={0.3}
            />

            <Area
              type="monotone"
              dataKey="range"
              name="P10–P90 Uncertainty Range"
              stroke="none"
              fill="#0082c8"
              fillOpacity={0.2}
            />

            <Line
              type="monotone"
              dataKey="mean"
              name="Predicted Mean Concentration (mg/L)"
              stroke="#005596"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#005596", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
