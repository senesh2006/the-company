"use client";

import { useMetrics } from "@/lib/queries";

export default function AnalyticsPage() {
  const { data: metrics } = useMetrics();

  // Placeholder data if metrics API doesn't provide cost data yet
  const totalSpend = metrics?.totalCost || 1248.50;
  const avgCost = (metrics?.totalCost && metrics?.totalTasks) ? (metrics.totalCost / metrics.totalTasks) : 0.42;

  return (
    <div className="p-xl flex-1 max-w-[1440px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-xl">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold mb-xs">Cost & Analytics</h2>
          <p className="font-body-lg text-body-lg text-secondary">Monitor spending, efficiency, and resource allocation across your AI workforce.</p>
        </div>
        <div className="flex gap-md">
          <div className="flex items-center gap-xs px-md py-base bg-white border border-outline-variant rounded-lg font-body-md text-body-md cursor-pointer hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-md">calendar_today</span>
            Last 30 Days
            <span className="material-symbols-outlined text-md">expand_more</span>
          </div>
          <button className="flex items-center gap-xs px-lg py-base bg-white border border-outline-variant text-on-background rounded-lg font-body-md text-body-md font-medium hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-md">download</span>
            Download Report
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
        {/* Card 1 */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col gap-xs hover:shadow-md transition-shadow">
          <p className="text-secondary font-label-caps text-label-caps uppercase tracking-wider">Total Spend</p>
          <div className="flex items-baseline gap-xs">
            <h3 className="font-display-lg text-display-lg font-bold">${totalSpend.toFixed(2)}</h3>
            <span className="text-primary font-body-md text-body-md font-semibold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12%
            </span>
          </div>
          <p className="text-secondary opacity-50 text-[11px]">vs. last month ($1,114.73)</p>
        </div>
        
        {/* Card 2 */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col gap-xs hover:shadow-md transition-shadow">
          <p className="text-secondary font-label-caps text-label-caps uppercase tracking-wider">Avg. Cost per Task</p>
          <div className="flex items-baseline gap-xs">
            <h3 className="font-display-lg text-display-lg font-bold">${avgCost.toFixed(2)}</h3>
            <span className="text-tertiary font-body-md text-body-md font-semibold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              -2%
            </span>
          </div>
          <p className="text-secondary opacity-50 text-[11px]">Efficiency improved</p>
        </div>
        
        {/* Card 3 */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col gap-xs hover:shadow-md transition-shadow">
          <p className="text-secondary font-label-caps text-label-caps uppercase tracking-wider">Resource Efficiency</p>
          <div className="flex items-baseline gap-xs">
            <h3 className="font-display-lg text-display-lg font-bold">94.2%</h3>
            <div className="w-2 h-2 bg-primary rounded-full ml-xs animate-pulse"></div>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-xs">
            <div className="bg-primary h-1 rounded-full" style={{ width: "94%" }}></div>
          </div>
        </div>
        
        {/* Card 4 */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col gap-xs hover:shadow-md transition-shadow">
          <p className="text-secondary font-label-caps text-label-caps uppercase tracking-wider">Projected Spend</p>
          <div className="flex items-baseline gap-xs">
            <h3 className="font-display-lg text-display-lg font-bold">$3,150.00</h3>
          </div>
          <p className="text-secondary opacity-50 text-[11px]">Estimate for current billing cycle</p>
        </div>
      </div>

      {/* Bento Layout: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
        {/* Large Spending Trend Chart */}
        <div className="lg:col-span-2 bg-white p-lg rounded-xl shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between mb-xl">
            <h4 className="font-headline-sm text-headline-sm font-semibold">Spending Trend</h4>
            <div className="flex gap-md">
              <span className="flex items-center gap-xs font-body-md text-body-md text-secondary">
                <span className="w-3 h-3 rounded-full bg-primary"></span> Costs
              </span>
              <span className="flex items-center gap-xs font-body-md text-body-md text-secondary">
                <span className="w-3 h-3 rounded-full bg-outline-variant"></span> Average
              </span>
            </div>
          </div>
          {/* Chart Placeholder with styling */}
          <div className="h-64 w-full relative flex items-end gap-1 px-base">
            <div className="flex-1 bg-primary/10 rounded-t-sm h-[40%] relative group hover:bg-primary/20 transition-colors"></div>
            <div className="flex-1 bg-primary/15 rounded-t-sm h-[55%] relative group hover:bg-primary/25 transition-colors"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[45%] relative group hover:bg-primary/30 transition-colors"></div>
            <div className="flex-1 bg-primary/25 rounded-t-sm h-[60%] relative group hover:bg-primary/35 transition-colors"></div>
            <div className="flex-1 bg-primary/30 rounded-t-sm h-[75%] relative group hover:bg-primary/40 transition-colors"></div>
            <div className="flex-1 bg-primary/40 rounded-t-sm h-[65%] relative group hover:bg-primary/50 transition-colors"></div>
            <div className="flex-1 bg-primary/50 rounded-t-sm h-[85%] relative group hover:bg-primary/60 transition-colors"></div>
            <div className="flex-1 bg-primary/60 rounded-t-sm h-[95%] relative group hover:bg-primary/70 transition-colors"></div>
            <div className="flex-1 bg-primary/70 rounded-t-sm h-[80%] relative group hover:bg-primary/80 transition-colors"></div>
            <div className="flex-1 bg-primary/80 rounded-t-sm h-[70%] relative group hover:bg-primary/90 transition-colors"></div>
            <div className="flex-1 bg-primary rounded-t-sm h-[100%] relative group">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-xs bg-inverse-surface text-white px-xs py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${totalSpend > 0 ? (totalSpend/10).toFixed(2) : '24.10'}</div>
            </div>
            
            {/* Average Line Decoration */}
            <div className="absolute w-full h-[1px] border-t border-dashed border-secondary/30 bottom-[60%]"></div>
          </div>
          <div className="flex justify-between mt-md text-secondary font-code-sm text-[11px] opacity-60">
            <span>OCT 01</span>
            <span>OCT 10</span>
            <span>OCT 20</span>
            <span>OCT 30</span>
          </div>
        </div>

        {/* Cost by Department */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col">
          <h4 className="font-headline-sm text-headline-sm font-semibold mb-xl">Cost by Department</h4>
          <div className="flex-1 flex flex-col justify-center gap-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="font-body-md text-body-md">Marketing</span>
              </div>
              <span className="font-body-md text-body-md font-bold">$482.10</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="font-body-md text-body-md">Finance</span>
              </div>
              <span className="font-body-md text-body-md font-bold">$312.40</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                <span className="font-body-md text-body-md">Research</span>
              </div>
              <span className="font-body-md text-body-md font-bold">$295.00</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
                <span className="font-body-md text-body-md">Operations</span>
              </div>
              <span className="font-body-md text-body-md font-bold">$159.00</span>
            </div>
          </div>
          <div className="mt-xl h-2 w-full bg-surface-container-low rounded-full overflow-hidden flex">
            <div className="bg-primary h-full" style={{ width: "40%" }}></div>
            <div className="bg-secondary h-full" style={{ width: "25%" }}></div>
            <div className="bg-secondary-container h-full" style={{ width: "20%" }}></div>
            <div className="bg-surface-container-highest h-full" style={{ width: "15%" }}></div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-outline-variant mb-xl overflow-hidden">
        <div className="p-lg border-b border-surface-container">
          <h4 className="font-headline-sm text-headline-sm font-semibold">Cost by Worker</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-md text-body-md">
            <thead className="bg-surface font-label-caps text-label-caps text-secondary">
              <tr>
                <th className="px-lg py-md">Worker</th>
                <th className="px-lg py-md">Department</th>
                <th className="px-lg py-md text-right">Tasks Completed</th>
                <th className="px-lg py-md text-right">Total Cost</th>
                <th className="px-lg py-md text-right">Avg. Cost</th>
                <th className="px-lg py-md">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md flex items-center gap-md">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">MM</div>
                  <span className="font-medium">Marketing Manager</span>
                </td>
                <td className="px-lg py-md text-secondary">Marketing</td>
                <td className="px-lg py-md text-right font-code-sm">412</td>
                <td className="px-lg py-md text-right font-bold">$156.20</td>
                <td className="px-lg py-md text-right text-secondary">$0.38</td>
                <td className="px-lg py-md">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'wght' 600" }}>trending_up</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md flex items-center gap-md">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">FA</div>
                  <span className="font-medium">Finance Auditor</span>
                </td>
                <td className="px-lg py-md text-secondary">Finance</td>
                <td className="px-lg py-md text-right font-code-sm">285</td>
                <td className="px-lg py-md text-right font-bold">$210.45</td>
                <td className="px-lg py-md text-right text-secondary">$0.74</td>
                <td className="px-lg py-md">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'wght' 600" }}>trending_down</span>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <td className="px-lg py-md flex items-center gap-md">
                  <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-on-secondary-container font-bold text-xs">RA</div>
                  <span className="font-medium">Research Assistant</span>
                </td>
                <td className="px-lg py-md text-secondary">Research</td>
                <td className="px-lg py-md text-right font-code-sm">892</td>
                <td className="px-lg py-md text-right font-bold">$115.80</td>
                <td className="px-lg py-md text-right text-secondary">$0.13</td>
                <td className="px-lg py-md">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'wght' 600" }}>trending_flat</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-lg flex flex-col gap-md">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h4 className="font-headline-sm text-headline-sm font-semibold text-primary">Smart Suggestions</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="bg-white p-md rounded-lg flex items-start gap-md border border-primary/5 hover:border-primary/20 transition-colors">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span className="material-symbols-outlined">timer_off</span>
            </div>
            <div>
              <p className="font-body-md text-body-md font-bold mb-base">Optimize Finance Agent</p>
              <p className="font-body-md text-body-md text-secondary opacity-80">High idle time detected between 02:00 and 06:00. Switching to 'On-Demand' mode could save $42.00/month.</p>
            </div>
          </div>
          <div className="bg-white p-md rounded-lg flex items-start gap-md border border-primary/5 hover:border-primary/20 transition-colors">
            <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <p className="font-body-md text-body-md font-bold mb-base">Scale Research Cluster</p>
              <p className="font-body-md text-body-md text-secondary opacity-80">Peak usage detected daily at 14:00. Scaling up 15 minutes prior will reduce average task latency by 24%.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Signature */}
      <footer className="mt-auto py-lg flex justify-between items-center text-secondary opacity-40 font-body-md text-body-md">
        <span>© 2026 Company OS. All rights reserved.</span>
        <div className="flex gap-lg">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
