"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  MapPin, 
  Bot, 
  Megaphone, 
  Briefcase, 
  Code, 
  Sparkles,
  Layers
} from "lucide-react";

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "pending" | "blocked";
  assignee_role?: string;
  step_number?: number;
  total_steps?: number;
}

interface MilestoneMapProps {
  milestones: MilestoneItem[];
  progress?: number;
  taskTitle?: string;
  compact?: boolean;
  className?: string;
}

export function MilestoneMap({
  milestones,
  progress,
  taskTitle,
  compact = false,
  className = "",
}: MilestoneMapProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const inProgressIndex = milestones.findIndex((m) => m.status === "in_progress");
  const total = milestones.length;

  const computedProgress = progress !== undefined 
    ? progress 
    : Math.round(((completedCount + (inProgressIndex >= 0 ? 0.5 : 0)) / total) * 100);

  const getRoleIcon = (role?: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("market") || r.includes("growth")) return Megaphone;
    if (r.includes("finance") || r.includes("account")) return Briefcase;
    if (r.includes("engineer") || r.includes("code") || r.includes("dev")) return Code;
    return Bot;
  };

  // Compact Mode (for list rows or cards)
  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Milestone {completedCount + (inProgressIndex >= 0 ? 1 : 0)} of {total}
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {computedProgress}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {milestones.map((m, idx) => {
            const isDone = m.status === "completed";
            const isActive = m.status === "in_progress";
            const isBlocked = m.status === "blocked";

            return (
              <div key={m.id || idx} className="flex-1 flex items-center gap-1">
                <div
                  title={`${idx + 1}. ${m.title} (${m.status})`}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    isDone
                      ? "bg-emerald-600 shadow-xs"
                      : isActive
                      ? "bg-emerald-400 animate-pulse"
                      : isBlocked
                      ? "bg-rose-500"
                      : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full Interactive Journey Map
  return (
    <div className={`p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-xs ${className}`}>
      {/* Header with Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              AI Operation Milestone Map
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Autonomous execution roadmap & progress tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {completedCount} / {total} Milestones • <span className="text-emerald-600 font-extrabold">{computedProgress}%</span>
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${computedProgress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 rounded-full"
        />
      </div>

      {/* Stepper Node Graph */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {milestones.map((m, idx) => {
            const isDone = m.status === "completed";
            const isActive = m.status === "in_progress";
            const isBlocked = m.status === "blocked";
            const isPending = m.status === "pending";
            const isSelected = selectedMilestone === m.id || (selectedMilestone === null && isActive);
            const RoleIcon = getRoleIcon(m.assignee_role);

            return (
              <div
                key={m.id || idx}
                onClick={() => setSelectedMilestone(m.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : isDone
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50/80"
                    : isActive
                    ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 hover:bg-emerald-50"
                    : isBlocked
                    ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 hover:bg-rose-50"
                    : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white"
                }`}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-emerald-500 text-white animate-pulse"
                          : isBlocked
                          ? "bg-rose-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Step {idx + 1}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 animate-pulse"
                        : isBlocked
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isDone ? "Done" : isActive ? "Active" : isBlocked ? "Blocked" : "Pending"}
                  </span>
                </div>

                {/* Milestone Info */}
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {m.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                {/* Assignee Badge */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                    <RoleIcon className="w-3 h-3 text-slate-500" />
                    {m.assignee_role || "Specialist"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Active Details */}
      {(() => {
        const activeItem = milestones.find((m) => m.id === selectedMilestone) || 
          milestones.find((m) => m.status === "in_progress") || 
          milestones[0];

        if (!activeItem) return null;

        return (
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Focus Milestone: {activeItem.title}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Assigned to: {activeItem.assignee_role || "Specialist"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeItem.description}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
