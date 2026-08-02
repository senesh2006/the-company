"use client";

import { useState } from "react";
import { 
  GitFork, 
  Users, 
  Bot, 
  MoreVertical, 
  Download, 
  User, 
  Building2, 
  Cloud, 
  Terminal, 
  Layers,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function HierarchyPage() {
  const [viewType, setViewType] = useState<"functional" | "projects">("functional");
  const [selectedNode, setSelectedNode] = useState<string | null>("exec");

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organizational Structure
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Manage and visualize reporting lines for human teams and AI agents.
          </p>
        </div>

        {/* Toggle button pill */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewType("functional")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewType === "functional"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Functional</span>
          </button>
          <button
            onClick={() => setViewType("projects")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewType === "projects"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Project Teams</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Diagram Canvas */}
      <div className="bg-slate-50/60 rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs min-h-[480px] flex flex-col items-center justify-center relative overflow-x-auto">
        
        {/* LEVEL 1: Executive Control Node */}
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-2xl p-4 w-72 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-slate-900">Executive Control</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HQ Node</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ACTIVE
              </span>
              <button className="text-[11px] text-slate-500 hover:text-slate-800 font-medium">
                View Details
              </button>
            </div>
          </div>

          {/* Stem Connector Line 1 */}
          <div className="w-0.5 h-8 bg-slate-300" />
        </div>

        {/* LEVEL 2: Department Horizontal Bar & Nodes */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Horizontal Fork Bar */}
          <div className="w-3/4 h-0.5 bg-slate-300 relative">
            <div className="absolute left-0 top-0 w-0.5 h-8 bg-slate-300" />
            <div className="absolute right-0 top-0 w-0.5 h-8 bg-slate-300" />
          </div>

          {/* Level 2 Nodes Grid */}
          <div className="w-full flex justify-between gap-6 pt-8">
            
            {/* Left Node: Engineering */}
            <div className="flex-1 flex flex-col items-center max-w-[280px]">
              <div className="bg-white rounded-2xl p-4 w-full border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900">Engineering</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sarah Chen (VP)</span>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Stem Line down to Level 3 */}
              <div className="w-0.5 h-8 bg-slate-300" />

              {/* Sub-fork bar for DevOps & Backend */}
              <div className="w-full h-0.5 bg-slate-300 relative">
                <div className="absolute left-0 top-0 w-0.5 h-6 bg-slate-300" />
                <div className="absolute right-0 top-0 w-0.5 h-6 bg-slate-300" />
              </div>

              {/* Level 3 Sub-Nodes */}
              <div className="w-full flex justify-between gap-3 pt-6">
                {/* Sub-card 1: DevOps */}
                <div className="bg-white rounded-2xl p-3 w-[130px] border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>DevOps</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1 truncate">
                      <Bot className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">DataOps_Agent</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>M. Davis</span>
                  </div>
                </div>

                {/* Sub-card 2: Backend */}
                <div className="bg-white rounded-2xl p-3 w-[130px] border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Backend</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1 truncate">
                      <Bot className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">CodeReview_Bot</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Node: Marketing */}
            <div className="flex-1 flex flex-col items-center max-w-[280px]">
              <div className="bg-white rounded-2xl p-4 w-full border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900">Marketing</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    IDLE
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Bottom Status Bar */}
      <div className="bg-white rounded-2xl p-4 md:px-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Headcount */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Headcount
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> 142
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <Bot className="w-3.5 h-3.5" /> 38
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Structure Health */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Structure Health
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-[92%]" />
              </div>
              <span className="text-xs font-bold text-emerald-700 font-mono">92%</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={() => alert("Exporting organizational tree...")}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          Export Structure
        </button>
      </div>
    </div>
  );
}
