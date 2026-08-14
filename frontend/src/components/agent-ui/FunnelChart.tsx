"use client";

import React from "react";
import { FunnelChartProps, FunnelChartPropsSchema } from "@/lib/agent-ui/schema";
import { ArrowDown, CheckCircle2 } from "lucide-react";

export { FunnelChartPropsSchema };
export type { FunnelChartProps };

const STAGE_GRADIENTS = [
  "from-emerald-500 to-emerald-600",
  "from-teal-500 to-teal-600",
  "from-cyan-500 to-cyan-600",
  "from-sky-500 to-sky-600",
  "from-blue-500 to-blue-600",
  "from-indigo-500 to-indigo-600",
];

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);
  const firstVal = stages.length > 0 ? stages[0].value : 1;

  return (
    <div className="w-full p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const widthPct = Math.max(Math.round((stage.value / maxVal) * 100), 8);
          const overallConv = firstVal > 0 ? Math.round((stage.value / firstVal) * 100) : 0;
          const prevVal = idx > 0 ? stages[idx - 1].value : stage.value;
          const stepConv = prevVal > 0 ? Math.round((stage.value / prevVal) * 100) : 100;
          const gradient = STAGE_GRADIENTS[idx % STAGE_GRADIENTS.length];

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold flex items-center justify-center text-[10px] border border-slate-200 dark:border-slate-700">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {stage.value.toLocaleString()}
                  </span>
                  {idx > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {stepConv}% step
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {overallConv}% of total
                  </span>
                </div>
              </div>

              {/* Funnel Progress Bar */}
              <div className="h-6 w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-hidden p-0.5 relative">
                <div
                  className={`h-full rounded-lg bg-gradient-to-r ${gradient} transition-all duration-500 shadow-xs flex items-center justify-end pr-2 text-[10px] font-bold text-white font-mono`}
                  style={{ width: `${widthPct}%` }}
                >
                  {widthPct > 20 && `${stage.value.toLocaleString()}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
