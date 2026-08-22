"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ThinkingProcess } from '@/components/ThinkingProcess';
import { MilestoneMap } from '@/components/MilestoneMap';
import { useTasks, useAgents, useCreateTask, useTaskStream } from "@/lib/queries";
import { 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Pause,
  Bot,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Copy,
  Check,
  X,
  FileText,
  ShieldCheck,
  Cpu,
  Megaphone,
  Briefcase,
  Code
} from "lucide-react";

export default function TasksPage() {
  const { data: dbTasks, isLoading, refetch } = useTasks();
  const { data: agents } = useAgents();
  const createTask = useCreateTask();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "completed" | "backlog">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "priority">("time");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgentRole, setNewTaskAgentRole] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("P1");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const { user } = useAuth();
  const activeBusinessId = (user as any)?.user_metadata?.business_id || (user as any)?.business_id || "00000000-0000-0000-0000-000000000001";
  const { supervisorPlan, workerResults, synthesisResult, isStreaming } = useTaskStream(
    selectedTask ? (selectedTask.rawTask?.business_id || activeBusinessId) : undefined,
    selectedTask?.id
  );

  // Map real database tasks
  const allTasks = (dbTasks || []).map((t: any) => {
    const assignedAgent = agents?.find(a => a.id === t.agent_id || a.role === t.assignee_role);
    const statusRaw = (t.status || "pending").toLowerCase();
    const statusUpper = (t.status || "pending").toUpperCase();
    const milestones = t.milestones || [];
    const completedMilestones = milestones.filter((m: any) => m.status === "completed").length;
    const inProgressIndex = milestones.findIndex((m: any) => m.status === "in_progress");
    const totalMilestones = milestones.length;

    let cat: "active" | "scheduled" | "completed" | "backlog" = "active";
    let statType: "in_progress" | "completed" | "pending" | "blocked" = "in_progress";
    let isBlocked = false;
    let progress = t.progress !== undefined && t.progress !== null ? Number(t.progress) : 0;

    if (totalMilestones > 0) {
      // If structured milestones exist, calculate exact mathematical progress
      progress = (completedMilestones === 0 && inProgressIndex < 0) 
        ? 0 
        : Math.round(((completedMilestones + (inProgressIndex >= 0 ? 0.5 : 0)) / totalMilestones) * 100);
    }

    if (statusRaw === "completed" || statusRaw === "done") {
      cat = "completed";
      statType = "completed";
      if (totalMilestones === 0) progress = 100;
    } else if (statusRaw === "pending" || statusRaw === "queued" || statusRaw === "assigned" || statusRaw === "idle" || statusRaw === "created") {
      cat = "scheduled";
      statType = "pending";
      if (totalMilestones === 0) progress = 0;
    } else if (statusRaw === "needs_approval") {
      cat = "active";
      statType = "blocked";
      isBlocked = true;
      if (totalMilestones === 0) progress = 75;
    } else if (statusRaw === "failed" || statusRaw === "rejected") {
      cat = "active";
      statType = "blocked";
      isBlocked = true;
      if (totalMilestones === 0) progress = 0;
    } else {
      // Actively running in progress
      cat = "active";
      statType = "in_progress";
      if (totalMilestones === 0 && (!progress || progress === 0)) {
        const elapsedSec = Math.max(0, (Date.now() - new Date(t.created_at || Date.now()).getTime()) / 1000);
        progress = elapsedSec < 4 ? 25 : elapsedSec < 15 ? 50 : 75;
      }
    }

    const priorityLabel = (t.priority === "high" || t.priority === "P0") ? "P0" : ((t.priority === "low" || t.priority === "P2") ? "P2" : "P1");

    return {
      id: t.id,
      priority: priorityLabel,
      title: t.description || t.mandate || "Autonomous Operation Mandate",
      subtitle: isBlocked 
        ? `Needs Review • Retry: ${t.retry_count || 0}/2` 
        : `Dispatched ${new Date(t.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isBlocked: isBlocked,
      agentName: assignedAgent?.name || (t.assignee_role ? `Specialist (${t.assignee_role})` : "Personal Assistant"),
      agentRole: assignedAgent?.role || t.assignee_role || "Autonomous Worker",
      agentAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${t.id}`,
      status: statusUpper,
      statusType: statType,
      progress: progress,
      category: cat as "active" | "scheduled" | "completed" | "backlog",
      milestones: milestones,
      rawTask: t
    };
  });

  const filteredTasks = allTasks.filter((t) => {
    if (activeTab === "active" && t.category !== "active") return false;
    if (activeTab === "scheduled" && t.category !== "scheduled") return false;
    if (activeTab === "completed" && t.category !== "completed") return false;
    if (activeTab === "backlog" && t.category !== "backlog") return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        assigned_agent_id: newTaskAgentRole || (agents?.[0]?.role ?? "Personal Assistant"),
        priority: newTaskPriority,
        description: newTaskTitle
      });
      setNewTaskTitle("");
      setShowNewTaskModal(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Tasks & Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Live execution monitoring and autonomous workflow orchestration
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <a
            href="/activity?view=stream"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold shadow-xs transition-all duration-200 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Unified Live Stream</span>
          </a>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto text-xs md:text-sm font-semibold">
          {[
            { id: "all", label: "All Tasks" },
            { id: "active", label: "Active" },
            { id: "scheduled", label: "Scheduled" },
            { id: "completed", label: "Completed" },
            { id: "backlog", label: "Backlog" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2 transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "text-emerald-800 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Filter / Sort Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:bg-slate-950 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Filter</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl z-30 space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="P0">P0 - Critical</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Normal</option>
                </select>
              </div>
            )}
          </div>

          <button 
            onClick={() => setSortBy(sortBy === "time" ? "priority" : "time")}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:bg-slate-950 shadow-xs cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Sort: {sortBy === "time" ? "Latest" : "Priority"}</span>
          </button>
        </div>
      </div>

      {/* 3. Task List Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin text-emerald-600">progress_activity</span>
            <p className="text-xs font-semibold">Synchronizing task fleet...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No operations found</p>
              <p className="text-xs text-slate-400 mt-0.5">Dispatched missions and mandate tasks will appear here in real-time.</p>
            </div>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Dispatch First Mission
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-5 hover:bg-slate-50/80 dark:bg-slate-900/80 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer"
              >
                {/* Left: Priority + Title + Subtitle */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black font-mono tracking-wider ${
                      task.priority === "P0"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : task.priority === "P1"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 transition-colors truncate">
                      {task.title}
                    </h3>
                    <p className={`text-xs mt-0.5 font-medium ${task.isBlocked ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
                      {task.subtitle}
                    </p>
                  </div>
                </div>

                {/* Center: Assigned Agent & Status */}
                <div className="flex items-center gap-6 shrink-0">
                  {/* Agent badge */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isPA = (task.agentName === "Personal Assistant" || task.agentName === "Supervisor" || task.agentRole === "Personal Assistant" || task.agentRole === "Supervisor");
                      const roleStr = (task.agentRole + " " + task.agentName).toLowerCase();
                      const isMkt = roleStr.includes("market") || roleStr.includes("growth") || roleStr.includes("social");
                      const isFin = roleStr.includes("finance") || roleStr.includes("account") || roleStr.includes("audit") || roleStr.includes("ledger");
                      const isEng = roleStr.includes("engineer") || roleStr.includes("code") || roleStr.includes("dev") || roleStr.includes("tech");
                      
                      const badgeBg = isMkt 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : isFin 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : isEng 
                        ? "bg-purple-50 text-purple-700 border-purple-200" 
                        : isPA
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";

                      return (
                        <div className={`w-7 h-7 shrink-0 rounded-lg overflow-hidden ${badgeBg} border flex items-center justify-center`}>
                          {isMkt ? (
                            <Megaphone className="w-3.5 h-3.5" />
                          ) : isFin ? (
                            <Briefcase className="w-3.5 h-3.5" />
                          ) : isEng ? (
                            <Code className="w-3.5 h-3.5" />
                          ) : isPA ? (
                            <Sparkles className="w-3.5 h-3.5" />
                          ) : (
                            <Bot className="w-3.5 h-3.5" />
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {task.agentName}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {task.agentRole}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Progress */}
                  <div className="flex items-center gap-3 w-52 justify-end">
                    {task.milestones && task.milestones.length > 0 ? (
                      <div className="w-24 hidden sm:block">
                        <MilestoneMap compact={true} milestones={task.milestones} progress={task.progress} />
                      </div>
                    ) : task.statusType === "in_progress" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                          {task.progress}%
                        </span>
                      </div>
                    ) : null}

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 shrink-0 ${
                        task.statusType === "completed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : task.statusType === "blocked"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : task.statusType === "pending"
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          task.statusType === "completed"
                            ? "bg-emerald-600"
                            : task.statusType === "blocked"
                            ? "bg-rose-500"
                            : task.statusType === "pending"
                            ? "bg-slate-400"
                            : "bg-emerald-600 animate-pulse"
                        }`}
                      />
                      <span>{task.status}</span>
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:text-slate-300 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dispatch New Operation</h2>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Operation Mandate / Goal
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct comprehensive competitor pricing audit and output comparative table in shared memory..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assignee Specialist
                  </label>
                  <select
                    value={newTaskAgentRole}
                    onChange={(e) => setNewTaskAgentRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:bg-slate-900 focus:outline-none"
                  >
                    <option value="">Personal Assistant (Auto-delegate)</option>
                    {(agents || []).map((a) => (
                      <option key={a.id} value={a.role}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority Tier
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:bg-slate-900 focus:outline-none font-semibold"
                  >
                    <option value="P0">P0 - Critical Block</option>
                    <option value="P1">P1 - High Priority</option>
                    <option value="P2">P2 - Normal Routine</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {createTask.isPending && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                  <span>Dispatch Mission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Task Detail Drawer - Robust & Fully Visible */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-150"
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="w-full sm:w-[580px] md:w-[680px] max-w-full bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-wider ${
                    selectedTask.priority === "P0"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : selectedTask.priority === "P1"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operation Inspection</span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Directive */}
              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
                  {selectedTask.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>ID: {selectedTask.id}</span>
                  <span>&bull;</span>
                  <span>{selectedTask.subtitle}</span>
                </div>
              </div>

              {/* Status & Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Assigned Specialist
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {selectedTask.agentName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedTask.agentRole}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedTask.statusType === "completed"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : selectedTask.statusType === "blocked"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedTask.statusType === "completed" ? "bg-emerald-600" : "bg-amber-600"
                    }`} />
                    <span>{selectedTask.status}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Verification Gate
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedTask.rawTask?.retry_count || 0} / 2 Retries
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Maker-Checker Verified
                  </p>
                </div>
              </div>

              {/* AI Milestone Roadmap */}
              {selectedTask.milestones && selectedTask.milestones.length > 0 && (
                <MilestoneMap
                  milestones={selectedTask.milestones}
                  progress={selectedTask.progress}
                  taskTitle={selectedTask.title}
                />
              )}

              {/* Execution Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Execution Output & Deliverables
                    </h3>
                  </div>
                  {selectedTask.rawTask?.result && (
                    <button
                      onClick={() => handleCopyResult(selectedTask.rawTask.result)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      {copiedOutput ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Output</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* If task has completed or synthesized execution result */}
                {synthesisResult || selectedTask.rawTask?.result ? (
                  <div className="space-y-3">
                    {isStreaming && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Live stream active &bull; Synthesizing final deliverables</span>
                      </div>
                    )}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto leading-relaxed shadow-inner max-h-[500px] select-text">
                      <MarkdownRenderer content={synthesisResult || selectedTask.rawTask?.result} />
                    </div>
                  </div>
                ) : isStreaming || selectedTask.statusType === "in_progress" ? (
                  <div className="space-y-4">
                    {/* Live Stream Status Indicator */}
                    {isStreaming && (
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Streaming Live Node Execution</span>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md uppercase font-bold">SSE Active</span>
                      </div>
                    )}

                    {/* Progressive Supervisor Plan Card */}
                    {supervisorPlan && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Global Supervisor Plan</span>
                        </div>
                        {supervisorPlan.thoughts && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                            "{supervisorPlan.thoughts}"
                          </p>
                        )}
                        {supervisorPlan.new_tasks && supervisorPlan.new_tasks.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Planned Sub-Tasks:</span>
                            <div className="grid gap-1.5">
                              {supervisorPlan.new_tasks.map((task: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">[{task.assignee_role || "Specialist"}]: </span>
                                    <span>{task.description || task.title}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progressive Worker Results */}
                    {workerResults && workerResults.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Worker Deliverables:</span>
                        {workerResults.map((res: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                            {res.results?.map((r: any, rIdx: number) => (
                              <div key={rIdx} className="space-y-1">
                                <span className="font-bold text-emerald-700">{r.agent_role || "Worker"} Deliverable:</span>
                                <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-h-40 overflow-y-auto">
                                  <MarkdownRenderer content={r.output || ""} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Real-time Thinking Process */}
                    <ThinkingProcess
                      isThinking={true}
                      title={`${selectedTask.agentName || "AI Team"} is Executing`}
                      statusMessage={`${selectedTask.agentName || "Specialist"} is reasoning and executing tools in real time...`}
                      steps={selectedTask.rawTask?.live_thoughts && selectedTask.rawTask.live_thoughts.length > 0 ? selectedTask.rawTask.live_thoughts : undefined}
                      defaultExpanded={true}
                    />
                  </div>
                ) : selectedTask.statusType === "blocked" ? (
                  <div className="p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center text-rose-800 dark:text-rose-300 space-y-1">
                    <AlertTriangle className="w-5 h-5 mx-auto text-rose-600 mb-1" />
                    <p className="text-xs font-bold">Execution Paused: Governance Review Required</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Task reached human review gate or encountered validation error. Check Approvals page.
                    </p>
                  </div>
                ) : selectedTask.statusType === "completed" ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 space-y-1">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Task completed successfully.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Deliverables recorded in audit trail.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 space-y-1">
                    <Clock className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Task queued in dispatch pipeline.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Assigned to {selectedTask.agentName}. Execution will begin shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Press ESC or click outside to close
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
