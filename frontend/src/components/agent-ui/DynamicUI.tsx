"use client";

import React, { useMemo } from "react";
import { Sparkles, AlertCircle, BarChart2 } from "lucide-react";
import { AgentUIPayload, parseAgentUIPayload } from "@/lib/agent-ui/schema";
import { getRegisteredComponent } from "./registry";

export interface DynamicUIProps {
  payload?: AgentUIPayload | unknown;
  rawJson?: unknown;
  className?: string;
}

export function DynamicUI({ payload, rawJson, className = "" }: DynamicUIProps) {
  const target = payload !== undefined ? payload : rawJson;
  const parsed = parseAgentUIPayload(target);

  // Fallback rendering if parsing or validation failed
  if (!parsed.success) {
    const rawContent =
      typeof target === "string"
        ? target
        : JSON.stringify(target, null, 2) || "Empty payload";

    return (
      <div className={`my-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs ${className}`}>
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Dynamic UI Validation Fallback</span>
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-2 font-sans">
          {parsed.error}
        </p>
        <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto max-h-60 border border-slate-800">
          <code>{rawContent}</code>
        </pre>
      </div>
    );
  }

  const validPayload = parsed.data;
  const registration = getRegisteredComponent(validPayload.component);

  // Fallback if component is somehow not found in registry
  if (!registration) {
    return (
      <div className={`my-4 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs ${className}`}>
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Unregistered Component: {validPayload.component}</span>
        </div>
        <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto max-h-60 border border-slate-800">
          <code>{JSON.stringify(validPayload, null, 2)}</code>
        </pre>
      </div>
    );
  }

  const Component = registration.component;

  return (
    <div className={`my-4 p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4 ${className}`}>
      {/* Header with Title & Badge */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {validPayload.title}
          </h4>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 uppercase shrink-0">
          {validPayload.component}
        </span>
      </div>

      {/* Render the Matching Component */}
      <div className="w-full">
        <Component {...validPayload.props} />
      </div>

      {/* Narration Text */}
      {validPayload.narration && (
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
            &ldquo;{validPayload.narration}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
