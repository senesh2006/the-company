"use client";

import { useNeedsAttention } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Check, X, UserCheck } from "lucide-react";

export default function NeedsAttentionPage() {
  const { data: items, isLoading } = useNeedsAttention();
  const { setSelectedAgentId } = useAppStore();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-rose-500/20 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500">Scanning workforce alerts & blockers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 border border-rose-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Action Required
              </span>
              <span className="text-xs text-rose-100 font-mono">Incident & Exception Resolution</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-rose-300" />
              Needs Attention
            </h1>
            <p className="text-sm text-rose-50 max-w-2xl leading-relaxed">
              Autonomous AI workers that are currently blocked, requesting manual parameter inputs, or requiring exception handling.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.id} className="bento-card p-6 bg-white border border-slate-200 border-l-4 border-l-rose-500 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold uppercase font-mono">
                    Blocked Worker
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.agentName}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAgentId(item.agentId)}
                  className="text-xs text-slate-500 hover:text-emerald-700 font-mono mt-1 flex items-center gap-1 transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  Worker ID: WRK-{item.agentId?.slice(0, 8)}
                </button>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-mono font-bold uppercase w-fit">
                {item.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Issue Overview</p>
                <p className="text-xs font-semibold text-slate-900">{item.title}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exception Details</p>
                <p className="text-xs font-medium text-slate-700">{item.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs">
                <Check className="w-4 h-4" /> Approve Action
              </button>
              <button className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <X className="w-4 h-4" /> Reject & Abort
              </button>
              <button 
                onClick={() => setSelectedAgentId(item.agentId)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all ml-auto"
              >
                Inspect Worker Directives
              </button>
            </div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div className="bento-card p-12 bg-white flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Workforce Operational</h3>
            <p className="text-xs text-slate-500 max-w-md">No AI workers require manual intervention or exception handling at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
