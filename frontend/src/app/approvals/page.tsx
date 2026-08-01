"use client";

import { useNeedsAttention } from "@/lib/queries";

export default function ApprovalsPage() {
  const { data: items, isLoading, error } = useNeedsAttention();

  if (isLoading) {
    return (
      <div className="p-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-display-lg text-secondary">sync</span>
          <p className="text-body-md text-secondary">Loading attention items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-xl text-error bg-error/10 rounded-lg">
        Failed to load attention items.
      </div>
    );
  }

  return (
    <div className="p-xl max-w-7xl mx-auto flex flex-col gap-xl">
      <header className="glass-header p-xl rounded-2xl flex flex-col gap-sm">
        <h1 className="font-display-lg text-display-lg text-primary">Approvals & Attention</h1>
        <p className="font-body-md text-body-md text-secondary">Items requiring human review or intervention.</p>
      </header>

      {(!items || items.length === 0) ? (
        <div className="bento-card p-xl flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-display-lg text-green-500">check_circle</span>
          <p className="font-headline-sm text-headline-sm text-primary">All clear! No items need your attention.</p>
          <p className="font-body-md text-body-md text-secondary">Your AI workforce is running smoothly.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {items.map((item: any) => (
            <div key={item.id} className="premium-card p-lg flex flex-col md:flex-row md:items-center justify-between gap-md border-l-4 border-l-yellow-500">
              <div className="flex flex-col gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs font-medium uppercase tracking-wider">{item.type}</span>
                  <span className="text-xs text-secondary">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{item.title}</h3>
                <p className="font-body-md text-body-md text-secondary">{item.description}</p>
                <div className="flex items-center gap-sm mt-sm">
                  <span className="material-symbols-outlined text-sm text-secondary">smart_toy</span>
                  <span className="text-sm text-secondary">Agent: {item.agentName}</span>
                </div>
              </div>
              <div className="flex gap-sm">
                <button className="px-4 py-2 bg-surface-container hover:bg-secondary/20 text-primary rounded-lg transition-colors">
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
