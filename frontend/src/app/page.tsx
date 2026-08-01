"use client";

import { useMetrics, useAgents, useTasks } from "@/lib/queries";

export default function DashboardPage() {
  const { data: metrics } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading } = useAgents();
  const { data: tasks, isLoading: isTasksLoading } = useTasks();

  if (isAgentsLoading && !agents) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-md">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-surface-container border-t-primary"></div>
          <span className="text-body-md font-body-md text-secondary pulse-dot">Connecting to AI Control Plane...</span>
        </div>
      </div>
    );
  }

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

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "recently";
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

  const recentTasks = (tasks || []).slice(0, 5);

  return (
    <div className="flex flex-col gap-xl max-w-[1440px] mx-auto p-md md:p-xl">
      {/* Header */}
      <header className="glass-header flex flex-col md:flex-row md:items-center justify-between gap-md p-lg rounded-2xl border border-outline/10">
        <div className="flex flex-col gap-xs">
          <h1 className="text-display-lg font-display-lg text-on-surface">Company OS Control Plane</h1>
          <p className="text-body-md font-body-md text-secondary">Autonomous multi-agent orchestration and operations center</p>
        </div>
        <div className="flex items-center gap-sm">
          <a
            href="/hire"
            className="px-lg py-sm bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Hire Worker
          </a>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bento-card p-lg flex flex-col gap-xs border border-outline-variant">
          <div className="flex items-center justify-between text-secondary">
            <span className="text-label-caps font-label-caps">Total Workforce</span>
            <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
          </div>
          <span className="text-headline-lg font-headline-lg text-on-surface font-bold">{agents?.length ?? metrics?.totalAgents ?? 0}</span>
          <span className="text-xs text-secondary">Hired specialists</span>
        </div>
        
        <div className="bento-card p-lg flex flex-col gap-xs border border-outline-variant">
          <div className="flex items-center justify-between text-green-600">
            <span className="text-label-caps font-label-caps">Active Workforce</span>
            <span className="material-symbols-outlined text-green-500 text-[20px]">sync</span>
          </div>
          <span className="text-headline-lg font-headline-lg text-green-600 font-bold">{metrics?.activeAgents ?? 0}</span>
          <span className="text-xs text-secondary">Currently executing</span>
        </div>
        
        <div className="bento-card p-lg flex flex-col gap-xs border border-outline-variant">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-label-caps font-label-caps">Tasks Completed</span>
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">task_alt</span>
          </div>
          <span className="text-headline-lg font-headline-lg text-emerald-600 font-bold">{metrics?.completedTasks ?? 0}</span>
          <span className="text-xs text-secondary">Missions accomplished</span>
        </div>
        
        <div className="bento-card p-lg flex flex-col gap-xs border border-outline-variant">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-label-caps font-label-caps">Risk Level</span>
            <span className="material-symbols-outlined text-amber-500 text-[20px]">shield</span>
          </div>
          <span className="text-headline-lg font-headline-lg text-amber-600 font-bold capitalize">{metrics?.riskLevel ?? 'Low'}</span>
          <span className="text-xs text-secondary">System integrity score</span>
        </div>
      </div>

      {/* Main Content Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Workers Roster Section */}
        <div className="lg:col-span-2 bento-card p-lg flex flex-col gap-md border border-outline-variant">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">engineering</span>
              Deployed Workforce ({agents?.length || 0})
            </h2>
            <a href="/agents" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              View All Workers
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
          
          <div className="flex flex-col gap-sm">
            {!agents || agents.length === 0 ? (
              <div className="p-xl flex flex-col items-center justify-center text-center border border-dashed border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-display-lg text-secondary mb-sm opacity-40">person_off</span>
                <p className="text-body-md font-body-md text-secondary">No workers hired yet.</p>
                <a href="/hire" className="mt-sm text-primary text-xs font-semibold hover:underline">
                  Hire your first agent &rarr;
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-sm no-scrollbar overflow-y-auto max-h-[380px]">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-md bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-center justify-between transition-colors hover:bg-surface-container">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">{getRoleIcon(agent.role)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-md font-body-md text-on-surface font-semibold">{agent.name}</span>
                        <span className="text-xs text-secondary capitalize">{agent.role}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-sm">
                      <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 font-label-caps text-[10px] uppercase font-semibold
                        ${agent.status === 'Running' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 
                          agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' : 
                          agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                          'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          agent.status === 'Running' ? 'bg-green-500 animate-pulse' :
                          agent.status === 'Idle' ? 'bg-yellow-500' :
                          agent.status === 'Paused' ? 'bg-orange-500' : 'bg-red-500'
                        }`}></span>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Operations Feed Section */}
        <div className="bento-card p-lg flex flex-col gap-md border border-outline-variant">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">dynamic_feed</span>
              Recent Activity
            </h2>
            <a href="/tasks" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              All Tasks
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
          
          <div className="flex flex-col gap-sm">
            {recentTasks.length === 0 ? (
              <div className="p-lg flex flex-col items-center justify-center text-center border border-dashed border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-3xl text-secondary mb-xs opacity-40">assignment_late</span>
                <p className="text-xs text-secondary">No operations logged yet.</p>
              </div>
            ) : (
              recentTasks.map((t) => (
                <div key={t.id} className="p-sm bg-surface-container-low rounded-xl border border-outline-variant/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold uppercase text-[10px] ${
                      t.status === 'running' ? 'text-green-600' :
                      t.status === 'completed' ? 'text-emerald-600' :
                      t.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-[10px] text-secondary">{getRelativeTime(t.created_at)}</span>
                  </div>
                  <p className="text-xs text-on-surface font-medium line-clamp-2">{t.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

