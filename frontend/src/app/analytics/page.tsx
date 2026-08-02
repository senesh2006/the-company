"use client";

import { useState } from "react";
import { useMetrics, useAgents } from "@/lib/queries";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles, 
  Clock, 
  Zap, 
  ChevronDown,
  Bot
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Spending trend mock data matching the screenshot
  const trendBars = [
    { day: "OCT 01", height: "35%", isHigh: false },
    { day: "", height: "48%", isHigh: false },
    { day: "", height: "42%", isHigh: false },
    { day: "OCT 10", height: "55%", isHigh: false },
    { day: "", height: "68%", isHigh: false },
    { day: "", height: "60%", isHigh: false },
    { day: "OCT 20", height: "78%", isHigh: false },
    { day: "", height: "88%", isHigh: false },
    { day: "", height: "70%", isHigh: false },
    { day: "OCT 30", height: "98%", isHigh: true },
  ];

  // Department cost breakdown
  const departments = [
    { name: "Marketing", amount: 482.10, color: "bg-emerald-800", dotColor: "bg-emerald-800", pct: 38 },
    { name: "Finance", amount: 312.40, color: "bg-slate-700", dotColor: "bg-slate-700", pct: 25 },
    { name: "Research", amount: 295.00, color: "bg-blue-300", dotColor: "bg-blue-300", pct: 24 },
    { name: "Operations", amount: 159.00, color: "bg-slate-300", dotColor: "bg-slate-300", pct: 13 },
  ];

  // Worker breakdown
  const workersCost = [
    {
      initials: "MM",
      name: "Marketing Manager",
      department: "Marketing",
      tasksCompleted: 412,
      totalCost: 156.20,
      avgCost: 0.38,
      trend: "up",
      avatarBg: "bg-emerald-100 text-emerald-800"
    },
    {
      initials: "FA",
      name: "Finance Auditor",
      department: "Finance",
      tasksCompleted: 285,
      totalCost: 210.45,
      avgCost: 0.74,
      trend: "down",
      avatarBg: "bg-blue-100 text-blue-800"
    },
    {
      initials: "RA",
      name: "Research Assistant",
      department: "Research",
      tasksCompleted: 892,
      totalCost: 115.80,
      avgCost: 0.13,
      trend: "flat",
      avatarBg: "bg-purple-100 text-purple-800"
    }
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cost & Analytics
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Monitor spending, efficiency, and resource allocation across your AI workforce.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Date Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl z-30">
                {["Last 7 Days", "Last 30 Days", "This Quarter", "Year to Date"].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setDateRange(r);
                      setShowDatePicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium ${
                      dateRange === r ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download Report Button */}
          <button
            onClick={() => alert("Generating comprehensive PDF analytics report...")}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* TOTAL SPEND */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Spend
          </span>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
                $1,248.50
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>&#9650;</span> +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              vs. last month ($1,114.73)
            </p>
          </div>
        </div>

        {/* AVG. COST PER TASK */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Avg. Cost Per Task
          </span>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
                $0.42
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>&#9660;</span> -2%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Efficiency Improved
            </p>
          </div>
        </div>

        {/* RESOURCE EFFICIENCY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Resource Efficiency
          </span>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
                94.2%
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-800 rounded-full w-[94.2%]" />
            </div>
          </div>
        </div>

        {/* PROJECTED SPEND */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Projected Spend
          </span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
              $3,150.00
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Estimate for current billing cycle
            </p>
          </div>
        </div>
      </div>

      {/* 3. Charts Row (Spending Trend + Cost by Department) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Spending Trend (Col 8/12) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm md:text-base font-bold text-slate-900">Spending Trend</h2>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-800" />
                <span className="text-slate-600">Costs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-400">Average</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
            {trendBars.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                    bar.isHigh
                      ? "bg-emerald-800 group-hover:bg-emerald-900"
                      : "bg-emerald-600/50 group-hover:bg-emerald-600/70"
                  }`}
                  style={{ height: bar.height }}
                />
              </div>
            ))}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-2 uppercase tracking-wider px-2">
            <span>OCT 01</span>
            <span>OCT 10</span>
            <span>OCT 20</span>
            <span>OCT 30</span>
          </div>
        </div>

        {/* Cost by Department (Col 4/12) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 mb-5">Cost by Department</h2>
            
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${dept.dotColor}`} />
                    <span className="text-slate-700 font-medium">{dept.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ${dept.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Segmented Color Bar */}
          <div className="pt-6">
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100">
              {departments.map((dept) => (
                <div
                  key={dept.name}
                  className={`h-full ${dept.color}`}
                  style={{ width: `${dept.pct}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cost by Worker Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Cost by Worker</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6 font-semibold text-slate-500">Worker</th>
                <th className="py-3.5 px-6 font-semibold text-slate-500">Department</th>
                <th className="py-3.5 px-6 font-semibold text-slate-500 text-center">Tasks Completed</th>
                <th className="py-3.5 px-6 font-semibold text-slate-500 text-right">Total Cost</th>
                <th className="py-3.5 px-6 font-semibold text-slate-500 text-right">Avg. Cost</th>
                <th className="py-3.5 px-6 font-semibold text-slate-500 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {workersCost.map((w) => (
                <tr key={w.name} className="hover:bg-slate-50/80 transition-colors">
                  {/* Worker Avatar & Name */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${w.avatarBg} font-bold flex items-center justify-center text-xs shrink-0`}>
                        {w.initials}
                      </div>
                      <span className="font-bold text-slate-900">{w.name}</span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {w.department}
                  </td>

                  {/* Tasks Completed */}
                  <td className="py-4 px-6 text-center font-mono font-medium text-slate-700">
                    {w.tasksCompleted}
                  </td>

                  {/* Total Cost */}
                  <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                    ${w.totalCost.toFixed(2)}
                  </td>

                  {/* Avg. Cost */}
                  <td className="py-4 px-6 text-right font-mono text-slate-600">
                    ${w.avgCost.toFixed(2)}
                  </td>

                  {/* Trend Indicator */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center">
                      {w.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : w.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Smart Suggestions Banner */}
      <div className="bg-emerald-50/40 rounded-3xl p-6 border border-emerald-200/60 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-emerald-900">Smart Suggestions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Optimize Finance Agent</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                High idle time detected between 02:00 and 06:00. Switching to &quot;On-Demand&quot; mode could save $42.00/month.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Scale Research Cluster</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Peak usage detected daily at 14:00. Scaling up 15 minutes prior will reduce average task latency by 24%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
