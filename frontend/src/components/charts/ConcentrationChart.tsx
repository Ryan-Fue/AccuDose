import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import type { TimePoint } from "../../types";

interface ConcentrationChartProps {
  data: TimePoint[];
}

export const ConcentrationChart: React.FC<ConcentrationChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-choc-600 dark:bg-choc-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Proteomic Stream & Drug Concentration
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Target therapeutic window: <span className="font-semibold text-emerald-600 dark:text-emerald-400">2.0 – 6.0 mg/L</span>
          </p>
        </div>
      </div>

      <div className="w-full h-[280px] min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="concGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#005596" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#005596" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
              domain={[0, 2.0]}
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

            {/* Target Therapeutic Area Band */}
            <ReferenceArea
              yAxisId="left"
              y1={2.0}
              y2={6.0}
              fill="#10b981"
              fillOpacity={0.12}
              stroke="#10b981"
              strokeDasharray="2 2"
              strokeOpacity={0.4}
              label={{ value: "Therapeutic Target Range", fill: "#059669", fontSize: 10, position: "insideTopLeft" }}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="obs_drug_concentration_proxy"
              name="Observed Drug Conc (mg/L)"
              stroke="#005596"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: "#005596", stroke: "#ffffff", strokeWidth: 2 }}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="obs_cyp_activity"
              name="CYP Enzyme Activity"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
