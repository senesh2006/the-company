"use client";

import { useMemory } from "@/lib/queries";

export default function MemoryPage() {
  const { data: memoryEntries, isLoading, error } = useMemory();

  if (isLoading) {
    return (
      <div className="p-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined animate-spin text-display-lg text-secondary">sync</span>
          <p className="text-body-md text-secondary">Loading memory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-xl text-error bg-error/10 rounded-lg">
        Failed to load memory entries.
      </div>
    );
  }

  return (
    <div className="p-xl max-w-7xl mx-auto flex flex-col gap-xl">
      <header className="glass-header p-xl rounded-2xl flex flex-col gap-sm">
        <h1 className="font-display-lg text-display-lg text-primary">Shared Memory</h1>
        <p className="font-body-md text-body-md text-secondary">Global state and knowledge shared across the organization.</p>
      </header>

      {(!memoryEntries || memoryEntries.length === 0) ? (
        <div className="bento-card p-xl flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-display-lg text-secondary">memory</span>
          <p className="font-headline-sm text-headline-sm text-primary">No memory entries yet.</p>
          <p className="font-body-md text-body-md text-secondary">Agents haven't stored any shared knowledge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {memoryEntries.map((entry) => (
            <div key={entry.id} className="bento-card p-lg flex flex-col gap-md">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-secondary uppercase">{entry.key}</span>
                <span className="text-xs text-secondary">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <div className="bg-surface-container rounded-lg p-md overflow-x-auto no-scrollbar">
                <pre className="font-body-md text-body-md text-primary whitespace-pre-wrap">{entry.value}</pre>
              </div>
              <div className="flex items-center gap-sm mt-auto pt-sm border-t border-secondary/20">
                <span className="material-symbols-outlined text-sm text-secondary">person</span>
                <span className="text-sm text-secondary">Updated by {entry.updatedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
