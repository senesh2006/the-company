"use client";

import { useMetrics } from '@/lib/queries';

export default function Dashboard() {
  const { data: metrics } = useMetrics();

  // Mocked data from HTML if metrics aren't fully matching
  const totalWorkers = metrics?.totalAgents || 12;
  const activeTasks = metrics?.totalTasks ? metrics.totalTasks - (metrics.completedTasks || 0) : 48;
  const totalCost = metrics?.totalCost || 42.30;
  const successRate = metrics?.successRate ? (metrics.successRate * 100).toFixed(1) : "98.2";

  return (
    <>
      <div className="mb-xl">
        <h2 className="font-display-lg text-display-lg text-on-background">Dashboard</h2>
        <p className="font-body-lg text-body-lg text-secondary">System-wide overview of your AI workforce and operations.</p>
      </div>

      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
        {/* Total Workers */}
        <div className="bento-card p-lg flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-secondary font-label-caps text-label-caps">Total Workers</span>
            <div className="bg-primary-container/10 p-base rounded-lg">
              <span className="material-symbols-outlined text-primary">groups</span>
            </div>
          </div>
          <div className="flex items-end gap-md">
            <span className="font-headline-md text-display-lg">{totalWorkers}</span>
            <div className="flex items-center text-primary mb-base">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span className="font-label-caps text-label-caps ml-[2px]">2 since yesterday</span>
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bento-card p-lg flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-secondary font-label-caps text-label-caps">Active Tasks</span>
            <div className="bg-tertiary-container/10 p-base rounded-lg">
              <span className="material-symbols-outlined text-tertiary">task_alt</span>
            </div>
          </div>
          <div className="flex items-center gap-xl">
            <span className="font-headline-md text-display-lg">{activeTasks}</span>
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-primary" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" strokeDasharray="150" strokeDashoffset="22" strokeWidth="4"></circle>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-label-caps text-[10px]">85%</span>
            </div>
          </div>
        </div>

        {/* Total Cost Today */}
        <div className="bento-card p-lg flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-secondary font-label-caps text-label-caps">Total Cost Today</span>
            <div className="bg-secondary-container p-base rounded-lg">
              <span className="material-symbols-outlined text-secondary">payments</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-display-lg">${totalCost.toFixed(2)}</span>
            <div className="w-full h-8 mt-xs">
              <svg className="w-full h-full">
                <path className="w-full" d="M0 25 L10 20 L20 28 L30 15 L40 22 L50 18 L60 25 L70 12 L80 15 L90 5 L100 10" fill="none" stroke="#10b981" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bento-card p-lg flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-secondary font-label-caps text-label-caps">Avg. Success Rate</span>
            <div className="bg-primary/10 p-base rounded-lg">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
          </div>
          <div className="flex items-end gap-md">
            <span className="font-headline-md text-display-lg">{successRate}%</span>
            <div className="flex items-center text-primary mb-base">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">
        {/* Task Completion Volume */}
        <div className="bento-card p-lg lg:col-span-2">
          <div className="flex justify-between items-center mb-xl">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Task Completion Volume</h3>
            <div className="flex gap-sm">
              <button className="bg-surface-container px-md py-xs rounded-lg font-label-caps text-label-caps text-secondary hover:text-primary transition-colors">Daily</button>
              <button className="bg-primary text-on-primary px-md py-xs rounded-lg font-label-caps text-label-caps">Weekly</button>
            </div>
          </div>
          <div className="h-64 relative bg-surface-container-low rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-end px-lg pb-base gap-gutter">
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[40%] transition-all hover:h-[45%]"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[65%] transition-all hover:h-[70%]"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[50%] transition-all hover:h-[55%]"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[85%] transition-all hover:h-[90%]"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[75%] transition-all hover:h-[80%]"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[95%] transition-all hover:h-[100%] border-t-4 border-primary"></div>
              <div className="flex-1 bg-primary/20 rounded-t-lg h-[60%] transition-all hover:h-[65%]"></div>
            </div>
          </div>
        </div>

        {/* Worker Distribution */}
        <div className="bento-card p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xl">Worker Distribution</h3>
          <div className="relative w-48 h-48 mx-auto mb-lg">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#10b981" strokeDasharray="40 100" strokeDashoffset="0" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#565e74" strokeDasharray="25 100" strokeDashoffset="-40" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#a43a3a" strokeDasharray="20 100" strokeDashoffset="-65" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#bbcabf" strokeDasharray="15 100" strokeDashoffset="-85" strokeWidth="4.5"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline-md text-headline-md">{totalWorkers}</span>
              <span className="text-[10px] text-secondary uppercase tracking-widest font-bold">Agents</span>
            </div>
          </div>
          <div className="space-y-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-body-md">Marketing</span>
              </div>
              <span className="font-label-caps text-label-caps">40%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-body-md">Finance</span>
              </div>
              <span className="font-label-caps text-label-caps">25%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                <span className="text-body-md">Research</span>
              </div>
              <span className="font-label-caps text-label-caps">20%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-sm">
                <div className="w-3 h-3 rounded-full bg-outline-variant"></div>
                <span className="text-body-md">Operations</span>
              </div>
              <span className="font-label-caps text-label-caps">15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Recent Activities Feed */}
        <div className="bento-card p-lg flex flex-col max-h-[400px]">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Activities</h3>
            <button className="text-primary font-label-caps text-label-caps hover:underline">View All Logs</button>
          </div>
          <div className="space-y-md overflow-y-auto no-scrollbar pr-xs">
            {/* Activity 1 */}
            <div className="flex gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border-l-2 border-primary">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface">Marketing Manager completed <span className="font-code-sm text-primary">"Ad Copy Optimization"</span></p>
                <p className="text-secondary text-[11px] mt-1">2 mins ago • Duration: 14s</p>
              </div>
            </div>
            {/* Activity 2 */}
            <div className="flex gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border-l-2 border-tertiary">
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-tertiary text-[20px]">search</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface">Research Agent started <span className="font-code-sm text-tertiary">"Q3 Market Audit"</span></p>
                <p className="text-secondary text-[11px] mt-1">12 mins ago • 0% complete</p>
              </div>
            </div>
            {/* Activity 3 */}
            <div className="flex gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border-l-2 border-secondary">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface">Finance Bot processed <span className="font-code-sm text-secondary">"Invoice #8842"</span></p>
                <p className="text-secondary text-[11px] mt-1">45 mins ago • Success</p>
              </div>
            </div>
            {/* Activity 4 */}
            <div className="flex gap-md p-sm hover:bg-surface-container-low rounded-lg transition-colors border-l-2 border-primary">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface">Content Creator published <span className="font-code-sm text-primary">"Weekly Roundup Post"</span></p>
                <p className="text-secondary text-[11px] mt-1">1 hour ago • Slack notified</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bento-card p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xl">System Health</h3>
          <div className="space-y-xl">
            {/* Compute Status */}
            <div>
              <div className="flex justify-between items-center mb-sm">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">developer_board</span>
                  <span className="font-body-md text-on-surface">Compute Clusters</span>
                </div>
                <span className="text-primary font-bold font-label-caps text-label-caps">84% Peak</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-primary rounded-full"></div>
              </div>
            </div>
            {/* Memory Status */}
            <div>
              <div className="flex justify-between items-center mb-sm">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">memory</span>
                  <span className="font-body-md text-on-surface">Global Context Memory</span>
                </div>
                <span className="text-secondary font-label-caps text-label-caps">1.2 TB / 2.0 TB</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-secondary-fixed-dim rounded-full"></div>
              </div>
            </div>
            {/* API Connections */}
            <div className="grid grid-cols-2 gap-lg">
              <div className="p-md rounded-xl bg-surface-container-low flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] uppercase text-secondary">API Latency</span>
                  <div className="pulse-dot"></div>
                </div>
                <span className="font-headline-sm text-primary">24ms</span>
                <span className="text-[10px] text-secondary">Nominal performance</span>
              </div>
              <div className="p-md rounded-xl bg-surface-container-low flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] uppercase text-secondary">Conns.</span>
                  <div className="pulse-dot"></div>
                </div>
                <span className="font-headline-sm text-primary">1,204</span>
                <span className="text-[10px] text-secondary">Active webhooks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB Contextual */}
      <button className="fixed bottom-xl right-xl w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </>
  );
}

