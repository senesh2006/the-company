"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { LineChartProps, LineChartPropsSchema } from "@/lib/agent-ui/schema";

export { LineChartPropsSchema };
export type { LineChartProps };

export function LineChart({ data, xKey, yKey, seriesLabel }: LineChartProps) {
  return (
    <div className="w-full h-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
            labelStyle={{ fontWeight: "bold", color: "#38bdf8", marginBottom: "4px" }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            name={seriesLabel || yKey}
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#059669", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
