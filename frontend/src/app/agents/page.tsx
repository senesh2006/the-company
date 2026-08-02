"use client";

import { useState } from "react";
import { useAgents, useMetrics, useUpdateAgentStatus } from "@/lib/queries";
import { AgentStatus, TrustTier } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function AgentsPage() {
  const { data: agents, isLoading: isLoadingAgents, error: agentsError, refetch } = useAgents();
  const { data: metrics } = useMetrics();
  const updateStatus = useUpdateAgentStatus();
  const { setSelectedAgentId } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  if (isLoadingAgents && !agents) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
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
    if (r.includes("marketing") || r.includes("growth") || r.includes("social")) return "campaign";
    if (r.includes("finance") || r.includes("accountant") || r.includes("analyst")) return "account_balance";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "terminal";
    if (r.includes("research") || r.includes("data")) return "psychology";
    if (r.includes("admin") || r.includes("ops") || r.includes("operations")) return "inbox";
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

  const filteredAgents = (agents || []).filter((agent: any) => {
    const matchesSearch = 
      (agent.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedRoleFilter !== "all" && !(agent.role || "").toLowerCase().includes(selectedRoleFilter.toLowerCase())) return false;
    if (selectedTierFilter !== "all" && (agent.trust_tier || "observe") !== selectedTierFilter) return false;
    return true;
  });

  const rolesList = Array.from(new Set((agents || []).map((a: any) => a.role || "General")));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Workforce Control v6.0
              </span>
              <span className="text-xs text-slate-400 font-mono">{agents?.length || 0} AI Workers Governed</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              AI Autonomous Workforce
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Command decentralized specialized AI workers, inspect earned trust tiers (Observe, Assist, Operate), modify prompt personas, and monitor live audit trails.
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
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Recruit AI Worker
            </a>
          </div>
        </div>
      </header>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, role, specialization..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur-md"
            />
          </div>

          {/* Role Filter */}
          <select 
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 backdrop-blur-md cursor-pointer"
          >
            <option value="all">All Roles</option>
            {rolesList.map((r: any) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Trust Tier Filter */}
          <select 
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 backdrop-blur-md cursor-pointer"
          >
            <option value="all">All Trust Tiers</option>
            <option value="observe">Observe Tier (100% Gated)</option>
            <option value="assist">Assist Tier (Low-risk auto)</option>
            <option value="operate">Operate Tier (Autonomous)</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-xl transition-all ${
              viewMode === "grid" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-slate-900/60 text-slate-400 border border-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-xl transition-all ${
              viewMode === "table" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : "bg-slate-900/60 text-slate-400 border border-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-base">table_rows</span>
          </button>
        </div>
      </div>

      {/* Workers Content Grid / Table */}
      {(!agents || agents.length === 0) ? (
        <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-4xl">groups</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No AI Workers in Fleet</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">Recruit autonomous workers to start running decentralized tasks and missions.</p>
          </div>
          <a href="/hire" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-cyan-600/25">
            Recruit First AI Worker
          </a>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-3">
          <span className="material-symbols-outlined text-4xl text-slate-400 opacity-50">search_off</span>
          <p className="text-sm font-bold text-slate-200">No matching AI Workers found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or role filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((worker: any) => {
            const roleIcon = getRoleIcon(worker.role);
            const roleStyle = getRoleColor(worker.role);
            const tier = (worker.trust_tier || "observe") as TrustTier;
            const cleanCycles = worker.clean_cycles_count || 0;

            return (
              <div 
                key={worker.id} 
                onClick={() => setSelectedAgentId(worker.id)}
                className="group cursor-pointer p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between gap-5 relative hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all shadow-lg"
              >
                <div>
                  {/* Top Bar: Icon + Name + Tier + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${roleStyle} flex items-center justify-center shrink-0 border shadow-inner`}>
                        <span className="material-symbols-outlined text-2xl">{roleIcon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                          {worker.name}
                        </h3>
                        <span className="text-xs text-slate-400 capitalize font-medium">
                          {worker.role || "Specialist"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border
                        ${tier === 'operate'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tier === 'assist'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {tier}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {worker.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Worker Metadata & Governance Progress */}
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Clean Cycles:</span>
                      <span className="font-mono font-semibold text-cyan-400">{cleanCycles} completed</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Authority Limit:</span>
                      <span className="font-mono text-slate-300">
                        ${(worker.authority_limit_usd ?? (tier === 'operate' ? 1000 : tier === 'assist' ? 100 : 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Specialization:</span>
                      <span className="text-slate-300 font-mono text-[11px] truncate max-w-[140px]">
                        {worker.specialization_id || 'standard-v1'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-xs text-cyan-400 font-semibold group-hover:text-cyan-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">tune</span>
                    Inspect & Govern
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
        <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold">
                  <th className="p-4">AI Worker</th>
                  <th className="p-4">Specialized Role</th>
                  <th className="p-4">Trust Tier</th>
                  <th className="p-4">Clean Cycles</th>
                  <th className="p-4">Authority Limit</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredAgents.map((worker: any) => {
                  const tier = (worker.trust_tier || "observe") as TrustTier;
                  return (
                    <tr 
                      key={worker.id} 
                      onClick={() => setSelectedAgentId(worker.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-xs font-bold text-slate-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg text-cyan-400">smart_toy</span>
                        {worker.name}
                      </td>
                      <td className="p-4 text-xs text-slate-300 font-medium">{worker.role}</td>
                      <td className="p-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                          tier === 'operate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          tier === 'assist' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {tier}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-cyan-400">{worker.clean_cycles_count || 0}</td>
                      <td className="p-4 text-xs font-mono text-slate-300">
                        ${(worker.authority_limit_usd ?? (tier === 'operate' ? 1000 : tier === 'assist' ? 100 : 0)).toFixed(2)}
                      </td>
                      <td className="p-4 text-xs text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgentId(worker.id);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
