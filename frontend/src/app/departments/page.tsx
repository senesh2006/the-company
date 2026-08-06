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
  ExternalLink
} from "lucide-react";
import { useAgents, useMetrics, useFinanceAccounts } from "@/lib/queries";
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
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      gradient: "from-emerald-950/40 via-slate-900/60 to-slate-950/80"
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
      border: "border-cyan-500/20",
      text: "text-cyan-400",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      gradient: "from-cyan-950/40 via-slate-900/60 to-slate-950/80"
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
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      gradient: "from-indigo-950/40 via-slate-900/60 to-slate-950/80"
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
      border: "border-purple-500/20",
      text: "text-purple-400",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      gradient: "from-purple-950/40 via-slate-900/60 to-slate-950/80"
    },
    keywords: ["ops", "lead", "orchestrator", "research", "analyst", "data", "executive", "admin"]
  }
];

function DepartmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDept = searchParams?.get("dept") || "finance";
  
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDept);
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
  const DeptIcon = currentDept.icon;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header with Breadcrumb & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Company Organization</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200">Departments & AI Workforces</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Departments & Autonomous Teams
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Functional business units powered by specialized AI workers, shared memory, and domain tools.
          </p>
        </div>

        {/* Recruit Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/hire"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Recruit AI Worker</span>
          </Link>
        </div>
      </div>

      {/* 2. Department Selector Tabs (Pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DEPARTMENTS.map((dept) => {
          const isSelected = dept.id === selectedDeptId;
          const deptAgents = getDeptAgents(dept);
          const activeCount = deptAgents.filter(a => a.status === 'Running' || a.status === 'Idle').length;
          const Icon = dept.icon;

          return (
            <button
              key={dept.id}
              onClick={() => handleSelectDept(dept.id)}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group ${
                isSelected
                  ? `bg-slate-900/90 border-slate-700 ring-2 ring-indigo-500/40 shadow-xl`
                  : `bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${dept.color.bg} ${dept.color.text} border ${dept.color.border}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dept.color.badge}`}>
                  {deptAgents.length} {deptAgents.length === 1 ? 'Worker' : 'Workers'}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                  {dept.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {activeCount} active in fleet
                </p>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="activeDeptBorder"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-cyan-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Selected Department Hero & AI Workers Section */}
      <div className={`rounded-3xl border ${currentDept.color.border} bg-gradient-to-b ${currentDept.color.gradient} p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${currentDept.color.bg} ${currentDept.color.text} border ${currentDept.color.border} shadow-inner`}>
              <DeptIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {currentDept.name} Department
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentDept.color.badge}`}>
                  Autonomous Unit
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentDept.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Hire {currentDept.shortName} Specialist</span>
            </Link>
          </div>
        </div>

        {/* Assigned Workers Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Assigned AI Workforce ({currentDeptAgents.length})
              </h3>
            </div>
            <Link
              href="/agents"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Manage all agents</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {currentDeptAgents.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
              <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                No dedicated AI workers currently assigned to {currentDept.name}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                You can hire specialized autonomous agents to manage this department.
              </p>
              <div className="mt-4">
                <Link
                  href={`/hire?department=${encodeURIComponent(currentDept.name)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Hire First {currentDept.shortName} Worker</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDeptAgents.map((agent: any) => {
                const isRunning = agent.status === "Running";
                const isIdle = agent.status === "Idle";

                return (
                  <div
                    key={agent.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition group relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200">
                            <Bot className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                              {agent.name || "AI Worker"}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {agent.role || "Specialist"}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
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

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Objective</p>
                        <p className="text-xs text-slate-300 truncate mt-0.5">
                          {agent.current_task_title || "Standby for founder directives"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Cost Today: <span className="font-mono text-slate-200">${(agent.cost_today_usd ?? 0).toFixed(2)}</span>
                      </span>
                      <button
                        onClick={() => setSelectedAgentId(agent.id)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>Directives</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Department Workspace & Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DeptIcon className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {currentDept.name} Workspace & Domain Tools
            </h2>
          </div>
          <span className="text-xs text-slate-500">Live Department Data & Operations</span>
        </div>

        {/* SPECIFIC WORKSPACE BY DEPARTMENT */}
        {selectedDeptId === "finance" && (
          <div className="space-y-6">
            {/* The Full Interactive Chart of Accounts & General Ledger component */}
            <ChartOfAccountsSheet />
          </div>
        )}

        {selectedDeptId === "marketing" && (
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Growth & Campaign Intelligence</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Marketing AI Workers autonomously execute search, social copywriting, and multi-channel demand generation.
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Launch Marketing Task</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Target Channels</span>
                <p className="text-lg font-bold text-white mt-1">LinkedIn, X / Twitter, SEO</p>
                <p className="text-[11px] text-slate-500 mt-1">Managed by AI Agents</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Connected Integrations</span>
                <p className="text-lg font-bold text-cyan-400 mt-1">Notion, Perplexity Search</p>
                <p className="text-[11px] text-slate-500 mt-1">Live MCP Tools Active</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Content Pipeline</span>
                <p className="text-lg font-bold text-white mt-1">Maker-Checker Reviewed</p>
                <p className="text-[11px] text-slate-500 mt-1">SOX & Quality Guardrails</p>
              </div>
            </div>
          </div>
        )}

        {selectedDeptId === "engineering" && (
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Engineering Workspace & Repository</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Autonomous coding agents generate, inspect, and test pull requests with full test validation.
                </p>
              </div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Code Objective</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Active CI/CD Pipeline</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">Railway & GitHub Actions</p>
                <p className="text-[11px] text-slate-500 mt-1">Continuous Deployment</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Runtime Tools</span>
                <p className="text-lg font-bold text-indigo-400 mt-1">Git, Terminal, PyTest</p>
                <p className="text-[11px] text-slate-500 mt-1">Subprocess Sandbox</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Architecture State</span>
                <p className="text-lg font-bold text-white mt-1">Next.js + FastAPI + Postgres</p>
                <p className="text-[11px] text-slate-500 mt-1">Full-stack Autonomous Fleet</p>
              </div>
            </div>
          </div>
        )}

        {selectedDeptId === "operations" && (
          <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Operations & Executive Governance</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Cross-department orchestration, strategic planning, human approval gates, and organizational monitoring.
                </p>
              </div>
              <Link
                href="/approvals"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review Approvals</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Executive Approvals</span>
                <p className="text-lg font-bold text-amber-400 mt-1">Maker-Checker Policy</p>
                <p className="text-[11px] text-slate-500 mt-1">Human-in-the-Loop Threshold</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Organizational Hierarchy</span>
                <p className="text-lg font-bold text-purple-400 mt-1">Reporting Structure</p>
                <p className="text-[11px] text-slate-500 mt-1">Live in /hierarchy</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Shared Memory Store</span>
                <p className="text-lg font-bold text-white mt-1">Postgres JSONB / Supabase</p>
                <p className="text-[11px] text-slate-500 mt-1">Durable Key-Value State</p>
              </div>
            </div>
          </div>
        )}
      </div>
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

