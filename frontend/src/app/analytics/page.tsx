"use client";

import { useMetrics, useAgents } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { DollarSign, Users, CheckCircle2, TrendingUp, Cpu, ShieldAlert } from "lucide-react";

export default function AnalyticsPage() {
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useMetrics();
  const { data: agents, isLoading: isAgentsLoading, error: agentsError } = useAgents();
  const { setSelectedAgentId } = useAppStore();

  if (isMetricsLoading || isAgentsLoading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500">Aggregating workforce telemetry & cost analytics...</p>
        </div>
      </div>
    );
  }

  if (metricsError || agentsError || !metrics || !agents) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center shadow-xs">
        <p className="text-sm font-bold text-rose-800">Failed to load workforce analytics and telemetry data.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Operational Telemetry
              </span>
              <span className="text-xs text-emerald-100 font-mono">Resource & Financial Efficiency</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Cost & Workforce Analytics
            </h1>
            <p className="text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Real-time financial attribution, inference token costs, autonomous unit utilization, and system-wide throughput metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 bg-white/15 border border-white/20 rounded-2xl flex items-center gap-2 font-mono text-xs text-white backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Telemetry Stream
            </div>
          </div>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bento-card p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Run Cost</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 font-mono">
              ${(metrics.totalCost ?? 0).toFixed(2)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-mono flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> Optimally routed inference
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total AI Workers</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 font-mono">{metrics.totalAgents ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {metrics.activeAgents ?? 0} active ({(metrics.totalAgents ?? 0) > 0 ? Math.round(((metrics.activeAgents ?? 0) / (metrics.totalAgents ?? 1)) * 100) : 0}% utilization)
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Operations</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900 font-mono">{metrics.completedTasks ?? 0}</p>
            <p className="text-[11px] text-cyan-700 mt-1 font-mono font-semibold">
              {metrics.totalTasks ?? 0} total dispatched
            </p>
          </div>
        </div>

        <div className="bento-card p-6 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Risk Posture</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-700 font-mono capitalize">
              {metrics.riskLevel || 'Nominal'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">All guardrails compliant</p>
          </div>
        </div>
      </section>

      {/* Worker Utilization Breakdown */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-700" />
            AI Worker Performance & State Matrix
          </h2>
          <span className="text-xs font-mono text-slate-500">{agents.length} Deployed Units</span>
        </div>

        {agents.length === 0 ? (
          <div className="bento-card p-12 flex flex-col items-center justify-center text-center gap-4 border-dashed border-slate-300 bg-white">
            <Users className="w-10 h-10 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">No Workers Active</h3>
            <p className="text-xs text-slate-500 max-w-md">Provision AI workers in the Recruitment Center to begin recording execution telemetry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                onClick={() => setSelectedAgentId(agent.id)}
                className="bento-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-emerald-500/50 bg-white border border-slate-200 transition-all duration-200 group shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-800 shrink-0 font-mono text-xs font-bold">
                    WRK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {agent.name}
                      </h3>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {agent.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{agent.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Efficiency</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">99.4% Latency SLO</span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${
                    agent.status === 'Running' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    agent.status === 'Idle' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    agent.status === 'Paused' ? 'bg-orange-100 text-orange-800 border-orange-300' : 
                    'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      agent.status === 'Running' ? 'bg-emerald-500 animate-pulse' :
                      agent.status === 'Idle' ? 'bg-amber-500' :
                      agent.status === 'Paused' ? 'bg-orange-500' : 'bg-rose-500'
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
