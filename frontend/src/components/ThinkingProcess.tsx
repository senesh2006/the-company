"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, Sparkles, Cpu, CheckCircle2, Terminal } from "lucide-react";

export interface ThinkingProcessProps {
  /**
   * Raw text of thoughts or markdown reasoning
   */
  thoughtContent?: string;
  /**
   * Array of individual thought/reasoning steps if available
   */
  steps?: string[];
  /**
   * Title displayed in the thinking bar (e.g. "Thought Process", "Reasoning Trace")
   */
  title?: string;
  /**
   * Duration in seconds or formatted string (e.g. "Thought for 4.2s")
   */
  duration?: string | number;
  /**
   * Whether the AI worker is actively thinking right now
   */
  isThinking?: boolean;
  /**
   * Initial expanded state
   */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Extracts <thought>...</thought>, <think>...</think>, or <reasoning>...</reasoning>
 * blocks from text, returning the thought portion and the clean final answer.
 */
export function extractThoughts(rawText: string): { thoughts: string | null; cleanContent: string } {
  if (!rawText) return { thoughts: null, cleanContent: "" };

  // Match <thought>...</thought>, <think>...</think>, <reasoning>...</reasoning>
  const thoughtTagRegex = /<(thought|think|reasoning)>([\s\S]*?)<\/\1>/i;
  const match = rawText.match(thoughtTagRegex);

  if (match) {
    const thoughts = match[2].trim();
    const cleanContent = rawText.replace(thoughtTagRegex, "").trim();
    return { thoughts, cleanContent };
  }

  // Match Markdown style: ### Thought Process ... ### Final Deliverables / Answer
  const mdThoughtRegex = /(?:###\s*(?:Thought Process|Internal Reasoning|Analysis & Strategy|Reasoning Trace)\s*\n)([\s\S]*?)(?=(?:\n###\s*|\n##\s*|$))/i;
  const mdMatch = rawText.match(mdThoughtRegex);
  if (mdMatch && mdMatch[1].trim()) {
    const thoughts = mdMatch[1].trim();
    const cleanContent = rawText.replace(mdThoughtRegex, "").trim();
    return { thoughts, cleanContent };
  }

  return { thoughts: null, cleanContent: rawText };
}

export function ThinkingProcess({
  thoughtContent,
  steps,
  title = "Thought Process",
  duration,
  isThinking = false,
  defaultExpanded = false,
  className = "",
}: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isThinking);

  // If there's no thoughts and not currently thinking, render nothing
  if (!thoughtContent && (!steps || steps.length === 0) && !isThinking) {
    return null;
  }

  const stepCount = steps?.length || (thoughtContent ? thoughtContent.split(/\n\n+/).length : 1);
  const formattedDuration = typeof duration === "number" ? `${duration.toFixed(1)}s` : duration;

  return (
    <div className={`my-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 overflow-hidden shadow-xs transition-all ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Brain / Sparkles Icon */}
          <div className="w-7 h-7 rounded-xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
            {isThinking ? (
              <Brain className="w-4 h-4 text-emerald-600 animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {isThinking ? "Thinking..." : title}
            </span>

            {/* Badges */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
              {isThinking ? "Active Reasoning" : `${stepCount} step${stepCount !== 1 ? "s" : ""}`}
            </span>

            {formattedDuration && (
              <span className="text-[10px] font-mono text-slate-400">
                • {formattedDuration}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            {isExpanded ? "Hide thoughts" : "View reasoning"}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-200/70"
          >
            <div className="p-4 bg-white/70 space-y-3 text-xs leading-relaxed text-slate-700 font-sans border-l-3 border-emerald-500/70 ml-3 my-2 rounded-r-xl">
              {isThinking && (
                <div className="flex items-center gap-2 text-emerald-800 text-[11px] font-mono bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Evaluating policies, tool execution paths, and double-entry safeguards...</span>
                </div>
              )}

              {steps && steps.length > 0 ? (
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold flex items-center justify-center shrink-0 text-[9px] border border-slate-200">
                        {idx + 1}
                      </span>
                      <div className="flex-1 text-slate-700 font-mono text-[11px] bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {thoughtContent && (
                <div className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100 max-h-[320px] overflow-y-auto">
                  {thoughtContent}
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Independent Chain-of-Thought verified
                </span>
                <span>Company OS Cognitive Engine</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
