"use client";

import React from "react";
import { Database, Bot, Sparkles, Megaphone, Briefcase, Code, ShieldCheck } from "lucide-react";

interface MemoryUpdateCardProps {
  agentName?: string;
  role?: string;
  triggerMessages?: string[];
  memoryKey?: string;
  summary?: string;
  timestamp?: string;
  className?: string;
}

function getAgentAccent(roleOrName?: string) {
  const r = (roleOrName || "").toLowerCase();
  if (r.includes("market") || r.includes("growth") || r.includes("social")) {
    return {
      dotColor: "bg-cyan-500",
      pillBg: "bg-cyan-950/70 border-cyan-800/60 text-cyan-300",
      icon: Megaphone,
      accentText: "text-cyan-400"
    };
  }
  if (r.includes("finance") || r.includes("account") || r.includes("ledger") || r.includes("bookkeeper")) {
    return {
      dotColor: "bg-emerald-500",
      pillBg: "bg-emerald-950/70 border-emerald-800/60 text-emerald-300",
      icon: Briefcase,
      accentText: "text-emerald-400"
    };
  }
  if (r.includes("engineer") || r.includes("code") || r.includes("dev") || r.includes("tech")) {
    return {
      dotColor: "bg-purple-500",
      pillBg: "bg-purple-950/70 border-purple-800/60 text-purple-300",
      icon: Code,
      accentText: "text-purple-400"
    };
  }
  if (r.includes("chief") || r.includes("staff") || r.includes("director")) {
    return {
      dotColor: "bg-violet-500",
      pillBg: "bg-violet-950/70 border-violet-800/60 text-violet-300",
      icon: ShieldCheck,
      accentText: "text-violet-400"
    };
  }
  // Default: purple / indigo for assistant / manager
  return {
    dotColor: "bg-purple-500",
    pillBg: "bg-purple-950/70 border-purple-800/60 text-purple-300",
    icon: Sparkles,
    accentText: "text-purple-400"
  };
}

export function MemoryUpdateCard({
  agentName,
  role,
  triggerMessages = [],
  memoryKey,
  summary,
  timestamp,
  className = ""
}: MemoryUpdateCardProps) {
  const targetLabel = agentName || role || "Account Manager";
  const accent = getAgentAccent(role || agentName);

  // If no triggering messages provided, construct default context representations
  const messagesToRender = triggerMessages.length > 0 
    ? triggerMessages 
    : (summary ? [summary] : (memoryKey ? [`Updated knowledge base key: ${memoryKey}`] : ["Learned new operational context and workflow parameters."]));

  return (
    <div className={`my-3 p-4 rounded-2xl bg-slate-900/60 dark:bg-slate-950/80 border border-slate-800/80 shadow-xs space-y-3 ${className}`}>
      
      {/* Triggering Message Bubbles (Simple grey/slate rounded bubbles) */}
      <div className="space-y-2">
        {messagesToRender.map((msg, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-xl bg-slate-800/70 dark:bg-slate-900/90 border border-slate-700/60 text-slate-200 text-xs leading-relaxed max-w-2xl font-normal shadow-2xs select-text"
          >
            {msg}
          </div>
        ))}
      </div>

      {/* Centered Pill: "Updated memory for {Agent Name}" */}
      <div className="flex items-center justify-center pt-1">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs ${accent.pillBg} backdrop-blur-xs transition-all hover:scale-[1.02]`}>
          <span className={`w-2 h-2 rounded-full ${accent.dotColor} animate-pulse shadow-sm`} />
          <span className="tracking-tight">
            Updated memory for <strong className="font-bold text-white">{targetLabel}</strong>
          </span>
          {memoryKey && (
            <span className="text-[10px] font-mono opacity-70 border-l border-current/30 pl-1.5">
              #{memoryKey}
            </span>
          )}
          {timestamp && (
            <span className="text-[10px] font-mono opacity-60">
              • {timestamp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
