"use client";

import { useTasks, useMetrics } from "@/lib/queries";

export default function TasksPage() {
  const { data: tasks, isLoading: isTasksLoading, error: tasksError } = useTasks();
  const { data: metrics } = useMetrics();

  if (isTasksLoading && !tasks) {
    return (
      <div className="flex h-full items-center justify-center p-xl">
        <div className="flex flex-col items-center gap-md">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-body-md text-secondary">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (tasksError || !tasks) {
    return (
      <div className="flex h-full items-center justify-center p-xl">
        <p className="font-body-md text-error">Failed to load tasks.</p>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  const totalTasks = tasks.length;

  return (
    <div className="flex flex-col gap-xl p-xl h-full overflow-y-auto no-scrollbar">
      <header className="glass-header flex flex-col gap-sm">
        <h1 className="font-display-lg text-primary">Tasks</h1>
        <p className="font-body-md text-secondary">Monitor and manage all operations.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-secondary">list_alt</span>
          <p className="font-label-caps text-secondary">Total Tasks</p>
          <p className="font-headline-sm text-primary">{totalTasks}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-green-500">check_circle</span>
          <p className="font-label-caps text-secondary">Completed</p>
          <p className="font-headline-sm text-primary">{completedCount}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-blue-500">autorenew</span>
          <p className="font-label-caps text-secondary">Running</p>
          <p className="font-headline-sm text-primary">{runningCount}</p>
        </div>
        <div className="bento-card flex flex-col gap-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="font-label-caps text-secondary">Failed</p>
          <p className="font-headline-sm text-primary">{failedCount}</p>
        </div>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="font-headline-sm text-primary">Task Queue</h2>
        {tasks.length === 0 ? (
          <div className="premium-card flex flex-col items-center justify-center p-xl gap-md text-center">
             <span className="material-symbols-outlined text-display-lg text-secondary opacity-50">inbox</span>
             <p className="font-body-md text-secondary">No tasks yet. Hire an agent and assign a goal to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-sm">
            {tasks.map((task) => {
               const getStatusColor = (status: string) => {
                 switch (status) {
                   case 'running': return 'text-primary bg-primary/10';
                   case 'completed': return 'text-green-500 bg-green-500/10';
                   case 'failed': return 'text-error bg-error/10';
                   case 'pending': return 'text-secondary bg-surface-container';
                   default: return 'text-secondary bg-surface-container';
                 }
               };

               const statusColor = getStatusColor(task.status);

               // Simple relative time calculation
               const getRelativeTime = (dateString?: string) => {
                  if (!dateString) return "unknown time";
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                  
                  if (diffInSeconds < 60) return "just now";
                  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                  return `${Math.floor(diffInSeconds / 86400)}d ago`;
               };

               return (
                <div key={task.id} className="premium-card flex flex-col md:flex-row items-start md:items-center justify-between gap-md p-md">
                  <div className="flex flex-col gap-xs flex-1">
                    <p className="font-body-md text-primary">{task.description}</p>
                    <div className="flex items-center gap-sm">
                       <p className="font-label-caps text-secondary">ID: {task.id.slice(0, 8)}</p>
                       <p className="font-label-caps text-secondary">•</p>
                       <p className="font-label-caps text-secondary">Priority: {task.priority}</p>
                       <p className="font-label-caps text-secondary">•</p>
                       <p className="font-label-caps text-secondary">{getRelativeTime(task.created_at)}</p>
                    </div>
                  </div>
                  <div className={`px-sm py-xs rounded-full flex items-center gap-xs ${statusColor}`}>
                     {task.status === 'running' && <div className="pulse-dot bg-primary w-2 h-2 rounded-full"></div>}
                     <span className="font-label-caps uppercase">{task.status}</span>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
