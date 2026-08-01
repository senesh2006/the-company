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
    queryFn: () => api.getAgent(selectedAgentId!),
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
          className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 z-50 flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                agent?.status === 'Running' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                agent?.status === 'Failed' ? 'bg-red-500' :
                agent?.status === 'Paused' ? 'bg-amber-500' :
                'bg-gray-400'
              }`} />
              <div>
                <h2 className="font-bold text-gray-900">{agent?.name || 'Loading...'}</h2>
                <p className="text-xs text-gray-500 font-medium">{agent?.role}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 flex justify-center"><Activity className="w-6 h-6 text-gray-400 animate-spin" /></div>
          ) : agent ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 border-b border-gray-200">
                <div className="p-4 border-r border-gray-200 flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider">STATUS</span>
                  <span className="text-xl font-bold text-gray-900">{agent.status}</span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider">AGENT ID</span>
                  <span className="text-xl font-bold text-gray-900">{agent.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="p-4 flex gap-2 border-b border-gray-200 bg-gray-50/50">
                <Button variant="outline" size="sm" className="flex-1 bg-white border-gray-200 hover:bg-gray-50 hover:text-amber-600 shadow-sm text-gray-700">
                  <Pause className="w-4 h-4 mr-2" /> Pause
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-white border-gray-200 hover:bg-gray-50 hover:text-red-600 shadow-sm text-gray-700">
                  <Power className="w-4 h-4 mr-2" /> Kill
                </Button>
              </div>

              {/* Current Task */}
              <div className="p-4 border-b border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold mb-2 block tracking-wider">CURRENT DIRECTIVE</span>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm font-medium text-gray-700">
                  {agent.current_task_id ? `Executing Task ${agent.current_task_id}` : 'Idling, waiting for global router...'}
                </div>
              </div>

              {/* Live Stream */}
              <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30">
                <div className="p-4 pb-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider">ACTIVITY STREAM</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 font-mono text-xs">
                  {agent.status === 'Running' && (
                    <div className="text-gray-600 flex gap-2">
                      <span className="text-blue-500 font-bold">{'>'}</span>
                      <span className="typing-effect text-gray-800 font-medium">Analyzing data from memory...</span>
                    </div>
                  )}
                  {agent.status === 'Idle' && (
                    <div className="text-gray-400 flex gap-2">
                      <span>{'>'}</span>
                      <span>Polling for new assignments.</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Inject Box */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Inject instruction..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 shadow-sm"
                  />
                  <Zap className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-gray-500 text-center font-medium">Agent not found.</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
