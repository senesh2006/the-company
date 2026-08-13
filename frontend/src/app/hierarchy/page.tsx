"use client";

import { useState } from "react";
import { useAgents, useHierarchy } from "@/lib/queries";
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
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Plus
} from "lucide-react";

export default function HierarchyPage() {
  const { data: liveAgents, isLoading } = useAgents();
  const { data: hierarchyData } = useHierarchy();

  const [viewType, setViewType] = useState<"functional" | "projects">("functional");
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  const agents = liveAgents || [];

  // Group agents into functional departments
  const engineeringAgents = agents.filter(a => 
    a.role?.toLowerCase().includes("engineer") || 
    a.role?.toLowerCase().includes("code") || 
    a.role?.toLowerCase().includes("security") ||
    a.role?.toLowerCase().includes("tech")
  );

  const opsAgents = agents.filter(a => 
    a.role?.toLowerCase().includes("lead") || 
    a.role?.toLowerCase().includes("orchestrator") || 
    a.role?.toLowerCase().includes("research") || 
    a.role?.toLowerCase().includes("ops") ||
    a.role?.toLowerCase().includes("data")
  );

  const businessAgents = agents.filter(a => 
    a.role?.toLowerCase().includes("finance") || 
    a.role?.toLowerCase().includes("marketing") || 
    a.role?.toLowerCase().includes("growth") ||
    a.role?.toLowerCase().includes("sales")
  );

  const totalBots = agents.length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Organizational Structure
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Dynamic hierarchy and reporting hierarchy across active human executives and autonomous AI agents.
          </p>
        </div>

        {/* Toggle button pill */}
        <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewType("functional")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewType === "functional"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Functional Hierarchy</span>
          </button>
          <button
            onClick={() => setViewType("projects")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewType === "projects"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Autonomous Units</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Diagram Canvas */}
      <div className="bg-slate-50/60 rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-xs min-h-[520px] flex flex-col items-center justify-center relative overflow-x-auto">
        
        {/* LEVEL 1: Executive Control Node */}
        <div className="flex flex-col items-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-80 border border-slate-200/90 dark:border-slate-700/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Founder & Executive Board</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supreme Governance Node</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE OVERSIGHT
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold">Governance Gate</span>
            </div>
          </div>

          {/* Stem Connector Line 1 */}
          <div className="w-0.5 h-8 bg-slate-300" />
        </div>

        {/* LEVEL 2: Department Horizontal Bar & Nodes */}
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Horizontal Fork Bar */}
          <div className="w-full h-0.5 bg-slate-300 relative">
            <div className="absolute left-1/6 top-0 w-0.5 h-8 bg-slate-300" />
            <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-slate-300" />
            <div className="absolute right-1/6 top-0 w-0.5 h-8 bg-slate-300" />
          </div>

          {/* Level 2 Nodes Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            
            {/* Column 1: Engineering Pod */}
            <div className="flex flex-col items-center">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full border border-slate-200/90 dark:border-slate-700/90 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Engineering & Tech</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Autonomous Pod</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                  {engineeringAgents.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      No engineering agents
                    </div>
                  ) : (
                    engineeringAgents.map((agent: any) => (
                      <div 
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Bot className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{agent.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{agent.role}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {agent.trust_tier || "Assist"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Operations & Orchestration Pod */}
            <div className="flex flex-col items-center">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full border border-slate-200/90 dark:border-slate-700/90 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Core Orchestration</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations & Data</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                  {opsAgents.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      No operations agents
                    </div>
                  ) : (
                    opsAgents.map((agent: any) => (
                      <div 
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Bot className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{agent.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{agent.role}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {agent.trust_tier || "Assist"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Growth & Financial Pod */}
            <div className="flex flex-col items-center">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full border border-slate-200/90 dark:border-slate-700/90 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Finance & Growth</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capital & Market</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-2">
                  {businessAgents.length === 0 ? (
                    <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      No finance/growth agents
                    </div>
                  ) : (
                    businessAgents.map((agent: any) => (
                      <div 
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Bot className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{agent.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{agent.role}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          {agent.trust_tier || "Observe"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Bottom Status Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:px-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Headcount */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Workforce
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1 text-emerald-700">
                <Bot className="w-3.5 h-3.5" /> {totalBots} Active Agents
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Structure Health */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance Health
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full w-full" />
              </div>
              <span className="text-xs font-bold text-emerald-700 font-mono">100%</span>
            </div>
          </div>
        </div>

        {/* Selected Agent Quick Inspector */}
        {selectedAgent && (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAgent.name}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-emerald-700 font-bold uppercase">{selectedAgent.trust_tier}</span>
            <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
