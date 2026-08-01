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
        <Card className="bg-white border border-gray-100 shadow-sm p-5 flex flex-col justify-between h-28 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <span className="text-sm font-medium">Active Agents</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">{activeAgentsCount}</span>
        </Card>
        
        <Card className="bg-white border border-gray-100 shadow-sm p-5 flex flex-col justify-between h-28 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <span className="text-sm font-medium">Running Tasks</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">{runningTasksCount}</span>
        </Card>

        <Card className={`bg-white border border-gray-100 shadow-sm p-5 flex flex-col justify-between h-28 rounded-2xl ${attentionCount > 0 ? 'ring-1 ring-amber-500/50' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <div className={`flex items-center gap-2 ${attentionCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
              <span className="text-sm font-medium">Needs Attention</span>
            </div>
            {attentionCount > 0 && <ShieldAlert className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="flex justify-between items-end">
            <span className={`text-3xl font-bold ${attentionCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{attentionCount}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${attentionCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {attentionCount > 0 ? 'Requires Review' : 'All Clear'}
            </span>
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-100 shadow-sm p-5 flex flex-col justify-between h-28 rounded-2xl">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <span className="text-sm font-medium">Avg Confidence</span>
          </div>
          <span className="text-3xl font-bold text-gray-900">{avgConfidence.toFixed(1)}%</span>
        </Card>
      </div>

      {/* Main Canvas Controls */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
          <button 
            onClick={() => setViewMode('hierarchy')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${viewMode === 'hierarchy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Org Hierarchy
          </button>
          <button 
            onClick={() => setViewMode('tasks')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${viewMode === 'tasks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Task Graph
          </button>
        </div>
        
        <Button size="sm" className="bg-black hover:bg-gray-800 text-white font-medium rounded-full px-5">
          Launch Mission <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl overflow-auto relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {viewMode === 'hierarchy' ? (
          isHierarchyLoading ? <div className="p-8 text-gray-400 font-medium">Connecting to swarm...</div> :
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
