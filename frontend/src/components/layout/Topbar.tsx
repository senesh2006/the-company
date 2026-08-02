"use client";

import { useMetrics, useAgents } from '@/lib/queries';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export function Topbar() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { theme, setTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length || 0;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Executive Founder";
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || "EX";

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
        <Link 
          href="/hire" 
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span>Recruit Worker</span>
        </Link>

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
          <Link 
            href="/approvals"
            className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
            title="Approvals & Attention"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5 animate-ping"></span>
            <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5"></span>
          </Link>
          
          <Link 
            href="/analytics"
            className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="System Analytics"
          >
            <span className="material-symbols-outlined text-lg">insights</span>
          </Link>
        </div>
        
        {/* User profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] shadow-xs">
              <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center text-xs font-bold text-emerald-800">
                {userInitials}
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-sm">
              {menuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 py-2 px-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email || "founder@company.ai"}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  <span>{isConfigured ? 'Supabase Auth' : 'Local Dev Mode'}</span>
                </div>
              </div>

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-base text-slate-400">switch_account</span>
                <span>Switch Account / Sign In</span>
              </Link>

              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
              >
                <span className="material-symbols-outlined text-base text-rose-500">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
