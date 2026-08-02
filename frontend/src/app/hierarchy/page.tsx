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
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Mapping workforce hierarchy & reporting topologies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-sm font-bold text-rose-400">Failed to load workforce hierarchy topology.</p>
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
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workforce Topology
              </span>
              <span className="text-xs text-slate-400 font-mono">Autonomous Organizational Matrix</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Workforce Hierarchy
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Visual overview of autonomous AI worker clusters, specialization domains, and active task distribution across reporting tiers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/hire" 
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Recruit Specialist
            </a>
          </div>
        </div>
      </header>

      {/* KPI Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bento-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Deployed Workers</span>
          <p className="text-2xl font-extrabold text-slate-100 font-mono mt-1">{totalWorkers}</p>
        </div>
        <div className="bento-card p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active Operational Clusters</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{roleCategories}</p>
        </div>
        <div className="bento-card p-5 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Autonomous Orchestration</span>
          <p className="text-2xl font-extrabold text-teal-400 font-mono mt-1">Decentralized</p>
        </div>
      </section>

      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-800">
          <span className="material-symbols-outlined text-4xl text-slate-600">account_tree</span>
          <h3 className="text-base font-bold text-slate-200">No Workers in Hierarchy</h3>
          <p className="text-xs text-slate-400 max-w-md">Recruit and provision autonomous specialists to populate your organizational matrix.</p>
          <a href="/hire" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all">
            Recruit First AI Worker
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groupedAgents && Object.entries(groupedAgents).map(([role, roleAgents]: [string, any]) => (
            <div key={role} className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-base">workspaces</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-100">{role}</h2>
                    <p className="text-[11px] text-slate-400 font-mono">{roleAgents.length} active worker{roleAgents.length > 1 ? 's' : ''} in cluster</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 border-l-2 border-emerald-500/30">
                {roleAgents.map((agent: any) => (
                  <div 
                    key={agent.id} 
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="bento-card p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-emerald-500/40 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            WRK-{agent.id.slice(0, 8)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {agent.name}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        agent.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        agent.status === 'Idle' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'Running' ? 'bg-emerald-400 animate-pulse' :
                          agent.status === 'Idle' ? 'bg-amber-400' :
                          agent.status === 'Paused' ? 'bg-orange-400' : 'bg-rose-400'
                        }`}></span>
                        {agent.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-slate-500">Autonomous Tier 1</span>
                      <span className="text-emerald-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
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
