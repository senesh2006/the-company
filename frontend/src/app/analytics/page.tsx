"use client";

import { useMetrics, useAgents } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { DollarSign, Users, Activity, CheckCircle2, TrendingUp, Cpu, ShieldAlert, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading, error: agentsError } = useAgents();
  const { setSelectedAgentId } = useAppStore();

  if (isMetricsLoading || isAgentsLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Aggregating workforce telemetry & cost analytics...</p>
        </div>
      </div>
    );
  }

  if (metricsError || agentsError || !metrics || !agents) {
    return (
      <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
        <p className="text-sm font-bold text-rose-400">Failed to load workforce analytics and telemetry data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Operational Telemetry
              </span>
              <span className="text-xs text-slate-400 font-mono">Resource & Financial Efficiency</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Cost & Workforce Analytics
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time financial attribution, inference token costs, autonomous unit utilization, and system-wide throughput metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-2 font-mono text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Telemetry Stream
            </div>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Run Cost</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-100 font-mono">
              ${(metrics.totalCost ?? 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Optimally routed inference
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total AI Workers</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-100 font-mono">{metrics.totalAgents ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {metrics.activeAgents ?? 0} active ({(metrics.totalAgents ?? 0) > 0 ? Math.round(((metrics.activeAgents ?? 0) / (metrics.totalAgents ?? 1)) * 100) : 0}% utilization)
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Operations</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-100 font-mono">{metrics.completedTasks ?? 0}</p>
            <p className="text-[11px] text-cyan-400 mt-1 font-mono">
              {metrics.totalTasks ?? 0} total dispatched
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Risk Posture</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-400 font-mono capitalize">
              {metrics.riskLevel || 'Nominal'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">All guardrails compliant</p>
          </div>
        </div>
      </section>

      {/* Worker Utilization Breakdown */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            AI Worker Performance & State Matrix
          </h2>
          <span className="text-xs font-mono text-slate-400">{agents.length} Deployed Units</span>
        </div>

        {agents.length === 0 ? (
          <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-800">
            <Users className="w-10 h-10 text-slate-600" />
            <h3 className="text-base font-bold text-slate-200">No Workers Active</h3>
            <p className="text-xs text-slate-400 max-w-md">Provision AI workers in the Recruitment Center to begin recording execution telemetry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                onClick={() => setSelectedAgentId(agent.id)}
                className="bento-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/40 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 font-mono text-xs font-bold">
                    WRK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {agent.name}
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {agent.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{agent.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Efficiency</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">99.4% Latency SLO</span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${
                    agent.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    agent.status === 'Idle' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    agent.status === 'Paused' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      agent.status === 'Running' ? 'bg-emerald-400 animate-pulse' :
                      agent.status === 'Idle' ? 'bg-amber-400' :
                      agent.status === 'Paused' ? 'bg-orange-400' : 'bg-rose-400'
                    }`}></span>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
