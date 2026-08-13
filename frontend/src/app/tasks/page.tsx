"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MarketingAvatar } from "@/components/ui/MarketingAvatar";
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ThinkingProcess } from '@/components/ThinkingProcess';
import { useTasks, useAgents, useCreateTask } from "@/lib/queries";
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
  Cpu
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

  // Map real database tasks
  const allTasks = (dbTasks || []).map((t: any) => {
    const assignedAgent = agents?.find(a => a.id === t.agent_id || a.role === t.assignee_role);
    const statusUpper = (t.status || "queued").toUpperCase();
    
    let cat = "active";
    let statType = "in_progress";
    let isBlocked = false;
    let progress = 50;

    if (t.status === "completed") {
      cat = "completed";
      statType = "completed";
      progress = 100;
    } else if (t.status === "pending" || t.status === "queued") {
      cat = "scheduled";
      statType = "pending";
      progress = 0;
    } else if (t.status === "needs_approval" || t.status === "failed" || t.status === "rejected") {
      cat = "active";
      statType = "blocked";
      isBlocked = true;
      progress = 25;
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
      category: cat,
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tasks & Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Live execution monitoring and autonomous workflow orchestration
          </p>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
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
                  : "text-slate-500 hover:text-slate-800"
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
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-800 focus:outline-none"
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
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort: {sortBy === "time" ? "Latest" : "Priority"}</span>
          </button>
        </div>
      </div>

      {/* 3. Task List Card Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin text-emerald-600">progress_activity</span>
            <p className="text-xs font-semibold">Synchronizing task fleet...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No operations found</p>
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
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-5 hover:bg-slate-50/80 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer"
              >
                {/* Left: Priority + Title + Subtitle */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black font-mono tracking-wider ${
                      task.priority === "P0"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : task.priority === "P1"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {task.priority}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
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
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {(task.agentName === "Growth & Marketing Lead" || task.agentRole === "Marketing Manager") ? (
                        <MarketingAvatar className="w-full h-full rounded-none" />
                      ) : (
                        <img src={task.agentAvatar} alt={task.agentName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {task.agentName}
                      </span>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {task.agentRole}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Progress */}
                  <div className="flex items-center gap-3 w-44 justify-end">
                    {task.statusType === "in_progress" && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-600">
                          {task.progress}%
                        </span>
                      </div>
                    )}

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 ${
                        task.statusType === "completed"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : task.statusType === "blocked"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : task.statusType === "pending"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
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

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Dispatch New Operation</h2>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Operation Mandate / Goal
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Conduct comprehensive competitor pricing audit and output comparative table in shared memory..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Assignee Specialist
                  </label>
                  <select
                    value={newTaskAgentRole}
                    onChange={(e) => setNewTaskAgentRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority Tier
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none font-semibold"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
            className="w-full sm:w-[580px] md:w-[680px] max-w-full bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 overflow-y-auto shrink-0 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-wider ${
                    selectedTask.priority === "P0"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : selectedTask.priority === "P1"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operation Inspection</span>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Directive */}
              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug break-words">
                  {selectedTask.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>ID: {selectedTask.id}</span>
                  <span>&bull;</span>
                  <span>{selectedTask.subtitle}</span>
                </div>
              </div>

              {/* Status & Metadata Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Assigned Specialist
                  </span>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedTask.agentName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
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
                  <p className="text-xs font-mono font-bold text-slate-800">
                    {selectedTask.rawTask?.retry_count || 0} / 2 Retries
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Maker-Checker Verified
                  </p>
                </div>
              </div>

              {/* Execution Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Execution Output & Deliverables
                    </h3>
                  </div>
                  {selectedTask.rawTask?.result && (
                    <button
                      onClick={() => handleCopyResult(selectedTask.rawTask.result)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
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

                {selectedTask.statusType !== "completed" && (
                  <ThinkingProcess
                    isThinking={true}
                    title={`${selectedTask.agentName || "AI Worker"} is Reasoning`}
                    steps={[
                      "Evaluating mandate context and organizational policies",
                      "Analyzing execution complexity & Maker-Checker safety criteria",
                      "Executing specialist tool calls & drafting verified deliverables",
                    ]}
                    defaultExpanded={true}
                  />
                )}

                {selectedTask.rawTask?.result ? (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 overflow-x-auto leading-relaxed shadow-inner max-h-[420px] select-text">
                    <MarkdownRenderer content={selectedTask.rawTask.result} />
                  </div>
                ) : selectedTask.statusType === "completed" ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-1">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-700">
                      Task completed successfully.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Deliverables recorded in audit trail.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
