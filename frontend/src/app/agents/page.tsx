"use client";

import { useAgents, useUpdateAgentStatus, useMetrics } from "@/lib/queries";
import Link from "next/link";
import { type AgentStatus } from "@/lib/api";

const statusConfig: Record<AgentStatus, { badgeBg: string; text: string; dot: string; label: string; border: string }> = {
  Running: { badgeBg: "bg-primary/10", text: "text-primary", dot: "bg-primary animate-pulse-soft", label: "Running", border: "border-primary/20" },
  Paused: { badgeBg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Paused", border: "border-amber-200" },
  Idle: { badgeBg: "bg-surface-container-high", text: "text-secondary", dot: "bg-secondary", label: "Idle", border: "border-surface-variant" },
  Failed: { badgeBg: "bg-error/10", text: "text-error", dot: "bg-error", label: "Failed", border: "border-error/20" },
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const { data: metrics } = useMetrics();
  const updateStatus = useUpdateAgentStatus();

  if (isLoading) {
    return <div className="text-secondary font-body-md">Loading fleet data...</div>;
  }

  const activeWorkers = metrics?.activeAgents || 0;
  const totalCost = metrics?.totalCost || 0;
  const completedTasks = metrics?.completedTasks || 0;

  return (
    <div className="space-y-lg max-w-[1400px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">Workers</h2>
          <p className="text-secondary font-body-lg">Hire, monitor and control your AI workforce</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link href="/hire" className="flex items-center gap-xs px-md py-sm bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/10 hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Hire Worker
          </Link>
        </div>
      </div>

      {/* Action Controls */}
      <div className="premium-card p-sm flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-xs">
          <button className="px-md py-base bg-surface-container-high text-on-background rounded-lg text-sm flex items-center gap-xs hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="px-md py-base bg-surface-container-high text-on-background rounded-lg text-sm flex items-center gap-xs hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort
          </button>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-lg">
          <button className="p-2 bg-white shadow-sm rounded-md text-primary">
            <span className="material-symbols-outlined">view_list</span>
          </button>
          <button className="p-2 text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
      </div>

      {/* Main Agent Table */}
      <div className="premium-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="px-lg py-md font-label-caps text-secondary">Worker</th>
              <th className="px-lg py-md font-label-caps text-secondary">Department</th>
              <th className="px-lg py-md font-label-caps text-secondary">Status</th>
              <th className="px-lg py-md font-label-caps text-secondary">Current Task</th>
              <th className="px-lg py-md font-label-caps text-secondary">Cost Today</th>
              <th className="px-lg py-md font-label-caps text-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {agents?.map(agent => {
              const conf = statusConfig[agent.status] || statusConfig.Idle;
              return (
                <tr key={agent.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-lg py-lg">
                    <div className="flex items-center gap-md">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                         <span className="material-symbols-outlined text-primary">smart_toy</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-background">{agent.name}</p>
                        <p className="text-xs text-secondary">{agent.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-lg text-body-md">Department</td>
                  <td className="px-lg py-lg">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${conf.badgeBg} ${conf.text} ${conf.border}`}>
                      <span className={`status-pulse ${conf.dot}`}></span>
                      {conf.label}
                    </span>
                  </td>
                  <td className="px-lg py-lg max-w-xs">
                    <p className="truncate text-body-md">{agent.currentGoal || "—"}</p>
                  </td>
                  <td className="px-lg py-lg font-mono text-body-md">${agent.costSoFar?.toFixed(2) || "0.00"}</td>
                  <td className="px-lg py-lg text-right">
                    <div className="flex items-center justify-end gap-base">
                      <button className="p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      
                      {agent.status === 'Running' ? (
                        <button 
                          className="p-2 text-secondary hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                          title="Pause"
                          onClick={() => updateStatus.mutate({ id: agent.id, status: 'Paused' })}
                        >
                          <span className="material-symbols-outlined">pause</span>
                        </button>
                      ) : (
                        <button 
                          className="p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                          title="Resume"
                          onClick={() => updateStatus.mutate({ id: agent.id, status: 'Running' })}
                        >
                          <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                      )}
                      
                      <button 
                        className="p-2 text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-all" 
                        title="Kill Process"
                        onClick={() => updateStatus.mutate({ id: agent.id, status: 'Failed' })}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!agents || agents.length === 0) && (
              <tr>
                <td colSpan={6} className="px-lg py-xl text-center text-secondary">
                  No workers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dashboard Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mt-xl">
        <div className="premium-card p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps text-secondary">Active Workers</span>
            <span className="material-symbols-outlined text-primary">sensors</span>
          </div>
          <p className="text-display-lg font-bold">{activeWorkers}</p>
        </div>
        <div className="premium-card p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps text-secondary">Compute Used</span>
            <span className="material-symbols-outlined text-secondary">memory</span>
          </div>
          <p className="text-display-lg font-bold">84%</p>
        </div>
        <div className="premium-card p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps text-secondary">Total Cost Today</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <p className="text-display-lg font-bold">${totalCost.toFixed(2)}</p>
        </div>
        <div className="premium-card p-lg">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps text-secondary">Tasks Completed</span>
            <span className="material-symbols-outlined text-secondary">task_alt</span>
          </div>
          <p className="text-display-lg font-bold">{completedTasks}</p>
        </div>
      </div>
    </div>
  );
}
