"use client";


import { ShieldAlert, Zap, DollarSign } from 'lucide-react';
import { useMetrics } from '@/lib/queries';

export function Topbar() {
  const { data: metrics } = useMetrics();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Hello, Commander!</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Burn Rate (Today)</span>
          <span className="text-sm font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-3 h-3 text-gray-400 mr-0.5" />
            {metrics ? metrics.totalCost.toFixed(2) : '0.00'}
          </span>
        </div>
        
        <div className="h-8 w-px bg-gray-200" />
        
        <div className="flex flex-col items-end mr-4">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Global Risk</span>
          <span className="text-sm font-semibold uppercase text-gray-900 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-gray-400" />
            {metrics ? metrics.riskLevel : 'LOW'}
          </span>
        </div>

        <button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
          <Zap className="w-4 h-4" />
          <span>Open Site</span>
        </button>
      </div>
    </header>
  );
}
