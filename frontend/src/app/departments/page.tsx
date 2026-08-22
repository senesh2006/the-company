"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Briefcase, 
  Megaphone, 
  Bot, 
  Plus, 
  FileSpreadsheet, 
  FileText,
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
  CheckCircle2, 
  Clock, 
  Send, 
  X, 
  BarChart3, 
  Zap, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Video, 
  Wallet, 
  Globe, 
  Check, 
  AlertCircle, 
  Bell, 
  Share2, 
  ArrowUpRight, 
  Database,
  Target
} from "lucide-react";
import { 
  useAgents, 
  useMetrics, 
  useTasks, 
  useDepartmentDetails, 
  useToggleDepartmentChecklist, 
  useDispatchDepartmentDirective,
  useFinanceAccounts,
  useJournalEntries
} from "@/lib/queries";
import { useAppStore } from "@/lib/store";
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

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawParam = searchParams?.get("dept");
  const initialDept = (rawParam && DEPARTMENTS.some(d => d.id === rawParam)) ? rawParam : "marketing";
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
  const [activeTab, setActiveTab] = useState<"overview" | "workspace" | "workforce">("overview");

  // Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [directivePrompt, setDirectivePrompt] = useState("");
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Queries & Mutations
  const { data: rawAgents } = useAgents();
  const { data: rawTasks } = useTasks();
  const { data: metrics } = useMetrics();
  const { data: financeData } = useFinanceAccounts();
  const { data: journalEntries } = useJournalEntries();
  const { data: deptDetails, isLoading: isDeptLoading } = useDepartmentDetails(selectedDeptId);
  const toggleChecklistMutation = useToggleDepartmentChecklist();
  const dispatchDirectiveMutation = useDispatchDepartmentDirective();
  const { setSelectedAgentId } = useAppStore();

  const agents = rawAgents || [];
  const tasks = rawTasks || [];
  const currentDept = DEPARTMENTS.find(d => d.id === selectedDeptId) || DEPARTMENTS[0];

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

  const toggleChecklistItem = async (task_id: number) => {
    try {
      await toggleChecklistMutation.mutateAsync({ deptId: selectedDeptId, taskId: task_id });
    } catch (err) {
      console.error("Failed to toggle checklist task", err);
    }
  };

  const getDeptAgents = (dept: DepartmentMeta) => {
    return agents.filter((a: any) => {
      const roleStr = `${a.role || ""} ${a.name || ""}`.toLowerCase();
      return dept.keywords.some(k => roleStr.includes(k));
    });
  };

  const currentDeptAgents = getDeptAgents(currentDept);
  const currentChecklist = deptDetails?.checklist || [];
  const completedTasksCount = currentChecklist.filter((c: any) => c.completed).length;
  const DeptIcon = currentDept.icon;

  // Real Department Tasks
  const deptTasks = tasks.filter((t: any) => {
    const assigneeStr = `${t.assignee_role || ""} ${t.description || ""}`.toLowerCase();
    return currentDept.keywords.some(k => assigneeStr.includes(k));
  });
  const completedDeptTasks = deptTasks.filter((t: any) => t.status === "completed");
  const runningDeptTasks = deptTasks.filter((t: any) => t.status === "running" || t.status === "queued");

  // Real Financial Values
  const tbSummary = financeData?.trial_balance?.summary;
  const totalRevenue = tbSummary?.total_revenue ?? 0;
  const totalExpenses = (tbSummary?.total_opex ?? 0) + (tbSummary?.total_cogs ?? 0);
  const netIncome = tbSummary?.net_income ?? (totalRevenue - totalExpenses);
  const totalAssets = tbSummary?.total_assets ?? 0;
  const totalLiabilities = tbSummary?.total_liabilities ?? 0;

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

  const recentActivities = deptDetails?.activities || [];
  const alerts = deptDetails?.alerts || [];
  const attentionItems = deptDetails?.attention || [];

  return (
    <div className="space-y-6 pb-20 text-slate-800 dark:text-slate-200 font-sans">
      {/* 1. SaaS HEADER & DEPARTMENT NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
            <span>Company Organization</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 font-bold">Departments Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <span>{currentDept.name}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentDept.badgeClass}`}>
              {currentDeptAgents.length} {currentDeptAgents.length === 1 ? 'Worker' : 'Workers'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {currentDept.description}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          {/* Department Unit Selector Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {DEPARTMENTS.map(dept => {
              const isSelected = dept.id === selectedDeptId;
              const Icon = dept.icon;
              return (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDept(dept.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dept.shortName}</span>
                </button>
              );
            })}
          </div>

          <a
            href="/activity?view=stream"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Unified Live Stream</span>
          </a>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Prompt Department</span>
          </button>
        </div>
      </div>

      {/* VIEW TABS BAR */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "overview"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Department Telemetry & Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workspace"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Domain Workspace & Tools</span>
          </button>

          <button
            onClick={() => setActiveTab("workforce")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workforce"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Assigned AI Fleet ({currentDeptAgents.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* 2. TAB CONTENTS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 8 COLUMNS: LIVE DEPARTMENT DASHBOARD */}
          <div className="lg:col-span-8 space-y-6">

            {/* 🩵 A. MARKETING & GROWTH LIVE DASHBOARD */}
            {selectedDeptId === "marketing" && (
              <div className="space-y-6">
                {/* Marketing Growth Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase tracking-wider">Total Tasks</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{deptTasks.length}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Deliverables</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{completedDeptTasks.length} Done</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">In Flight</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{runningDeptTasks.length} Active</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Channel Grid */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Active Marketing Channels & Strategy Engines</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-400">Market Intelligence</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Perplexity Web Search</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time competitor tracking</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">Brand Governance</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Shared Memory Store</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tone & Policy Enforcement</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Autonomous Mandates</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Content & SEO Pipeline</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fast-path worker execution</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🟢 B. FINANCE & ACCOUNTING LIVE DASHBOARD */}
            {selectedDeptId === "finance" && (
              <div className="space-y-6">
                {/* Finance Live Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase tracking-wider">Total Revenue</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-700">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">Total Expenses</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Net Income</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                          ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 w-fit">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Assets</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">
                      ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Book Assets</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-800 w-fit">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Liabilities</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">
                      ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Outstanding Liabilities</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800 w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Journal Entries</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">
                      {journalEntries?.entries?.length ?? journalEntries?.total_count ?? 0}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Synchronized Ledger Records</p>
                  </div>
                </div>

                {/* Operations & Finance Specialized Desks Suite */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Operations & Finance Desks</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Autonomous operational capabilities active on the Financial Controller.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
                      5 Desks Online
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {/* Desk 1: Contract Desk */}
                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <FileText className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Contract Desk
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Contract Desk</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          See the week of paper at a glance. Summarizes by stage and owner, pulls key terms, and flags blocked reviews.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDirectivePrompt("Contract Desk: Review the week of paper, summarize contracts by stage and owner, extract key SLA/liability terms, and flag blocked reviews.");
                          setIsDispatchModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Run Contract Review</span>
                      </button>
                    </div>

                    {/* Desk 2: Expense Manager */}
                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Receipt className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Expense Manager
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Expense Manager</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Stay on top of the money. Builds weekly summaries from expense sheets, logs new receipts from email, and nudges owners on missing categories.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDirectivePrompt("Expense Manager: Compile weekly summary from expense manager and Google Sheets, log pending receipts, and audit missing categories.");
                          setIsDispatchModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Compile Weekly Expenses</span>
                      </button>
                    </div>

                    {/* Desk 3: Invoice Coordinator */}
                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                            <CreditCard className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                            Invoice Coordinator
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Invoice Coordinator</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Stop invoices from sitting. Forwards invoices, matches line items with POs, tracks vendor actuals, and nudges owners when human sign-off is needed.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDirectivePrompt("Invoice Coordinator: Run 3-way invoice matching against POs, track vendor actuals, and flag any stalled invoices.");
                          setIsDispatchModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Match Invoices & POs</span>
                      </button>
                    </div>

                    {/* Desk 4: Security Questionnaire Filler */}
                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Security Filler
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Security Questionnaire Filler</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Speed through vendor security portals. Pulls answers from your trust center and past RFPs, drafts every field, and parks the submit for review.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDirectivePrompt("Security Questionnaire Filler: Pull verified answers from Trust Center and policies in Shared Memory, draft all questionnaire fields, and park for review.");
                          setIsDispatchModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Draft Questionnaire</span>
                      </button>
                    </div>

                    {/* Desk 5: Vendor Portal Operator */}
                    <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            <Globe className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Vendor Operator
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Vendor Portal Operator</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Run renewals, seats, and procurement on portals with no clean API. Clicks the same path every week and comes back with exceptions only.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDirectivePrompt("Vendor Portal Operator: Scan vendor renewal dates within 60 days, audit seat utilization across portals, and report exceptions only.");
                          setIsDispatchModalOpen(true);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Scan Portals & Seats</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE WIDGET: RECENT ACTIVITIES & TELEMETRY STREAM */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recent {currentDept.shortName} Activity Stream</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Live Telemetry</span>
              </div>

              <div className="space-y-2.5">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No recent activities logged yet.</p>
                ) : (
                  recentActivities.map((act: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{act.text}</p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{act.time}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${act.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                        {act.badge || 'EXEC'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LIVE WIDGET: AI OPERATIONAL ALERTS & ATTENTION QUEUE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Operational Alerts */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>AI Operational Status</span>
                </h3>

                <div className="space-y-2">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No active alerts.</p>
                  ) : (
                    alerts.map((alt: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{alt.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5.5">{alt.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Attention Queue */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Attention Queue ({attentionItems.length})</span>
                </h3>

                <div className="space-y-2">
                  {attentionItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Attention queue clear.</p>
                  ) : (
                    attentionItems.map((att: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">{att.title}</h4>
                          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">{att.priority === "high" ? "High Priority" : "Action Needed"}</span>
                        </div>
                        <Link 
                          href="/approvals"
                          className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-bold text-[10px] transition shrink-0"
                        >
                          {att.action}
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: LIVE CHECKLIST & QUICK ACTIONS */}
          <div className="lg:col-span-4 space-y-6">

            {/* CHECKLIST CARD */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{currentDept.shortName} Setup Guide</span>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {completedTasksCount}/{currentChecklist.length} Complete
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Department operational readiness tasks.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${currentChecklist.length > 0 ? (completedTasksCount / currentChecklist.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right font-medium">
                  {completedTasksCount} of {currentChecklist.length} tasks ready
                </p>
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                {currentChecklist.map((task: any) => (
                  <button
                    key={task.id}
                    onClick={() => toggleChecklistItem(task.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center gap-2.5 ${
                      task.completed
                        ? "bg-slate-50 dark:bg-slate-950 text-slate-400 line-through border border-slate-200/60 dark:border-slate-800"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-2xs"
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

            {/* QUICK ACTIONS CARD */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Control Plane Navigation
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct links to live systems & configuration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/tasks"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Tasks Hub</span>
                </Link>

                <Link 
                  href="/memory"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Shared Memory</span>
                </Link>

                <Link 
                  href="/approvals"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Approvals</span>
                </Link>

                <Link 
                  href="/onboarding"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Setup Wizard</span>
                </Link>
              </div>
            </div>

            {/* EXPAND WORKFORCE CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 border border-emerald-700 text-white space-y-3 shadow-md relative overflow-hidden">
              <h4 className="text-base font-extrabold leading-snug">
                Expand Your {currentDept.shortName} Fleet
              </h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Assign new specialist roles with custom authority limits and trust tiers.
              </p>
              <Link
                href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-900 hover:bg-slate-100 text-xs font-extrabold shadow-xs transition active:scale-95"
              >
                <span>Hire Specialist</span>
                <ArrowRight className="w-4 h-4 text-emerald-900" />
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* 3. DOMAIN WORKSPACE TAB */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {selectedDeptId === "finance" ? (
            <ChartOfAccountsSheet />
          ) : (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Marketing & Growth Operations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live strategy mandates, brand compliance verification, and audience reach tools.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-600" />
                    <span>Brand Voice & Guidelines</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Policies and tone parameters stored in Shared Memory are automatically injected into the Growth & Marketing Lead agent before every mandate generation.
                  </p>
                  <Link 
                    href="/memory"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline pt-1"
                  >
                    <span>View Brand Memory Keys</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Fast-Path Autonomous Execution</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Growth tasks execute with low-latency LLM routing, Perplexity search grounding, and automated reflection loops capped at 5 sub-tasks per mandate.
                  </p>
                  <button
                    onClick={() => setIsDispatchModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline pt-1"
                  >
                    <span>Dispatch Strategy Directive</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. WORKFORCE TAB */}
      {activeTab === "workforce" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDeptAgents.length === 0 ? (
            <div className="col-span-full p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-3">
              <Bot className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No autonomous workers assigned yet</h4>
              <Link
                href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Hire First {currentDept.shortName} Worker</span>
              </Link>
            </div>
          ) : (
            currentDeptAgents.map((agent: any) => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold">
                    <Bot className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name || "AI Worker"}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{agent.role || "Specialist"}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Status: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{agent.status || "Idle"}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  >
                    View Agent Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DISPATCH DIRECTIVE MODAL */}
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
                    Dispatch an autonomous objective directly to your AI workers.
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
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Departments...</div>}>
      <DepartmentsContent />
    </Suspense>
  );
}
