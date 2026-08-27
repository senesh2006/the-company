"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Compass, ChevronRight, ChevronLeft, X, CheckCircle2, RotateCcw, Zap } from "lucide-react";
import { api } from "@/lib/api";

export interface TourStep {
  id: string;
  title: string;
  category: string;
  content: string;
  targetId?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "⚡ Welcome to Company OS Demo",
    category: "Judge Guided Tour",
    content: "You are exploring a pre-seeded, live multi-agent AI workforce. Take a 30-second guided walkthrough to discover how autonomous specialist agents run business operations.",
  },
  {
    id: "agents",
    title: "🤖 Autonomous Specialist AI Fleet",
    category: "AI Workforce",
    content: "Four specialized AI workers — Sarah Chen (Marketing), Frank Wright (Finance), Elena Rostova (Engineering), and Marcus Vance (Intel Lead) — execute mandates with tiered trust guardrails.",
  },
  {
    id: "prompts",
    title: "⚡ 1-Click Scenario Prompts",
    category: "Interactive Execution",
    content: "Use the 'Try a Scenario Prompt' panel on your dashboard to dispatch real tasks with 1 click directly into the live worker execution engine.",
    targetId: "demo-prompts-panel"
  },
  {
    id: "audit",
    title: "📡 Live Operations & Audit Trail",
    category: "Governance & Transparency",
    content: "Every worker thought, tool invocation, and decision is logged in real-time in the Live Operations feed with 100% auditability and maker-checker validation.",
  },
  {
    id: "finance",
    title: "📊 GAAP Ledger & 2-Way Sheets Sync",
    category: "Financial System",
    content: "Inspect 6 months of historical double-entry general ledger transactions balancing to $620,000.00 cash on hand with live trial balance equilibrium.",
  },
  {
    id: "knowledge",
    title: "📁 Knowledge Base & 11 Indexed Documents",
    category: "Shared Memory",
    content: "11 domain documents (Markdown, CSV, TXT, PDF) are indexed in shared memory for instant worker contextual retrieval.",
  }
];

export function DemoGuidedTour() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("companyos_demo_tour_seen");
      if (!seen) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("companyos_demo_tour_seen", "true");
    }
  };

  const handleReopen = () => {
    setCurrentStepIdx(0);
    setIsOpen(true);
  };

  const handleResetAccount = async () => {
    setResetting(true);
    setResetMsg(null);
    try {
      await api.resetDemoAccount();
      setResetMsg("Demo account restored to pristine baseline state!");
      setTimeout(() => {
        setResetMsg(null);
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 1200);
    } catch (err: any) {
      setResetMsg(err?.message || "Failed to reset demo state.");
      setTimeout(() => setResetMsg(null), 4000);
    } finally {
      setResetting(false);
    }
  };

  const currentStep = TOUR_STEPS[currentStepIdx];

  return (
    <div className="w-full mb-6">
      {/* Top Banner Control Bar */}
      <div id="demo-tour-banner" className="bg-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 text-white shadow-xs">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-100">Company OS — Judge Demo Mode</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Live & Self-Healing
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Pre-seeded with 6-month financial ledger & 11 knowledge base docs</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {resetMsg && (
            <span className="text-[11px] font-semibold text-emerald-400 mr-2 animate-pulse">
              {resetMsg}
            </span>
          )}

          <button
            type="button"
            disabled={resetting}
            onClick={handleResetAccount}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Restore demo account to clean baseline state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin text-amber-400" : ""}`} />
            <span>{resetting ? "Resetting..." : "Reset Demo"}</span>
          </button>

          <button
            type="button"
            onClick={handleReopen}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Guided Walkthrough</span>
          </button>
        </div>
      </div>

      {/* Guided Tour Modal / Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="mt-3 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative z-30 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                  {currentStep.category}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Step {currentStepIdx + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Exit Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
              {currentStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              {currentStep.content}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStepIdx
                        ? "w-5 bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{currentStepIdx === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
