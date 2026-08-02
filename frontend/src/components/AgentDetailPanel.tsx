"use client";

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAgent, useUpdateAgentStatus, useInjectInstruction } from '@/lib/queries';
import { api, TrustTier } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Power, Terminal, Zap, Send, ShieldCheck, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';

export function AgentDetailPanel() {
  const { selectedAgentId, setSelectedAgentId } = useAppStore();
  const [instructionText, setInstructionText] = useState("");
  const [injectedFeedback, setInjectedFeedback] = useState<string | null>(null);
  const [governanceActionPending, setGovernanceActionPending] = useState(false);

  const { data: agent, isLoading, refetch } = useAgent(selectedAgentId || '');
  const updateStatus = useUpdateAgentStatus();
  const injectInstruction = useInjectInstruction();

  const handleStatusChange = (newStatus: 'Running' | 'Paused' | 'Idle' | 'Failed') => {
    if (!selectedAgentId) return;
    updateStatus.mutate({ id: selectedAgentId, status: newStatus });
  };

  const handlePromote = async () => {
    if (!selectedAgentId) return;
    setGovernanceActionPending(true);
    try {
      await api.promoteWorker(selectedAgentId);
      setInjectedFeedback("Worker promoted to next trust tier!");
      refetch();
    } catch (e: any) {
      setInjectedFeedback("Promotion failed: " + e.message);
    } finally {
      setGovernanceActionPending(false);
      setTimeout(() => setInjectedFeedback(null), 3000);
    }
  };

  const handleDemote = async () => {
    if (!selectedAgentId) return;
    setGovernanceActionPending(true);
    try {
      await api.demoteWorker(selectedAgentId, "Founder manual rollback");
      setInjectedFeedback("Worker demoted to previous tier.");
      refetch();
    } catch (e: any) {
      setInjectedFeedback("Demotion failed: " + e.message);
    } finally {
      setGovernanceActionPending(false);
      setTimeout(() => setInjectedFeedback(null), 3000);
    }
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

  const trustTier = (agent?.trust_tier || 'observe') as TrustTier;
  const cleanCycles = agent?.clean_cycles_count || 0;
  const authorityLimit = agent?.authority_limit_usd ?? (trustTier === 'operate' ? 1000 : trustTier === 'assist' ? 100 : 0);

  return (
    <AnimatePresence>
      {selectedAgentId && (
        <motion.div
          initial={{ x: 440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 440, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-slate-950/95 border-l border-white/10 z-50 flex flex-col shadow-2xl backdrop-blur-2xl text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
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
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                    AI Worker
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{agent?.role || 'Autonomous Unit'}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedAgentId(null)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
              <p className="text-xs font-mono">Syncing worker state...</p>
            </div>
          ) : agent ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Trust Tier & Governance Governance Card (PRD v6.0 §6.1) */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Earned Trust Governance</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                    trustTier === 'operate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    trustTier === 'assist' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {trustTier} Tier
                  </span>
                </div>

                {/* Progress bar towards Assist promotion */}
                {trustTier === 'observe' && (
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Clean Cycles for Assist Promotion</span>
                      <span className="font-mono text-cyan-400">{cleanCycles} / 3</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min((cleanCycles / 3) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block">Authority Limit</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5">
                      ${authorityLimit.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block">Specialization</span>
                    <span className="text-xs font-medium text-slate-300 font-mono mt-0.5 truncate block">
                      {agent.specialization_id || 'standard-v1'}
                    </span>
                  </div>
                </div>

                {/* Manual Promotion / Demotion Controls */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handlePromote}
                    disabled={governanceActionPending || trustTier === 'operate'}
                    className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Promote Tier
                  </button>
                  <button
                    onClick={handleDemote}
                    disabled={governanceActionPending || trustTier === 'observe'}
                    className="flex-1 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <ArrowDownRight className="w-3 h-3" /> Demote / Rollback
                  </button>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex gap-2">
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
                    <Pause className="w-3.5 h-3.5" /> Pause Worker
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('Idle')}
                  disabled={updateStatus.isPending}
                  className="py-2 px-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" /> Reset Idle
                </button>
              </div>

              {/* Directive Injection Form */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300">Live Directive Injection</span>
                </div>
                <form onSubmit={handleInject} className="space-y-2">
                  <textarea
                    rows={2}
                    value={instructionText}
                    onChange={(e) => setInstructionText(e.target.value)}
                    placeholder="Inject instruction into running worker..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!instructionText.trim() || injectInstruction.isPending}
                    className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" /> Inject Directive
                  </button>
                </form>
              </div>

              {injectedFeedback && (
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs text-center font-mono">
                  {injectedFeedback}
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
