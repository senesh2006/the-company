"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Megaphone, 
  Cpu, 
  Layers, 
  Bot, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  ShieldCheck, 
  Search, 
  UserPlus, 
  ArrowRight,
  Sparkles,
  Activity,
  DollarSign,
  Receipt,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  X,
  BarChart3,
  SlidersHorizontal,
  Zap,
  RefreshCw,
  Play
} from "lucide-react";
import { useAgents, useMetrics } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { ChartOfAccountsSheet } from "@/components/finance/ChartOfAccountsSheet";

interface DepartmentMeta {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    gradient: string;
    ring: string;
  };
  keywords: string[];
}

const DEPARTMENTS: DepartmentMeta[] = [
  {
    id: "finance",
    name: "Finance & Accounting",
    shortName: "Accounting",
    description: "Autonomous general ledger, GAAP double-entry bookkeeping, Google Sheets live synchronization, and expense auditing.",
    icon: Briefcase,
    color: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      gradient: "from-emerald-950/50 via-slate-900/80 to-slate-950/90",
      ring: "ring-emerald-500/40"
    },
    keywords: ["finance", "account", "bookkeeper", "ledger", "tax", "audit", "billing", "payroll"]
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    shortName: "Marketing",
    description: "Autonomous demand generation, social presence, copywriting, SEO campaigns, and audience acquisition.",
    icon: Megaphone,
    color: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      gradient: "from-cyan-950/50 via-slate-900/80 to-slate-950/90",
      ring: "ring-cyan-500/40"
    },
    keywords: ["market", "growth", "social", "copy", "brand", "seo", "content", "campaign"]
  },
  {
    id: "engineering",
    name: "Engineering & Product",
    shortName: "Engineering",
    description: "Autonomous software development, code generation, bug fixing, test automation, and infrastructure orchestration.",
    icon: Cpu,
    color: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      gradient: "from-indigo-950/50 via-slate-900/80 to-slate-950/90",
      ring: "ring-indigo-500/40"
    },
    keywords: ["engineer", "developer", "code", "tech", "software", "architect", "devops"]
  },
  {
    id: "operations",
    name: "Operations & Research",
    shortName: "Operations",
    description: "Autonomous cross-functional orchestration, market intelligence, executive triage, and shared memory governance.",
    icon: Layers,
    color: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
      text: "text-purple-400",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      gradient: "from-purple-950/50 via-slate-900/80 to-slate-950/90",
      ring: "ring-purple-500/40"
    },
    keywords: ["ops", "lead", "orchestrator", "research", "analyst", "data", "executive", "admin"]
  }
];

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDept = searchParams?.get("dept") || "finance";
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
  const [activeTab, setActiveTab] = useState<"workforce" | "workspace" | "activity">("workforce");
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Running" | "Idle">("all");
  
  // Directive Dispatcher Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [directivePrompt, setDirectivePrompt] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const { data: rawAgents, isLoading: agentsLoading } = useAgents();
  const { data: metrics } = useMetrics();
  const { setSelectedAgentId } = useAppStore();

  useEffect(() => {
    const dept = searchParams?.get("dept");
    if (dept && DEPARTMENTS.some(d => d.id === dept)) {
      setSelectedDeptId(dept);
    }
  }, [searchParams]);

  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    router.replace(`/departments?dept=${deptId}`);
  };

  const agents = rawAgents || [];
  const currentDept = DEPARTMENTS.find(d => d.id === selectedDeptId) || DEPARTMENTS[0];

  // Helper to match agents to departments
  const getDeptAgents = (dept: DepartmentMeta) => {
    return agents.filter((a: any) => {
      const roleStr = `${a.role || ""} ${a.name || ""}`.toLowerCase();
      return dept.keywords.some(k => roleStr.includes(k));
    });
  };

  const currentDeptAgents = getDeptAgents(currentDept);
  const runningWorkersCount = currentDeptAgents.filter(a => a.status === 'Running').length;
  const idleWorkersCount = currentDeptAgents.filter(a => a.status === 'Idle' || !a.status).length;
  const currentDeptCost = currentDeptAgents.reduce((sum, a) => sum + (a.cost_today_usd || 0), 0);
  const totalFleetCost = agents.reduce((sum, a) => sum + (a.cost_today_usd || 0), 0);

  // Filtered workers for current department
  const filteredWorkers = currentDeptAgents.filter((agent: any) => {
    const nameMatch = (agent.name || "").toLowerCase().includes(workerSearchQuery.toLowerCase());
    const roleMatch = (agent.role || "").toLowerCase().includes(workerSearchQuery.toLowerCase());
    const taskMatch = (agent.current_task_title || "").toLowerCase().includes(workerSearchQuery.toLowerCase());
    const passesSearch = nameMatch || roleMatch || taskMatch;
    
    if (statusFilter === "all") return passesSearch;
    return passesSearch && agent.status === statusFilter;
  });

  const handleDispatchDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directivePrompt.trim()) return;
    
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
        setIsDispatchModalOpen(false);
        setDirectivePrompt("");
      }, 1500);
    }, 1000);
  };

  const DeptIcon = currentDept.icon;

  return (
    <div className="space-y-8 pb-20 text-slate-100 font-sans">
      {/* 1. Header & Overview Stats Bar */}
      <div className="flex flex-col gap-6 border-b border-slate-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Company Organization</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-200">Departments & AI Workforces</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Departments Hub</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                4 Autonomous Units
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Specialized functional business units operating autonomous AI workers, shared memory, and domain workspace tools.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Dispatch Department Objective</span>
            </button>
            <Link
              href="/hire"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Recruit Specialist</span>
            </Link>
          </div>
        </div>

        {/* Global Department Fleet Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Total Workforce</span>
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white">{agents.length}</span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Fleet
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Active Execution</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white">
                {agents.filter(a => a.status === 'Running').length}
              </span>
              <span className="text-[10px] text-slate-400">
                / {agents.length} running tasks
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Fleet Spend Today</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-white font-mono">${totalFleetCost.toFixed(2)}</span>
              <span className="text-[10px] text-cyan-400 font-semibold">LLM Tokens</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">Department Policy</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-slate-200">Maker-Checker</span>
              <span className="text-[10px] text-amber-400 font-medium">SOX Guardrails</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Selector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {DEPARTMENTS.map((dept) => {
          const isSelected = dept.id === selectedDeptId;
          const deptAgents = getDeptAgents(dept);
          const activeCount = deptAgents.filter(a => a.status === 'Running').length;
          const deptCost = deptAgents.reduce((sum, a) => sum + (a.cost_today_usd || 0), 0);
          const Icon = dept.icon;

          return (
            <button
              key={dept.id}
              onClick={() => handleSelectDept(dept.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden group ${
                isSelected
                  ? `bg-slate-900/95 border-slate-700 shadow-2xl ring-2 ${dept.color.ring}`
                  : `bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${dept.color.bg} ${dept.color.text} border ${dept.color.border} shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dept.color.badge}`}>
                    {deptAgents.length} {deptAgents.length === 1 ? 'Worker' : 'Workers'}
                  </span>
                  {activeCount > 0 && (
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeCount} active
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3.5">
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition flex items-center justify-between">
                  <span>{dept.name}</span>
                </h3>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                  <span>Daily Spend</span>
                  <span className="font-mono text-slate-200 font-semibold">${deptCost.toFixed(2)}</span>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="activeDeptIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-cyan-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Department Hero Banner */}
      <div className={`rounded-3xl border ${currentDept.color.border} bg-gradient-to-b ${currentDept.color.gradient} p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden shadow-2xl space-y-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl ${currentDept.color.bg} ${currentDept.color.text} border ${currentDept.color.border} shadow-2xl`}>
              <DeptIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {currentDept.name}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${currentDept.color.badge}`}>
                  Autonomous Department Unit
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentDept.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Prompt {currentDept.shortName} Fleet</span>
            </button>
            <Link
              href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hire Specialist</span>
            </Link>
          </div>
        </div>

        {/* Department KPIs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Fleet</span>
            <p className="text-base font-extrabold text-white mt-0.5">{currentDeptAgents.length} Agents</p>
            <span className="text-[10px] text-slate-500">{runningWorkersCount} running, {idleWorkersCount} standby</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Burn Today</span>
            <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">${currentDeptCost.toFixed(2)}</p>
            <span className="text-[10px] text-slate-500">Allocated budget active</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operational Health</span>
            <p className="text-base font-extrabold text-cyan-400 mt-0.5">99.9% Online</p>
            <span className="text-[10px] text-slate-500">0 critical alerts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shared Memory Keys</span>
            <p className="text-base font-extrabold text-purple-400 mt-0.5">Connected</p>
            <span className="text-[10px] text-slate-500">Postgres JSONB synchronized</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("workforce")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "workforce"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Workforce & Directives</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-slate-950/60 font-mono">
              {currentDeptAgents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "workspace"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Department Domain Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "activity"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit & Execution Stream</span>
          </button>
        </div>
      </div>

      {/* 5. TAB CONTENTS */}
      <AnimatePresence mode="wait">
        {activeTab === "workforce" && (
          <motion.div
            key="workforce-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${currentDept.shortName} AI workers or active objectives...`}
                  value={workerSearchQuery}
                  onChange={(e) => setWorkerSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {workerSearchQuery && (
                  <button
                    onClick={() => setWorkerSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    All ({currentDeptAgents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("Running")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === "Running" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Running ({runningWorkersCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("Idle")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === "Idle" ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Idle ({idleWorkersCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Workers Grid */}
            {filteredWorkers.length === 0 ? (
              <div className="p-10 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
                <Bot className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching AI workers found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {workerSearchQuery || statusFilter !== "all"
                    ? "Try adjusting your search criteria or clear status filters."
                    : `No autonomous workers assigned to ${currentDept.name} yet.`}
                </p>
                <div className="pt-2">
                  <Link
                    href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Recruit {currentDept.shortName} Specialist</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkers.map((agent: any) => {
                  const isRunning = agent.status === "Running";
                  const isIdle = agent.status === "Idle" || !agent.status;
                  const progress = agent.task_progress ?? (isRunning ? 65 : 0);

                  return (
                    <div
                      key={agent.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition duration-200 group flex flex-col justify-between relative overflow-hidden shadow-xl"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-200 group-hover:border-indigo-500/50 transition">
                              <Bot className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-indigo-300 transition">
                                {agent.name || "AI Worker"}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {agent.role || "Specialist"}
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isRunning
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isIdle
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : isIdle ? 'bg-blue-400' : 'bg-slate-500'}`} />
                            {agent.status || "Idle"}
                          </span>
                        </div>

                        {/* Objective Card */}
                        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 uppercase font-bold tracking-wider">Current Task</span>
                            <span className="text-indigo-400 font-mono font-bold">{progress}%</span>
                          </div>
                          <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                            {agent.current_task_title || "Standby for founder directives"}
                          </p>
                          {/* Task Progress Bar */}
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-400">
                          Cost Today: <span className="font-mono text-slate-200 font-bold">${(agent.cost_today_usd ?? 0).toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => setSelectedAgentId(agent.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1 transition text-[11px]"
                        >
                          <span>Directives</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "workspace" && (
          <motion.div
            key="workspace-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* SPECIFIC WORKSPACE BY DEPARTMENT */}
            {selectedDeptId === "finance" && (
              <div className="space-y-6">
                <ChartOfAccountsSheet />
              </div>
            )}

            {selectedDeptId === "marketing" && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-cyan-400" />
                      <span>Growth & Content Intelligence Workspace</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Marketing AI Workers autonomously execute search, social copywriting, and multi-channel demand generation.
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Launch Marketing Directive</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Target Channels</span>
                    <p className="text-base font-bold text-white mt-1">LinkedIn, X / Twitter, SEO</p>
                    <p className="text-[11px] text-slate-500 mt-1">Managed by AI Agents</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Connected Tools</span>
                    <p className="text-base font-bold text-cyan-400 mt-1">Notion, Perplexity Search</p>
                    <p className="text-[11px] text-slate-500 mt-1">Live MCP Tools Active</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Content Pipeline</span>
                    <p className="text-base font-bold text-white mt-1">Maker-Checker Reviewed</p>
                    <p className="text-[11px] text-slate-500 mt-1">SOX & Quality Guardrails</p>
                  </div>
                </div>
              </div>
            )}

            {selectedDeptId === "engineering" && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                      <span>Engineering Sandbox & Repository Workspace</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Autonomous coding agents generate, inspect, and test pull requests with full test validation.
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Submit Code Task</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Active CI/CD Pipeline</span>
                    <p className="text-base font-bold text-emerald-400 mt-1">Railway & GitHub Actions</p>
                    <p className="text-[11px] text-slate-500 mt-1">Continuous Deployment</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Runtime Sandbox</span>
                    <p className="text-base font-bold text-indigo-400 mt-1">Git, Terminal, PyTest</p>
                    <p className="text-[11px] text-slate-500 mt-1">Subprocess Sandbox</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Architecture State</span>
                    <p className="text-base font-bold text-white mt-1">Next.js + FastAPI + Postgres</p>
                    <p className="text-[11px] text-slate-500 mt-1">Full-stack Autonomous Fleet</p>
                  </div>
                </div>
              </div>
            )}

            {selectedDeptId === "operations" && (
              <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>Operations & Executive Governance Workspace</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Cross-department orchestration, strategic planning, human approval gates, and organizational monitoring.
                    </p>
                  </div>
                  <Link
                    href="/approvals"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Review Approvals</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Executive Approvals</span>
                    <p className="text-base font-bold text-amber-400 mt-1">Maker-Checker Policy</p>
                    <p className="text-[11px] text-slate-500 mt-1">Human-in-the-Loop Threshold</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Organizational Structure</span>
                    <p className="text-base font-bold text-purple-400 mt-1">Hierarchy Tree</p>
                    <p className="text-[11px] text-slate-500 mt-1">Live in /hierarchy</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Shared Memory Store</span>
                    <p className="text-base font-bold text-white mt-1">Postgres JSONB / Supabase</p>
                    <p className="text-[11px] text-slate-500 mt-1">Durable Key-Value State</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{currentDept.name} Live Execution Log</span>
              </h3>
              <span className="text-xs text-slate-500">Real-time telemetry</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">[09:42:15]</span>
                  <span className="text-slate-200">Department AI Agent synchronized state with shared PostgreSQL database.</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">SUCCESS</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-slate-400">[09:30:00]</span>
                  <span className="text-slate-200">Maker-Checker compliance engine verified zero policy violations.</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">VERIFIED</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-slate-400">[08:15:22]</span>
                  <span className="text-slate-200">Autonomous worker dispatched execution heartbeat to Event Bus.</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">ACTIVE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. DISPATCH DIRECTIVE MODAL */}
      <AnimatePresence>
        {isDispatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${currentDept.color.bg} ${currentDept.color.text} border ${currentDept.color.border}`}>
                  <DeptIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Prompt {currentDept.shortName} Workforce
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch an autonomous directive to all {currentDeptAgents.length} assigned AI workers.
                  </p>
                </div>
              </div>

              {dispatchSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Directive Dispatched Successfully!</h4>
                  <p className="text-xs text-slate-300">
                    Workers in {currentDept.name} have received the task instructions.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDispatchDirective} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Department Objective / Prompt
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={`e.g. Audit all Q3 expenses against GAAP standards and update the Google Sheets ledger...`}
                      value={directivePrompt}
                      onChange={(e) => setDirectivePrompt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDispatching || !directivePrompt.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition active:scale-95"
                    >
                      {isDispatching ? (
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
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading Departments...</div>}>
      <DepartmentsContent />
    </Suspense>
  );
}
