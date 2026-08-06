"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAgents, useNeedsAttention } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Bot, 
  ClipboardList, 
  Database, 
  BarChart3, 
  Building2,
  FileSpreadsheet,
  UserPlus, 
  ShieldCheck, 
  Network,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { easings, durations } from "@/lib/motion";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: agents } = useAgents();
  const { data: attentionItems } = useNeedsAttention();
  const { user, signOut } = useAuth();
  
  const activeWorkerCount = agents?.filter(a => a.status === 'Running' || a.status === 'Idle')?.length || 0;
  const pendingAttentionCount = attentionItems?.length || 0;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (user ? "User" : "");
  const userEmail = user?.email || "";
  const userInitials = userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "U";

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }

  const mainNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Departments', href: '/departments', icon: Building2 },
    { name: 'AI Workers', href: '/agents', icon: Bot, badge: activeWorkerCount > 0 ? `${activeWorkerCount}` : undefined },
    { name: 'Tasks & Operations', href: '/tasks', icon: ClipboardList },
    { name: 'Shared Memory', href: '/memory', icon: Database },
    { name: 'Cost & Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const opsNavItems: NavItem[] = [
    { name: 'Recruit Worker', href: '/hire', icon: UserPlus },
    { name: 'Approvals & Attention', href: '/approvals', icon: ShieldCheck, badge: pendingAttentionCount > 0 ? `${pendingAttentionCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
    { name: 'Worker Hierarchy', href: '/hierarchy', icon: Network },
  ];

  const NavGroup = ({ items, label }: { items: NavItem[], label: string }) => (
    <div className="mb-6">
      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-slate-900 rounded-xl"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-3">
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className={cn(isActive && "text-white")}>{item.name}</span>
              </div>
              <div className="relative flex items-center gap-2">
                {item.badge && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors",
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : item.badgeColor || "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={cn(
                  "w-3.5 h-3.5 transition-all",
                  isActive ? "text-emerald-400 translate-x-0 opacity-100" : "text-slate-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Brand Header */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/" className="flex items-center gap-3 group" onClick={onMobileClose}>
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-[1px] shadow-md shadow-emerald-500/10"
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
          </motion.div>
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
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <NavGroup items={mainNavItems} label="Operations" />
        <NavGroup items={opsNavItems} label="Governance & Hierarchy" />
      </div>

      {/* Trust & Autonomy Telemetry */}
      <div className="my-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-emerald"></span>
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
            <motion.button 
              onClick={() => signOut()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onMobileClose}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-slate-700 hover:text-emerald-700 group"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Sign In / Register</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[280px] glass-surface border-r border-slate-200/90 shadow-sm flex-col p-5 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: durations.fast }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed left-0 top-0 h-screen w-[280px] glass-surface border-r border-slate-200/90 shadow-2xl flex-col p-5 z-50 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: durations.slow, ease: easings.easeOutExpo }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-[1px]">
                    <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <span className="font-bold text-sm text-slate-900">Company OS</span>
                </div>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
