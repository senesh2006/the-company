"use client";

import { useState } from "react";
import { useTasks, useMetrics } from "@/lib/queries";

export default function TasksPage() {
  const { data: tasks, isLoading: isTasksLoading, error: tasksError } = useTasks();
  const { data: metrics } = useMetrics();
  const [filter, setFilter] = useState<string>("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  if (isTasksLoading && !tasks) {
    return (
      <div className="flex h-full items-center justify-center p-xl min-h-[400px]">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-body-md text-secondary">Loading operations and tasks...</p>
        </div>
      </div>
    );
  }

  if (tasksError || !tasks) {
    return (
      <div className="flex h-full items-center justify-center p-xl min-h-[400px]">
        <div className="p-xl bg-error/10 border border-error/20 rounded-xl text-center flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-error text-4xl">error</span>
          <p className="font-headline-sm text-error font-semibold">Failed to load tasks</p>
          <p className="font-body-md text-secondary">Please check your connection or database configuration.</p>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending" || t.status === "queued").length;
  const totalTasks = tasks.length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "running") return t.status === "running";
    if (filter === "completed") return t.status === "completed";
    if (filter === "failed") return t.status === "failed";
    if (filter === "pending") return t.status === "pending" || t.status === "queued";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {status || 'Pending'}
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

  return (
    <div className="flex flex-col gap-xl p-md md:p-xl h-full overflow-y-auto no-scrollbar max-w-[1440px] mx-auto">
      {/* Header */}
      <header className="glass-header flex flex-col md:flex-row md:items-center justify-between gap-md p-lg rounded-2xl border border-outline/10">
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-on-surface">Task & Mission Hub</h1>
          <p className="font-body-md text-secondary">Real-time telemetry and execution logs across all agent operations.</p>
        </div>
        <a 
          href="/hire" 
          className="bg-primary hover:bg-primary/90 text-white font-semibold px-lg py-sm rounded-xl transition-colors flex items-center gap-xs w-fit shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add_task</span>
          Deploy New Mission
        </a>
      </header>

      {/* Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div 
          onClick={() => setFilter("all")}
          className={`bento-card p-md cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container-low'}`}
        >
          <div className="flex items-center justify-between text-secondary mb-xs">
            <span className="font-label-caps text-label-caps">Total Tasks</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">list_alt</span>
          </div>
          <p className="font-headline-md text-headline-md text-on-surface font-bold">{totalTasks}</p>
        </div>

        <div 
          onClick={() => setFilter("running")}
          className={`bento-card p-md cursor-pointer transition-all ${filter === 'running' ? 'ring-2 ring-green-500 bg-green-500/5' : 'hover:bg-surface-container-low'}`}
        >
          <div className="flex items-center justify-between text-green-600 mb-xs">
            <span className="font-label-caps text-label-caps">Running</span>
            <span className="material-symbols-outlined text-green-500 text-[20px] animate-spin">sync</span>
          </div>
          <p className="font-headline-md text-headline-md text-green-600 font-bold">{runningCount}</p>
        </div>

        <div 
          onClick={() => setFilter("completed")}
          className={`bento-card p-md cursor-pointer transition-all ${filter === 'completed' ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : 'hover:bg-surface-container-low'}`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-xs">
            <span className="font-label-caps text-label-caps">Completed</span>
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
          </div>
          <p className="font-headline-md text-headline-md text-emerald-600 font-bold">{completedCount}</p>
        </div>

        <div 
          onClick={() => setFilter("failed")}
          className={`bento-card p-md cursor-pointer transition-all ${filter === 'failed' ? 'ring-2 ring-red-500 bg-red-500/5' : 'hover:bg-surface-container-low'}`}
        >
          <div className="flex items-center justify-between text-red-600 mb-xs">
            <span className="font-label-caps text-label-caps">Failed / Crashed</span>
            <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
          </div>
          <p className="font-headline-md text-headline-md text-red-600 font-bold">{failedCount}</p>
        </div>
      </section>

      {/* Task Queue Section */}
      <section className="flex flex-col gap-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
          <div className="flex items-center gap-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface">Execution Feed</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-semibold">
              {filteredTasks.length} {filter !== 'all' ? filter : ''} items
            </span>
          </div>

          <div className="flex items-center gap-xs overflow-x-auto pb-1 hide-scrollbar">
            {['all', 'running', 'completed', 'failed', 'pending'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-md py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                  filter === f 
                    ? 'bg-on-surface text-surface' 
                    : 'bg-surface-container hover:bg-surface-container-high text-secondary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="bento-card flex flex-col items-center justify-center p-xxl gap-md text-center">
            <span className="material-symbols-outlined text-display-lg text-secondary opacity-40">inbox</span>
            <p className="font-headline-sm text-headline-sm text-on-surface">No tasks in this view</p>
            <p className="font-body-md text-secondary max-w-md">
              {filter === 'all' 
                ? 'No operations have been dispatched yet. Go to Hire Agents to launch your first automated mission.' 
                : `There are currently no tasks with status '${filter}'.`}
            </p>
            {filter === 'all' && (
              <a href="/hire" className="px-lg py-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                Launch Mission
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-sm">
            {filteredTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const hasResult = Boolean(task.result);

              return (
                <div 
                  key={task.id} 
                  className={`bento-card p-lg transition-all border ${
                    isExpanded ? 'border-primary/40 shadow-md' : 'border-outline/10 hover:border-outline/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
                    <div className="flex-1 flex flex-col gap-xs min-w-0">
                      <div className="flex items-center gap-sm flex-wrap">
                        {getStatusBadge(task.status)}
                        <span className="font-code-sm text-xs text-secondary bg-surface-container px-2 py-0.5 rounded">
                          ID: {task.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-secondary">
                          {getRelativeTime(task.created_at)}
                        </span>
                      </div>
                      
                      <p className="font-body-lg text-on-surface font-medium mt-1 leading-snug">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-sm shrink-0">
                      {hasResult && (
                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="px-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg transition-colors flex items-center gap-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isExpanded ? 'expand_less' : 'terminal'}
                          </span>
                          {isExpanded ? 'Hide Result' : 'View Execution Output'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Result Drawer */}
                  {isExpanded && task.result && (
                    <div className="mt-md pt-md border-t border-outline/10">
                      <div className="flex items-center justify-between mb-xs">
                        <span className="font-label-caps text-xs text-secondary font-bold flex items-center gap-xs uppercase">
                          <span className="material-symbols-outlined text-[14px]">output</span>
                          Execution Output & Trace
                        </span>
                        <span className="text-[11px] text-secondary">
                          Task status: {task.status}
                        </span>
                      </div>
                      <pre className="p-md bg-zinc-950 text-zinc-100 rounded-xl font-code-sm text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px] border border-zinc-800">
                        {task.result}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

