"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Megaphone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  FileText
} from "lucide-react";
import { useTodayBriefing, useRefreshTodayBriefing } from "@/lib/queries";
import Link from "next/link";

export function TodaysBriefing() {
  const { data: briefing, isLoading, isError, refetch } = useTodayBriefing();
  const refreshMutation = useRefreshTodayBriefing();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"narrative" | "departments" | "priorities">("narrative");

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (e) {
      console.error("Failed to refresh briefing", e);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  if (isError || !briefing) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today&apos;s Executive Briefing</h3>
            <p className="text-xs text-slate-500">Autonomous intelligence is ready to synthesize yesterday&apos;s operations.</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Generate Briefing</span>
        </button>
      </div>
    );
  }

  const {
    headline,
    period,
    date,
    executive_summary,
    marketing_update,
    finance_update,
    completed_milestones = [],
    todays_priorities = [],
    action_items_needed = [],
    metrics: briefingMetrics
  } = briefing;

  return (
    <div className="w-full bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950/80 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 space-y-5 relative overflow-hidden transition-all">
      {/* Decorative Gradient Background Highlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-600 p-0.5 shadow-md shadow-emerald-500/10">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Today&apos;s Executive Briefing
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                AI Synthesis
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {date || "Today"}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {period || "Yesterday's Operations"}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Refresh & Collapse */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95 disabled:opacity-50"
            title="Re-run AI analysis with latest data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{refreshMutation.isPending ? "Analyzing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
            title={isExpanded ? "Collapse Briefing" : "Expand Briefing"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Key Takeaway Headline Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 flex items-start gap-3.5 relative z-10">
        <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Executive Key Takeaway
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">
            {headline}
          </p>
        </div>
      </div>

      {/* 3. Expandable Deep Dive Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-1 relative z-10"
          >
            {/* View Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("narrative")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === "narrative"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Analysis</span>
              </button>

              <button
                onClick={() => setActiveTab("departments")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === "departments"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Department Updates</span>
              </button>

              <button
                onClick={() => setActiveTab("priorities")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === "priorities"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Today&apos;s Strategic Focus</span>
              </button>
            </div>

            {/* TAB 1: EXECUTIVE NARRATIVE */}
            {activeTab === "narrative" && (
              <div className="space-y-4">
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-line bg-white/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 font-medium">
                  {executive_summary}
                </div>

                {/* Accomplished Milestones */}
                {completed_milestones.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Key Accomplishments & Deliverables Completed</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {completed_milestones.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DEPARTMENT UPDATES */}
            {activeTab === "departments" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marketing */}
                <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span>Marketing & Growth Department</span>
                    </h4>
                    <Link href="/departments?dept=marketing" className="text-[11px] text-cyan-700 dark:text-cyan-400 font-bold hover:underline">
                      View Hub
                    </Link>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {marketing_update}
                  </p>
                </div>

                {/* Finance */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Finance & Accounting Department</span>
                    </h4>
                    <Link href="/departments?dept=finance" className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      View Hub
                    </Link>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {finance_update}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: TODAY'S STRATEGIC PRIORITIES */}
            {activeTab === "priorities" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Autonomous Roadmap & Priorities for Today</span>
                  </h4>
                  <div className="space-y-2">
                    {todays_priorities.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 text-xs">
                        <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attention Items Required */}
                {action_items_needed.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Executive Attention: </span>
                        <span>{action_items_needed.join(", ")}</span>
                      </div>
                    </div>
                    <Link
                      href="/approvals"
                      className="px-3 py-1 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 text-amber-950 dark:text-amber-100 text-xs font-bold transition shrink-0"
                    >
                      Inspect Queue
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 4. Mini Metrics Strip */}
            {briefingMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Completed Tasks</span>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {briefingMetrics.completed_tasks_count}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400">In-Flight Tasks</span>
                  <p className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                    {briefingMetrics.running_tasks_count}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Ledger Revenue</span>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    ${(briefingMetrics.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Operating Margin</span>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    ${(briefingMetrics.net_income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
