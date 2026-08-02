"use client";

import { useNeedsAttention } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { CheckCircle2, XCircle, UserCheck } from "lucide-react";

export default function ApprovalsPage() {
  const { data: items, isLoading, error } = useNeedsAttention();
  const { setSelectedAgentId } = useAppStore();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500">Loading pending approval queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center shadow-xs">
        <p className="text-sm font-bold text-rose-800">Failed to load human-in-the-loop approval items.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 border border-amber-600/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Governance & Safety
              </span>
              <span className="text-xs text-amber-100 font-mono">Human-in-the-Loop Gateway</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Approvals & Safety Gates
            </h1>
            <p className="text-sm text-amber-50 max-w-2xl leading-relaxed">
              Review mission-critical decisions, high-risk operational steps, and policy verifications escalated by autonomous AI workers.
            </p>
          </div>
        </div>
      </header>

      {(!items || items.length === 0) ? (
        <div className="bento-card p-12 bg-white flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zero Governance Blockers</h3>
          <p className="text-xs text-slate-500 max-w-md">
            All AI workers are operating within approved safety constraints. No pending human overrides or reviews required.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item: any) => (
            <div key={item.id} className="bento-card p-6 bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-amber-500 shadow-xs">
              <div className="flex flex-col gap-2.5 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                    {item.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    onClick={() => setSelectedAgentId(item.agentId)}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold font-mono"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Worker: {item.agentName} (WRK-{item.agentId?.slice(0, 6)})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
