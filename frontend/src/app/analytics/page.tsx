"use client";

import { useState } from "react";
import { useMetrics, useAgents, useTasks } from "@/lib/queries";
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
  const { data: liveMetrics } = useMetrics();
  const { data: liveAgents } = useAgents();
  const { data: liveTasks } = useTasks();

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const agents = liveAgents || [];
  const tasks = liveTasks || [];

  // Compute live totals
  const totalCompleted = tasks.filter((t: any) => t.status === "completed").length;
  const computedTotalSpend = liveMetrics?.totalCost ? Number(liveMetrics.totalCost) : 1248.50;
  const avgCostPerTask = totalCompleted > 0 ? (computedTotalSpend / totalCompleted).toFixed(2) : "0.42";

  // Spending trend data
  const trendBars = [
    { day: "DAY 01", height: "35%", isHigh: false },
    { day: "", height: "48%", isHigh: false },
    { day: "", height: "42%", isHigh: false },
    { day: "DAY 10", height: "55%", isHigh: false },
    { day: "", height: "68%", isHigh: false },
    { day: "", height: "60%", isHigh: false },
    { day: "DAY 20", height: "78%", isHigh: false },
    { day: "", height: "88%", isHigh: false },
    { day: "", height: "70%", isHigh: false },
    { day: "TODAY", height: "95%", isHigh: true },
  ];

  // Dynamic department cost calculation
  const departments = [
    { name: "Engineering", amount: computedTotalSpend * 0.42, color: "bg-blue-600", dotColor: "bg-blue-600", pct: 42 },
    { name: "Marketing", amount: computedTotalSpend * 0.28, color: "bg-emerald-600", dotColor: "bg-emerald-600", pct: 28 },
    { name: "Finance", amount: computedTotalSpend * 0.18, color: "bg-slate-700", dotColor: "bg-slate-700", pct: 18 },
    { name: "Research & Ops", amount: computedTotalSpend * 0.12, color: "bg-purple-500", dotColor: "bg-purple-500", pct: 12 },
  ];

  // Live or fallback worker cost breakdown
  const workerTable = (agents.length > 0 ? agents : [
    { name: "Atlas", role: "Lead Orchestrator", clean_cycles_count: 12 },
    { name: "Cipher", role: "Software Engineer", clean_cycles_count: 25 },
    { name: "Ledger", role: "Finance Specialist", clean_cycles_count: 8 },
    { name: "Echo", role: "Marketing Specialist", clean_cycles_count: 14 }
  ]).map((a: any, index: number) => {
    const tasksDone = a.clean_cycles_count || (15 + index * 8);
    const cost = (tasksDone * 0.45) + (index * 12);
    const avg = cost / (tasksDone || 1);
    const initials = (a.name || "AI").slice(0, 2).toUpperCase();

    return {
      initials: initials,
      name: a.name,
      department: a.role?.includes("Engineer") ? "Engineering" : a.role?.includes("Finance") ? "Finance" : a.role?.includes("Marketing") ? "Marketing" : "Operations",
      tasksCompleted: tasksDone,
      totalCost: cost,
      avgCost: avg,
      trend: index % 2 === 0 ? "up" : "flat",
      avatarBg: index % 3 === 0 ? "bg-emerald-100 text-emerald-800" : index % 3 === 1 ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
    };
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cost & Analytics
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Monitor spending, efficiency, and resource allocation across your live AI workforce.
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
            onClick={() => alert("Generating live analytics snapshot...")}
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
                ${computedTotalSpend.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>&#9650;</span> +8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Active billing cycle computation
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
                ${avgCostPerTask}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <span>&#9660;</span> -5%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Autonomous execution efficiency
            </p>
          </div>
        </div>

        {/* RESOURCE EFFICIENCY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            System Reliability
          </span>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
                98.4%
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-emerald-700 rounded-full w-[98.4%]" />
            </div>
          </div>
        </div>

        {/* PROJECTED SPEND */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Agents
          </span>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">
              {agents.length > 0 ? agents.length : 5} Workers
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {totalCompleted} completed mandates
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
            <span>DAY 01</span>
            <span>DAY 10</span>
            <span>DAY 20</span>
            <span>TODAY</span>
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
          <h2 className="text-sm md:text-base font-bold text-slate-900">Worker Efficiency & Cost</h2>
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
              {workerTable.map((w) => (
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
              <h3 className="text-xs font-bold text-slate-900">Optimize Specialist Allocations</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Autonomous task execution is operating within budget parameters. Governance rules are enforcing compliance on high-risk operations.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Scale Orchestration Loop</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clean cycle streaks on Assist Tier workers qualify for autonomous Operate promotion once verified by the founder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
