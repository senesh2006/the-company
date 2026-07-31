"use client";

import { useQuery } from '@tanstack/react-query';
import { api, type Task } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleDashed, Clock, XCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskGraph() {
  const { businessId } = useAppStore();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', businessId],
    queryFn: () => api.getTasks(businessId),
    refetchInterval: 2000,
  });

  if (isLoading) return <div className="p-8 text-zinc-500 font-mono">Loading DAG...</div>;
  if (!tasks || tasks.length === 0) return <div className="p-8 text-zinc-500 font-mono">No tasks active.</div>;

  const rootTasks = tasks.filter(t => !t.parent_id);

  return (
    <div className="p-8 space-y-6">
      {rootTasks.map(root => (
        <TaskNode key={root.id} task={root} allTasks={tasks} />
      ))}
    </div>
  );
}

function TaskNode({ task, allTasks, level = 0 }: { task: Task, allTasks: Task[], level?: number }) {
  const subTasks = allTasks.filter(t => t.parent_id === task.id);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'running': return <PlayCircle className="w-4 h-4 text-emerald-400 animate-pulse" />;
      case 'failed': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'assigned': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <CircleDashed className="w-4 h-4 text-zinc-600" />;
    }
  };

  return (
    <div className="relative">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "glass-panel border p-4 rounded-lg w-[450px] relative z-10",
          task.status === 'running' ? "border-emerald-500/30" : "border-zinc-800"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div>
              <p className="text-sm text-zinc-200">{task.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">
                  {task.id}
                </span>
                {task.assignee_role && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    → {task.assignee_role}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-[10px] uppercase font-mono tracking-wider font-semibold">
            <span className={cn(
              task.status === 'running' && 'text-emerald-400',
              task.status === 'completed' && 'text-emerald-600',
              task.status === 'failed' && 'text-rose-500',
              (task.status === 'queued' || task.status === 'pending') && 'text-zinc-600'
            )}>{task.status}</span>
          </div>
        </div>
      </motion.div>

      {subTasks.length > 0 && (
        <div className="ml-6 pl-8 border-l-2 border-zinc-800/50 relative mt-4 space-y-4">
          {subTasks.map(sub => (
            <div key={sub.id} className="relative">
              <div className="absolute top-6 -left-8 w-8 h-[2px] bg-zinc-800/50" />
              <TaskNode task={sub} allTasks={allTasks} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
