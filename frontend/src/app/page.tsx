"use client";

import { useState } from "react";
import { useMetrics, useAgents, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { 
  Users, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  Megaphone, 
  Search, 
  Receipt, 
  Cpu, 
  Database, 
  Plus, 
  ArrowUpRight,
  Sparkles,
  Send,
  X
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { setSelectedAgentId } = useAppStore();

  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("weekly");
  const [isQuickMandateOpen, setIsQuickMandateOpen] = useState(false);
  const [mandateText, setMandateText] = useState("");
  const [isSubmittingMandate, setIsSubmittingMandate] = useState(false);
  const [mandateFeedback, setMandateFeedback] = useState<string | null>(null);

  // Dynamic calculations with sensible realistic fallbacks matching mockup
  const totalWorkers = agents?.length ?? 12;
  const activeTasksCount = tasks?.filter(t => t.status === "running" || t.status === "queued").length || 48;
  const totalCostToday = metrics?.totalCost ? metrics.totalCost.toFixed(2) : "42.30";
  const successRate = metrics?.errorRate !== undefined ? `${(100 - metrics.errorRate).toFixed(1)}%` : "98.2%";

  // Volume Bar Data for Daily vs Weekly
  const volumeData = timeframe === "weekly" ? [
    { label: "W1", value: 35, count: "42 tasks" },
    { label: "W2", value: 65, count: "78 tasks" },
    { label: "W3", value: 45, count: "54 tasks" },
    { label: "W4", value: 80, count: "96 tasks" },
    { label: "W5", value: 72, count: "86 tasks" },
    { label: "W6", value: 95, count: "114 tasks", isPeak: true },
    { label: "W7", value: 55, count: "66 tasks" },
  ] : [
    { label: "Mon", value: 40, count: "14 tasks" },
    { label: "Tue", value: 60, count: "21 tasks" },
    { label: "Wed", value: 75, count: "26 tasks" },
    { label: "Thu", value: 95, count: "34 tasks", isPeak: true },
    { label: "Fri", value: 85, count: "30 tasks" },
    { label: "Sat", value: 30, count: "10 tasks" },
    { label: "Sun", value: 20, count: "7 tasks" },
  ];

  const handleQuickMandateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandateText.trim() || isSubmittingMandate) return;
    setIsSubmittingMandate(true);
    try {
      await api.dispatchMandate({
        mandate: mandateText.trim(),
        priority: "normal",
        cadence: "once"
      });
      setMandateFeedback("Mandate contract dispatched to autonomous workforce!");
      setMandateText("");
      refetchTasks();
      setTimeout(() => {
        setMandateFeedback(null);
        setIsQuickMandateOpen(false);
      }, 2000);
    } catch (err: any) {
      setMandateFeedback("Error: " + (err.message || "Failed to dispatch mandate"));
    } finally {
      setIsSubmittingMandate(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          System-wide overview of your AI workforce and operations.
        </p>
      </div>

      {/* 2. Top Stats Row (4 Metric Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card 1: Total Workers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Workers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{totalWorkers}</span>
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
                <span>&uarr;</span> 2 since yesterday
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{activeTasksCount}</span>
            {/* Circular mini progress gauge showing 85% */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-700"
                  strokeDasharray="85, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-700 font-mono">85%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Cost Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Cost Today</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">${totalCostToday}</span>
            {/* Green smooth mini sparkline */}
            <div className="w-full h-5 mt-1.5 flex items-end">
              <svg className="w-full h-5 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  d="M0 16 Q 15 18, 30 11 T 60 14 T 85 5 T 100 8"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Success Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg. Success Rate</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">{successRate}</span>
            <div className="flex items-center text-emerald-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Middle Section (Task Completion Volume + Worker Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Task Completion Volume */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900">Task Completion Volume</h2>
            {/* Daily / Weekly toggle pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTimeframe("daily")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === "daily" 
                    ? "bg-emerald-800 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === "weekly" 
                    ? "bg-emerald-800 text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 flex items-end justify-between gap-3 md:gap-5 min-h-[220px]">
            {volumeData.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-md pointer-events-none mb-1">
                  {bar.count}
                </div>
                
                {/* Bar element */}
                <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-[140px]">
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      bar.isPeak 
                        ? "bg-emerald-600/30 border-t-4 border-emerald-700" 
                        : "bg-teal-700/20 hover:bg-emerald-600/30"
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                </div>

                <span className="text-[11px] font-semibold text-slate-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Worker Distribution */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Worker Distribution</h2>

          {/* Segmented Donut Chart */}
          <div className="flex flex-col items-center justify-center my-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                {/* Segment 1: Marketing 40% (Emerald Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray="95.5 238.7"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Finance 25% (Navy Slate) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#334155"
                  strokeWidth="12"
                  strokeDasharray="59.7 238.7"
                  strokeDashoffset="-95.5"
                />
                {/* Segment 3: Research 20% (Burgundy Rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#be123c"
                  strokeWidth="12"
                  strokeDasharray="47.7 238.7"
                  strokeDashoffset="-155.2"
                />
                {/* Segment 4: Operations 15% (Sage Muted) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#94a3b8"
                  strokeWidth="12"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-202.9"
                />
              </svg>
              
              {/* Center Donut Hole Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{totalWorkers}</span>
                <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">AGENTS</span>
              </div>
            </div>
          </div>

          {/* Legend / Breakdown List */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Marketing</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">40%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span className="text-slate-600 font-medium">Finance</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">25%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                <span className="text-slate-600 font-medium">Research</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">20%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-slate-600 font-medium">Operations</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">15%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Bottom Section (Recent Activities + System Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Recent Activities */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900">Recent Activities</h2>
            <a 
              href="/tasks" 
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View All Logs
            </a>
          </div>

          <div className="space-y-3">
            {/* Activity 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 border-l-4 border-l-emerald-500 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Marketing Manager completed <span className="text-emerald-800">"Ad Copy Optimization"</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">2 mins ago &bull; Duration: 14s</p>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 border-l-4 border-l-rose-500 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-rose-100/70 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <Search className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Research Agent started <span className="text-rose-800">"Q3 Market Audit"</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">12 mins ago &bull; 0% complete</p>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3.5 border-l-4 border-l-slate-500 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Finance Bot processed <span className="text-slate-900">"Invoice #8842"</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">45 mins ago &bull; Success</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: System Health */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
          <h2 className="text-sm md:text-base font-bold text-slate-900">System Health</h2>

          <div className="space-y-4">
            {/* Meter 1: Compute Clusters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <Cpu className="w-4 h-4 text-slate-500" />
                  <span>Compute Clusters</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">86% Peak</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "86%" }} />
              </div>
            </div>

            {/* Meter 2: Global Context Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span>Global Context Memory</span>
                </div>
                <span className="font-mono text-slate-500 font-semibold">1.2 TB / 2.0 TB</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-300 rounded-full" style={{ width: "60%" }} />
              </div>
            </div>
          </div>

          {/* Bottom 2 Mini Metric Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">API LATENCY</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5">24ms</span>
              <span className="text-[10px] text-slate-500">Nominal performance</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CONNS.</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5">1,204</span>
              <span className="text-[10px] text-slate-500">Active webhooks</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setIsQuickMandateOpen(true)}
          className="w-12 h-12 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
          title="Dispatch Mandate / Quick Action"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Quick Mandate Modal */}
      {isQuickMandateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dispatch Executive Mandate</h3>
                  <p className="text-[11px] text-slate-500">Autonomous fleet will coordinate and execute</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQuickMandateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickMandateSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={mandateText}
                onChange={(e) => setMandateText(e.target.value)}
                placeholder="E.g. Analyze Q3 marketing channels and draft an optimization proposal..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
              />

              {mandateFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-medium">
                  {mandateFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickMandateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!mandateText.trim() || isSubmittingMandate}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingMandate ? "Dispatching..." : "Launch Mandate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
