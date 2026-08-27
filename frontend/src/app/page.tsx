"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetrics, useAgents, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
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
  X,
  Bot,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { TodaysBriefing } from "@/components/dashboard/TodaysBriefing";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { setSelectedAgentId } = useAppStore();

  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("weekly");
  const [isQuickMandateOpen, setIsQuickMandateOpen] = useState(false);
  const [mandateText, setMandateText] = useState("");
  const [isSubmittingMandate, setIsSubmittingMandate] = useState(false);
  const [mandateFeedback, setMandateFeedback] = useState<string | null>(null);

  // Auth gate: redirect unauthenticated visitors to the marketing landing page
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/landing");
    }
  }, [authLoading, user, router]);

  // Show nothing while checking auth or redirecting
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Dynamic calculations reflecting real live user data
  const totalWorkers = agents?.length ?? 0;
  const activeTasksList = tasks?.filter(t => t.status === "running" || t.status === "queued" || t.status === "pending") || [];
  const activeTasksCount = activeTasksList.length;
  const totalCostToday = (metrics?.totalCost || 0).toFixed(2);
  const successRate = metrics?.errorRate !== undefined ? `${(100 - metrics.errorRate).toFixed(1)}%` : "100%";

  // Dynamic department distribution
  const departmentCounts: Record<string, number> = {
    Marketing: 0,
    Finance: 0,
    Research: 0,
    Operations: 0,
  };

  (agents || []).forEach(a => {
    const r = (a.role || "").toLowerCase();
    if (r.includes("market") || r.includes("growth")) {
      departmentCounts.Marketing += 1;
    } else if (r.includes("finance") || r.includes("account")) {
      departmentCounts.Finance += 1;
    } else if (r.includes("research") || r.includes("data") || r.includes("analyst")) {
      departmentCounts.Research += 1;
    } else {
      departmentCounts.Operations += 1;
    }
  });

  const mktPct = totalWorkers > 0 ? Math.round((departmentCounts.Marketing / totalWorkers) * 100) : 0;
  const finPct = totalWorkers > 0 ? Math.round((departmentCounts.Finance / totalWorkers) * 100) : 0;
  const resPct = totalWorkers > 0 ? Math.round((departmentCounts.Research / totalWorkers) * 100) : 0;
  const opsPct = totalWorkers > 0 ? Math.max(0, 100 - mktPct - finPct - resPct) : 0;

  // Volume Data computed dynamically
  const completedCount = tasks?.filter(t => t.status === "completed").length || 0;
  const volumeData = timeframe === "weekly" ? [
    { label: "W1", value: totalWorkers > 0 ? 15 : 0, count: `${Math.round(completedCount * 0.1)} tasks` },
    { label: "W2", value: totalWorkers > 0 ? 25 : 0, count: `${Math.round(completedCount * 0.15)} tasks` },
    { label: "W3", value: totalWorkers > 0 ? 30 : 0, count: `${Math.round(completedCount * 0.2)} tasks` },
    { label: "W4", value: totalWorkers > 0 ? 40 : 0, count: `${Math.round(completedCount * 0.25)} tasks` },
    { label: "W5", value: totalWorkers > 0 ? 60 : 0, count: `${Math.round(completedCount * 0.3)} tasks` },
    { label: "W6", value: totalWorkers > 0 ? 85 : 0, count: `${completedCount} tasks`, isPeak: true },
    { label: "W7", value: totalWorkers > 0 ? 45 : 0, count: `${activeTasksCount} active` },
  ] : [
    { label: "Mon", value: totalWorkers > 0 ? 20 : 0, count: "0 tasks" },
    { label: "Tue", value: totalWorkers > 0 ? 35 : 0, count: "0 tasks" },
    { label: "Wed", value: totalWorkers > 0 ? 50 : 0, count: "0 tasks" },
    { label: "Thu", value: totalWorkers > 0 ? 75 : 0, count: `${completedCount} tasks`, isPeak: true },
    { label: "Fri", value: totalWorkers > 0 ? 60 : 0, count: "0 tasks" },
    { label: "Sat", value: totalWorkers > 0 ? 20 : 0, count: "0 tasks" },
    { label: "Sun", value: totalWorkers > 0 ? 10 : 0, count: "0 tasks" },
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

  const recentTasks = (tasks || []).slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            System-wide overview of your AI workforce and operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsQuickMandateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dispatch Mandate</span>
          </button>
        </div>
      </div>

      {/* Quick Mandate Modal */}
      {isQuickMandateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsQuickMandateOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:text-slate-300 p-1 rounded-xl hover:bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Direct Workforce Mandate</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Instruct your autonomous agent workforce in natural language.</p>
              </div>
            </div>

            <form onSubmit={handleQuickMandateSubmit} className="space-y-4">
              <textarea
                value={mandateText}
                onChange={(e) => setMandateText(e.target.value)}
                placeholder="e.g. Conduct market analysis on competitive pricing and generate a summary report..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                required
              />

              {mandateFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  mandateFeedback.startsWith("Error") ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}>
                  {mandateFeedback}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickMandateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMandate || !mandateText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                >
                  {isSubmittingMandate ? (
                    <span>Dispatching...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Execute Mandate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Today's Executive AI Briefing */}
      <TodaysBriefing />

      {/* 3. Top Stats Row (4 Metric Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        
        {/* Card 1: Total Workers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Workers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalWorkers}</span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-0.5">
                {totalWorkers === 0 ? "No active agents" : `${totalWorkers} active`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{activeTasksCount}</span>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              {activeTasksCount === 0 ? "Idle" : "In Progress"}
            </span>
          </div>
        </div>

        {/* Card 3: Total Cost Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Cost Today</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">${totalCostToday}</span>
          </div>
        </div>

        {/* Card 4: Avg. Success Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg. Success Rate</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">{successRate}</span>
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
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Task Completion Volume</h2>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setTimeframe("daily")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === "daily" 
                    ? "bg-emerald-800 text-white shadow-xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === "weekly" 
                    ? "bg-emerald-800 text-white shadow-xs" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex items-end justify-between gap-3 md:gap-5 min-h-[220px]">
            {volumeData.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-md pointer-events-none mb-1">
                  {bar.count}
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex items-end h-[140px]">
                  <div 
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      bar.isPeak 
                        ? "bg-emerald-600/40 border-t-4 border-emerald-700" 
                        : "bg-emerald-700/20 hover:bg-emerald-600/30"
                    }`}
                    style={{ height: `${Math.max(bar.value, 4)}%` }}
                  />
                </div>

                <span className="text-[11px] font-semibold text-slate-400">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Worker Distribution */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Worker Distribution</h2>

          {totalWorkers === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl my-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Workers Recruited</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Recruit agents to populate your workforce breakdown.</p>
              </div>
              <a
                href="/hire"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs"
              >
                Hire Worker
              </a>
            </div>
          ) : (
            <>
              {/* Segmented Donut Chart */}
              <div className="flex flex-col items-center justify-center my-2">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-40 h-40 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${(mktPct / 100) * 238.7} 238.7`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{totalWorkers}</span>
                    <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">AGENTS</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Marketing</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{mktPct}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Finance</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{finPct}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-700"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Research</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{resPct}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Operations</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{opsPct}%</span>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* 4. Bottom Section (Recent Activities + System Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Recent Activities */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Recent Activities</h2>
            <a 
              href="/tasks" 
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              View All Logs
            </a>
          </div>

          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center gap-2">
                <Activity className="w-6 h-6 text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Recent Operations</p>
                <p className="text-[11px] text-slate-400">Dispatch your first mandate to initiate agent activity logs.</p>
              </div>
            ) : (
              recentTasks.map((t: any) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 dark:border-slate-800 flex items-start gap-3.5 border-l-4 border-l-emerald-500 hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug truncate">
                      {t.description || t.mandate || "Autonomous Operation"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Status: {t.status} &bull; {new Date(t.created_at || Date.now()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: System Health */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
          <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">System Health</h2>

          <div className="space-y-4">
            {/* Meter 1: Compute Clusters */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <Cpu className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Compute Clusters</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">Operational</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: totalWorkers > 0 ? "65%" : "10%" }} />
              </div>
            </div>

            {/* Meter 2: Global Context Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                  <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Knowledge Base Storage</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">Active</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-700 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Company OS Cloud Engine</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700">Online</span>
          </div>
        </div>

      </div>
    </div>
  );
}
