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
    { name: 'Approvals & Attention', href: '/approvals', icon: 'verified_user', badge: pendingAttentionCount > 0 ? `${pendingAttentionCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
    { name: 'Worker Hierarchy', href: '/hierarchy', icon: 'account_tree' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white/95 backdrop-blur-2xl border-r border-slate-200/90 shadow-sm flex flex-col p-5 z-50">
      {/* Brand Header */}
      <div className="mb-6 px-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-[1px] shadow-md shadow-emerald-500/10">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-xl font-bold">hub</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-headline-sm font-bold text-slate-900 tracking-tight text-[17px]">Company OS</h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-emerald-50 text-emerald-700 border border-emerald-200">v2.4</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Autonomous AI Workforce</p>
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
                  ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 font-semibold shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-emerald-600 fill" : "text-slate-400 group-hover:text-slate-600"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  isActive 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                    : "bg-slate-100 text-slate-600 border-slate-200"
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
                  ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 font-semibold shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-emerald-600 fill" : "text-slate-400 group-hover:text-slate-600"
                )}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  item.badgeColor || (isActive 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                    : "bg-slate-100 text-slate-600 border-slate-200")
                )}>
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>
      
      {/* Fleet Health Status Card */}
      <div className="p-3 my-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30 animate-pulse"></span>
          <div>
            <p className="text-[11px] font-semibold text-slate-800">Fleet Online</p>
            <p className="text-[10px] text-slate-500">Autonomous loop active</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 font-semibold">99.9%</span>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-200 pt-4 px-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[1px]">
              <div className="w-full h-full bg-slate-100 rounded-[11px] flex items-center justify-center text-xs font-bold text-slate-700">
                HQ
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">Workspace Admin</p>
            <p className="text-[10px] text-slate-500 truncate">ops@company.ai</p>
          </div>
        </div>
        <a href="/analytics" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-lg">tune</span>
        </a>
      </div>
    </aside>
  );
}
