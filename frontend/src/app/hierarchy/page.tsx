"use client";

import { useAgents } from "@/lib/queries";

export default function HierarchyPage() {
  const { data: agents, isLoading, error } = useAgents();

  if (isLoading) {
    return (
      <div className="p-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-display-lg text-secondary">sync</span>
          <p className="text-body-md text-secondary">Loading hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-xl text-error bg-error/10 rounded-lg">
        Failed to load hierarchy.
      </div>
    );
  }

  // Group agents by role (simplified tree)
  const groupedAgents = agents?.reduce((acc: any, agent: any) => {
    const role = agent.role || "Unassigned";
    if (!acc[role]) acc[role] = [];
    acc[role].push(agent);
    return acc;
  }, {});

  return (
    <div className="p-xl max-w-7xl mx-auto flex flex-col gap-xl">
      <header className="glass-header p-xl rounded-2xl flex flex-col gap-sm">
        <h1 className="font-display-lg text-display-lg text-primary">Organization Hierarchy</h1>
        <p className="font-body-md text-body-md text-secondary">View the structure and roles of your AI workforce.</p>
      </header>

      {(!agents || agents.length === 0) ? (
        <div className="bento-card p-xl flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-display-lg text-secondary">account_tree</span>
          <p className="font-headline-sm text-headline-sm text-primary">No agents in the organization yet.</p>
          <p className="font-body-md text-body-md text-secondary">Hire agents to build your organization.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-xl">
          {groupedAgents && Object.entries(groupedAgents).map(([role, roleAgents]: [string, any]) => (
            <div key={role} className="flex flex-col gap-md">
              <h2 className="font-headline-sm text-headline-sm text-primary capitalize flex items-center gap-sm border-b border-secondary/20 pb-2">
                <span className="material-symbols-outlined text-secondary">work</span>
                {role}s ({roleAgents.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md pl-md border-l-2 border-secondary/20">
                {roleAgents.map((agent: any) => (
                  <div key={agent.id} className="bento-card p-md flex flex-col gap-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-body-md text-primary font-medium">{agent.name}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-label-caps uppercase ${
                        agent.status === 'Running' ? 'bg-green-500/10 text-green-500' :
                        agent.status === 'Idle' ? 'bg-yellow-500/10 text-yellow-500' :
                        agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === 'Running' ? 'bg-green-500 pulse-dot' :
                        agent.status === 'Idle' ? 'bg-yellow-500' :
                        agent.status === 'Paused' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></span>
                      {agent.status}
                      </span>
                    </div>
                    <span className="text-xs text-secondary bg-surface-container px-2 py-1 rounded w-fit capitalize">{agent.role}</span>
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
