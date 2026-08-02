"use client";

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAgent, useUpdateAgentStatus, useInjectInstruction } from '@/lib/queries';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Power, Terminal, Zap, Send, ShieldCheck, Cpu } from 'lucide-react';

export function AgentDetailPanel() {
  const { selectedAgentId, setSelectedAgentId } = useAppStore();
  const [instructionText, setInstructionText] = useState("");
  const [injectedFeedback, setInjectedFeedback] = useState<string | null>(null);

  const { data: agent, isLoading } = useAgent(selectedAgentId || '');
  const updateStatus = useUpdateAgentStatus();
  const injectInstruction = useInjectInstruction();

  const handleStatusChange = (newStatus: 'Running' | 'Paused' | 'Idle' | 'Failed') => {
    if (!selectedAgentId) return;
    updateStatus.mutate({ id: selectedAgentId, status: newStatus });
  };

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || !instructionText.trim() || injectInstruction.isPending) return;

    injectInstruction.mutate(
      { id: selectedAgentId, instruction: instructionText.trim() },
      {
        onSuccess: () => {
          setInjectedFeedback("Directive injected successfully");
          setInstructionText("");
          setTimeout(() => setInjectedFeedback(null), 3000);
        },
        onError: () => {
          setInjectedFeedback("Failed to inject directive");
          setTimeout(() => setInjectedFeedback(null), 3000);
        }
      }
    );
  };

  return (
    <AnimatePresence>
      {selectedAgentId && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-slate-900/95 border-l border-slate-800/80 z-50 flex flex-col shadow-2xl backdrop-blur-2xl text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ring-4 ${
                agent?.status === 'Running' ? 'bg-emerald-400 ring-emerald-500/20 animate-pulse' :
                agent?.status === 'Failed' ? 'bg-rose-500 ring-rose-500/20' :
                agent?.status === 'Paused' ? 'bg-amber-400 ring-amber-500/20' :
                'bg-slate-500 ring-slate-500/20'
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-100">{agent?.name || 'Inspecting Worker...'}</h2>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                    AI Worker
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{agent?.role || 'Autonomous Unit'}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
              <p className="text-xs font-mono">Syncing neural state...</p>
            </div>
          ) : agent ? (
            <>
              {/* Telemetry Stats Grid */}
              <div className="grid grid-cols-2 border-b border-slate-800/80 bg-slate-950/30">
                <div className="p-4 border-r border-slate-800/80 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Execution State</span>
                  <span className={`text-base font-extrabold font-mono ${
                    agent.status === 'Running' ? 'text-emerald-400' :
                    agent.status === 'Paused' ? 'text-amber-400' :
                    agent.status === 'Failed' ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Worker Identifier</span>
                  <span className="text-base font-extrabold text-slate-200 font-mono">
                    WRK-{agent.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Quick Action Controls */}
              <div className="p-4 flex gap-2 border-b border-slate-800/80 bg-slate-900/40">
                {agent.status === 'Paused' ? (
                  <button
                    onClick={() => handleStatusChange('Running')}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Resume Worker
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('Paused')}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Pause Execution
                  </button>
                )}

                <button
                  onClick={() => handleStatusChange('Idle')}
                  disabled={updateStatus.isPending}
                  className="flex-1 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" /> Reset State
                </button>
              </div>

              {/* Current Active Directive */}
              <div className="p-4 border-b border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Active Mission Directive
                </span>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-medium text-slate-300 leading-relaxed font-mono">
                  {agent.current_task_id 
                    ? `Executing Operation: ${agent.current_task_id}` 
                    : 'Autonomous worker is polling the task router for new directives.'}
                </div>
              </div>

              {/* Live Neural Stream */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950/50">
                <div className="p-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Real-Time Neural Activity
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Sync
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2.5 font-mono text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">00:01</span>
                    <span className="text-emerald-400 font-bold">{'>'}</span>
                    <span className="text-slate-300">Initialized core cognitive model with business context.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">00:03</span>
                    <span className="text-teal-400 font-bold">{'>'}</span>
                    <span className="text-slate-300">Memory cache loaded (14 active knowledge entries).</span>
                  </div>
                  {agent.status === 'Running' ? (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 select-none">00:05</span>
                      <span className="text-cyan-400 font-bold animate-pulse">{'>'}</span>
                      <span className="text-cyan-300">Processing autonomous workflow step...</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-600 select-none">00:05</span>
                      <span className="text-slate-500 font-bold">{'>'}</span>
                      <span className="text-slate-500">Awaiting runtime directive dispatch.</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Inject Directive Form */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
                {injectedFeedback && (
                  <div className="mb-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {injectedFeedback}
                  </div>
                )}
                <form onSubmit={handleInject} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={instructionText}
                    onChange={(e) => setInstructionText(e.target.value)}
                    placeholder="Inject live prompt or directive..." 
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-slate-100 placeholder:text-slate-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!instructionText.trim() || injectInstruction.isPending}
                    className="absolute right-2 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:hover:text-emerald-400 transition-colors"
                  >
                    {injectInstruction.isPending ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-emerald-400 border-t-transparent animate-spin"></div>
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-slate-500">
              Worker not found or unmounted.
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
