"use client";

import { useMetrics, useAgents, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { CompanyFeed } from "@/components/CompanyFeed";
import { TrustTier } from "@/lib/api";

export default function DashboardPage() {
  const { data: metrics } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading } = useAgents();
  const { data: tasks, isLoading: isTasksLoading } = useTasks();
  const { setSelectedAgentId } = useAppStore();

  if (isAgentsLoading && !agents) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-slate-200 backdrop-blur-xl shadow-lg">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-lg">hub</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-800">Connecting to Company OS v6.0</p>
            <p className="text-xs text-slate-500 mt-1">Initializing Governed AI Autonomous Workforce...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("marketing") || r.includes("growth") || r.includes("social")) return "campaign";
    if (r.includes("finance") || r.includes("accountant") || r.includes("analyst")) return "account_balance";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "terminal";
    if (r.includes("research") || r.includes("data")) return "psychology";
    if (r.includes("admin") || r.includes("ops")) return "inbox";
    if (r.includes("supervisor") || r.includes("lead") || r.includes("manager") || r.includes("robin")) return "shield_person";
    return "smart_toy";
  };

  const getRoleColor = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "from-cyan-50 to-blue-50 text-cyan-700 border-cyan-200";
    if (r.includes("marketing") || r.includes("growth") || r.includes("social")) return "from-purple-50 to-pink-50 text-purple-700 border-purple-200";
    if (r.includes("finance") || r.includes("accountant")) return "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200";
    if (r.includes("research")) return "from-amber-50 to-orange-50 text-amber-700 border-amber-200";
    if (r.includes("admin") || r.includes("ops")) return "from-blue-50 to-indigo-50 text-blue-700 border-blue-200";
    return "from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200";
  };

  const totalWorkers = agents?.length ?? metrics?.totalAgents ?? 0;
  const activeWorkers = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length ?? metrics?.activeAgents ?? 0;
  const completedTasks = metrics?.completedTasks ?? tasks?.filter(t => t.status === 'completed').length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Executive Command Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Company OS v6.0 Active
              </span>
              <span className="text-xs text-emerald-100 font-mono">Robin Coordinating Agent</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Workforce Operations Plane
            </h1>
            <p className="text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Command decentralized specialized AI workers, review tiered authority escalations (Observe, Assist, Operate), and monitor live company execution.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/hire"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-900 text-xs font-bold shadow-md transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-lg text-emerald-700">person_add</span>
              Recruit AI Worker
            </a>
            <a
              href="/agents"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-emerald-200">tune</span>
              Workforce Fleet
            </a>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Workforce */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Workforce</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{totalWorkers}</span>
              <span className="text-xs text-indigo-600 font-semibold font-mono">Specialists</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Governed AI Workers</p>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (totalWorkers / 10) * 100)}%` }}></div>
          </div>
        </div>

        {/* Active Workforce */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Executions</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">sync</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-700">{activeWorkers}</span>
              <span className="text-xs text-slate-500 font-mono">/ {totalWorkers} online</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Autonomous worker cycles</p>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-600 h-full rounded-full" style={{ width: totalWorkers > 0 ? `${(activeWorkers / totalWorkers) * 100}%` : '0%' }}></div>
          </div>
        </div>

        {/* Completed Operations */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Mandates</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{completedTasks}</span>
              <span className="text-xs text-emerald-700 font-semibold font-mono">Clean Cycles</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Verified audit records</p>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>

        {/* Fleet Cost & Risk */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Governance & Risk</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">Observe</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Gated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Earned Trust Protocol active</p>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Company Feed Section */}
      <CompanyFeed />

      {/* Workforce Overview Grid */}
      <div className="bento-card p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600">badge</span>
              Active AI Workforce Fleet
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200 font-semibold">
                {agents?.length || 0}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any worker card to inspect trust tier, authority limits, and neural state</p>
          </div>
          <a 
            href="/agents" 
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-all"
          >
            Workforce Directory
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents || []).map((worker) => {
            const roleStyle = getRoleColor(worker.role);
            const tier = (worker.trust_tier || "observe") as TrustTier;
            return (
              <div 
                key={worker.id}
                onClick={() => setSelectedAgentId(worker.id)}
                className="group cursor-pointer p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-emerald-500/50 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleStyle} flex items-center justify-center shrink-0 border`}>
                      <span className="material-symbols-outlined text-xl">{getRoleIcon(worker.role)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {worker.name}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize font-medium">{worker.role || "Specialist"}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    tier === 'operate' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    tier === 'assist' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {tier}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                    {worker.clean_cycles_count || 0} clean cycles
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Inspect <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
