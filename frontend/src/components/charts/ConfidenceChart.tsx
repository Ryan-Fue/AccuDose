import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { TimePoint } from "../../types";

interface ConfidenceChartProps {
  data: TimePoint[];
  confidenceFloor: number;
}

export const ConfidenceChart: React.FC<ConfidenceChartProps> = ({ data, confidenceFloor }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-choc-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Model Safety & Out-Of-Distribution Confidence Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated human hand-back gating triggers when score falls below confidence floor
          </p>
        </div>
      </div>

      <div className="w-full h-[220px] min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis
              dataKey="time_minutes"
              unit="m"
              tick={{ fontSize: 11, fill: "#64748b" }}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[0, 1.0]}
              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
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
            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: "12px" }} />

            <ReferenceLine
              y={confidenceFloor}
              stroke="#d97706"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `Auto-suggest floor (${(confidenceFloor * 100).toFixed(0)}%)`,
                fill: "#d97706",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />

            <Line
              type="monotone"
              dataKey="confidence"
              name="Confidence Score"
              stroke="#0082c8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#0082c8", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
