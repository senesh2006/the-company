"use client";

import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
  useRunRoutine
} from "@/lib/queries";
import { RoutineItem } from "@/lib/api";
import {
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  FileSpreadsheet,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIALIST_OPTIONS = [
  { role: "Finance Manager", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { role: "Marketing Manager", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { role: "Software Engineer", color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { role: "Research Specialist", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { role: "Admin & Operations Worker", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { role: "Personal Assistant", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" }
];

const ROUTINE_TEMPLATES = [
  {
    title: "Daily 9 AM Google Sheets & General Ledger Audit",
    role: "Finance Manager",
    schedule_type: "daily",
    schedule_config: { time: "09:00" },
    priority: "high",
    description: "Audit Google Sheets General Ledger, verify trial balance parity (total debits equal total credits), check for any anomalous expenses, and sync trial balance metrics into Shared Memory."
  },
  {
    title: "Hourly Inbound Lead & Email Triage",
    role: "Marketing Manager",
    schedule_type: "interval_minutes",
    schedule_config: { interval_minutes: 60 },
    priority: "medium",
    description: "Inspect Gmail and connected marketing channels for new customer inquiries, draft professional replies, and alert the founder on high-priority partnership inquiries."
  },
  {
    title: "Weekly Competitor Intelligence & Market Scan",
    role: "Research Specialist",
    schedule_type: "weekly",
    schedule_config: { time: "09:00", day: "Monday" },
    priority: "medium",
    description: "Scrape search trends, analyze rival AI operating systems and pricing updates, synthesize key takeaways, and update company intelligence matrices in Shared Memory."
  },
  {
    title: "Daily End-of-Day Executive Briefing & Slack Broadcast",
    role: "Personal Assistant",
    schedule_type: "daily",
    schedule_config: { time: "18:00" },
    priority: "high",
    description: "Review today's completed deliverables, financial ledger changes, and task statuses. Synthesize the Founder's evening executive summary and post high-level progress highlights to Slack."
  }
];

function RoutinesContent() {
  const { data: routines = [], isLoading, refetch, isFetching } = useRoutines();
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();
  const deleteMutation = useDeleteRoutine();
  const runMutation = useRunRoutine();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // New Routine Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeRole, setAssigneeRole] = useState("Finance Manager");
  const [scheduleType, setScheduleType] = useState<"daily" | "hourly" | "weekly" | "interval_minutes">("daily");
  const [dailyTime, setDailyTime] = useState("09:00");
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [priority, setPriority] = useState("medium");

  const activeCount = routines.filter((r) => r.is_active).length;
  const totalRuns = routines.reduce((acc, r) => acc + (r.run_count || 0), 0);

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const schedule_config =
        scheduleType === "daily" || scheduleType === "weekly"
          ? { time: dailyTime }
          : { interval_minutes: intervalMinutes };

      await createMutation.mutateAsync({
        title,
        description,
        assignee_role: assigneeRole,
        schedule_type: scheduleType,
        schedule_config,
        priority,
        is_active: true
      });

      setNotification({
        message: `Successfully created automated routine "${title}"! It will execute autonomously in the background.`,
        type: "success"
      });

      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setNotification({
        message: `Failed to create routine: ${err.message || "Unknown error"}`,
        type: "info"
      });
    }
  };

  const handleApplyTemplate = (tmpl: typeof ROUTINE_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setAssigneeRole(tmpl.role);
    setScheduleType(tmpl.schedule_type as any);
    if (tmpl.schedule_config.time) setDailyTime(tmpl.schedule_config.time);
    if (tmpl.schedule_config.interval_minutes) setIntervalMinutes(tmpl.schedule_config.interval_minutes);
    setPriority(tmpl.priority);
    setIsCreateModalOpen(true);
  };

  const handleToggleActive = async (routine: RoutineItem) => {
    try {
      await updateMutation.mutateAsync({
        id: routine.id,
        updates: { is_active: !routine.is_active }
      });
      setNotification({
        message: `Routine "${routine.title}" ${!routine.is_active ? "activated" : "paused"}.`,
        type: "info"
      });
    } catch (err: any) {
      setNotification({
        message: `Failed to update routine: ${err.message}`,
        type: "info"
      });
    }
  };

  const handleRunNow = async (routine: RoutineItem) => {
    try {
      setRunningRoutineId(routine.id);
      await runMutation.mutateAsync(routine.id);
      setNotification({
        message: `Triggered immediate background execution for "${routine.title}"! Dispatched to ${routine.assignee_role}.`,
        type: "success"
      });
    } catch (err: any) {
      setNotification({
        message: `Failed to run routine: ${err.message}`,
        type: "info"
      });
    } finally {
      setTimeout(() => setRunningRoutineId(null), 2000);
    }
  };

  const handleDelete = async (routine: RoutineItem) => {
    if (!confirm(`Are you sure you want to delete routine "${routine.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(routine.id);
      setNotification({
        message: `Deleted routine "${routine.title}".`,
        type: "info"
      });
    } catch (err: any) {
      setNotification({
        message: `Failed to delete routine: ${err.message}`,
        type: "info"
      });
    }
  };

  const formatSchedule = (routine: RoutineItem) => {
    const type = routine.schedule_type;
    const cfg = routine.schedule_config || {};
    if (type === "daily") return `Daily at ${cfg.time || "09:00"} UTC`;
    if (type === "hourly") return "Every Hour";
    if (type === "weekly") return `Weekly on ${cfg.day || "Monday"} at ${cfg.time || "09:00"} UTC`;
    if (type === "interval_minutes") return `Every ${cfg.interval_minutes || 60} minutes`;
    return type;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Automated Background Routines
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Daemon Active (Offline Execution Enabled)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure recurring autonomous workflows. AI specialists execute these directives in the background on schedule, even when you are not actively using or browsing Company OS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            <span>{isFetching ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Routine</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm border",
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200 border-blue-200 dark:border-blue-800"
            )}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Stat Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Automations</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeCount} <span className="text-xs font-normal text-slate-400">/ {routines.length} total</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Autonomous Runs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalRuns} <span className="text-xs font-normal text-slate-400">dispatches</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Background Engine</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Continuous 60s Tick
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Audit & Reliability</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Task Log & Memory Sync
            </p>
          </div>
        </div>
      </div>

      {/* Quick Starter Templates */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Quick Routine Starters</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROUTINE_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 transition cursor-pointer shadow-2xs hover:shadow-sm space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tmpl.role}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Use Template →
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                {tmpl.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Routines Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Configured Automated Routines</span>
        </h2>

        {isLoading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading automated routines...</span>
          </div>
        ) : routines.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No Automated Routines Configured</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create a routine above or pick a template to schedule autonomous audits, emails, competitor tracking, or Google Sheets syncs.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Routine</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {routines.map((routine) => {
              const specMeta = SPECIALIST_OPTIONS.find((s) => s.role === routine.assignee_role) || SPECIALIST_OPTIONS[0];
              const isRunning = runningRoutineId === routine.id;
              const isResultOpen = expandedResultId === routine.id;

              return (
                <motion.div
                  key={routine.id}
                  layout
                  className={cn(
                    "p-6 rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm space-y-4 flex flex-col justify-between",
                    routine.is_active
                      ? "border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
                      : "border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50 dark:bg-slate-950/40"
                  )}
                >
                  <div className="space-y-3">
                    {/* Header with Title and Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                              specMeta.bg,
                              specMeta.color,
                              specMeta.border
                            )}
                          >
                            {routine.assignee_role}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatSchedule(routine)}
                          </span>

                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {routine.priority}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {routine.title}
                        </h3>
                      </div>

                      {/* Active/Pause Switch */}
                      <button
                        onClick={() => handleToggleActive(routine)}
                        title={routine.is_active ? "Pause Routine" : "Resume Routine"}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0",
                          routine.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        {routine.is_active ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3" />
                            Paused
                          </>
                        )}
                      </button>
                    </div>

                    {/* Mandate Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      {routine.description}
                    </p>

                    {/* Execution Meta */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Next Scheduled Run</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {routine.next_run_at ? new Date(routine.next_run_at).toLocaleString() : "Pending"}
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Total Runs & Status</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>{routine.run_count || 0} times</span>
                          {routine.last_status && (
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                                routine.last_status === "completed"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              )}
                            >
                              {routine.last_status}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Result View */}
                    {routine.last_result && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setExpandedResultId(isResultOpen ? null : routine.id)}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>{isResultOpen ? "Hide Last Output" : "View Last Execution Output"}</span>
                          {isResultOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <AnimatePresence>
                          {isResultOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto border border-slate-800"
                            >
                              {routine.last_result}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleRunNow(routine)}
                      disabled={isRunning || runMutation.isPending}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching Autonomous Run...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(routine)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      title="Delete Routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Routine Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Create Automated Routine
                    </h3>
                    <p className="text-xs text-slate-400">
                      Autonomous background execution without requiring web app usage
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRoutine} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Routine Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Daily 9 AM Google Sheets Financial Audit"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Specialist Role */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned AI Specialist
                  </label>
                  <select
                    value={assigneeRole}
                    onChange={(e) => setAssigneeRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {SPECIALIST_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Schedule Type & Config */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Schedule Frequency
                    </label>
                    <select
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="daily">Daily (Specified Time)</option>
                      <option value="hourly">Hourly (Every 60m)</option>
                      <option value="weekly">Weekly (Monday 9am)</option>
                      <option value="interval_minutes">Custom Interval (Minutes)</option>
                    </select>
                  </div>

                  {scheduleType === "daily" || scheduleType === "weekly" ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Execution Time (UTC)
                      </label>
                      <input
                        type="time"
                        value={dailyTime}
                        onChange={(e) => setDailyTime(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  ) : scheduleType === "interval_minutes" ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Interval (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 60)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Frequency Detail
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Every 60 minutes"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>

                {/* Mandate Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Actionable Autonomous Mandate
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide explicit instructions for the AI specialist to execute on each scheduled tick..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Execution Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving Routine...
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Schedule Routine
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoutinesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading Routines Engine...
          </div>
        </div>
      }
    >
      <RoutinesContent />
    </Suspense>
  );
}
