"use client";

import { useState } from "react";
import { useTasks, useMetrics } from "@/lib/queries";

export default function TasksPage() {
  const { data: tasks, isLoading: isTasksLoading, error: tasksError } = useTasks();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  if (isTasksLoading && !tasks) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-sm font-mono text-slate-500">Streaming execution telemetry & mission logs...</p>
        </div>
      </div>
    );
  }

  if (tasksError || !tasks) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center flex flex-col items-center gap-3 max-w-md shadow-sm">
          <span className="material-symbols-outlined text-rose-600 text-4xl">error</span>
          <p className="text-base font-bold text-rose-800">Telemetry Stream Disconnected</p>
          <p className="text-xs text-slate-600">Failed to establish connection to Company OS worker execution bus.</p>
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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Executing
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Terminated
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
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
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                Mission Telemetry Hub
              </span>
              <span className="text-xs text-emerald-100 font-mono">Real-Time Worker Execution Stream</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Tasks & Workflows
            </h1>
            <p className="text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Monitor autonomous execution traces, inspect deterministic outputs, and audit real-time directives dispatched across your AI worker fleet.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/hire" 
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-emerald-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-emerald-700">add_task</span>
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
            filter === 'all' ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Operations</span>
            <span className="material-symbols-outlined text-slate-400 text-lg">stacked_line_chart</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono">{totalTasks}</p>
            <span className="text-xs text-emerald-700 font-medium font-mono">Logged</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("running")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'running' ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Execution</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg animate-spin">sync</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-700 font-mono">{runningCount}</p>
            <span className="text-xs text-slate-500 font-mono">In-flight</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("completed")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'completed' ? 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-500/30' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-teal-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Success Rate</span>
            <span className="material-symbols-outlined text-teal-600 text-lg">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-teal-700 font-mono">{successRate}%</p>
            <span className="text-xs text-slate-500 font-mono">{completedCount} resolved</span>
          </div>
        </div>

        <div 
          onClick={() => setFilter("failed")}
          className={`bento-card p-5 cursor-pointer transition-all ${
            filter === 'failed' ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500/30' : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Exceptions</span>
            <span className="material-symbols-outlined text-rose-600 text-lg">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-rose-700 font-mono">{failedCount}</p>
            <span className="text-xs text-slate-500 font-mono">Terminated</span>
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'running', 'completed', 'failed', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap shadow-xs ${
                filter === f 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {f === 'all' ? 'All Operations' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Feed */}
      {filteredTasks.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-300 bg-white">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-500 border border-slate-200">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">No Operations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            {filter === 'all' 
              ? 'No missions have been dispatched to AI workers yet.' 
              : `No operations currently match the '${filter}' status filter.`}
          </p>
          <a
            href="/hire"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
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
                  isExpanded ? 'border-emerald-500 shadow-md bg-white' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(task.status)}
                      <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold">
                        OP-{task.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {getRelativeTime(task.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {task.description || task.mandate || "Autonomous Operation"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {hasResult && (
                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border shadow-xs ${
                          isExpanded 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
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
                  <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
                          Deterministic Output & Execution Trace
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyResult(task.id, task.result || "")}
                        className="text-[11px] font-mono text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedTaskId === task.id ? 'done' : 'content_copy'}
                        </span>
                        {copiedTaskId === task.id ? 'Copied to Clipboard' : 'Copy Trace'}
                      </button>
                    </div>
                    
                    <pre className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[350px] border border-slate-800 shadow-inner">
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
