"use client";

import { useMetrics, useAgents } from "@/lib/queries";

export default function DashboardPage() {
  const { data: metrics } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading } = useAgents();

  if (isAgentsLoading && !agents) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-md">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-surface-container border-t-primary"></div>
          <span className="text-body-md font-body-md text-secondary pulse-dot">Loading system data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-xl">
      {/* Header */}
      <header className="glass-header flex flex-col gap-xs mb-xl p-md rounded-xl">
        <h1 className="text-display-lg font-display-lg text-primary">Dashboard</h1>
        <p className="text-body-md font-body-md text-secondary">Overview of your company's automated workforce</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="premium-card p-lg flex flex-col gap-sm border border-outline/10 rounded-xl bg-surface-container">
          <span className="text-label-caps font-label-caps text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">groups</span>
            Total Workers
          </span>
          <span className="text-headline-sm font-headline-sm text-primary">{metrics?.totalAgents ?? 0}</span>
        </div>
        
        <div className="premium-card p-lg flex flex-col gap-sm border border-outline/10 rounded-xl bg-surface-container">
          <span className="text-label-caps font-label-caps text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Active Workers
          </span>
          <span className="text-headline-sm font-headline-sm text-primary">{metrics?.activeAgents ?? 0}</span>
        </div>
        
        <div className="premium-card p-lg flex flex-col gap-sm border border-outline/10 rounded-xl bg-surface-container">
          <span className="text-label-caps font-label-caps text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            Tasks Completed
          </span>
          <span className="text-headline-sm font-headline-sm text-primary">{metrics?.completedTasks ?? 0}</span>
        </div>
        
        <div className="premium-card p-lg flex flex-col gap-sm border border-outline/10 rounded-xl bg-surface-container">
          <span className="text-label-caps font-label-caps text-secondary flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">attach_money</span>
            Total Cost
          </span>
          <span className="text-headline-sm font-headline-sm text-primary">${metrics?.totalCost ?? 0}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Active Workers Section */}
        <div className="lg:col-span-2 bento-card p-lg flex flex-col gap-md border border-outline/10 rounded-xl bg-surface-container">
          <h2 className="text-headline-sm font-headline-sm text-primary flex items-center gap-sm">
            <span className="material-symbols-outlined">engineering</span>
            Active Workers
          </h2>
          
          <div className="flex flex-col gap-sm">
            {!agents || agents.length === 0 ? (
              <div className="p-xl flex flex-col items-center justify-center text-center border border-dashed border-outline/20 rounded-lg">
                <span className="material-symbols-outlined text-display-lg text-secondary mb-sm">person_off</span>
                <p className="text-body-md font-body-md text-secondary">No workers hired yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm no-scrollbar overflow-y-auto max-h-[400px]">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-md bg-background rounded-lg border border-outline/10 flex items-center justify-between transition-colors hover:bg-surface-container">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">robot_2</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-md font-body-md text-primary font-medium">{agent.name}</span>
                        <span className="text-body-sm text-secondary capitalize">{agent.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className={`px-sm py-xs rounded-full flex items-center gap-xs font-label-caps text-[10px] uppercase
                        ${agent.status === 'Running' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                          agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                          agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {agent.status === 'Running' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Overview Section */}
        <div className="bento-card p-lg flex flex-col gap-md border border-outline/10 rounded-xl bg-surface-container">
          <h2 className="text-headline-sm font-headline-sm text-primary flex items-center gap-sm">
            <span className="material-symbols-outlined">query_stats</span>
            System Overview
          </h2>
          
          <div className="flex flex-col gap-md">
            <div className="p-md bg-background rounded-lg border border-outline/10 flex flex-col gap-xs">
              <span className="text-label-caps font-label-caps text-secondary">Total Tasks</span>
              <span className="text-headline-sm font-headline-sm text-primary">{metrics?.totalTasks ?? 0}</span>
            </div>
            
            <div className="p-md bg-background rounded-lg border border-outline/10 flex flex-col gap-xs">
              <span className="text-label-caps font-label-caps text-secondary">Completed Tasks</span>
              <span className="text-headline-sm font-headline-sm text-primary">{metrics?.completedTasks ?? 0}</span>
            </div>
            
            <div className="p-md bg-background rounded-lg border border-outline/10 flex flex-col gap-xs">
              <span className="text-label-caps font-label-caps text-secondary">Risk Level</span>
              <div className="flex items-center gap-sm">
                <span className={`text-headline-sm font-headline-sm ${
                  metrics?.riskLevel?.toLowerCase() === 'low' ? 'text-green-500' : 
                  metrics?.riskLevel?.toLowerCase() === 'medium' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {metrics?.riskLevel ?? 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
