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
  FileText
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
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  pulses: {
    income: string;
    expenses: string;
    profit: string;
  };
  metrics: {
    receivable: string;
    receivablePct: string;
    payable: string;
    payablePct: string;
    pending: string;
    pendingPct: string;
  };
  inflow: {
    cashCollected: string;
    bankCollection: string;
    payables: string;
    cashBalance: string;
    bankBalance: string;
    taxPayables: string;
  };
  checklist: { id: number; title: string; completed: boolean }[];
  keywords: string[];
}

const DEPARTMENTS: DepartmentMeta[] = [
  {
    id: "finance",
    name: "Finance & Accounting",
    shortName: "Accounting",
    description: "Autonomous general ledger, GAAP double-entry bookkeeping, Google Sheets live synchronization, and expense auditing.",
    icon: Briefcase,
    accentColor: "emerald",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    pulses: {
      income: "$200,000",
      expenses: "$50,000",
      profit: "$150,000"
    },
    metrics: {
      receivable: "$200,000",
      receivablePct: "96.6%",
      payable: "$150,000",
      payablePct: "56.3%",
      pending: "$150,000",
      pendingPct: "45%"
    },
    inflow: {
      cashCollected: "$100,000",
      bankCollection: "$150,000",
      payables: "$150,000",
      cashBalance: "$200,000",
      bankBalance: "$100,000",
      taxPayables: "$120,000"
    },
    checklist: [
      { id: 1, title: "Connect Google Sheets Ledger", completed: true },
      { id: 2, title: "Hire Lead Accountant AI Worker", completed: true },
      { id: 3, title: "Set Authority Limits & Spending Caps", completed: true },
      { id: 4, title: "Enable GAAP Double-Entry Validation", completed: true },
      { id: 5, title: "Configure Automated Trial Balance Audits", completed: false },
      { id: 6, title: "Set Up Tax & Payroll Directives", completed: false },
      { id: 7, title: "Configure Approval Thresholds", completed: false },
      { id: 8, title: "Verify Multi-Currency Accounts", completed: false }
    ],
    keywords: ["finance", "account", "bookkeeper", "ledger", "tax", "audit", "billing", "payroll"]
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    shortName: "Marketing",
    description: "Autonomous demand generation, social presence, copywriting, SEO campaigns, and audience acquisition.",
    icon: Megaphone,
    accentColor: "cyan",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    pulses: {
      income: "$340,000",
      expenses: "$82,000",
      profit: "$258,000"
    },
    metrics: {
      receivable: "$340,000",
      receivablePct: "98.2%",
      payable: "$82,000",
      payablePct: "32.1%",
      pending: "$95,000",
      pendingPct: "28%"
    },
    inflow: {
      cashCollected: "$180,000",
      bankCollection: "$160,000",
      payables: "$82,000",
      cashBalance: "$310,000",
      bankBalance: "$240,000",
      taxPayables: "$45,000"
    },
    checklist: [
      { id: 1, title: "Setup Perplexity AI Web Search Tool", completed: true },
      { id: 2, title: "Hire Growth Copywriter AI Agent", completed: true },
      { id: 3, title: "Configure Social Campaign Directives", completed: true },
      { id: 4, title: "Set Up Brand Voice Guidelines", completed: true },
      { id: 5, title: "Integrate Notion Content Workspace", completed: false },
      { id: 6, title: "Configure SEO Landing Page Pipeline", completed: false },
      { id: 7, title: "Enable Automated Lead Scoring", completed: false },
      { id: 8, title: "Connect Multi-Channel Analytics", completed: false }
    ],
    keywords: ["market", "growth", "social", "copy", "brand", "seo", "content", "campaign"]
  },
  {
    id: "engineering",
    name: "Engineering & Product",
    shortName: "Engineering",
    description: "Autonomous software development, code generation, bug fixing, test automation, and infrastructure orchestration.",
    icon: Cpu,
    accentColor: "indigo",
    badgeBg: "bg-indigo-500/10",
    badgeText: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    pulses: {
      income: "$490,000",
      expenses: "$110,000",
      profit: "$380,000"
    },
    metrics: {
      receivable: "$490,000",
      receivablePct: "99.4%",
      payable: "$110,000",
      payablePct: "41.5%",
      pending: "$120,000",
      pendingPct: "35%"
    },
    inflow: {
      cashCollected: "$290,000",
      bankCollection: "$200,000",
      payables: "$110,000",
      cashBalance: "$450,000",
      bankBalance: "$380,000",
      taxPayables: "$65,000"
    },
    checklist: [
      { id: 1, title: "Connect GitHub Repository Pipeline", completed: true },
      { id: 2, title: "Hire Autonomous Code Architect Agent", completed: true },
      { id: 3, title: "Configure PyTest & Automated Testing", completed: true },
      { id: 4, title: "Enable Terminal Subprocess Sandbox", completed: true },
      { id: 5, title: "Configure Railway Production Deployment", completed: true },
      { id: 6, title: "Set Up FastAPI Endpoint Builders", completed: false },
      { id: 7, title: "Configure MCP Server Integrations", completed: false },
      { id: 8, title: "Verify Pull Request Auto-Reviews", completed: false }
    ],
    keywords: ["engineer", "developer", "code", "tech", "software", "architect", "devops"]
  },
  {
    id: "operations",
    name: "Operations & Research",
    shortName: "Operations",
    description: "Autonomous cross-functional orchestration, market intelligence, executive triage, and shared memory governance.",
    icon: Layers,
    accentColor: "purple",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    borderColor: "border-purple-500/30",
    pulses: {
      income: "$280,000",
      expenses: "$45,000",
      profit: "$235,000"
    },
    metrics: {
      receivable: "$280,000",
      receivablePct: "97.1%",
      payable: "$45,000",
      payablePct: "22.4%",
      pending: "$60,000",
      pendingPct: "18%"
    },
    inflow: {
      cashCollected: "$150,000",
      bankCollection: "$130,000",
      payables: "$45,000",
      cashBalance: "$260,000",
      bankBalance: "$210,000",
      taxPayables: "$30,000"
    },
    checklist: [
      { id: 1, title: "Initialize Shared Memory Store", completed: true },
      { id: 2, title: "Hire Lead Operations Orchestrator AI", completed: true },
      { id: 3, title: "Set Up Maker-Checker Approval Gate", completed: true },
      { id: 4, title: "Configure Executive Notification Triage", completed: true },
      { id: 5, title: "Set Up Cross-Department Event Bus", completed: false },
      { id: 6, title: "Configure Automated System Backups", completed: false },
      { id: 7, title: "Verify Hierarchy Reporting Tree", completed: false },
      { id: 8, title: "Enable SOX Compliance Audit Logging", completed: false }
    ],
    keywords: ["ops", "lead", "orchestrator", "research", "analyst", "data", "executive", "admin"]
  }
];

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDept = searchParams?.get("dept") || "finance";
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly" | "Quarterly">("Weekly");
  const [activeTab, setActiveTab] = useState<"dashboard" | "workspace" | "workforce">("dashboard");
  const [deptChecklist, setDeptChecklist] = useState<{ id: number; title: string; completed: boolean }[]>([]);

  // Directive Dispatcher Modal State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [directivePrompt, setDirectivePrompt] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const { data: rawAgents } = useAgents();
  const { setSelectedAgentId } = useAppStore();

  const agents = rawAgents || [];
  const currentDept = DEPARTMENTS.find(d => d.id === selectedDeptId) || DEPARTMENTS[0];

  useEffect(() => {
    const dept = searchParams?.get("dept");
    if (dept && DEPARTMENTS.some(d => d.id === dept)) {
      setSelectedDeptId(dept);
    }
  }, [searchParams]);

  useEffect(() => {
    setDeptChecklist(currentDept.checklist);
  }, [currentDept]);

  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    router.replace(`/departments?dept=${deptId}`);
  };

  const toggleChecklistItem = (id: number) => {
    setDeptChecklist(prev =>
      prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    );
  };

  const getDeptAgents = (dept: DepartmentMeta) => {
    return agents.filter((a: any) => {
      const roleStr = `${a.role || ""} ${a.name || ""}`.toLowerCase();
      return dept.keywords.some(k => roleStr.includes(k));
    });
  };

  const currentDeptAgents = getDeptAgents(currentDept);
  const completedTasksCount = deptChecklist.filter(c => c.completed).length;
  const DeptIcon = currentDept.icon;

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

  return (
    <div className="space-y-6 pb-20 text-slate-100 font-sans">
      {/* 1. MUNIM-INSPIRED SaaS TOP BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Company:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => handleSelectDept(e.target.value)}
              className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer"
            >
              {DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department Units:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {DEPARTMENTS.map(dept => {
                const isSelected = dept.id === selectedDeptId;
                return (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDept(dept.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <dept.icon className="w-3.5 h-3.5" />
                    <span>{dept.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Cadence:</span>
            <select
              value={timeframe}
              onChange={(e: any) => setTimeframe(e.target.value)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Weekly" className="bg-slate-900 text-white">Weekly</option>
              <option value="Monthly" className="bg-slate-900 text-white">Monthly</option>
              <option value="Quarterly" className="bg-slate-900 text-white">Quarterly</option>
            </select>
          </div>

          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg transition active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Prompt Department</span>
          </button>
        </div>
      </div>

      {/* VIEW MODES TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "dashboard"
                ? "bg-slate-900 text-white border border-slate-700 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Department Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workspace"
                ? "bg-slate-900 text-white border border-slate-700 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Domain Workspace & Tools</span>
          </button>

          <button
            onClick={() => setActiveTab("workforce")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "workforce"
                ? "bg-slate-900 text-white border border-slate-700 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Assigned AI Fleet ({currentDeptAgents.length})</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          {currentDept.name} Overview
        </span>
      </div>

      {/* 2. MAIN 2-COLUMN MUNIM DASHBOARD LAYOUT */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLUMNS: METRICS, PULSES, PROJECTIONS, INFLOW, ANALYTICS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* WIDGET 1: GROWTH PULSES (3 LARGE COLORED KPI CARDS) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Growth Pulses</span>
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">{timeframe} Telemetry</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CARD 1: TOTAL INCOME / OUTPUT (CYAN) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/90 border border-cyan-500/30 relative overflow-hidden shadow-lg group">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Income</p>
                      <h4 className="text-2xl font-black text-white font-mono mt-0.5">{currentDept.pulses.income}</h4>
                    </div>
                  </div>
                  <Wallet className="w-24 h-24 text-cyan-500/5 absolute -right-4 -bottom-4 pointer-events-none group-hover:scale-110 transition duration-300" />
                </div>

                {/* CARD 2: TOTAL EXPENSES / BURN (ROSE/PINK) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-900/90 border border-rose-500/30 relative overflow-hidden shadow-lg group">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-inner">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                      <h4 className="text-2xl font-black text-white font-mono mt-0.5">{currentDept.pulses.expenses}</h4>
                    </div>
                  </div>
                  <Receipt className="w-24 h-24 text-rose-500/5 absolute -right-4 -bottom-4 pointer-events-none group-hover:scale-110 transition duration-300" />
                </div>

                {/* CARD 3: NET PROFIT / GAIN (EMERALD) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/30 relative overflow-hidden shadow-lg group">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                      <h4 className="text-2xl font-black text-white font-mono mt-0.5">{currentDept.pulses.profit}</h4>
                    </div>
                  </div>
                  <TrendingUp className="w-24 h-24 text-emerald-500/5 absolute -right-4 -bottom-4 pointer-events-none group-hover:scale-110 transition duration-300" />
                </div>
              </div>
            </div>

            {/* WIDGET 2: REVENUE PROJECTION (3 WHITE/DARK METRIC CARDS WITH TREND PILLS) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Revenue Projection & Department Variance</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* CARD 1: RECEIVABLES */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center gap-1 border border-emerald-500/20">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{currentDept.metrics.receivablePct}</span>
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white font-mono mt-2">{currentDept.metrics.receivable}</h4>
                    <p className="text-[11px] text-slate-400">Total Receivable Amount</p>
                  </div>
                </div>

                {/* CARD 2: PAYABLES */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-xs flex items-center gap-1 border border-rose-500/20">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>{currentDept.metrics.payablePct}</span>
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white font-mono mt-2">{currentDept.metrics.payable}</h4>
                    <p className="text-[11px] text-slate-400">Total Payable Amount</p>
                  </div>
                </div>

                {/* CARD 3: PENDING RECEIPTS */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center gap-1 border border-blue-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentDept.metrics.pendingPct}</span>
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white font-mono mt-2">{currentDept.metrics.pending}</h4>
                    <p className="text-[11px] text-slate-400">Long Time Pending Receipts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 3: REVENUE INFLOW (6 CIRCULAR ICON AVATAR CARDS GRID) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>Revenue Inflow & Department Balances</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Cash Collected */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.cashCollected}</h4>
                    <p className="text-[11px] text-slate-400">Total Cash Collected</p>
                  </div>
                </div>

                {/* 2. Collection In Bank */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.bankCollection}</h4>
                    <p className="text-[11px] text-slate-400">Total Collection In Bank</p>
                  </div>
                </div>

                {/* 3. Unavoidable Payables */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.payables}</h4>
                    <p className="text-[11px] text-slate-400">Unavoidable Payables</p>
                  </div>
                </div>

                {/* 4. Total Cash Balance */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.cashBalance}</h4>
                    <p className="text-[11px] text-slate-400">Total Cash Balance</p>
                  </div>
                </div>

                {/* 5. Total Bank Balance */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.bankBalance}</h4>
                    <p className="text-[11px] text-slate-400">Total Bank Balance</p>
                  </div>
                </div>

                {/* 6. Tax Payables */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{currentDept.inflow.taxPayables}</h4>
                    <p className="text-[11px] text-slate-400">Tax Payables (SOX)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 4: SPLIT ROW (SALE/PURCHASE & DONUT CHART ANALYTICS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT SUMMARY: SALE & PURCHASE / DIRECTIVES SUMMARY */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Department Directives & Output
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Weekly</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-slate-400">Total Output</p>
                    <h4 className="text-lg font-bold text-white font-mono mt-0.5">$200,000</h4>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit mb-2">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-slate-400">Total Burn</p>
                    <h4 className="text-lg font-bold text-white font-mono mt-0.5">$150,000</h4>
                  </div>
                </div>
              </div>

              {/* RIGHT DONUT CHART: DEPARTMENT ANALYTICS */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                    <span>Department Analytics</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Budget Allocation</span>
                </div>

                <div className="flex items-center justify-around gap-4">
                  {/* SVG Donut Chart Inspired by Munim */}
                  <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray="45, 100"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-cyan-400"
                        strokeDasharray="30, 100"
                        strokeDashoffset="-45"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-400"
                        strokeDasharray="15, 100"
                        strokeDashoffset="-75"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Share</span>
                      <span className="text-xs font-black text-white font-mono">45.9%</span>
                    </div>
                  </div>

                  {/* Legend List */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 font-medium">Accounting (45.96%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="text-slate-300 font-medium">Marketing (35.96%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <span className="text-slate-300 font-medium">Engineering (25.96%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <span className="text-slate-300 font-medium">Operations (10.96%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: MUNIM-INSPIRED SETUP GUIDE & SUPPORT PANELS */}
          <div className="lg:col-span-4 space-y-6">

            {/* WIDGET A: SETUP GUIDE & CHECKLIST (DIRECT MUNIM INSPIRED) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>{currentDept.shortName} Setup Guide</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                    {completedTasksCount}/{deptChecklist.length} Complete
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Get started by completing the department configuration tasks below.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${(completedTasksCount / deptChecklist.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-right font-medium">
                  Setup progress {completedTasksCount} to {deptChecklist.length} tasks complete
                </p>
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                {deptChecklist.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleChecklistItem(task.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center gap-2.5 ${
                      task.completed
                        ? "bg-slate-950/60 text-slate-400 line-through border border-slate-800/60"
                        : "bg-slate-950 text-slate-200 hover:bg-slate-800/80 border border-slate-800"
                    }`}
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="font-medium line-clamp-1">{task.id}. {task.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* WIDGET B: CONTACT SUPPORT & AI HELP BUTTONS */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Department AI Support
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  We're always happy to help! Reach out anytime.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Book Demo</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Chat</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Us</span>
                </button>

                <button className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Help Center</span>
                </button>
              </div>
            </div>

            {/* WIDGET C: VIBRANT BLUE PROMO / REFERRAL BANNER (EXACT MATCH TO MUNIM BOTTOM RIGHT BANNER) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 border border-blue-400/30 text-white space-y-3 shadow-2xl relative overflow-hidden">
              <Gift className="w-20 h-20 text-white/10 absolute -right-3 -bottom-3 pointer-events-none" />
              <h4 className="text-base font-extrabold leading-snug">
                Scale your autonomous workforce & earn 10% token bonus
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Invite team members or add autonomous agents to your department to unlock higher authority limits and priority processing.
              </p>
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-slate-100 text-xs font-extrabold shadow-lg transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Get Invite Link</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-900" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. WORKSPACE TAB (CHART OF ACCOUNTS FOR FINANCE, ETC.) */}
      {activeTab === "workspace" && (
        <div className="space-y-6">
          {selectedDeptId === "finance" && <ChartOfAccountsSheet />}
          {selectedDeptId !== "finance" && (
            <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">{currentDept.name} Workspace</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Connected tools, domain memory, and autonomous task logs for {currentDept.name}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. WORKFORCE TAB */}
      {activeTab === "workforce" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDeptAgents.length === 0 ? (
            <div className="col-span-full p-10 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-3">
              <Bot className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">No autonomous workers assigned yet</h4>
              <Link
                href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Hire First {currentDept.shortName} Worker</span>
              </Link>
            </div>
          ) : (
            currentDeptAgents.map((agent: any) => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{agent.name || "AI Worker"}</h4>
                    <p className="text-xs text-slate-400">{agent.role || "Specialist"}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status: <strong className="text-emerald-400">{agent.status || "Idle"}</strong></span>
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="text-indigo-400 font-bold hover:underline"
                  >
                    View Agent
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
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <DeptIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Prompt {currentDept.shortName} Workforce
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch an autonomous objective directly to your AI workers.
                  </p>
                </div>
              </div>

              {dispatchSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Directive Dispatched Successfully!</h4>
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
                      placeholder={`e.g. Run weekly audit on all ledger accounts...`}
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
