"use client";

import { useNeedsAttention } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Check, X, UserCheck, ShieldAlert, RotateCcw } from "lucide-react";

export default function NeedsAttentionPage() {
  const { data: items, isLoading } = useNeedsAttention();
  const { setSelectedAgentId } = useAppStore();

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Scanning workforce alerts & blockers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Needs Attention
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              {items?.length || 0} Blockers
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Autonomous AI workers currently blocked or requesting manual parameter authorization.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items?.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                    Blocked Worker
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.agentName}</h3>
                </div>
                <button 
                  onClick={() => setSelectedAgentId(item.agentId)}
                  className="text-xs text-slate-400 hover:text-emerald-700 font-medium mt-1 flex items-center gap-1 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Worker ID: WRK-{item.agentId?.slice(0, 8)}
                </button>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold uppercase w-fit">
                {item.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Overview</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Exception Details</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs">
                <Check className="w-3.5 h-3.5" /> Approve Action
              </button>
              <button className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs">
                <X className="w-3.5 h-3.5" /> Reject & Abort
              </button>
              <button 
                onClick={() => setSelectedAgentId(item.agentId)}
                className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all ml-auto shadow-xs"
              >
                Inspect Worker Directives
              </button>
            </div>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Workforce Operational</h3>
            <p className="text-xs text-slate-400 max-w-md">No AI workers require manual intervention or exception handling at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
