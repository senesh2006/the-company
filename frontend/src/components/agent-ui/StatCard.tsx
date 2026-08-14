"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StatCardProps, StatCardPropsSchema } from "@/lib/agent-ui/schema";

export { StatCardPropsSchema };
export type { StatCardProps };

export function StatCard({ label, value, delta, deltaDirection }: StatCardProps) {
  const isUp = deltaDirection === "up";
  const isDown = deltaDirection === "down";

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {delta !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
              isUp
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : isDown
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isDown ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>
              {delta > 0 && isUp ? `+${delta}%` : `${delta}%`}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
}
