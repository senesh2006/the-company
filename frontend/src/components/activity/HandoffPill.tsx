"use client";

import React from "react";
import { 
  Bot, 
  Sparkles, 
  Megaphone, 
  Briefcase, 
  Code, 
  User, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface AgentInfo {
  name?: string;
  role?: string;
  avatar?: string;
}

interface HandoffPillProps {
  fromAgent?: AgentInfo;
  toAgent?: AgentInfo;
  targetRole?: string;
  taskDescription?: string;
  timestamp?: string;
  className?: string;
}

function getAgentMeta(roleOrName?: string) {
  const r = (roleOrName || "").toLowerCase();
  if (r.includes("market") || r.includes("growth") || r.includes("social")) {
    return {
      bg: "bg-cyan-500",
      border: "border-cyan-400/40",
      text: "text-cyan-400",
      icon: Megaphone,
      label: "Marketing"
    };
  }
  if (r.includes("finance") || r.includes("account") || r.includes("ledger") || r.includes("bookkeeper")) {
    return {
      bg: "bg-emerald-500",
      border: "border-emerald-400/40",
      text: "text-emerald-400",
      icon: Briefcase,
      label: "Finance"
    };
  }
  if (r.includes("engineer") || r.includes("code") || r.includes("dev") || r.includes("tech")) {
    return {
      bg: "bg-purple-500",
      border: "border-purple-400/40",
      text: "text-purple-400",
      icon: Code,
      label: "Engineer"
    };
  }
  if (r.includes("chief") || r.includes("staff") || r.includes("director")) {
    return {
      bg: "bg-violet-500",
      border: "border-violet-400/40",
      text: "text-violet-400",
      icon: ShieldCheck,
      label: "Chief of Staff"
    };
  }
  if (r.includes("founder") || r.includes("user")) {
    return {
      bg: "bg-amber-500",
      border: "border-amber-400/40",
      text: "text-amber-400",
      icon: User,
      label: "Founder"
    };
  }
  return {
    bg: "bg-indigo-500",
    border: "border-indigo-400/40",
    text: "text-indigo-400",
    icon: Sparkles,
    label: "Assistant"
  };
}

export function HandoffPill({
  fromAgent,
  toAgent,
  targetRole,
  taskDescription,
  timestamp,
  className = ""
}: HandoffPillProps) {
  const fromRole = fromAgent?.role || fromAgent?.name || "Personal Assistant";
  const toRole = toAgent?.role || toAgent?.name || targetRole || "Chief of Staff";

  const fromMeta = getAgentMeta(fromRole);
  const toMeta = getAgentMeta(toRole);

  const FromIcon = fromMeta.icon;
  const ToIcon = toMeta.icon;

  // Format short role label (e.g. "Chief of Staff" -> "Chief of Staff", "Finance Manager" -> "Finance")
  const targetDisplay = toRole.replace(" Manager", "").replace(" Worker", "").replace(" Lead", "");

  return (
    <div className={`flex items-center justify-center my-2.5 ${className}`}>
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/80 shadow-md backdrop-blur-md transition-all hover:border-slate-600 group">
        
        {/* Overlapping Avatars */}
        <div className="flex items-center -space-x-2 shrink-0">
          {/* From Agent Avatar */}
          <div 
            className={`w-6 h-6 rounded-full ${fromMeta.bg} text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-slate-900 dark:ring-slate-950 shadow-xs z-10`}
            title={`From: ${fromRole}`}
          >
            <FromIcon className="w-3 h-3" />
          </div>

          {/* To Agent Avatar */}
          <div 
            className={`w-6 h-6 rounded-full ${toMeta.bg} text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-slate-900 dark:ring-slate-950 shadow-xs z-20`}
            title={`To: ${toRole}`}
          >
            <ToIcon className="w-3 h-3" />
          </div>
        </div>

        {/* Pulsing 3-dot animation */}
        <div className="flex items-center gap-1 shrink-0 px-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:200ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:400ms]" />
        </div>

        {/* Text */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-300 font-medium tracking-tight">
            Sending to <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{targetDisplay}</span>...
          </span>
          {taskDescription && (
            <span className="hidden sm:inline text-slate-500 text-[11px] font-mono max-w-[200px] truncate" title={taskDescription}>
              ({taskDescription})
            </span>
          )}
        </div>

        {timestamp && (
          <span className="text-[10px] font-mono text-slate-500 pl-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
