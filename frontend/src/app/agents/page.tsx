"use client";

import { useState } from "react";
import { useAgents, useMetrics, useUpdateAgentStatus } from "@/lib/queries";
import { AgentStatus } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function AgentsPage() {
  const { data: agents, isLoading: isLoadingAgents, error: agentsError, refetch } = useAgents();
  const { data: metrics } = useMetrics();
  const updateStatus = useUpdateAgentStatus();
  const { setSelectedAgentId } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  if (isLoadingAgents && !agents) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-200">Loading AI Workforce Directory...</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = (e: React.MouseEvent, workerId: string, currentStatus: AgentStatus) => {
    e.stopPropagation();
    let newStatus: AgentStatus = "Paused";
    if (currentStatus === "Paused") newStatus = "Running";
    updateStatus.mutate({ id: workerId, status: newStatus });
  };

  const handleKill = (e: React.MouseEvent, workerId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to terminate this AI Worker?")) {
      updateStatus.mutate({ id: workerId, status: "Failed" });
    }
  };

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

  const filteredAgents = (agents || []).filter((agent: any) => {
    const matchesSearch = 
      (agent.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedRoleFilter === "all") return true;
    return (agent.role || "").toLowerCase().includes(selectedRoleFilter.toLowerCase());
  });

  const rolesList = Array.from(new Set((agents || []).map((a: any) => a.role || "General")));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workforce Control
              </span>
              <span className="text-xs text-slate-400 font-mono">{agents?.length || 0} Registered Units</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              AI Autonomous Workforce
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Command, inspect memory states, modify prompt personas, and monitor autonomous worker execution.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => refetch()}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Refresh roster"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
            <a 
              href="/hire" 
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Recruit AI Worker
            </a>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Fleet</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-400">{metrics?.activeAgents || 0}</span>
            <p className="text-xs text-slate-400 mt-1">Workers actively executing operations</p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Deployed</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-lg">groups</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-100">{agents?.length || metrics?.totalAgents || 0}</span>
            <p className="text-xs text-slate-400 mt-1">Autonomous specialists available</p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Finished Missions</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-lg">task_alt</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-100">{metrics?.completedTasks || 0}</span>
            <p className="text-xs text-slate-400 mt-1">Missions successfully verified</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers by name, role, or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                selectedRoleFilter === 'all' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              All Roles ({agents?.length || 0})
            </button>
            {rolesList.map((r: string) => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                  selectedRoleFilter === r 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-lg">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workers Content Grid / Table */}
      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-4xl">groups</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No AI Workers in Fleet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">Recruit autonomous workers to start running decentralized tasks and missions.</p>
          </div>
          <a href="/hire" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/25">
            Recruit First AI Worker
          </a>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-slate-400 opacity-50">search_off</span>
          <p className="text-sm font-bold text-slate-200">No matching AI Workers found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((worker: any) => {
            const roleIcon = getRoleIcon(worker.role);
            const roleStyle = getRoleColor(worker.role);

            return (
              <div 
                key={worker.id} 
                onClick={() => setSelectedAgentId(worker.id)}
                className="group cursor-pointer bento-card p-6 flex flex-col justify-between gap-5 relative hover:border-slate-700/90"
              >
                <div>
                  {/* Top Bar: Icon + Name + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleStyle} flex items-center justify-center shrink-0 border shadow-inner`}>
                        <span className="material-symbols-outlined text-2xl">{roleIcon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                          {worker.name}
                        </h3>
                        <span className="text-xs text-slate-400 capitalize font-medium">
                          {worker.role || "Specialist"}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0
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

                  {/* Worker Metadata Box */}
                  <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Worker UID:</span>
                      <span className="font-mono font-semibold text-slate-300">{worker.id.slice(0, 12)}...</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Persona Model:</span>
                      <span className="text-slate-300">{worker.system_prompt ? 'Specialized' : 'Standard'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs text-emerald-400/90 font-semibold group-hover:text-emerald-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">tune</span>
                    Inspect Telemetry
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleStatusChange(e, worker.id, worker.status)}
                      disabled={worker.status === 'Failed'}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                      title={worker.status === 'Paused' ? 'Resume Worker' : 'Pause Worker'}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {worker.status === 'Paused' ? 'play_arrow' : 'pause'}
                      </span>
                      {worker.status === 'Paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button 
                      onClick={(e) => handleKill(e, worker.id)}
                      disabled={worker.status === 'Failed'}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                      title="Terminate Worker"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold">
                  <th className="p-4">AI Worker</th>
                  <th className="p-4">Specialized Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Worker ID</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAgents.map((worker: any) => (
                  <tr 
                    key={worker.id} 
                    onClick={() => setSelectedAgentId(worker.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-xs font-bold text-slate-100 flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400 text-lg">{getRoleIcon(worker.role)}</span>
                      {worker.name}
                    </td>
                    <td className="p-4 text-xs text-slate-300 capitalize">
                      {worker.role}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
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
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {worker.id.slice(0, 10)}...
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleStatusChange(e, worker.id, worker.status)}
                        disabled={worker.status === 'Failed'}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                        title={worker.status === 'Paused' ? 'Resume' : 'Pause'}
                      >
                        <span className="material-symbols-outlined text-base">
                          {worker.status === 'Paused' ? 'play_arrow' : 'pause'}
                        </span>
                      </button>
                      <button 
                        onClick={(e) => handleKill(e, worker.id)}
                        disabled={worker.status === 'Failed'}
                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                        title="Terminate"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

