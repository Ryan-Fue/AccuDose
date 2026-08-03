import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine } from "recharts";
import { Activity } from "lucide-react";
import type { TimePoint } from "../../types";

interface ConcentrationChartProps {
  data: TimePoint[];
}

export const ConcentrationChart: React.FC<ConcentrationChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Observed Drug Concentration vs. Target Window</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Target: 2.0 – 6.0 mg/L (Green Range)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium">
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
            <span>Obs Concentration</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time_minutes" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px" }}
              formatter={(val: any) => [`${Number(val || 0).toFixed(2)} mg/L`, "Concentration"]}
              labelFormatter={(lbl: any) => `Time: ${lbl} mins`}
            />

            <ReferenceArea y1={2.0} y2={6.0} fill="#10b981" fillOpacity={0.12} />
            <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Toxicity Threshold (8.0 mg/L)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />

            <Line
              type="monotone"
              dataKey="true_concentration_mg_l"
              stroke="#005596"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
