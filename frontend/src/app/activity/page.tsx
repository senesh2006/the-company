"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  Copy, 
  Check, 
  X, 
  FileText, 
  ShieldCheck, 
  Megaphone, 
  Briefcase, 
  Code, 
  Zap, 
  Layers, 
  Activity, 
  Building2, 
  Wallet, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  BarChart3, 
  FileSpreadsheet, 
  Database, 
  UserPlus, 
  ArrowRight, 
  Send, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Bell, 
  AlertCircle, 
  Share2, 
  Globe, 
  Target
} from "lucide-react";
import { 
  useTasks, 
  useAgents, 
  useCreateTask, 
  useTaskStream, 
  useMetrics, 
  useDepartmentDetails, 
  useToggleDepartmentChecklist, 
  useDispatchDepartmentDirective, 
  useFinanceAccounts, 
  useJournalEntries 
} from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { CompanyFeed } from "@/components/CompanyFeed";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ThinkingProcess } from "@/components/ThinkingProcess";
import { MilestoneMap } from "@/components/MilestoneMap";
import { ChartOfAccountsSheet } from "@/components/finance/ChartOfAccountsSheet";

interface DepartmentMeta {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  activePillClass: string;
  keywords: string[];
}

const DEPARTMENTS: DepartmentMeta[] = [
  {
    id: "marketing",
    name: "Marketing & Growth",
    shortName: "Marketing",
    description: "Autonomous demand generation, SEO strategy, social media campaigns, brand voice enforcement, and market intelligence.",
    icon: Megaphone,
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    activePillClass: "bg-cyan-600 text-white",
    keywords: ["market", "growth", "social", "copy", "brand", "seo", "content", "campaign"]
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    shortName: "Accounting",
    description: "Autonomous general ledger, GAAP double-entry bookkeeping, Google Sheets live synchronization, and expense auditing.",
    icon: Briefcase,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    activePillClass: "bg-emerald-600 text-white",
    keywords: ["finance", "account", "bookkeeper", "ledger", "tax", "audit", "billing", "payroll"]
  }
];

function ActivityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams?.get("view") as "stream" | "tasks" | "departments" | null;
  const deptParam = searchParams?.get("dept");

  const [activeView, setActiveView] = useState<"stream" | "tasks" | "departments">(tabParam || "stream");
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    deptParam && DEPARTMENTS.some(d => d.id === deptParam) ? deptParam : "marketing"
  );
  const [deptTab, setDeptTab] = useState<"overview" | "workspace" | "workforce">("overview");

  // Task filtering state
  const [taskFilterTab, setTaskFilterTab] = useState<"all" | "active" | "scheduled" | "completed" | "backlog">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"time" | "priority">("time");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Modal State
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAgentRole, setNewTaskAgentRole] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("P1");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Department Dispatch Directive Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [directivePrompt, setDirectivePrompt] = useState("");
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Hooks & Queries
  const { data: dbTasks, isLoading: isTasksLoading, refetch: refetchTasks } = useTasks();
  const { data: agents } = useAgents();
  const { data: metrics } = useMetrics();
  const { data: financeData } = useFinanceAccounts();
  const { data: journalEntries } = useJournalEntries();
  const { data: deptDetails } = useDepartmentDetails(selectedDeptId);
  const toggleChecklistMutation = useToggleDepartmentChecklist();
  const dispatchDirectiveMutation = useDispatchDepartmentDirective();
  const createTask = useCreateTask();
  const { setSelectedAgentId } = useAppStore();

  const { user } = useAuth();
  const activeBusinessId = (user as any)?.user_metadata?.business_id || (user as any)?.business_id || "00000000-0000-0000-0000-000000000001";
  
  const { supervisorPlan, workerResults, synthesisResult, isStreaming } = useTaskStream(
    selectedTask ? (selectedTask.rawTask?.business_id || activeBusinessId) : undefined,
    selectedTask?.id
  );

  useEffect(() => {
    if (tabParam && (tabParam === "stream" || tabParam === "tasks" || tabParam === "departments")) {
      setActiveView(tabParam);
    }
    if (deptParam && DEPARTMENTS.some(d => d.id === deptParam)) {
      setSelectedDeptId(deptParam);
    }
  }, [searchParams, tabParam, deptParam]);

  const handleSelectView = (view: "stream" | "tasks" | "departments") => {
    setActiveView(view);
    router.replace(`/activity?view=${view}${view === "departments" ? `&dept=${selectedDeptId}` : ""}`);
  };

  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    router.replace(`/activity?view=departments&dept=${deptId}`);
  };

  // Map Tasks
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
    } else if (statusRaw === "backlog") {
      cat = "backlog";
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
      status: statusUpper,
      statusType: statType,
      progress: progress,
      category: cat,
      milestones: milestones,
      rawTask: t
    };
  });

  const filteredTasks = allTasks.filter((t) => {
    if (taskFilterTab === "active" && t.category !== "active") return false;
    if (taskFilterTab === "scheduled" && t.category !== "scheduled") return false;
    if (taskFilterTab === "completed" && t.category !== "completed") return false;
    if (taskFilterTab === "backlog" && t.category !== "backlog") return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const currentDept = DEPARTMENTS.find(d => d.id === selectedDeptId) || DEPARTMENTS[0];
  const currentDeptAgents = (agents || []).filter((a: any) => {
    const roleStr = `${a.role || ""} ${a.name || ""}`.toLowerCase();
    return currentDept.keywords.some(k => roleStr.includes(k));
  });
  const currentChecklist = deptDetails?.checklist || [];
  const completedTasksCount = currentChecklist.filter((c: any) => c.completed).length;
  const DeptIcon = currentDept.icon;

  const deptTasks = (dbTasks || []).filter((t: any) => {
    const assigneeStr = `${t.assignee_role || ""} ${t.description || ""}`.toLowerCase();
    return currentDept.keywords.some(k => assigneeStr.includes(k));
  });
  const completedDeptTasks = deptTasks.filter((t: any) => t.status === "completed");
  const runningDeptTasks = deptTasks.filter((t: any) => t.status === "running" || t.status === "queued");

  // Financial Telemetry
  const tbSummary = financeData?.trial_balance?.summary;
  const totalRevenue = tbSummary?.total_revenue ?? 0;
  const totalExpenses = (tbSummary?.total_opex ?? 0) + (tbSummary?.total_cogs ?? 0);
  const netIncome = tbSummary?.net_income ?? (totalRevenue - totalExpenses);
  const totalAssets = tbSummary?.total_assets ?? 0;
  const totalLiabilities = tbSummary?.total_liabilities ?? 0;

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
      refetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directivePrompt.trim()) return;
    try {
      await dispatchDirectiveMutation.mutateAsync({
        deptId: selectedDeptId,
        directive: directivePrompt
      });
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
        setIsDispatchModalOpen(false);
        setDirectivePrompt("");
      }, 1500);
    } catch (err) {
      console.error("Failed to dispatch directive", err);
    }
  };

  const toggleChecklistItem = async (task_id: number) => {
    try {
      await toggleChecklistMutation.mutateAsync({ deptId: selectedDeptId, taskId: task_id });
    } catch (err) {
      console.error("Failed to toggle checklist task", err);
    }
  };

  const handleCopyResult = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 pb-20 text-slate-800 dark:text-slate-200">
      
      {/* 1. TOP HEADER & TELEMETRY PULSES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Company OS Operations</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 font-bold">Unified Activity Stream</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Live Operations & Activity Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            Real-time multi-agent execution feed, inter-agent handoffs, live memory updates, and autonomous department desks.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Operation</span>
          </button>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Prompt Department</span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED VIEW SELECTOR TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => handleSelectView("stream")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === "stream"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Live Multi-Agent Stream</span>
          </button>

          <button
            onClick={() => handleSelectView("tasks")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === "tasks"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Task Fleet & Milestones ({allTasks.length})</span>
          </button>

          <button
            onClick={() => handleSelectView("departments")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === "departments"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Department Desks & Workspace</span>
          </button>
        </div>

        {/* Live sync pulse */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Engine:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            Interleaved Stream Polling
          </span>
        </div>
      </div>

      {/* 3. VIEW 1: LIVE CHRONOLOGICAL FEED STREAM */}
      {activeView === "stream" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <CompanyFeed />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Quick Operations Pulse */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Active Autonomous Squad</span>
              </h3>

              <div className="space-y-2">
                {(agents || []).slice(0, 5).map((agent: any) => (
                  <div 
                    key={agent.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{agent.name}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{agent.role}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
                      {agent.status || "Idle"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Flight Task Highlights */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Recent Dispatched Mandates</span>
              </h3>

              <div className="space-y-2">
                {allTasks.slice(0, 4).map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                        {task.title}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {task.agentRole} &bull; {task.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW 2: TASK FLEET & MILESTONES */}
      {activeView === "tasks" && (
        <div className="space-y-6">
          {/* Navigation Tabs & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
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
                  onClick={() => setTaskFilterTab(tab.id as any)}
                  className={`pb-2 transition-all relative whitespace-nowrap cursor-pointer ${
                    taskFilterTab === tab.id
                      ? "text-emerald-800 dark:text-emerald-400 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  {taskFilterTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
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
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Sort: {sortBy === "time" ? "Latest" : "Priority"}</span>
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
            {isTasksLoading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-semibold">Synchronizing task fleet...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
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
                    className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer"
                  >
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
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {task.title}
                        </h3>
                        <p className={`text-xs mt-0.5 font-medium ${task.isBlocked ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
                          {task.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {task.agentName}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-tight">
                            {task.agentRole}
                          </span>
                        </div>
                      </div>

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
        </div>
      )}

      {/* 5. VIEW 3: DEPARTMENT DESKS & WORKSPACE */}
      {activeView === "departments" && (
        <div className="space-y-6">
          {/* Department Unit Selector Pills */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <DeptIcon className="w-5 h-5 text-emerald-600" />
                <span>{currentDept.name}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentDept.badgeClass}`}>
                  {currentDeptAgents.length} Workers
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentDept.description}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {DEPARTMENTS.map(dept => {
                const isSelected = dept.id === selectedDeptId;
                const Icon = dept.icon;
                return (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDept(dept.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{dept.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-tabs for department */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setDeptTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                deptTab === "overview"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Department Telemetry & Desks</span>
            </button>

            <button
              onClick={() => setDeptTab("workspace")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                deptTab === "workspace"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Domain Workspace & Live Tools</span>
            </button>

            <button
              onClick={() => setDeptTab("workforce")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                deptTab === "workforce"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Assigned Fleet ({currentDeptAgents.length})</span>
            </button>
          </div>

          {/* Department Content */}
          {deptTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                {selectedDeptId === "finance" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 shadow-xs">
                        <p className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase tracking-wider">Total Revenue</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-xs">
                        <p className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">Total Expenses</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                          ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                        <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Net Income</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                          ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                    </div>

                    {/* 5 Operations & Finance Specialized Desks */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Operations & Finance Specialized Desks</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              Contract Desk
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Summarizes weekly paper by stage, extracts SLA terms, and flags stalled reviews.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setDirectivePrompt("Contract Desk: Review the week of paper, summarize contracts by stage and owner, extract key SLA/liability terms, and flag blocked reviews.");
                              setIsDispatchModalOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Run Contract Review</span>
                          </button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Expense Manager
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Builds weekly summaries from Google Sheets, logs email receipts, and audits categories.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setDirectivePrompt("Expense Manager: Compile weekly summary from expense manager and Google Sheets, log pending receipts, and audit missing categories.");
                              setIsDispatchModalOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Compile Expenses</span>
                          </button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                              Invoice Coordinator
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Matches line items with POs, tracks vendor actuals, and flags stalled invoices.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setDirectivePrompt("Invoice Coordinator: Run 3-way invoice matching against POs, track vendor actuals, and flag any stalled invoices.");
                              setIsDispatchModalOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Match Invoices</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 shadow-xs">
                        <p className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase tracking-wider">Total Tasks</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">{deptTasks.length}</h4>
                      </div>
                      <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                        <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Deliverables</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">{completedDeptTasks.length} Done</h4>
                      </div>
                      <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 shadow-xs">
                        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">In Flight</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">{runningDeptTasks.length} Active</h4>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>{currentDept.shortName} Setup Guide</span>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {completedTasksCount}/{currentChecklist.length} Complete
                    </span>
                  </h3>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {currentChecklist.map((task: any) => (
                      <button
                        key={task.id}
                        onClick={() => toggleChecklistItem(task.id)}
                        className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center gap-2.5 ${
                          task.completed
                            ? "bg-slate-50 dark:bg-slate-950 text-slate-400 line-through border border-slate-200/60 dark:border-slate-800"
                            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        }`}
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="font-semibold line-clamp-1">{task.id}. {task.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {deptTab === "workspace" && (
            <div className="space-y-6">
              {selectedDeptId === "finance" ? (
                <ChartOfAccountsSheet />
              ) : (
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Marketing Strategy & Brand Memory</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active brand guidelines and autonomous strategy pipelines stored in Shared Memory.
                  </p>
                </div>
              )}
            </div>
          )}

          {deptTab === "workforce" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDeptAgents.map((agent: any) => (
                <div
                  key={agent.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold">
                      <Bot className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{agent.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Status: <strong className="text-emerald-600">{agent.status || "Idle"}</strong></span>
                    <button
                      onClick={() => setSelectedAgentId(agent.id)}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. DISPATCH NEW OPERATION MODAL */}
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
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium resize-none"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-semibold"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {createTask.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Mission</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DISPATCH DEPARTMENT DIRECTIVE MODAL */}
      <AnimatePresence>
        {isDispatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <DeptIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Prompt {currentDept.shortName} Workforce
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dispatch an autonomous objective directly to your department workers.
                  </p>
                </div>
              </div>

              {dispatchSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Directive Dispatched Successfully!</h4>
                </div>
              ) : (
                <form onSubmit={handleDispatchDirective} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Department Objective / Directive
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={`e.g. Analyze current performance and draft Q3 recommendations...`}
                      value={directivePrompt}
                      onChange={(e) => setDirectivePrompt(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={dispatchDirectiveMutation.isPending || !directivePrompt.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95"
                    >
                      {dispatchDirectiveMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Directive</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. TASK DETAIL DRAWER */}
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

              {selectedTask.milestones && selectedTask.milestones.length > 0 && (
                <MilestoneMap
                  milestones={selectedTask.milestones}
                  progress={selectedTask.progress}
                  taskTitle={selectedTask.title}
                />
              )}

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
                    {isStreaming && (
                      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Streaming Live Node Execution</span>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md uppercase font-bold">SSE Active</span>
                      </div>
                    )}

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
                      </div>
                    )}

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

                    <ThinkingProcess
                      isThinking={true}
                      title={`${selectedTask.agentName || "AI Team"} is Executing`}
                      statusMessage={`${selectedTask.agentName || "Specialist"} is reasoning and executing tools in real time...`}
                      steps={selectedTask.rawTask?.live_thoughts && selectedTask.rawTask.live_thoughts.length > 0 ? selectedTask.rawTask.live_thoughts : undefined}
                      defaultExpanded={true}
                    />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 space-y-1">
                    <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Task ready in pipeline.
                    </p>
                  </div>
                )}
              </div>
            </div>

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

export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading Operations Hub...</div>}>
      <ActivityContent />
    </Suspense>
  );
}
