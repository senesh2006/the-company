"use client";

import { useMetrics, useAgents, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";

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
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-lg">hub</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200">Connecting to Company OS</p>
            <p className="text-xs text-slate-400 mt-1">Initializing AI Autonomous Workforce Control Plane...</p>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("marketing") || r.includes("growth")) return "campaign";
    if (r.includes("finance") || r.includes("accountant") || r.includes("analyst")) return "account_balance";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "terminal";
    if (r.includes("research") || r.includes("data")) return "psychology";
    if (r.includes("writer") || r.includes("content") || r.includes("copy")) return "edit_note";
    if (r.includes("supervisor") || r.includes("lead") || r.includes("manager")) return "shield_person";
    return "smart_toy";
  };

  const getRoleColor = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30";
    if (r.includes("marketing") || r.includes("growth")) return "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30";
    if (r.includes("finance") || r.includes("analyst")) return "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30";
    if (r.includes("research")) return "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30";
    return "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30";
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "just now";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch {
      return "recently";
    }
  };

  const totalWorkers = agents?.length ?? metrics?.totalAgents ?? 0;
  const activeWorkers = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length ?? metrics?.activeAgents ?? 0;
  const completedTasks = metrics?.completedTasks ?? tasks?.filter(t => t.status === 'completed').length ?? 0;
  const recentTasks = (tasks || []).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      {/* Executive Command Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                System Operational
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {metrics?.businessId ? metrics.businessId.slice(0, 8) + '...' : 'CORP-HQ-01'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Workforce Operations Plane
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time telemetry, automated task execution queues, and autonomous worker management across the enterprise.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/hire"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Recruit AI Worker
            </a>
            <a
              href="/tasks"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-slate-400">tune</span>
              Operations
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
              <span className="text-xs text-emerald-400 font-semibold font-mono">100% Deployed</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Autonomous AI specialists</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (totalWorkers / 10) * 100)}%` }}></div>
          </div>
        </div>

        {/* Active Workforce */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Executions</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">sync</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{activeWorkers}</span>
              <span className="text-xs text-slate-400 font-mono">/ {totalWorkers} online</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Currently processing operations</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: totalWorkers > 0 ? `${(activeWorkers / totalWorkers) * 100}%` : '0%' }}></div>
          </div>
        </div>

        {/* Completed Operations */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Missions</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">{completedTasks}</span>
              <span className="text-xs text-cyan-400 font-semibold font-mono">99.4% Pass</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Verified task outputs</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* System Risk & Cost */}
        <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Cost & Risk</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100">${metrics?.totalCost?.toFixed(2) || "0.00"}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {metrics?.riskLevel ?? 'Optimal'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Operational expenditure</p>
          </div>
          <div className="mt-4 w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Workforce Fleet (2 cols) & Operations Telemetry (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deployed AI Workforce Fleet */}
        <div className="lg:col-span-2 bento-card p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400">badge</span>
                Deployed AI Workforce
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {agents?.length || 0}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Click any worker card to inspect memory, tools, and telemetry</p>
            </div>
            <a 
              href="/agents" 
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
            >
              Directory & Controls
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {!agents || agents.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
                  <span className="material-symbols-outlined text-3xl">smart_toy</span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">No AI Workers in Fleet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Recruit autonomous workers specialized in research, software development, finance, and marketing.</p>
                <a 
                  href="/hire" 
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
                >
                  Recruit First AI Worker
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
                {agents.map((worker) => {
                  const roleStyle = getRoleColor(worker.role);
                  return (
                    <div 
                      key={worker.id}
                      onClick={() => setSelectedAgentId(worker.id)}
                      className="group cursor-pointer p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleStyle} flex items-center justify-center shrink-0 border`}>
                            <span className="material-symbols-outlined text-xl">{getRoleIcon(worker.role)}</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                              {worker.name}
                            </h3>
                            <p className="text-xs text-slate-400 capitalize font-medium">{worker.role || "General Specialist"}</p>
                          </div>
                        </div>
                        
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border
                          ${worker.status?.toLowerCase() === 'running' || worker.status?.toLowerCase() === 'active' || worker.status?.toLowerCase() === 'idle'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : worker.status?.toLowerCase() === 'busy'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : worker.status?.toLowerCase() === 'paused'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            worker.status?.toLowerCase() === 'running' || worker.status?.toLowerCase() === 'busy' ? 'bg-cyan-400 animate-pulse' :
                            worker.status?.toLowerCase() === 'idle' ? 'bg-emerald-400' :
                            worker.status?.toLowerCase() === 'paused' ? 'bg-amber-400' : 'bg-rose-400'
                          }`}></span>
                          {worker.status || 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="material-symbols-outlined text-xs text-slate-400">psychology</span>
                          {worker.system_prompt ? 'Custom Persona' : 'Default Model'}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-400/90 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Inspect <span className="material-symbols-outlined text-xs">chevron_right</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Operations & Quick Control Console */}
        <div className="flex flex-col gap-6">
          {/* Recent Operations Activity */}
          <div className="bento-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">dynamic_feed</span>
                Live Mission Activity
              </h2>
              <a href="/tasks" className="text-xs text-slate-400 hover:text-slate-200">
                View All &rarr;
              </a>
            </div>

            <div className="flex flex-col gap-2.5">
              {recentTasks.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                  <span className="material-symbols-outlined text-2xl text-slate-400 mb-1">assignment_turned_in</span>
                  <p className="text-xs text-slate-400">No operations executed yet.</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        task.status === 'running' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        task.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {task.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{getRelativeTime(task.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">{task.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Fleet Actions */}
          <div className="bento-card p-6 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fleet Control Hub</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <a 
                href="/hire"
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <span className="material-symbols-outlined text-emerald-400 text-lg group-hover:scale-110 transition-transform">person_add</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">Recruit Worker</p>
                <p className="text-[10px] text-slate-400">Deploy new agent</p>
              </a>
              <a 
                href="/approvals"
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <span className="material-symbols-outlined text-amber-400 text-lg group-hover:scale-110 transition-transform">policy</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">Governance</p>
                <p className="text-[10px] text-slate-400">Review escalations</p>
              </a>
              <a 
                href="/memory"
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <span className="material-symbols-outlined text-cyan-400 text-lg group-hover:scale-110 transition-transform">database</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">Shared State</p>
                <p className="text-[10px] text-slate-400">Global memory</p>
              </a>
              <a 
                href="/hierarchy"
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <span className="material-symbols-outlined text-indigo-400 text-lg group-hover:scale-110 transition-transform">account_tree</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">Org Tree</p>
                <p className="text-[10px] text-slate-400">Role hierarchy</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

