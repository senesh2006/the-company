"use client";

import { useMetrics } from "@/lib/queries";
import { DollarSign, Activity } from "lucide-react";

export function Topbar() {
  const { data: metrics } = useMetrics();

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="flex flex-1 items-center justify-between px-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-zinc-400">System Online</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <span className="text-sm text-zinc-500 mr-2">Cost Today:</span>
            <div className="flex items-center text-sm font-bold text-amber-500">
              <DollarSign className="h-4 w-4 mr-0.5" />
              {metrics?.totalCostToday.toFixed(2) || "0.00"}
            </div>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Founder" alt="User Avatar" />
          </div>
        </div>
      </div>
    </div>
  );
}
