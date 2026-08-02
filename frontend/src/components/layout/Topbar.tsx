"use client";

import { useMetrics, useAgents } from '@/lib/queries';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Topbar() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCount = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length || 0;

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/90 flex items-center justify-between px-8 z-40">
      {/* Search Console */}
      <div className="flex items-center gap-2.5 bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 rounded-xl px-4 py-2 w-96 transition-all duration-200 focus-within:border-emerald-500/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-xs">
        <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
        <input 
          className="bg-transparent border-none text-xs text-slate-800 w-full placeholder:text-slate-400 outline-none font-medium" 
          placeholder="Search workers, tasks, memory or operations..." 
          type="text"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
          ⌘K
        </kbd>
      </div>
      
      {/* Right controls */}
      <div className="flex items-center gap-3.5">
        {/* Real-time Workforce Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-800 font-semibold">{activeCount} AI Workers Active</span>
        </div>

        {/* Quick Recruit Button */}
        <a 
          href="/hire" 
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span>Recruit Worker</span>
        </a>

        <div className="h-5 w-[1px] bg-slate-200"></div>

        {/* Theme Toggle Button */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-lg">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        )}

        {/* Notifications & Settings */}
        <div className="flex items-center gap-1 text-slate-500">
          <a 
            href="/approvals"
            className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
            title="Approvals & Attention"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5 animate-ping"></span>
            <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5"></span>
          </a>
          
          <a 
            href="/analytics"
            className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="System Analytics"
          >
            <span className="material-symbols-outlined text-lg">insights</span>
          </a>
        </div>
        
        {/* User avatar */}
        <div className="flex items-center pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-[1px] shadow-xs">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center text-xs font-bold text-emerald-700">
              AD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
