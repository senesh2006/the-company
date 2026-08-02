"use client";

import { useState } from "react";
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
  Filter
} from "lucide-react";

export default function TasksPage() {
  const { data: dbTasks, isLoading } = useTasks();
  const { data: agents } = useAgents();
  const createTask = useCreateTask();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "scheduled" | "completed" | "backlog">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "priority" | "progress">("time");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgentId, setNewTaskAgentId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("P1");

  // Mock initial rich tasks matching reference mockup
  const defaultTasks = [
    {
      id: "task-1",
      priority: "P0",
      title: "Monthly Financial Audit",
      subtitle: "Started 2 hours ago • Est. 4h remaining",
      agentName: "FinAgent Delta",
      agentRole: "Financial Analyst",
      agentAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
      status: "IN PROGRESS",
      statusType: "in_progress",
      progress: 64,
      category: "active"
    },
    {
      id: "task-2",
      priority: "P1",
      title: "Social Media Campaign Generation",
      subtitle: "Scheduled for 2:00 PM • Est. 1.5h",
      agentName: "CreativeBot 9",
      agentRole: "Content Strategist",
      agentAvatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=80",
      status: "PENDING",
      statusType: "pending",
      progress: 0,
      category: "scheduled"
    },
    {
      id: "task-3",
      priority: "P2",
      title: "Data Normalization & Cleaning",
      subtitle: "Completed 15m ago • Duration: 45m",
      agentName: "DataNode Zero",
      agentRole: "Data Engineer",
      agentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      status: "COMPLETED",
      statusType: "completed",
      progress: 100,
      category: "completed"
    },
    {
      id: "task-4",
      priority: "P0",
      title: "Legacy Database Migration",
      subtitle: "Blocked: API Rate Limit Exceeded",
      isBlocked: true,
      agentName: "Architect-1",
      agentRole: "System Admin",
      agentAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      status: "BLOCKED",
      statusType: "blocked",
      progress: 12,
      category: "active"
    },
    {
      id: "task-5",
      priority: "P1",
      title: "User Sentiment Analysis (Q4)",
      subtitle: "Started 5m ago • Est. 12h remaining",
      agentName: "SentiAI",
      agentRole: "UX Researcher",
      agentAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      status: "IN PROGRESS",
      statusType: "in_progress",
      progress: 4,
      category: "active"
    }
  ];

  // Merge database tasks if present
  const allTasks = (dbTasks && dbTasks.length > 0)
    ? dbTasks.map((t: any, idx: number) => {
        const matching = defaultTasks[idx % defaultTasks.length];
        const statusUpper = (t.status || "").toUpperCase();
        let cat = "active";
        let statType = "in_progress";
        let isBlocked = false;

        if (statusUpper === "COMPLETED") {
          cat = "completed";
          statType = "completed";
        } else if (statusUpper === "PENDING" || statusUpper === "SCHEDULED") {
          cat = "scheduled";
          statType = "pending";
        } else if (statusUpper === "BLOCKED" || statusUpper === "FAILED") {
          cat = "active";
          statType = "blocked";
          isBlocked = true;
        }

        return {
          id: t.id,
          priority: t.priority || matching.priority,
          title: t.title || t.instruction || matching.title,
          subtitle: isBlocked ? "Blocked: Needs Review" : (t.created_at ? `Created ${new Date(t.created_at).toLocaleTimeString()}` : matching.subtitle),
          isBlocked: isBlocked,
          agentName: t.agent_name || matching.agentName,
          agentRole: matching.agentRole,
          agentAvatar: matching.agentAvatar,
          status: statusUpper || matching.status,
          statusType: statType,
          progress: t.progress ?? (statType === "completed" ? 100 : matching.progress),
          category: cat
        };
      })
    : defaultTasks;

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
        assigned_agent_id: newTaskAgentId || (agents?.[0]?.id ?? "agent-1"),
        priority: newTaskPriority,
        description: newTaskTitle
      });
      setNewTaskTitle("");
      setShowNewTaskModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tasks
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Orchestrate and monitor the execution of complex workflows
          </p>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 self-start sm:self-auto"
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
              className={`pb-2 transition-all relative whitespace-nowrap ${
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
          {/* Filter Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
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

          {/* Sort Button */}
          <button
            onClick={() => setSortBy(sortBy === "time" ? "priority" : "time")}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* 3. Task Cards List */}
      <div className="flex flex-col gap-3.5">
        {filteredTasks.map((task) => {
          const isP0 = task.priority === "P0";
          const isP1 = task.priority === "P1";
          const isCompleted = task.statusType === "completed";
          const isBlocked = task.statusType === "blocked" || task.isBlocked;
          const isPending = task.statusType === "pending";

          return (
            <div
              key={task.id}
              className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Column: Priority + Title + Subtitle */}
              <div className="flex items-start gap-3.5 min-w-[280px] max-w-md">
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 mt-0.5 border ${
                    isP0
                      ? "bg-rose-50 text-rose-700 border-rose-200/80"
                      : isP1
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {task.priority}
                </span>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  
                  {isBlocked ? (
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{task.subtitle}</span>
                    </p>
                  ) : isCompleted ? (
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{task.subtitle}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.subtitle}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Middle Column: Assignee */}
              <div className="flex items-center gap-3 min-w-[180px]">
                <img
                  src={task.agentAvatar}
                  alt={task.agentName}
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{task.agentName}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{task.agentRole}</div>
                </div>
              </div>

              {/* Right Column: Status Badge & Progress */}
              <div className="flex items-center gap-4 min-w-[200px] justify-between md:justify-end">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                    isCompleted
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isBlocked
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isPending
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isBlocked
                        ? "bg-rose-500"
                        : isPending
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  {task.status}
                </span>

                <div className="flex items-center gap-3 w-28 shrink-0">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isBlocked
                          ? "bg-rose-600"
                          : isCompleted
                          ? "bg-emerald-600"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-700 w-9 text-right">
                    {task.progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Tasks
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">12</span>
            <span className="text-xs font-bold text-emerald-600">+2 from yesterday</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Success Rate
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">99.2%</span>
            <span className="text-xs font-semibold text-slate-400">Global Avg</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Avg Completion Time
          </span>
          <div className="mt-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">1h 14m</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Approval
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900">3</span>
            <span className="text-xs font-bold text-rose-600">Needs Action</span>
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Dispatch New Task</h2>
            
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Task Title / Mission</label>
                <input
                  type="text"
                  placeholder="e.g. Run Q3 Financial Rebalancing"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Assign Worker</label>
                <select
                  value={newTaskAgentId}
                  onChange={(e) => setNewTaskAgentId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Default AI Worker</option>
                  {agents?.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Priority Level</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="P0">P0 - Critical</option>
                  <option value="P1">P1 - High</option>
                  <option value="P2">P2 - Medium</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
