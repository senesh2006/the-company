"use client";

import { useAgents } from "@/lib/queries";
import { useAppStore } from "@/lib/store";

export default function HierarchyPage() {
  const { data: agents, isLoading, error } = useAgents();
  const { setSelectedAgentId } = useAppStore();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500">Mapping workforce hierarchy & reporting topologies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center shadow-xs">
        <p className="text-sm font-bold text-rose-800">Failed to load workforce hierarchy topology.</p>
      </div>
    );
  }

  // Group workers by role
  const groupedAgents = agents?.reduce((acc: any, agent: any) => {
    const role = agent.role || "Specialist Worker";
    if (!acc[role]) acc[role] = [];
    acc[role].push(agent);
    return acc;
  }, {});

  const totalWorkers = agents?.length || 0;
  const roleCategories = groupedAgents ? Object.keys(groupedAgents).length : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Workforce Topology
              </span>
              <span className="text-xs text-emerald-100 font-mono">Autonomous Organizational Matrix</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Workforce Hierarchy
            </h1>
            <p className="text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Visual overview of autonomous AI worker clusters, specialization domains, and active task distribution across reporting tiers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/hire" 
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Recruit Specialist
            </a>
          </div>
        </div>
      </header>

      {/* KPI Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bento-card p-5 bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Deployed Workers</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{totalWorkers}</p>
        </div>
        <div className="bento-card p-5 bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Active Operational Clusters</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{roleCategories}</p>
        </div>
        <div className="bento-card p-5 bg-white border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Autonomous Orchestration</span>
          <p className="text-2xl font-extrabold text-teal-700 font-mono mt-1">Decentralized</p>
        </div>
      </section>

      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-12 bg-white flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 shadow-xs">
          <span className="material-symbols-outlined text-4xl text-slate-400">account_tree</span>
          <h3 className="text-base font-bold text-slate-900">No Workers in Hierarchy</h3>
          <p className="text-xs text-slate-500 max-w-md">Recruit and provision autonomous specialists to populate your organizational matrix.</p>
          <a href="/hire" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs">
            Recruit First AI Worker
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupedAgents && Object.entries(groupedAgents).map(([role, roleAgents]: [string, any]) => (
            <div key={role} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-base">workspaces</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{role}</h2>
                    <p className="text-[11px] text-slate-500 font-mono">{roleAgents.length} active worker{roleAgents.length > 1 ? 's' : ''} in cluster</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-emerald-500/40">
                {roleAgents.map((agent: any) => (
                  <div 
                    key={agent.id} 
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="bento-card p-5 bg-white border border-slate-200 flex flex-col justify-between gap-4 cursor-pointer hover:border-emerald-500/50 transition-all duration-200 group shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            WRK-{agent.id.slice(0, 8)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {agent.name}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${
                        agent.status === 'Running' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        agent.status === 'Idle' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        agent.status === 'Paused' ? 'bg-orange-100 text-orange-800 border-orange-300' : 
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'Running' ? 'bg-emerald-500 animate-pulse' :
                          agent.status === 'Idle' ? 'bg-amber-500' :
                          agent.status === 'Paused' ? 'bg-orange-500' : 'bg-rose-500'
                        }`}></span>
                        {agent.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-[11px] text-slate-400">Autonomous Tier 1</span>
                      <span className="text-emerald-700 text-xs font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Inspect
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
