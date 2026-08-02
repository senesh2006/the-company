"use client";

import { useState } from "react";
import { useTasks, useMetrics } from "@/lib/queries";

export default function TasksPage() {
  const { data: tasks, isLoading: isTasksLoading, error: tasksError } = useTasks();
  const { data: metrics } = useMetrics();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  if (isTasksLoading && !tasks) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-400">Streaming execution telemetry & mission logs...</p>
        </div>
      </div>
    );
  }

  if (tasksError || !tasks) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center flex flex-col items-center gap-3 max-w-md">
          <span className="material-symbols-outlined text-rose-400 text-4xl">error</span>
          <p className="text-base font-bold text-rose-300">Telemetry Stream Disconnected</p>
          <p className="text-xs text-slate-400">Failed to establish connection to Company OS worker execution bus.</p>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending" || t.status === "queued").length;
  const totalTasks = tasks.length;
  const successRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter = 
      filter === "all" ? true :
      filter === "running" ? t.status === "running" :
      filter === "completed" ? t.status === "completed" :
      filter === "failed" ? t.status === "failed" :
      filter === "pending" ? (t.status === "pending" || t.status === "queued") : true;

    const desc = t.description || t.mandate || "";
    const matchesSearch = 
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Boolean(t.result && t.result.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Executing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Terminated
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {status || 'Queued'}
          </span>
        );
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return "recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch {
      return "recently";
    }
  };

  const handleCopyResult = (taskId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mission Telemetry Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time Worker Execution Stream</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Tasks & Workflows
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Monitor autonomous execution traces, inspect deterministic outputs, and audit real-time directives dispatched across your AI worker fleet.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/hire" 
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add_task</span>
              Recruit & Assign Mission
            </a>
          </div>
        </div>
      </header>

      {/* Telemetry Metric Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilter("all")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'all' ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Operations</span>
            <span className="material-symbols-outlined text-slate-400 text-lg">stacked_line_chart</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-slate-100 font-mono">{totalTasks}</p>
            <span className="text-xs text-emerald-400 font-medium">Logged</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("running")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'running' ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Execution</span>
            <span className="material-symbols-outlined text-emerald-400 text-lg animate-spin">sync</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">{runningCount}</p>
            <span className="text-xs text-slate-400 font-mono">In-flight</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("completed")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'completed' ? 'border-teal-500/50 bg-teal-500/5 ring-1 ring-teal-500/30' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Success Rate</span>
            <span className="material-symbols-outlined text-teal-400 text-lg">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-teal-400 font-mono">{successRate}%</p>
            <span className="text-xs text-slate-400 font-mono">{completedCount} resolved</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("failed")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'failed' ? 'border-rose-500/50 bg-rose-500/5 ring-1 ring-rose-500/30' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Exceptions</span>
            <span className="material-symbols-outlined text-rose-400 text-lg">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-rose-400 font-mono">{failedCount}</p>
            <span className="text-xs text-slate-400 font-mono">Terminated</span>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task logs, descriptions, or worker outputs..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'running', 'completed', 'failed', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                filter === f 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {f === 'all' ? 'All Operations' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Feed */}
      {filteredTasks.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500 border border-slate-700/50">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="text-base font-bold text-slate-200">No Operations Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
            {filter === 'all' 
              ? 'No missions have been dispatched to AI workers yet.' 
              : `No operations currently match the '${filter}' status filter.`}
          </p>
          <a
            href="/hire"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            Deploy New Mission
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const hasResult = Boolean(task.result);

            return (
              <div 
                key={task.id} 
                className={`bento-card p-5 transition-all duration-200 border ${
                  isExpanded ? 'border-emerald-500/40 shadow-xl bg-slate-900/90' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(task.status)}
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-slate-800">
                        OP-{task.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {getRelativeTime(task.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-semibold text-slate-100 leading-snug">
                      {task.description || task.mandate || "Autonomous Operation"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {hasResult && (
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border ${
                          isExpanded 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isExpanded ? 'expand_less' : 'terminal'}
                        </span>
                        {isExpanded ? 'Collapse Trace' : 'Inspect Output'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Monospace Execution Console Drawer */}
                {isExpanded && task.result && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          Deterministic Output & Execution Trace
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyResult(task.id, task.result || "")}
                        className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedTaskId === task.id ? 'done' : 'content_copy'}
                        </span>
                        {copiedTaskId === task.id ? 'Copied to Clipboard' : 'Copy Trace'}
                      </button>
                    </div>
                    
                    <pre className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[350px] border border-slate-800/90 shadow-inner">
                      {task.result}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

