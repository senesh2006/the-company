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
  Play,
  ChevronDown,
  TrendingDown,
  PieChart,
  CheckSquare,
  Square,
  HelpCircle,
  MessageSquare,
  Mail,
  Video,
  Gift,
  Share2,
  ArrowUpRight,
  Wallet,
  Landmark,
  FileText,
  Globe,
  Code2,
  GitBranch,
  Terminal,
  Server,
  Database,
  Check,
  AlertCircle,
  Bell,
  AlertTriangle,
  FileCode,
  Workflow,
  ShieldAlert,
  UserCheck,
  ZapOff
} from "lucide-react";
import { 
  useAgents, 
  useMetrics, 
  useTasks, 
  useDepartmentDetails, 
  useToggleDepartmentChecklist, 
  useDispatchDepartmentDirective 
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
    id: "finance",
    name: "Finance & Accounting",
    shortName: "Accounting",
    description: "Autonomous general ledger, GAAP double-entry bookkeeping, Google Sheets live synchronization, and expense auditing.",
    icon: Briefcase,
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    activePillClass: "bg-emerald-600 text-white",
    keywords: ["finance", "account", "bookkeeper", "ledger", "tax", "audit", "billing", "payroll"]
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    shortName: "Marketing",
    description: "Autonomous demand generation, social presence, copywriting, SEO campaigns, and audience acquisition.",
    icon: Megaphone,
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
    activePillClass: "bg-cyan-600 text-white",
    keywords: ["market", "growth", "social", "copy", "brand", "seo", "content", "campaign"]
  },
  {
    id: "engineering",
    name: "Engineering & Product",
    shortName: "Engineering",
    description: "Autonomous software development, code generation, bug fixing, test automation, and infrastructure orchestration.",
    icon: Cpu,
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    activePillClass: "bg-indigo-600 text-white",
    keywords: ["engineer", "developer", "code", "tech", "software", "architect", "devops"]
  },
  {
    id: "operations",
    name: "Operations & Research",
    shortName: "Operations",
    description: "Autonomous cross-functional orchestration, market intelligence, executive triage, and shared memory governance.",
    icon: Layers,
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    activePillClass: "bg-purple-600 text-white",
    keywords: ["ops", "lead", "orchestrator", "research", "analyst", "data", "executive", "admin"]
  }
];

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDept = searchParams?.get("dept") || "finance";
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly" | "Quarterly">("Weekly");
  const [activeTab, setActiveTab] = useState<"overview" | "workspace" | "workforce">("overview");

  // Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [directivePrompt, setDirectivePrompt] = useState("");
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Queries & Mutations
  const { data: rawAgents } = useAgents();
  const { data: deptDetails, isLoading: isDeptLoading } = useDepartmentDetails(selectedDeptId);
  const toggleChecklistMutation = useToggleDepartmentChecklist();
  const dispatchDirectiveMutation = useDispatchDepartmentDirective();
  const { setSelectedAgentId } = useAppStore();

  const agents = rawAgents || [];
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
      {/* 1. CLEAN LIGHT SaaS HEADER & DEPARTMENT NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="w-4 h-4 text-emerald-700" />
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
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{dept.shortName}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition active:scale-95"
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
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <span>Department Telemetry & Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workspace"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-700" />
            <span>Domain Workspace & Tools</span>
          </button>

          <button
            onClick={() => setActiveTab("workforce")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workforce"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-700" />
            <span>Assigned AI Fleet ({currentDeptAgents.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Cadence:</span>
          <select
            value={timeframe}
            onChange={(e: any) => setTimeframe(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
          </select>
        </div>
      </div>

      {/* 2. TAB CONTENTS */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 8 COLUMNS: UNIQUE CUSTOM DASHBOARD FOR EACH DEPARTMENT */}
          <div className="lg:col-span-8 space-y-6">

            {/* 🟢 A. FINANCE & ACCOUNTING CUSTOM DASHBOARD */}
            {selectedDeptId === "finance" && (
              <div className="space-y-6">
                {/* Finance Growth Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider">Total Income</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">$200,000</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-rose-100 text-rose-800 border border-rose-200">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Total Expenses</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">$50,000</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Net Profit</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">$150,000</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Projection & Variance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200 w-fit">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>96.6%</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">$200,000</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Receivable Amount</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-rose-50 text-rose-800 font-bold text-xs flex items-center gap-1 border border-rose-200 w-fit">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>56.3%</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">$150,000</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Payable Amount</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 font-bold text-xs flex items-center gap-1 border border-blue-200 w-fit">
                      <Clock className="w-3.5 h-3.5" />
                      <span>45%</span>
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">$150,000</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pending Receipt Audits</p>
                  </div>
                </div>
              </div>
            )}

            {/* 🩵 B. MARKETING & GROWTH CUSTOM DASHBOARD */}
            {selectedDeptId === "marketing" && (
              <div className="space-y-6">
                {/* Marketing Growth Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-cyan-50/80 border border-cyan-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider">Audience Reach</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">450,000</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Conversion Rate</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">4.8%</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Copy Volume</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">1,240 Posts</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Channel Grid */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-700" />
                    <span>Active Marketing Campaigns & Channels</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-cyan-700">LinkedIn B2B</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Founders Campaign</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">40% Traffic Share</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-indigo-700">X / Twitter</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Autonomous Tech Launch</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">30% Traffic Share</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-emerald-700">Organic SEO</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">AI Workers Guides</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">20% Traffic Share</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🟣 C. ENGINEERING & PRODUCT CUSTOM DASHBOARD */}
            {selectedDeptId === "engineering" && (
              <div className="space-y-6">
                {/* Engineering Growth Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <Code2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Active Repositories</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">14 Repos</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <GitBranch className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Commits Today</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">86 Commits</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-cyan-50/80 border border-cyan-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-cyan-900 uppercase tracking-wider">Test Pass Rate</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">99.4%</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tech Stack & Pipeline Status */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-700" />
                    <span>Production Services & CI/CD Telemetry</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Next.js Frontend
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Railway Production</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Static Prerendered 18/18</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        FastAPI Engine
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Python 3.11 Uvicorn</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Subprocess Sandbox Active</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-cyan-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
                        PostgreSQL Store
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Durable Key-Value</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Shared Memory Ref Sync</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 🟪 D. OPERATIONS & RESEARCH CUSTOM DASHBOARD */}
            {selectedDeptId === "operations" && (
              <div className="space-y-6">
                {/* Operations Growth Pulses */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-purple-100 text-purple-800 border border-purple-200">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Active Workflows</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">32 Tasks</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Approvals Handled</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">124 Approvals</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Memory Keys</p>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">1,450 Keys</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations Governance & Compliance Grid */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Governance & Executive Operations Telemetry</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-purple-700">Maker-Checker Policy</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">Active Guardrails</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Human Approval Required</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-emerald-700">Audit Compliance</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">100% Verified</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">SOX Audit Trail Active</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-amber-700">Decision SLA</span>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">0.4 Seconds</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Event Bus Latency</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE WIDGET: RECENT ACTIVITIES & TELEMETRY STREAM */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>Recent {currentDept.shortName} Activities & Stream</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Live Backend Feed</span>
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
                  <Bell className="w-4 h-4 text-cyan-700" />
                  <span>AI Operational Alerts</span>
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
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Attention Queue ({attentionItems.length})</span>
                </h3>

                <div className="space-y-2">
                  {attentionItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Attention queue empty.</p>
                  ) : (
                    attentionItems.map((att: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-amber-950">{att.title}</h4>
                          <span className="text-[10px] text-amber-800 font-semibold">{att.priority === "high" ? "High Priority" : "Action Needed"}</span>
                        </div>
                        <button className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition shrink-0">
                          {att.action}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: LIVE CHECKLIST & ASSISTANCE */}
          <div className="lg:col-span-4 space-y-6">

            {/* CHECKLIST CARD */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>{currentDept.shortName} Setup Guide</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {completedTasksCount}/{currentChecklist.length} Complete
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete the department configuration tasks below.
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
                  Setup progress {completedTasksCount} to {currentChecklist.length} tasks complete
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
                        ? "bg-slate-50 dark:bg-slate-950 text-slate-400 line-through border border-slate-200/60"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shadow-2xs"
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

            {/* AI SUPPORT CARD */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Department AI Support
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Reach out for assistance or trigger automated reviews.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Book Demo</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Chat</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Mail className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Email Us</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                  <span>Help Center</span>
                </button>
              </div>
            </div>

            {/* PROMO BANNER CARD */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 border border-emerald-700 text-white space-y-3 shadow-md relative overflow-hidden">
              <Gift className="w-20 h-20 text-white/10 absolute -right-3 -bottom-3 pointer-events-none" />
              <h4 className="text-base font-extrabold leading-snug">
                Scale your autonomous workforce & earn 10% token bonus
              </h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Add autonomous AI specialists to {currentDept.name} to expand operational velocity.
              </p>
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 text-emerald-900 hover:bg-slate-100 dark:bg-slate-800 text-xs font-extrabold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Get Invite Link</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-900" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. DOMAIN WORKSPACE TAB */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {selectedDeptId === "finance" && <ChartOfAccountsSheet />}
          {selectedDeptId !== "finance" && (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentDept.name} Domain Tools</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Interactive domain workspace tools, state memory, and action triggers for {currentDept.name}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. WORKFORCE TAB */}
      {activeTab === "workforce" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDeptAgents.length === 0 ? (
            <div className="col-span-full p-10 rounded-2xl border border-dashed border-slate-300 bg-white dark:bg-slate-900 text-center space-y-3">
              <Bot className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No autonomous workers assigned yet</h4>
              <Link
                href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Hire First {currentDept.shortName} Worker</span>
              </Link>
            </div>
          ) : (
            currentDeptAgents.map((agent: any) => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold">
                    <Bot className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name || "AI Worker"}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{agent.role || "Specialist"}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Status: <strong className="text-emerald-700 font-bold">{agent.status || "Idle"}</strong></span>
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="text-emerald-800 font-bold hover:underline"
                  >
                    View Directives
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
                className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
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
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Directive Dispatched Successfully!</h4>
                </div>
              ) : (
                <form onSubmit={handleDispatchDirective} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Department Objective / Prompt
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={`e.g. Run weekly performance audit and update report...`}
                      value={directivePrompt}
                      onChange={(e) => setDirectivePrompt(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={dispatchDirectiveMutation.isPending || !directivePrompt.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition active:scale-95"
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
