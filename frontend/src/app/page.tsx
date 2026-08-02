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
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 text-lg">hub</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">Connecting to Company OS v6.0</p>
            <p className="text-xs text-slate-400 mt-1">Initializing Governed AI Autonomous Workforce...</p>
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
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30";
    if (r.includes("marketing") || r.includes("growth") || r.includes("social")) return "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30";
    if (r.includes("finance") || r.includes("accountant")) return "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30";
    if (r.includes("research")) return "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30";
    if (r.includes("admin") || r.includes("ops")) return "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30";
    return "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30";
  };

  const totalWorkers = agents?.length ?? metrics?.totalAgents ?? 0;
  const activeWorkers = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length ?? metrics?.activeAgents ?? 0;
  const completedTasks = metrics?.completedTasks ?? tasks?.filter(t => t.status === 'completed').length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Executive Command Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Company OS v6.0 Active
              </span>
              <span className="text-xs text-slate-400 font-mono">Robin Coordinating Agent</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Workforce Operations Plane
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Command decentralized specialized AI workers, review tiered authority escalations (Observe, Assist, Operate), and monitor live company execution.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/hire"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Recruit AI Worker
            </a>
            <a
              href="/agents"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-cyan-400">tune</span>
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">groups</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">{totalWorkers}</span>
              <span className="text-xs text-cyan-400 font-semibold font-mono">Specialists</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Governed AI Workers</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalWorkers / 10) * 100)}%` }}></div>
          </div>
        </div>

        {/* Active Workforce */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Executions</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">sync</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-cyan-400">{activeWorkers}</span>
              <span className="text-xs text-slate-400 font-mono">/ {totalWorkers} online</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Autonomous worker cycles</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: totalWorkers > 0 ? `${(activeWorkers / totalWorkers) * 100}%` : '0%' }}></div>
          </div>
        </div>

        {/* Completed Operations */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Mandates</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">{completedTasks}</span>
              <span className="text-xs text-emerald-400 font-semibold font-mono">Clean Cycles</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Verified audit records</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>

        {/* Fleet Cost & Risk */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Governance & Risk</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">Observe</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Gated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Earned Trust Protocol active</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Company Feed Section (PRD v6.0 §4.2 & §6.2) */}
      <CompanyFeed />

      {/* Workforce Overview Grid */}
      <div className="bento-card p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-cyan-400">badge</span>
              Active AI Workforce Fleet
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {agents?.length || 0}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any worker card to inspect trust tier, authority limits, and neural state</p>
          </div>
          <a 
            href="/agents" 
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all"
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
                className="group cursor-pointer p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleStyle} flex items-center justify-center shrink-0 border`}>
                      <span className="material-symbols-outlined text-xl">{getRoleIcon(worker.role)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {worker.name}
                      </h3>
                      <p className="text-xs text-slate-400 capitalize font-medium">{worker.role || "Specialist"}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                    tier === 'operate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    tier === 'assist' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {tier}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                  <span className="font-mono text-[11px] text-cyan-400">
                    {worker.clean_cycles_count || 0} clean cycles
                  </span>
                  <span className="text-[11px] font-medium text-cyan-400/90 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
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
