"use client";

import { useState } from "react";
import { useAgents, useMetrics, useUpdateAgentStatus } from "@/lib/queries";
import { AgentStatus } from "@/lib/api";

export default function AgentsPage() {
  const { data: agents, isLoading: isLoadingAgents, error: agentsError, refetch } = useAgents();
  const { data: metrics } = useMetrics();
  const updateStatus = useUpdateAgentStatus();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  if (isLoadingAgents && !agents) {
    return (
      <div className="p-xl flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-display-lg text-primary">sync</span>
          <p className="font-body-md text-secondary">Loading AI workforce...</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = (agentId: string, currentStatus: AgentStatus) => {
    let newStatus: AgentStatus = "Paused";
    if (currentStatus === "Paused") newStatus = "Running";
    updateStatus.mutate({ id: agentId, status: newStatus });
  };

  const handleKill = (agentId: string) => {
    updateStatus.mutate({ id: agentId, status: "Failed" });
  };

  const getRoleIcon = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("marketing")) return "campaign";
    if (r.includes("finance") || r.includes("accountant")) return "account_balance";
    if (r.includes("coder") || r.includes("developer") || r.includes("engineer")) return "terminal";
    if (r.includes("research")) return "psychology";
    if (r.includes("writer") || r.includes("copy")) return "edit_note";
    if (r.includes("supervisor") || r.includes("manager")) return "shield_person";
    return "smart_toy";
  };

  const getRoleColor = (role?: string) => {
    const r = role?.toLowerCase() || "";
    if (r.includes("marketing")) return "text-purple-600 bg-purple-500/10 border-purple-500/20";
    if (r.includes("finance")) return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    if (r.includes("coder")) return "text-blue-600 bg-blue-500/10 border-blue-500/20";
    if (r.includes("research")) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    return "text-primary bg-primary/10 border-primary/20";
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
    <div className="p-md md:p-xl max-w-[1440px] mx-auto flex flex-col gap-xl">
      {/* Header */}
      <header className="glass-header p-lg rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-md border border-outline/10">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-on-surface">AI Workforce & Specialists</h1>
          <p className="font-body-md text-secondary">Manage, inspect, and command your autonomous agents.</p>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          <button 
            onClick={() => refetch()}
            className="p-2.5 bg-surface-container hover:bg-surface-container-high rounded-xl text-secondary hover:text-on-surface transition-colors"
            title="Refresh list"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
          <a 
            href="/hire" 
            className="px-lg py-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Hire New Agent
          </a>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bento-card p-lg flex flex-col gap-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-caps text-label-caps">Active Workforce</span>
            <span className="material-symbols-outlined text-green-500 text-[20px]">smart_toy</span>
          </div>
          <span className="font-display-lg text-display-lg text-green-600 font-bold">{metrics?.activeAgents || 0}</span>
          <span className="text-xs text-secondary">Agents currently executing tasks</span>
        </div>

        <div className="bento-card p-lg flex flex-col gap-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-caps text-label-caps">Total Deployed Agents</span>
            <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
          </div>
          <span className="font-display-lg text-display-lg text-primary font-bold">{agents?.length || metrics?.totalAgents || 0}</span>
          <span className="text-xs text-secondary">Specialists on the payroll</span>
        </div>

        <div className="bento-card p-lg flex flex-col gap-xs">
          <div className="flex items-center justify-between text-secondary">
            <span className="font-label-caps text-label-caps">Completed Operations</span>
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">task_alt</span>
          </div>
          <span className="font-display-lg text-display-lg text-emerald-600 font-bold">{metrics?.completedTasks || 0}</span>
          <span className="text-xs text-secondary">Missions successfully finished</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-sm items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name, role, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-sm flex-wrap">
          <div className="flex gap-xs overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                selectedRoleFilter === 'all' 
                  ? 'bg-on-surface text-surface' 
                  : 'bg-surface-container hover:bg-surface-container-high text-secondary'
              }`}
            >
              All Roles ({agents?.length || 0})
            </button>
            {rolesList.map((r: string) => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  selectedRoleFilter === r 
                    ? 'bg-on-surface text-surface' 
                    : 'bg-surface-container hover:bg-surface-container-high text-secondary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-surface-container p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-surface shadow-xs text-primary' : 'text-secondary hover:text-on-surface'}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-surface shadow-xs text-primary' : 'text-secondary hover:text-on-surface'}`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agents Content */}
      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-xxl flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-display-lg text-secondary opacity-40">groups</span>
          <p className="font-headline-md text-headline-md text-on-surface">No workers found</p>
          <p className="font-body-md text-secondary max-w-md">Hire your first AI worker to begin orchestrating autonomous workflows!</p>
          <a href="/hire" className="px-lg py-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            Hire First Specialist
          </a>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="bento-card p-xl flex flex-col items-center justify-center text-center gap-sm">
          <span className="material-symbols-outlined text-4xl text-secondary opacity-50">search_off</span>
          <p className="font-headline-sm text-on-surface">No matching agents found</p>
          <p className="text-xs text-secondary">Try adjusting your search query or role filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filteredAgents.map((agent: any) => {
            const roleIcon = getRoleIcon(agent.role);
            const roleColor = getRoleColor(agent.role);

            return (
              <div 
                key={agent.id} 
                className="bento-card p-lg flex flex-col justify-between gap-md hover:shadow-md transition-shadow border border-outline-variant"
              >
                <div>
                  <div className="flex items-start justify-between gap-sm mb-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[24px]">{roleIcon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{agent.name}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border w-fit mt-0.5 ${roleColor}`}>
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      agent.status === 'Running' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                      agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                      agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                      'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        agent.status === 'Running' ? 'bg-green-500 animate-pulse' :
                        agent.status === 'Idle' ? 'bg-yellow-500' :
                        agent.status === 'Paused' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></span>
                      {agent.status}
                    </span>
                  </div>

                  <div className="bg-surface-container-low p-sm rounded-lg text-xs flex flex-col gap-1 text-secondary">
                    <div className="flex items-center justify-between">
                      <span>Worker ID:</span>
                      <span className="font-code-sm font-semibold text-on-surface">{agent.id.slice(0, 12)}...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-sm border-t border-outline-variant flex items-center justify-between gap-sm">
                  <a 
                    href="/tasks"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Tasks
                  </a>

                  <div className="flex items-center gap-xs">
                    <button 
                      onClick={() => handleStatusChange(agent.id, agent.status)}
                      disabled={agent.status === 'Failed'}
                      className="px-2.5 py-1 hover:bg-surface-container rounded-lg text-secondary hover:text-on-surface transition-colors disabled:opacity-50 text-xs font-semibold flex items-center gap-1"
                      title={agent.status === 'Paused' ? 'Resume Agent' : 'Pause Agent'}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {agent.status === 'Paused' ? 'play_arrow' : 'pause'}
                      </span>
                      {agent.status === 'Paused' ? 'Resume' : 'Pause'}
                    </button>
                    <button 
                      onClick={() => handleKill(agent.id)}
                      disabled={agent.status === 'Failed'}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-secondary hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Terminate Worker"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
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
                <tr className="border-b border-outline-variant bg-surface-container/50">
                  <th className="p-md font-label-caps text-label-caps text-secondary">Worker</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary">Role</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary">Status</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary">Agent ID</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.map((agent: any) => (
                  <tr key={agent.id} className="border-b border-outline-variant/50 hover:bg-surface-container/30 transition-colors">
                    <td className="p-md font-body-md text-on-surface font-semibold flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">{getRoleIcon(agent.role)}</span>
                      {agent.name}
                    </td>
                    <td className="p-md">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getRoleColor(agent.role)}`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="p-md">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        agent.status === 'Running' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                        agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                        agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                        'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          agent.status === 'Running' ? 'bg-green-500 animate-pulse' :
                          agent.status === 'Idle' ? 'bg-yellow-500' :
                          agent.status === 'Paused' ? 'bg-orange-500' : 'bg-red-500'
                        }`}></span>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-md font-code-sm text-xs text-secondary">
                      {agent.id.slice(0, 8)}...
                    </td>
                    <td className="p-md flex items-center justify-end gap-sm">
                      <a 
                        href="/tasks"
                        className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-on-surface transition-colors"
                        title="View Missions"
                      >
                        <span className="material-symbols-outlined text-[18px]">assignment</span>
                      </a>
                      <button 
                        onClick={() => handleStatusChange(agent.id, agent.status)}
                        disabled={agent.status === 'Failed'}
                        className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-on-surface transition-colors disabled:opacity-50"
                        title={agent.status === 'Paused' ? 'Resume' : 'Pause'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {agent.status === 'Paused' ? 'play_arrow' : 'pause'}
                        </span>
                      </button>
                      <button 
                        onClick={() => handleKill(agent.id)}
                        disabled={agent.status === 'Failed'}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-secondary hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Terminate"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
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

