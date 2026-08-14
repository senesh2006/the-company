"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, Sparkles, Copy, Check, Terminal, Cpu } from "lucide-react";

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
   * Dynamic status message when thinking (e.g. "Analyzing mandate and evaluating tools...")
   */
  statusMessage?: string;
  /**
   * LLM model name that generated this thought trace
   */
  model?: string;
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
 * Extracts <thought>...</thought>, <think>...</think>, <reasoning>...</reasoning>,
 * or Markdown style reasoning headers from text, returning the thought portion and clean final answer.
 */
export function extractThoughts(rawText: string): { thoughts: string | null; cleanContent: string } {
  if (!rawText) return { thoughts: null, cleanContent: "" };

  // Match XML/HTML style tags: <thought>, <think>, <reasoning>, <reason>, <thought_process>
  const thoughtTagRegex = /<(thought|think|reasoning|reason|thought_process)>([\s\S]*?)<\/\1>/gi;
  const matches: string[] = [];
  let clean = rawText;

  let match: RegExpExecArray | null;
  while ((match = thoughtTagRegex.exec(rawText)) !== null) {
    if (match[2] && match[2].trim()) {
      matches.push(match[2].trim());
    }
  }

  if (matches.length > 0) {
    clean = rawText.replace(thoughtTagRegex, "").trim();
    return { thoughts: matches.join("\n\n"), cleanContent: clean };
  }

  // Match Markdown style: ### Thought Process ... ### Final Deliverables / Answer
  const mdThoughtRegex = /(?:###\s*(?:Thought Process|Internal Reasoning|Analysis & Strategy|Reasoning Trace|Agent Reasoning|Cognitive Trace)\s*\n)([\s\S]*?)(?=(?:\n###\s*|\n##\s*|$))/i;
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
  statusMessage,
  model,
  duration,
  isThinking = false,
  defaultExpanded = false,
  className = "",
}: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isThinking);
  const [copied, setCopied] = useState(false);

  // If there's no thoughts and not currently thinking, render nothing
  if (!thoughtContent && (!steps || steps.length === 0) && !isThinking) {
    return null;
  }

  const stepCount = steps?.length || (thoughtContent ? thoughtContent.split(/\n\n+/).filter(Boolean).length : 1);
  const formattedDuration = typeof duration === "number" ? `${duration.toFixed(1)}s` : duration;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = thoughtContent || (steps ? steps.join("\n") : "");
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`my-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/80 dark:bg-slate-900/80 overflow-hidden shadow-xs transition-all ${className}`}>
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Brain / Sparkles Icon */}
          <div className="w-7 h-7 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            {isThinking ? (
              <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              {isThinking ? (title.includes("is Reasoning") ? title : "Thinking...") : title}
            </span>

            {/* Badges */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
              {isThinking ? "Active Reasoning" : `${stepCount} step${stepCount !== 1 ? "s" : ""}`}
            </span>

            {model && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {model}
              </span>
            )}

            {formattedDuration && (
              <span className="text-[10px] font-mono text-slate-400">
                • {formattedDuration}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {thoughtContent && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy thought process"
              className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
            {isExpanded ? "Hide thoughts" : "View reasoning"}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400"
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
            className="overflow-hidden border-t border-slate-200/70 dark:border-slate-700/70"
          >
            <div className="p-4 bg-white dark:bg-slate-900/70 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-sans border-l-3 border-emerald-500/70 ml-3 my-2 rounded-r-xl">
              {isThinking && (
                <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="leading-tight">
                    {statusMessage || "Agent is formulating reasoning and tool execution strategy..."}
                  </span>
                </div>
              )}

              {steps && steps.length > 0 ? (
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold flex items-center justify-center shrink-0 text-[9px] border border-slate-200 dark:border-slate-700">
                        {idx + 1}
                      </span>
                      <div className="flex-1 text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-slate-50/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed whitespace-pre-wrap">
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {thoughtContent && (
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-50/60 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[380px] overflow-y-auto select-text">
                  {thoughtContent}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
