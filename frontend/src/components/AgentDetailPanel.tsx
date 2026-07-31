"use client";

import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Play, Pause, Power, Terminal, Zap } from 'lucide-react';
import { Button } from './ui/button';

export function AgentDetailPanel() {
  const { selectedAgentId, setSelectedAgentId } = useAppStore();
  
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', selectedAgentId],
    queryFn: () => api.getAgentDetails(selectedAgentId!),
    enabled: !!selectedAgentId,
    refetchInterval: 2000,
  });

  return (
    <AnimatePresence>
      {selectedAgentId && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="fixed right-0 top-16 bottom-0 w-96 glass-panel border-l border-zinc-800 z-50 flex flex-col bg-zinc-950/95"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                agent?.status === 'running' ? 'bg-emerald-500 pulse-emerald' :
                agent?.status === 'failed' ? 'bg-rose-500' :
                agent?.status === 'temp_supervisor' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.7)] animate-pulse' :
                agent?.status === 'paused' ? 'bg-amber-500' :
                'bg-blue-500'
              }`} />
              <div>
                <h2 className="font-semibold text-zinc-100">{agent?.name || 'Loading...'}</h2>
                <p className="text-xs text-zinc-400 font-mono">{agent?.role}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 flex justify-center"><Activity className="w-6 h-6 text-zinc-500 animate-spin" /></div>
          ) : agent ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 border-b border-zinc-800">
                <div className="p-4 border-r border-zinc-800 flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">CONFIDENCE</span>
                  <span className="text-xl font-mono text-emerald-400">{agent.confidence || 0}%</span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">COST (RUN)</span>
                  <span className="text-xl font-mono text-zinc-300">${agent.cost_today?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 flex gap-2 border-b border-zinc-800">
                <Button variant="outline" size="sm" className="flex-1 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-amber-400">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-rose-400">
                  <Power className="w-4 h-4 mr-2" /> Kill
                </Button>
              </div>

              {/* Current Task */}
              <div className="p-4 border-b border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono mb-2 block">CURRENT DIRECTIVE</span>
                <div className="bg-zinc-900/50 p-3 rounded border border-zinc-800 text-sm text-zinc-300">
                  {agent.current_task_id ? `Executing Task ${agent.current_task_id}` : 'Idling, waiting for global router...'}
                </div>
              </div>

              {/* Live Stream */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 pb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500 font-mono">ACTIVITY STREAM</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 font-mono text-xs">
                  {agent.status === 'temp_supervisor' && (
                    <div className="text-purple-400 flex gap-2">
                      <span>{'>'}</span>
                      <span>Spawning sub-workers to handle complex sub-tasks...</span>
                    </div>
                  )}
                  {agent.status === 'running' && (
                    <div className="text-zinc-400 flex gap-2">
                      <span>{'>'}</span>
                      <span className="typing-effect">Analyzing data from memory...</span>
                    </div>
                  )}
                  {agent.status === 'idle' && (
                    <div className="text-zinc-600 flex gap-2">
                      <span>{'>'}</span>
                      <span>Polling for new assignments.</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Inject Box */}
              <div className="p-4 border-t border-zinc-800">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Inject instruction..." 
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-zinc-100 placeholder:text-zinc-600"
                  />
                  <Zap className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-zinc-500 text-center">Agent not found.</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
