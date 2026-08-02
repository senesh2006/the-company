"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAgents, useNeedsAttention } from '@/lib/queries';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { data: agents } = useAgents();
  const { data: attentionItems } = useNeedsAttention();
  const { user, signOut } = useAuth();
  
  const activeWorkerCount = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length || 0;
  const pendingAttentionCount = attentionItems?.length || 0;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (user ? "User" : "");
  const userEmail = user?.email || "";
  const userInitials = userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "U";

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
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-[1px] shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-xl font-bold">hub</span>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
              Company OS
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                v6.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Autonomous Workforce</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operations
          </p>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "material-symbols-outlined text-lg transition-transform group-hover:scale-110",
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Governance & Hierarchy
          </p>
          <nav className="space-y-1">
            {opsNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "material-symbols-outlined text-lg transition-transform group-hover:scale-110",
                      isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pulse",
                      item.badgeColor || (isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-amber-100 text-amber-800 border-amber-300")
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Trust & Autonomy Telemetry */}
      <div className="my-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <p className="text-[10px] font-semibold text-slate-700">Governance Active</p>
            <p className="text-[9px] text-slate-500">Tier Guardrails Online</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 font-semibold">99.9%</span>
      </div>

      {/* User Profile Footer */}
      <div className="border-t border-slate-200 pt-4 px-2">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-[1px]">
                  <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center text-xs font-bold text-slate-700">
                    {userInitials}
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-slate-700 hover:text-emerald-700 group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-emerald-600 group-hover:scale-110 transition-transform">login</span>
              <span className="text-xs font-semibold">Sign In / Register</span>
            </div>
            <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-emerald-600">arrow_forward</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
