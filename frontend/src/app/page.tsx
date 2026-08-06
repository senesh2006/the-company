"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  ArrowUpRight, 
  Search, 
  Video, 
  Clock, 
  Pause, 
  Square, 
  CheckCircle2, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Command, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Bot, 
  X,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  TrendingUp,
  Download,
  Smartphone,
  FolderPlus,
  FileSpreadsheet
} from "lucide-react";
import { useMetrics, useAgents, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { setSelectedAgentId } = useAppStore();

  const [isQuickMandateOpen, setIsQuickMandateOpen] = useState(false);
  const [mandateText, setMandateText] = useState("");
  const [isSubmittingMandate, setIsSubmittingMandate] = useState(false);
  const [mandateFeedback, setMandateFeedback] = useState<string | null>(null);

  // Time Tracker State
  const [timeSeconds, setTimeSeconds] = useState(5048); // 01:24:08 default
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let timer: any;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimeSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      setMandateFeedback("Directive contract dispatched successfully!");
      setMandateText("");
      refetchTasks();
      setTimeout(() => {
        setMandateFeedback(null);
        setIsQuickMandateOpen(false);
      }, 2000);
    } catch (err: any) {
      setMandateFeedback("Error: " + (err.message || "Failed to dispatch directive"));
    } finally {
      setIsSubmittingMandate(false);
    }
  };

  // Live metrics calculation
  const totalDirectives = tasks?.length ?? 24;
  const completedTasks = tasks?.filter(t => t.status === "completed").length ?? 10;
  const runningWorkers = agents?.filter(a => a.status === "Running" || a.status === "Idle").length ?? 12;
  const pendingApprovals = tasks?.filter(t => t.status === "needs_approval" || t.status === "pending").length ?? 2;

  // Active AI Workforce roster (Donezo Team Collaboration)
  const workforceRoster = [
    {
      id: "1",
      name: "Alexandra Deff",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Lead Software Architect",
      task: "Working on GitHub Project Repository",
      status: "Completed",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    },
    {
      id: "2",
      name: "Edwin Adenike",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      role: "Senior Security Specialist",
      task: "Working on Integrate User Authentication System",
      status: "In Progress",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
    },
    {
      id: "3",
      name: "Isaac Oluwatemilorun",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      role: "AI Data Analyst",
      task: "Working on Develop Search and Filter Functionality",
      status: "Pending",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30"
    },
    {
      id: "4",
      name: "David Oshodi",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80",
      role: "Growth Operations Agent",
      task: "Working on Responsive Layout for Homepage",
      status: "In Progress",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
    }
  ];

  // Active Projects list (Donezo Projects widget)
  const activeProjects = [
    { id: 1, title: "Develop API Endpoints", date: "Due date: Nov 26, 2026", color: "bg-blue-500" },
    { id: 2, title: "Onboarding Flow", date: "Due date: Nov 28, 2026", color: "bg-emerald-500" },
    { id: 3, title: "Build Dashboard", date: "Due date: Nov 30, 2026", color: "bg-amber-500" },
    { id: 4, title: "Optimize Page Load", date: "Due date: Dec 5, 2026", color: "bg-purple-500" },
    { id: 5, title: "Cross-Browser Testing", date: "Due date: Dec 6, 2026", color: "bg-rose-500" },
  ];

  return (
    <div className="space-y-6 pb-20 text-slate-100 font-sans">
      {/* 1. HEADER & TOP SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Plan, prioritize, and accomplish your company objectives with ease.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search Bar matching Donezo header */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search task..."
              className="w-full bg-slate-900 border border-slate-800 rounded-full pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              ⌘F
            </div>
          </div>

          <button
            onClick={() => setIsQuickMandateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>

          <button
            onClick={() => setIsQuickMandateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition"
          >
            <span>Import Data</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS ROW (4 CARDS WITH TOP-RIGHT CIRCLE ARROWS ↗) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: DARK FOREST GREEN HIGHLIGHT CARD */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-600/40 text-white shadow-2xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-emerald-200 tracking-wider">Total Projects</span>
            <button className="w-8 h-8 rounded-full bg-emerald-800/60 border border-emerald-500/40 flex items-center justify-center text-emerald-200 group-hover:scale-110 transition">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black text-white font-mono">{totalDirectives}</h3>
            <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
              <span>5▲</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </div>

        {/* CARD 2: ENDED PROJECTS */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider">Ended Projects</span>
            <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:scale-110 transition">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black text-white font-mono">{completedTasks}</h3>
            <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
              <span>6▲</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </div>

        {/* CARD 3: RUNNING PROJECTS */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider">Running Projects</span>
            <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:scale-110 transition">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black text-white font-mono">{runningWorkers}</h3>
            <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
              <span>2▲</span>
              <span>Increased from last month</span>
            </div>
          </div>
        </div>

        {/* CARD 4: PENDING PROJECT */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider">Pending Project</span>
            <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:scale-110 transition">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black text-white font-mono">{pendingApprovals}</h3>
            <p className="mt-3 text-[11px] font-bold text-amber-400">
              On Discuss / Human Gate
            </p>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW (PROJECT ANALYTICS + REMINDERS + ACTIVE PROJECTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COL 1: PROJECT ANALYTICS BAR CHART (5 COLS) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Project Analytics</h3>
            <span className="text-xs text-slate-400 font-semibold">Weekly Activity</span>
          </div>

          {/* Custom Donezo Pill Bar Chart */}
          <div className="h-44 flex items-end justify-between px-2 pt-6 pb-2">
            {[
              { day: "S", height: "60%", type: "striped" },
              { day: "M", height: "85%", type: "solid-light" },
              { day: "T", height: "76%", type: "solid-teal", badge: "76%" },
              { day: "W", height: "95%", type: "solid-dark" },
              { day: "T", height: "70%", type: "striped" },
              { day: "F", height: "65%", type: "striped" },
              { day: "S", height: "55%", type: "striped" }
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end relative group">
                {bar.badge && (
                  <div className="absolute -top-7 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    {bar.badge}
                  </div>
                )}
                <div
                  className={`w-8 rounded-full transition-all duration-300 ${
                    bar.type === "solid-dark"
                      ? "bg-emerald-950 border border-emerald-600/50"
                      : bar.type === "solid-teal"
                      ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                      : bar.type === "solid-light"
                      ? "bg-emerald-700"
                      : "bg-slate-800/80 border border-dashed border-slate-700"
                  }`}
                  style={{ height: bar.height }}
                />
                <span className="text-xs font-bold text-slate-400">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2: REMINDERS WIDGET (3 COLS) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reminders</span>
            <h4 className="text-base font-extrabold text-white mt-2 leading-snug">
              Meeting with Arc Company
            </h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Time : 02.00 pm - 04.00 pm
            </p>
          </div>

          <button
            onClick={() => setIsQuickMandateOpen(true)}
            className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Start Meeting</span>
          </button>
        </div>

        {/* COL 3: PROJECTS LIST (4 COLS) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Project</h3>
            <button
              onClick={() => setIsQuickMandateOpen(true)}
              className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeProjects.map((proj) => (
              <div key={proj.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${proj.color}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">
                      {proj.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">{proj.date}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM ROW (TEAM COLLABORATION + PROJECT PROGRESS GAUGE + TIME TRACKER) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COL 1: TEAM COLLABORATION / AI WORKFORCE ROSTER (5 COLS) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Team Collaboration</h3>
            <Link
              href="/hire"
              className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </Link>
          </div>

          <div className="space-y-3">
            {workforceRoster.map((worker) => (
              <div key={worker.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={worker.avatar}
                    alt={worker.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{worker.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-[220px]">
                      {worker.task}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${worker.badgeColor}`}>
                  {worker.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2: PROJECT PROGRESS SEMI-CIRCLE GAUGE (3 COLS) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Project Progress</h3>

          {/* Gauge SVG Arc */}
          <div className="relative w-36 h-20 mx-auto flex items-end justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 50">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 70 15"
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <span className="text-2xl font-black text-white font-mono">41%</span>
              <span className="text-[10px] font-bold text-slate-400">Project Ended</span>
            </div>
          </div>

          {/* Gauge Legend */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-800" />
              In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Pending
            </span>
          </div>
        </div>

        {/* COL 3: TIME TRACKER WIDGET (4 COLS) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 border border-emerald-700/50 space-y-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 tracking-wider">Time Tracker</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="py-2 text-center">
            <h3 className="text-4xl font-black text-white font-mono tracking-widest drop-shadow-md">
              {formatTime(timeSeconds)}
            </h3>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="w-11 h-11 rounded-full bg-white text-emerald-950 flex items-center justify-center shadow-lg hover:scale-105 transition"
            >
              {isTimerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimeSeconds(0);
              }}
              className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

      </div>

      {/* DISPATCH MANDATE MODAL */}
      <AnimatePresence>
        {isQuickMandateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setIsQuickMandateOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dispatch New Directive</h3>
                  <p className="text-xs text-slate-400">Assign autonomous tasks to your AI workforce.</p>
                </div>
              </div>

              {mandateFeedback ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                  {mandateFeedback}
                </div>
              ) : (
                <form onSubmit={handleQuickMandateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Directive Description
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="e.g., Audit system performance and optimize Next.js page bundle sizes..."
                      value={mandateText}
                      onChange={(e) => setMandateText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickMandateOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingMandate || !mandateText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition active:scale-95"
                    >
                      {isSubmittingMandate ? "Dispatching..." : "Dispatch Project Directive"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
