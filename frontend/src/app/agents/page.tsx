"use client";

import { useAgents, useMetrics, useUpdateAgentStatus } from "@/lib/queries";
import { AgentStatus } from "@/lib/api";

export default function AgentsPage() {
  const { data: agents, isLoading: isLoadingAgents, error: agentsError, refetch } = useAgents();
  const { data: metrics } = useMetrics();
  const updateStatus = useUpdateAgentStatus();

  if (isLoadingAgents && !agents) {
    return (
      <div className="p-xl flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-display-lg text-primary">sync</span>
          <p className="text-body-md text-secondary">Loading workers...</p>
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

  return (
    <div className="p-xl max-w-7xl mx-auto flex flex-col gap-xl">
      <header className="glass-header p-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="flex flex-col gap-sm">
          <h1 className="font-display-lg text-display-lg text-primary">Workers</h1>
          <p className="font-body-md text-body-md text-secondary">Manage and monitor your AI workforce.</p>
        </div>
        <a href="/hire" className="px-6 py-3 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-sm w-fit">
          <span className="material-symbols-outlined">person_add</span>
          Hire Worker
        </a>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bento-card p-lg flex flex-col gap-sm">
          <span className="font-label-caps text-label-caps text-secondary">Active Workers</span>
          <span className="font-display-lg text-display-lg text-primary">{metrics?.activeAgents || 0}</span>
        </div>
        <div className="bento-card p-lg flex flex-col gap-sm">
          <span className="font-label-caps text-label-caps text-secondary">Total Agents</span>
          <span className="font-display-lg text-display-lg text-primary">{metrics?.totalAgents || 0}</span>
        </div>
        <div className="bento-card p-lg flex flex-col gap-sm">
          <span className="font-label-caps text-label-caps text-secondary">Completed Tasks</span>
          <span className="font-display-lg text-display-lg text-primary">{metrics?.completedTasks || 0}</span>
        </div>
      </div>

      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-xl flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-display-lg text-secondary">groups</span>
          <p className="font-headline-sm text-headline-sm text-primary">No workers found.</p>
          <p className="font-body-md text-body-md text-secondary mb-md">Hire your first AI worker to get started!</p>
          <a href="/hire" className="px-6 py-3 bg-surface-container text-primary rounded-lg hover:bg-secondary/20 transition-colors">
            Hire AI Worker
          </a>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary/20 bg-surface-container/50">
                  <th className="p-md font-label-caps text-label-caps text-secondary">Name</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary">Role</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary">Status</th>
                  <th className="p-md font-label-caps text-label-caps text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent: any) => (
                  <tr key={agent.id} className="border-b border-secondary/10 hover:bg-surface-container/30 transition-colors">
                    <td className="p-md font-body-md text-primary font-medium">{agent.name}</td>
                    <td className="p-md text-secondary capitalize">{agent.role}</td>
                    <td className="p-md">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        agent.status === 'Running' ? 'bg-green-500/10 text-green-500' :
                        agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-500' :
                        agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {agent.status === 'Running' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot"></span>}
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-md flex items-center justify-end gap-sm">
                      <button 
                        onClick={() => handleStatusChange(agent.id, agent.status)}
                        disabled={agent.status === 'Failed'}
                        className="p-2 hover:bg-surface-container rounded-lg text-secondary hover:text-primary transition-colors disabled:opacity-50"
                        title={agent.status === 'Paused' ? 'Resume' : 'Pause'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {agent.status === 'Paused' ? 'play_arrow' : 'pause'}
                        </span>
                      </button>
                      <button 
                        onClick={() => handleKill(agent.id)}
                        disabled={agent.status === 'Failed'}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Terminate"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
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
