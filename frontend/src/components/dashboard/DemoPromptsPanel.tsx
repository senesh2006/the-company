"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Bot, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

export interface DemoPromptItem {
  id: string;
  label: string;
  role: string;
  worker_name: string;
  category: string;
  badge_color?: string;
  description: string;
  prompt_text: string;
}

interface DemoPromptsPanelProps {
  onTaskDispatched?: (task: any) => void;
}

export function DemoPromptsPanel({ onTaskDispatched }: DemoPromptsPanelProps) {
  const [prompts, setPrompts] = useState<DemoPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrompts() {
      try {
        const data = await api.getDemoPrompts();
        if (data && Array.isArray(data.prompts)) {
          setPrompts(data.prompts);
        }
      } catch (err) {
        console.warn("Could not load backend demo prompts, using fallback:", err);
        setPrompts(FALLBACK_DEMO_PROMPTS);
      } finally {
        setLoading(false);
      }
    }
    loadPrompts();
  }, []);

  const handleDispatchPrompt = async (promptItem: DemoPromptItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDispatchingId(promptItem.id);

    try {
      // Re-use real task dispatch pipeline
      const task = await api.dispatchMandate({
        mandate: promptItem.prompt_text,
        assignee_role: promptItem.role,
        priority: "high"
      });

      setSuccessMsg(`Task queued for ${promptItem.worker_name} (${promptItem.role})!`);
      if (onTaskDispatched) {
        onTaskDispatched(task);
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        setErrorMsg("Demo rate limit reached (3 tasks per 10 min window). Please wait a few minutes before dispatching another task.");
      } else {
        setErrorMsg(msg || "Could not dispatch task. Please try again.");
      }
    } finally {
      setDispatchingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bento-card p-6 border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 rounded-2xl animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="demo-prompts-panel" className="bento-card p-6 sm:p-7 border border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent rounded-2xl relative overflow-hidden mb-8 shadow-sm">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-amber-500/10 to-transparent pointer-events-none rounded-full blur-2xl"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Try a Scenario Prompt
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                1-Click Live Execution
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Click any card to dispatch a live mandate directly to your autonomous AI specialists.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </motion.div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {prompts.map((item) => {
          const isDispatching = dispatchingId === item.id;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badge_color || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {item.category}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.worker_name}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {item.label}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                disabled={isDispatching || dispatchingId !== null}
                onClick={() => handleDispatchPrompt(item)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white text-[11px] font-bold transition-all flex items-center justify-between disabled:opacity-50 cursor-pointer"
              >
                {isDispatching ? (
                  <span className="flex items-center gap-1.5 mx-auto">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Dispatching...</span>
                  </span>
                ) : (
                  <>
                    <span>Dispatch Mandate</span>
                    <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const FALLBACK_DEMO_PROMPTS: DemoPromptItem[] = [
  {
    id: "prompt-mktg-01",
    label: "Draft Q4 Growth Campaign",
    role: "Marketing Manager",
    worker_name: "Sarah Chen",
    category: "Growth & Outbound",
    badge_color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Generate a multi-channel outbound launch strategy targeting enterprise RevOps directors.",
    prompt_text: "Audit our ICP guidelines in shared memory and draft a 3-step outbound campaign strategy for enterprise RevOps buyers at $10M+ ARR SaaS companies, focusing on month-end financial close automation."
  },
  {
    id: "prompt-fin-01",
    label: "Audit P&L & Cash Runway",
    role: "Finance Manager",
    worker_name: "Frank Wright",
    category: "Finance & Accounting",
    badge_color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Perform a GAAP variance check on Q2 expenses and calculate monthly runway.",
    prompt_text: "Fetch our latest trial balance and general journal entries from the Google Sheets ledger service. Verify total debits equal credits, calculate net burn over the last 6 months, and report current cash runway."
  },
  {
    id: "prompt-eng-01",
    label: "Review Q4 Technical Roadmap",
    role: "Coder",
    worker_name: "Elena Rostova",
    category: "Engineering & Architecture",
    badge_color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Review product roadmap and outline technical architecture for WhatsApp webhooks.",
    prompt_text: "Inspect product_roadmap.md in our knowledge base and create a technical architecture proposal for integrating real-time WhatsApp operational alerts for financial variance thresholds."
  },
  {
    id: "prompt-intel-01",
    label: "Competitor Intelligence Matrix",
    role: "Researcher",
    worker_name: "Marcus Vance",
    category: "Market Intelligence",
    badge_color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Compare Aperture Analytics against Mosaic.tech and Cube Software.",
    prompt_text: "Retrieve competitor_analysis.md and sales_call_notes.txt from our documents library. Summarize top enterprise objections regarding SOC2 compliance and outline 3 key win strategies against Mosaic.tech."
  }
];
