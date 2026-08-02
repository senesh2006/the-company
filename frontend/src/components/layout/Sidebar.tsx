"use client";

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAgents, useNeedsAttention } from '@/lib/queries';

export function Sidebar() {
  const pathname = usePathname();
  const { data: agents } = useAgents();
  const { data: attentionItems } = useNeedsAttention();
  
  const activeWorkerCount = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length || 0;
  const pendingAttentionCount = attentionItems?.length || 0;

  const mainNavItems = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'AI Workers', href: '/agents', icon: 'smart_toy', badge: activeWorkerCount > 0 ? `${activeWorkerCount} active` : undefined },
    { name: 'Tasks & Operations', href: '/tasks', icon: 'assignment' },
    { name: 'Shared Memory', href: '/memory', icon: 'memory' },
    { name: 'Cost & Analytics', href: '/analytics', icon: 'analytics' },
  ];

  const opsNavItems = [
    { name: 'Recruit Worker', href: '/hire', icon: 'person_add' },
    { name: 'Approvals & Attention', href: '/approvals', icon: 'verified_user', badge: pendingAttentionCount > 0 ? `${pendingAttentionCount}` : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { name: 'Worker Hierarchy', href: '/hierarchy', icon: 'account_tree' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#0c1322]/95 backdrop-blur-2xl border-r border-slate-800/80 shadow-2xl flex flex-col p-5 z-50">
      {/* Brand Header */}
      <div className="mb-6 px-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-xl font-bold">hub</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-headline-sm font-bold text-slate-100 tracking-tight text-[17px]">Company OS</h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v2.4</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Autonomous AI Workforce</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-1">
        <div className="pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Fleet</div>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a 
              key={item.name} 
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-300 border-l-2 border-emerald-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-emerald-400 fill" : "text-slate-400 group-hover:text-slate-300"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  isActive 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                    : "bg-slate-800 text-slate-400 border-slate-700/60"
                )}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}

        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workforce & Control</div>
        
        {opsNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a 
              key={item.name} 
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-300 border-l-2 border-emerald-400 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-emerald-400 fill" : "text-slate-400 group-hover:text-slate-300"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  item.badgeColor || (isActive 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                    : "bg-slate-800 text-slate-400 border-slate-700/60")
                )}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      
      {/* Fleet Health Status Card */}
      <div className="p-3 my-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></span>
          <div>
            <p className="text-[11px] font-semibold text-slate-200">Fleet Online</p>
            <p className="text-[10px] text-slate-400">Autonomous loop active</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400/90 font-medium">99.9%</span>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-800/80 pt-4 px-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[1px]">
              <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center text-xs font-bold text-slate-200">
                HQ
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Workspace Admin</p>
            <p className="text-[10px] text-slate-400 truncate">ops@company.ai</p>
          </div>
        </div>
        <a href="/analytics" className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-lg">tune</span>
        </a>
      </div>
    </aside>
  );
}

