"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { BarChartProps, BarChartPropsSchema } from "@/lib/agent-ui/schema";

export { BarChartPropsSchema };
export type { BarChartProps };

const BAR_COLORS = [
  "#059669", // emerald-600
  "#0284c7", // sky-600
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
];

export function BarChart({ data, xKey, yKey }: BarChartProps) {
  return (
    <div className="w-full h-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: "#334155",
              borderRadius: "0.75rem",
              color: "#f8fafc",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
          />
          <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
