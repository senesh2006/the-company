"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  ChevronDown,
  Check,
  Copy,
  Clock,
  ExternalLink,
  Search,
  Globe,
  LucideIcon,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
  Cpu,
} from "lucide-react";

// --- Context & Types ---

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  status?: "pending" | "active" | "complete" | "error";
  totalSteps: number;
  registerStep: () => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | undefined>(undefined);

export function useChainOfThought() {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error("useChainOfThought must be used within a ChainOfThought component");
  }
  return context;
}

export interface ChainOfThoughtProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  status?: "pending" | "active" | "complete" | "error";
  className?: string;
}

// --- ChainOfThought Container ---

export function ChainOfThought({
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  status = "complete",
  className = "",
}: ChainOfThoughtProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [totalSteps, setTotalSteps] = useState(0);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const registerStep = () => {
    setTotalSteps((prev) => prev + 1);
  };

  return (
    <ChainOfThoughtContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        status,
        totalSteps,
        registerStep,
      }}
    >
      <div
        className={`my-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-xs transition-all ${className}`}
      >
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
}

// --- ChainOfThought Header ---

export interface ChainOfThoughtHeaderProps {
  title?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  model?: string;
  duration?: string | number;
  copyContent?: string;
  className?: string;
  children?: ReactNode;
}

export function ChainOfThoughtHeader({
  title,
  icon: CustomIcon,
  badge,
  model,
  duration,
  copyContent,
  className = "",
  children,
}: ChainOfThoughtHeaderProps) {
  const { isOpen, toggleOpen, status } = useChainOfThought();
  const [copied, setCopied] = useState(false);

  const isActive = status === "active";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyContent) {
      navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDuration =
    typeof duration === "number" ? `${duration.toFixed(1)}s` : duration;

  return (
    <div
      onClick={toggleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleOpen();
        }
      }}
      className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors select-none cursor-pointer border-b border-transparent ${
        isOpen ? "border-slate-100 dark:border-slate-800" : ""
      } ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
            {/* Animated Icon Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                isActive
                  ? "bg-emerald-100/90 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 shadow-xs shadow-emerald-500/10"
                  : "bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {CustomIcon ? (
                <CustomIcon
                  className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`}
                />
              ) : isActive ? (
                <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              )}
            </div>

            {/* Title */}
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              {title || (isActive ? "Agent is Reasoning" : "Chain of Thought")}
            </span>

            {/* Status Badge */}
            {badge ? (
              badge
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                Active Reasoning
              </span>
            ) : null}

            {/* Model Badge */}
            {model && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {model}
              </span>
            )}

            {/* Duration */}
            {formattedDuration && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDuration}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {copyContent && (
              <button
                type="button"
                onClick={handleCopy}
                title="Copy chain of thought"
                className="p-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
              {isOpen ? "Hide thoughts" : "View thoughts"}
            </span>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-400 dark:text-slate-500"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

// --- ChainOfThought Content ---

export interface ChainOfThoughtContentProps {
  children: ReactNode;
  className?: string;
}

export function ChainOfThoughtContent({
  children,
  className = "",
}: ChainOfThoughtContentProps) {
  const { isOpen } = useChainOfThought();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className={`p-4 space-y-3.5 relative ${className}`}>
            {/* Vertical timeline connector */}
            <div className="absolute left-[1.85rem] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500/40 via-slate-200 dark:via-slate-800 to-transparent pointer-events-none" />
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- ChainOfThought Step ---

export interface ChainOfThoughtStepProps {
  label: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  status?: "pending" | "active" | "complete" | "error";
  duration?: string | number;
  children?: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

export function ChainOfThoughtStep({
  label,
  description,
  icon: StepIcon,
  status = "complete",
  duration,
  children,
  className = "",
  defaultExpanded = true,
}: ChainOfThoughtStepProps) {
  const [isStepExpanded, setIsStepExpanded] = useState(defaultExpanded);

  const isActive = status === "active";
  const isComplete = status === "complete";
  const isError = status === "error";

  const formattedDuration =
    typeof duration === "number" ? `${duration.toFixed(1)}s` : duration;

  return (
    <div className={`relative flex items-start gap-3 text-xs z-10 ${className}`}>
      {/* Step Icon Node */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border mt-0.5 transition-all shadow-xs ${
          isActive
            ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 ring-4 ring-emerald-500/10"
            : isComplete
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
            : isError
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400"
            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400"
        }`}
      >
        {StepIcon ? (
          <StepIcon
            className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`}
          />
        ) : isActive ? (
          <CircleDashed className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
        ) : isComplete ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
      </div>

      {/* Step Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-slate-800 dark:text-slate-200 font-medium text-xs leading-snug break-words">
            {label}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {formattedDuration && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {formattedDuration}
              </span>
            )}
            {children && (
              <button
                type="button"
                onClick={() => setIsStepExpanded(!isStepExpanded)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isStepExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {description && (
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed bg-slate-50/60 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {description}
          </div>
        )}

        {/* Step Children (Search Results, Images, Tool Acts) */}
        {children && isStepExpanded && (
          <div className="pt-1">{children}</div>
        )}
      </div>
    </div>
  );
}

// --- ChainOfThought Search Results & Items ---

export interface ChainOfThoughtSearchResultsProps {
  children: ReactNode;
  className?: string;
}

export function ChainOfThoughtSearchResults({
  children,
  className = "",
}: ChainOfThoughtSearchResultsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 my-1.5 ${className}`}>
      {children}
    </div>
  );
}

export interface ChainOfThoughtSearchResultProps {
  children: ReactNode;
  url?: string;
  icon?: LucideIcon;
  className?: string;
}

export function ChainOfThoughtSearchResult({
  children,
  url,
  icon: ResultIcon,
  className = "",
}: ChainOfThoughtSearchResultProps) {
  const content = (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all shadow-2xs group ${className}`}
    >
      {ResultIcon ? (
        <ResultIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
      )}
      <span className="truncate max-w-[220px]">{children}</span>
      {url && (
        <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
      )}
    </div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        {content}
      </a>
    );
  }

  return content;
}

// --- ChainOfThought Image ---

export interface ChainOfThoughtImageProps {
  children: ReactNode;
  caption?: string;
  className?: string;
}

export function ChainOfThoughtImage({
  children,
  caption,
  className = "",
}: ChainOfThoughtImageProps) {
  return (
    <div
      className={`my-2 p-2 rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 max-w-sm overflow-hidden shadow-xs space-y-2 ${className}`}
    >
      <div className="rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        {children}
      </div>
      {caption && (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans italic px-1 leading-snug">
          {caption}
        </p>
      )}
    </div>
  );
}
