"use client";

import { useNeedsAttention } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Check, X, ShieldAlert, CheckCircle2, XCircle, UserCheck } from "lucide-react";

export default function NeedsAttentionPage() {
  const { data: items, isLoading } = useNeedsAttention();
  const { setSelectedAgentId } = useAppStore();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Scanning workforce alerts & blockers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-rose-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Action Required
              </span>
              <span className="text-xs text-slate-400 font-mono">Incident & Exception Resolution</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
              Needs Attention
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Autonomous AI workers that are currently blocked, requesting manual parameter inputs, or requiring exception handling.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.id} className="bento-card p-6 border-l-4 border-l-rose-500 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase font-mono">
                    Blocked Worker
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{item.agentName}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAgentId(item.agentId)}
                  className="text-xs text-slate-400 hover:text-emerald-400 font-mono mt-1 flex items-center gap-1 transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  Worker ID: WRK-{item.agentId?.slice(0, 8)}
                </button>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-mono font-bold uppercase w-fit">
                {item.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Overview</p>
                <p className="text-xs font-medium text-slate-200">{item.title}</p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exception Details</p>
                <p className="text-xs font-medium text-slate-400">{item.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Approve Action
              </button>
              <button className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                <X className="w-4 h-4" /> Reject & Abort
              </button>
              <button 
                onClick={() => setSelectedAgentId(item.agentId)}
                className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-bold transition-all ml-auto"
              >
                Inspect Worker Directives
              </button>
            </div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Workforce Operational</h3>
            <p className="text-xs text-slate-400 max-w-md">No AI workers require manual intervention or exception handling at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
