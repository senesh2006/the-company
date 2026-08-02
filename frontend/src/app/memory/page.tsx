"use client";

import { useMemory } from "@/lib/queries";
import { Database, Search, Cpu, Clock, Key } from "lucide-react";
import { useState } from "react";

export default function MemoryPage() {
  const { data: memoryEntries, isLoading, error } = useMemory();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading collective AI memory vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-sm font-bold text-rose-400">Failed to load shared memory matrix.</p>
      </div>
    );
  }

  const filteredEntries = memoryEntries?.filter((entry) => 
    entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.updatedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-teal-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Shared Knowledge Vault
              </span>
              <span className="text-xs text-slate-400 font-mono">Distributed Cross-Worker State</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-teal-400" />
              Shared Memory Matrix
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Global knowledge base, cached contextual state, and business domain invariants synchronized across all autonomous AI workers.
            </p>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search memory keys, structured JSON values, or authoring AI workers..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 px-3 shrink-0">
          {filteredEntries?.length || 0} Knowledge {filteredEntries?.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {(!filteredEntries || filteredEntries.length === 0) ? (
        <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Database className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Memory Entries Found</h3>
          <p className="text-xs text-slate-400 max-w-md">
            AI workers continuously write domain context and learned operational parameters here during directive executions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bento-card p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Key className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-teal-400 truncate uppercase tracking-wider">
                      {entry.key}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800/80 max-h-48 overflow-y-auto no-scrollbar">
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {entry.value}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  <span>Synced by {entry.updatedBy || 'Core Orchestrator'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
