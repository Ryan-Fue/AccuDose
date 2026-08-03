import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { ShieldCheck } from "lucide-react";
import type { TimePoint } from "../../types";

interface ConfidenceChartProps {
  data: TimePoint[];
  confidenceFloor: number;
}

export const ConfidenceChart: React.FC<ConfidenceChartProps> = ({ data, confidenceFloor }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">OOD Safety Confidence Score Stream</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mahalanobis ensemble variance score (0.0 to 1.0)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium">
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span>OOD Confidence</span>
          </div>
        </div>
      </div>

      <div className="h-48 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0082c8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0082c8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time_minutes" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis domain={[0, 1.0]} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
              formatter={(val: any) => [`${(Number(val || 0) * 100).toFixed(1)}%`, "Confidence Score"]}
              labelFormatter={(lbl: any) => `Time: ${lbl} mins`}
            />

            <ReferenceLine
              y={confidenceFloor}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: `Safety Floor (${(confidenceFloor * 100).toFixed(0)}%)`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
            />

            <Area
              type="monotone"
              dataKey="confidence"
              stroke="#0082c8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#confidenceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
