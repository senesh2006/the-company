"use client";

import { useState } from "react";
import { useAgents, useMetrics, useTasks } from "@/lib/queries";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { AssistantAvatar } from "@/components/ui/AssistantAvatar";
import { 
  Plus, 
  SlidersHorizontal, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  Bot, 
  Megaphone, 
  Briefcase, 
  Search, 
  Settings, 
  Radio, 
  Cpu, 
  CreditCard, 
  CheckCircle2,
  ChevronDown
} from "lucide-react";

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const { data: allTasks } = useTasks();
  const { data: metrics } = useMetrics();
  const { setSelectedAgentId } = useAppStore();

  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "cost" | "progress">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Map real database agents with dynamic task progress
  const workers = (agents && agents.length > 0)
    ? agents.map((a: any) => {
        const r = (a.role || "").toLowerCase();
        let dept = "Operations";
        let sub = a.role || "Specialist";
        let icon = Bot;
        let bg = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";

        if (r.includes("market") || r.includes("growth")) {
          dept = "Marketing";
          sub = "Growth & Social";
          icon = Megaphone;
          bg = "bg-emerald-50 border-emerald-200 text-emerald-700";
        } else if (r.includes("finance") || r.includes("account")) {
          dept = "Finance";
          sub = "Ledger & Audits";
          icon = Briefcase;
          bg = "bg-blue-50 border-blue-200 text-blue-700";
        } else if (r.includes("research") || r.includes("data") || r.includes("analyst")) {
          dept = "Research";
          sub = "Market Insights";
          icon = Search;
          bg = "bg-purple-50 border-purple-200 text-purple-700";
        }

        // Correlate with active tasks to calculate real progress
        const workerTasks = (allTasks || []).filter(
          (t: any) => t.agent_id === a.id || 
          t.assignee_role?.toLowerCase() === a.role?.toLowerCase() ||
          t.assignee_role?.toLowerCase() === a.name?.toLowerCase()
        );

        const runningTask = workerTasks.find((t: any) => t.status === "running" || t.status === "in_progress");
        const completedCount = workerTasks.filter((t: any) => t.status === "completed").length;
        const totalCount = workerTasks.length;

        let computedProgress = 0;
        let currentTaskTitle = a.current_task_title || "Standby for directives";
        let agentStatus = a.status || "Idle";

        if (runningTask) {
          agentStatus = "Running";
          currentTaskTitle = runningTask.description || runningTask.mandate || "Executing active mandate";
          const rMilestones = runningTask.milestones || [];
          if (rMilestones.length > 0) {
            const compCount = rMilestones.filter((m: any) => m.status === "completed").length;
            const inProgIdx = rMilestones.findIndex((m: any) => m.status === "in_progress");
            computedProgress = Math.round(((compCount + (inProgIdx >= 0 ? 0.5 : 0)) / rMilestones.length) * 100);
          } else if (runningTask.progress !== undefined && runningTask.progress !== null && runningTask.progress > 0) {
            computedProgress = Number(runningTask.progress);
          } else {
            const elapsedSec = Math.max(0, (Date.now() - new Date(runningTask.created_at || Date.now()).getTime()) / 1000);
            computedProgress = elapsedSec < 4 ? 25 : elapsedSec < 15 ? 50 : 75;
          }
        } else if (totalCount > 0) {
          computedProgress = Math.round((completedCount / totalCount) * 100);
        } else {
          computedProgress = 0;
        }

        return {
          id: a.id,
          name: a.name || "Autonomous Agent",
          sublabel: sub,
          department: dept,
          status: agentStatus,
          currentTask: currentTaskTitle,
          progress: computedProgress,
          costToday: a.cost_today_usd ?? 0.0,
          avatarBg: bg,
          icon: icon
        };
      })
    : [];

  // Filter & Sort Logic
  const filteredWorkers = workers.filter((w) => {
    if (filterDepartment !== "all" && w.department !== filterDepartment) return false;
    if (filterStatus !== "all" && w.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "cost") {
      return sortDirection === "asc" ? a.costToday - b.costToday : b.costToday - a.costToday;
    }
    if (sortBy === "progress") {
      return sortDirection === "asc" ? a.progress - b.progress : b.progress - a.progress;
    }
    return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  const toggleSort = () => {
    if (sortBy === "name") {
      setSortBy("cost");
      setSortDirection("desc");
    } else if (sortBy === "cost") {
      setSortBy("progress");
      setSortDirection("desc");
    } else {
      setSortBy("name");
      setSortDirection("asc");
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Workers
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Hire, monitor and control your AI workforce
          </p>
        </div>

        <a
          href="/hire"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs md:text-sm font-bold shadow-xs transition-all duration-200 hover:scale-[1.02] active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Hire Worker</span>
        </a>
      </div>

      {/* 2. Filter & Toolbar Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterDepartment !== "all" || filterStatus !== "all"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-slate-100/90 text-slate-700 dark:text-slate-300 border-slate-200/70 hover:bg-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {(filterDepartment !== "all" || filterStatus !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-xl z-30 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="Research">Research</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Running">Running</option>
                    <option value="Paused">Paused</option>
                    <option value="Idle">Idle</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <button
                    onClick={() => {
                      setFilterDepartment("all");
                      setFilterStatus("all");
                      setShowFilterDropdown(false);
                    }}
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="text-[11px] text-emerald-700 font-bold hover:text-emerald-800"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Button */}
          <button
            onClick={toggleSort}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100/90 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/70 hover:bg-slate-200 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort ({sortBy})</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-300"
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-300"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Workers Content (Table / Grid or Empty State) */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No Workers Recruited Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Deploy specialized autonomous AI agents to handle marketing, finance, research, and technical operations.
          </p>
          <a
            href="/hire"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hire Your First Worker</span>
          </a>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Worker</th>
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Department</th>
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Current Task</th>
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400">Progress</th>
                  <th className="py-3.5 px-6 font-semibold text-slate-500 dark:text-slate-400 text-right">Cost Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWorkers.map((worker) => {
                  const Icon = worker.icon;
                  const isRunning = worker.status === "Running";
                  const isPaused = worker.status === "Paused";

                  return (
                    <tr
                      key={worker.id}
                      onClick={() => setSelectedAgentId(worker.id)}
                      className="hover:bg-slate-50/80 dark:bg-slate-900/80 cursor-pointer transition-colors group"
                    >
                      {/* Worker Identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                            (worker.name === "Personal Assistant" || worker.name === "Supervisor") 
                              ? "" 
                              : `rounded-xl overflow-hidden ${worker.avatarBg} border shadow-xs`
                          }`}>
                            {(worker.name === "Personal Assistant" || worker.name === "Supervisor") ? (
                              <AssistantAvatar className="w-full h-full" faceColor="#ffffff" featureColor="#0c0c0c" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 transition-colors">
                              {worker.name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              {worker.sublabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {worker.department}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isRunning
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : isPaused
                              ? "bg-amber-50 text-amber-700 border-amber-200/80"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRunning
                                ? "bg-emerald-500"
                                : isPaused
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {worker.status}
                        </span>
                      </td>

                      {/* Current Task */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate block max-w-xs">
                          {worker.currentTask}
                        </span>
                      </td>

                      {/* Progress Bar & Number */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 w-24">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                            {worker.progress > 0 ? `${worker.progress}%` : "0%"}
                          </span>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isRunning
                                  ? "bg-emerald-800"
                                  : isPaused
                                  ? "bg-amber-500"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${worker.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Cost Today */}
                      <td className="py-4 px-6 text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        ${worker.costToday.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWorkers.map((worker) => {
            const Icon = worker.icon;
            const isRunning = worker.status === "Running";
            const isPaused = worker.status === "Paused";

            return (
              <div
                key={worker.id}
                onClick={() => setSelectedAgentId(worker.id)}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                      (worker.name === "Personal Assistant" || worker.name === "Supervisor")
                        ? ""
                        : `rounded-xl overflow-hidden ${worker.avatarBg} border`
                    }`}>
                      {(worker.name === "Personal Assistant" || worker.name === "Supervisor") ? (
                        <AssistantAvatar className="w-full h-full" faceColor="#ffffff" featureColor="#0c0c0c" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isRunning
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPaused
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-slate-400"}`} />
                      {worker.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-800 transition-colors">
                      {worker.name}
                    </h3>
                    <p className="text-xs text-slate-400">{worker.sublabel} &bull; {worker.department}</p>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Current Task</p>
                    <p className="truncate font-medium">{worker.currentTask}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Progress</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{worker.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isRunning ? "bg-emerald-800" : isPaused ? "bg-amber-500" : "bg-slate-300"}`}
                      style={{ width: `${worker.progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Cost Today</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">${worker.costToday.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Metric Bento Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-2">
        
        {/* Card 1: Active Workers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Workers</span>
            <div className="text-emerald-600">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {agents?.length || 0}
            </span>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
              <span>&#9650;</span> {agents?.length || 0} deployed
            </p>
          </div>
        </div>

        {/* Card 2: Compute Used */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Compute Used</span>
            <div className="text-slate-600 dark:text-slate-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {(agents?.length || 0) > 0 ? "Normal" : "Idle"}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Autonomous execution ready
            </p>
          </div>
        </div>

        {/* Card 3: Total Cost Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Cost Today</span>
            <div className="text-slate-600 dark:text-slate-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              ${(metrics?.totalCost || 0).toFixed(2)}
            </span>
            <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <span>&#9650;</span> Real-time telemetry
            </p>
          </div>
        </div>

        {/* Card 4: Tasks Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tasks Completed</span>
            <div className="text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {metrics?.completedTasks || 0}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {metrics?.errorRate !== undefined ? `${(100 - metrics.errorRate).toFixed(1)}%` : "100%"} success rate
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
