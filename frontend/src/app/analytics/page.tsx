"use client";

import { useMetrics, useAgents } from "@/lib/queries";

export default function AnalyticsPage() {
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading, error: agentsError } = useAgents();

  if (isMetricsLoading || isAgentsLoading) {
    return (
      <div className="flex h-full items-center justify-center p-xl">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-body-md text-secondary">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (metricsError || agentsError || !metrics || !agents) {
    return (
      <div className="flex h-full items-center justify-center p-xl">
        <p className="font-body-md text-error">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl p-xl h-full overflow-y-auto no-scrollbar">
      <header className="glass-header flex flex-col gap-sm">
        <h1 className="font-display-lg text-primary">Cost & Analytics</h1>
        <p className="font-body-md text-secondary">Track performance metrics and operational costs.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-secondary">attach_money</span>
          <p className="font-label-caps text-secondary">Total Cost</p>
          <p className="font-headline-sm text-primary">${metrics.totalCost?.toFixed(2) || "0.00"}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-secondary">groups</span>
          <p className="font-label-caps text-secondary">Total Agents</p>
          <p className="font-headline-sm text-primary">{metrics.totalAgents}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-secondary">support_agent</span>
          <p className="font-label-caps text-secondary">Active Agents</p>
          <p className="font-headline-sm text-primary">{metrics.activeAgents}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-secondary">task_alt</span>
          <p className="font-label-caps text-secondary">Completed Tasks</p>
          <p className="font-headline-sm text-primary">{metrics.completedTasks}</p>
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="font-headline-sm text-primary">Agent Breakdown</h2>
        {agents.length === 0 ? (
          <div className="premium-card flex flex-col items-center justify-center p-xl gap-md text-center">
             <span className="material-symbols-outlined text-display-lg text-secondary opacity-50">group_off</span>
             <p className="font-body-md text-secondary">No agents currently hired.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-sm">
            {agents.map((agent) => (
              <div key={agent.id} className="premium-card flex flex-col md:flex-row items-start md:items-center justify-between gap-md p-md">
                <div className="flex items-center gap-md">
                   <div className="bg-surface-container p-sm rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">smart_toy</span>
                   </div>
                   <div className="flex flex-col gap-xs">
                     <p className="font-body-md text-primary">{agent.name}</p>
                     <p className="font-label-caps text-secondary">{agent.role}</p>
                   </div>
                </div>
                <div className="flex items-center gap-sm">
                   <div className={`px-sm py-xs rounded-full flex items-center gap-xs ${agent.status === 'Idle' ? 'bg-surface-container text-secondary' : 'bg-primary/10 text-primary'}`}>
                      {agent.status !== 'Idle' && <div className="pulse-dot bg-primary w-2 h-2 rounded-full"></div>}
                      <span className="font-label-caps uppercase">{agent.status}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
