"use client";

import { useMetrics } from "@/lib/queries";

export default function TasksPage() {
  const { data: metrics } = useMetrics();

  const activeTasks = metrics?.totalTasks ? metrics.totalTasks - (metrics.completedTasks || 0) : 12;
  const successRate = metrics?.successRate ? (metrics.successRate * 100).toFixed(1) : "99.2";

  return (
    <div className="max-w-[1440px] mx-auto w-full">
      {/* Header & Top Actions */}
      <div className="flex flex-col gap-lg mb-xl">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Tasks</h2>
            <p className="text-secondary font-body-lg text-body-lg mt-1">Orchestrate and monitor the execution of complex workflows</p>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-lg py-3 rounded-xl font-semibold flex items-center gap-sm shadow-sm transition-all active:scale-95">
            <span className="material-symbols-outlined">add</span>
            New Task
          </button>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-md border-b border-outline-variant pb-base">
          <div className="flex items-center gap-lg">
            <button className="pb-md px-xs font-semibold text-primary border-b-2 border-primary transition-all">All Tasks</button>
            <button className="pb-md px-xs font-medium text-secondary hover:text-primary transition-all">Active</button>
            <button className="pb-md px-xs font-medium text-secondary hover:text-primary transition-all">Scheduled</button>
            <button className="pb-md px-xs font-medium text-secondary hover:text-primary transition-all">Completed</button>
            <button className="pb-md px-xs font-medium text-secondary hover:text-primary transition-all">Backlog</button>
          </div>
          <div className="flex items-center gap-sm mb-md">
            <button className="flex items-center gap-xs px-md py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-secondary font-medium hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-xs px-md py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-secondary font-medium hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-sm">sort</span>
              Sort
            </button>
          </div>
        </div>
      </div>

      {/* Task Grid/List */}
      <div className="grid grid-cols-1 gap-md">
        
        {/* Task Item 1 */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant group hover:shadow-lg transition-all">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-xl">
            {/* Basic Info */}
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-sm mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-error/10 text-error">P0</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Monthly Financial Audit</h3>
              </div>
              <p className="text-secondary font-body-md text-body-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Started 2 hours ago • Est. 4h remaining
              </p>
            </div>
            
            {/* Assigned Worker */}
            <div className="w-48">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center relative overflow-hidden">
                   <span className="material-symbols-outlined text-secondary">smart_toy</span>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-surface rounded-full"></div>
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">FinAgent Delta</p>
                  <p className="text-xs text-secondary">Financial Analyst</p>
                </div>
              </div>
            </div>
            
            {/* Status & Progress */}
            <div className="w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full bg-primary-container/10 text-primary-container text-xs font-bold flex items-center gap-xs uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-primary-container rounded-full animate-pulse"></span>
                  In Progress
                </span>
                <span className="text-sm font-semibold text-primary-container">64%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full rounded-full" style={{ width: "64%" }}></div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all" title="Edit">
                <span className="material-symbols-outlined">edit_note</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all" title="Pause">
                <span className="material-symbols-outlined">pause_circle</span>
              </button>
              <button className="p-2 hover:bg-error/10 hover:text-error rounded-lg text-secondary transition-all" title="Stop">
                <span className="material-symbols-outlined">stop_circle</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Task Item 2 */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant group hover:shadow-lg transition-all">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-xl">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-sm mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-secondary-container/50 text-on-secondary-container">P1</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Social Media Campaign Generation</h3>
              </div>
              <p className="text-secondary font-body-md text-body-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Scheduled for 2:00 PM • Est. 1.5h
              </p>
            </div>
            <div className="w-48">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
                   <span className="material-symbols-outlined text-secondary">smart_toy</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">CreativeBot 9</p>
                  <p className="text-xs text-secondary">Content Strategist</p>
                </div>
              </div>
            </div>
            <div className="w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold flex items-center gap-xs uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-on-secondary-container rounded-full"></span>
                  Pending
                </span>
                <span className="text-sm font-semibold text-secondary">0%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary-container h-full rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all">
                <span className="material-symbols-outlined">edit_note</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all">
                <span className="material-symbols-outlined">play_circle</span>
              </button>
              <button className="p-2 hover:bg-error/10 hover:text-error rounded-lg text-secondary transition-all">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Task Item 3 */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant group hover:shadow-lg transition-all opacity-80">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-xl">
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-sm mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-outline/10 text-outline">P2</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Data Normalization & Cleaning</h3>
              </div>
              <p className="text-secondary font-body-md text-body-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Completed 15m ago • Duration: 45m
              </p>
            </div>
            <div className="w-48">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden">
                   <span className="material-symbols-outlined text-secondary">smart_toy</span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">DataNode Zero</p>
                  <p className="text-xs text-secondary">Data Engineer</p>
                </div>
              </div>
            </div>
            <div className="w-64">
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">check</span>
                  Completed
                </span>
                <span className="text-sm font-semibold text-primary">100%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all">
                <span className="material-symbols-outlined">replay</span>
              </button>
              <button className="p-2 hover:bg-surface-container rounded-lg text-secondary transition-all">
                <span className="material-symbols-outlined">description</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-xl grid grid-cols-1 md:grid-cols-4 gap-lg">
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Active Tasks</p>
          <p className="text-headline-md font-bold text-on-surface">{activeTasks} <span className="text-sm font-normal text-primary text-body-md">+2 from yesterday</span></p>
        </div>
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Success Rate</p>
          <p className="text-headline-md font-bold text-on-surface">{successRate}% <span className="text-sm font-normal text-primary text-body-md">Global Avg</span></p>
        </div>
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Avg Completion Time</p>
          <p className="text-headline-md font-bold text-on-surface">1h 14m</p>
        </div>
        <div className="bg-surface-container-low p-md rounded-lg border border-outline-variant">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Pending Approval</p>
          <p className="text-headline-md font-bold text-on-surface">3 <span className="text-sm font-normal text-error text-body-md">Needs Action</span></p>
        </div>
      </div>
    </div>
  );
}
