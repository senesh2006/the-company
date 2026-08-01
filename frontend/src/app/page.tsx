"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useMetrics, useNeedsAttention, useAgents } from '@/lib/queries';
import { HierarchyTree } from '@/components/HierarchyTree';
import { TaskGraph } from '@/components/TaskGraph';
import { AgentDetailPanel } from '@/components/AgentDetailPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Server, Activity, ArrowRight, ShieldAlert } from 'lucide-react';

export default function CommandCenter() {
  const { businessId } = useAppStore();
  const [viewMode, setViewMode] = useState<'hierarchy' | 'tasks'>('hierarchy');

  const { data: hierarchy, isLoading: isHierarchyLoading } = useQuery({
    queryKey: ['hierarchy', businessId],
    queryFn: () => api.getHierarchy(businessId),
    refetchInterval: 3000,
  });

  const { data: metrics } = useMetrics();
  const { data: attentionItems } = useNeedsAttention();
  const { data: agents } = useAgents();

  const activeAgentsCount = metrics?.activeAgents || 0;
  const runningTasksCount = (metrics?.totalTasks || 0) - (metrics?.completedTasks || 0);
  const attentionCount = attentionItems?.length || 0;
  
  const avgConfidence = agents && agents.length > 0
    ? agents.reduce((acc, a) => acc + (a.confidence || 0), 0) / agents.length
    : 0;

  return (
    <div className="h-full flex flex-col relative">
      {/* Fleet Health Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
        <Card className="bg-zinc-950 border-zinc-800 p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <Server className="w-4 h-4" />
            <span className="text-xs font-mono">ACTIVE AGENTS</span>
          </div>
          <span className="text-2xl font-mono text-zinc-100">{activeAgentsCount}</span>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono">RUNNING TASKS</span>
          </div>
          <span className="text-2xl font-mono text-emerald-400">{runningTasksCount}</span>
        </Card>

        <Card className={`bg-zinc-950 p-4 flex flex-col justify-between h-24 ${attentionCount > 0 ? 'border-amber-900/50 bg-amber-950/10' : 'border-emerald-900/50 bg-emerald-950/10'}`}>
          <div className={`flex items-center gap-2 ${attentionCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-mono">NEEDS ATTENTION</span>
          </div>
          <div className="flex justify-between items-end">
            <span className={`text-2xl font-mono ${attentionCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{attentionCount}</span>
            <span className={`text-xs font-mono ${attentionCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {attentionCount > 0 ? 'REQUIRES REVIEW' : 'ALL CLEAR'}
            </span>
          </div>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-xs font-mono">AVG CONFIDENCE</span>
          </div>
          <span className="text-2xl font-mono text-emerald-400">{avgConfidence.toFixed(1)}%</span>
        </Card>
      </div>

      {/* Main Canvas Controls */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setViewMode('hierarchy')}
            className={`px-4 py-1.5 rounded-md text-xs font-mono transition-colors ${viewMode === 'hierarchy' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            ORG HIERARCHY
          </button>
          <button 
            onClick={() => setViewMode('tasks')}
            className={`px-4 py-1.5 rounded-md text-xs font-mono transition-colors ${viewMode === 'tasks' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            TASK GRAPH
          </button>
        </div>
        
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs">
          LAUNCH MISSION <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-lg overflow-auto relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {viewMode === 'hierarchy' ? (
          isHierarchyLoading ? <div className="p-8 text-zinc-500 font-mono">Connecting to swarm...</div> :
          hierarchy ? <HierarchyTree data={hierarchy} /> : null
        ) : (
          <TaskGraph />
        )}
      </div>

      {/* Slide-out Context Panel */}
      <AgentDetailPanel />
    </div>
  );
}
