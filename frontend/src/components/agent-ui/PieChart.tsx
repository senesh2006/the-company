"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { PieChartProps, PieChartPropsSchema } from "@/lib/agent-ui/schema";

export { PieChartPropsSchema };
export type { PieChartProps };

const PIE_COLORS = [
  "#059669", // emerald-600
  "#0284c7", // sky-600
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

export function PieChart({ data, labelKey, valueKey }: PieChartProps) {
  // Ensure values are numbers
  const formattedData = data.map((d) => ({
    ...d,
    [valueKey]: typeof d[valueKey] === "number" ? d[valueKey] : parseFloat(String(d[valueKey])) || 0,
  }));

  return (
    <div className="w-full h-72 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={formattedData}
            dataKey={valueKey}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={45}
            paddingAngle={3}
          >
            {formattedData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
                className="dark:stroke-slate-900"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: "#334155",
              borderRadius: "0.75rem",
              color: "#f8fafc",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {value}
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
