import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import type { ForecastPoint } from "../../types";

interface ForecastChartProps {
  data: ForecastPoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Generative 4-Hour Monte Carlo Forecast</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Median trajectory (P50) with P10–P90 uncertainty ribbon</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium">
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
            <span>Mean Forecast</span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#005596" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#005596" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time_minutes" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
              formatter={(val: any) => [`${Number(val || 0).toFixed(2)} mg/L`, "Forecast Mean"]}
              labelFormatter={(lbl: any) => `Future Time: ${lbl} mins`}
            />

            <ReferenceArea y1={2.0} y2={6.0} fill="#10b981" fillOpacity={0.10} />
            <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="3 3" />

            <Area
              type="monotone"
              dataKey="mean"
              stroke="#005596"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#p50Grad)"
            />

            <Area
              type="monotone"
              dataKey="p90"
              stroke="#0082c8"
              strokeDasharray="2 2"
              strokeWidth={1}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
