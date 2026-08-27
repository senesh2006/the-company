"use client";

import { useMetrics, useAgents } from '@/lib/queries';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  Bell, 
  BarChart3, 
  ChevronDown, 
  LogOut, 
  SwitchCamera,
  Bot
} from 'lucide-react';
import { easings, durations } from '@/lib/motion';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { theme, setTheme } = useTheme();
  const { user, signOut, isConfigured } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || (user ? "User" : "");
  const userInitials = userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : "U";

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-280px)] h-16 glass-header dark:bg-slate-900/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Console */}
        <motion.div 
          className={cn(
            "hidden sm:flex items-center gap-2.5 bg-slate-100/90 dark:bg-slate-800/90 border rounded-xl px-4 py-2 w-72 lg:w-96 transition-all duration-200",
            searchFocused ? "bg-white dark:bg-slate-800 border-primary/50 ring-2 ring-primary/10 shadow-sm" : "border-slate-200/90 dark:border-slate-700/90 hover:border-slate-300 dark:hover:border-slate-600"
          )}
          animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 outline-none font-medium" 
            placeholder="Search workers, tasks, memory or operations..." 
            type="text"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-2xs">
            ⌘K
          </kbd>
        </motion.div>
      </div>
      
      {/* Right controls */}
      <div className="flex items-center gap-2 lg:gap-3.5">
        {/* Demo Mode / Judge Badge */}
        {(user?.user_metadata?.is_demo || user?.email === "demo@thecompany.ai") && (
          <motion.div 
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-bold shadow-xs"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-amber-500">⚡</span>
            <span>Judge Demo Account</span>
          </motion.div>
        )}

        {/* Real-time Workforce Status Pill */}
        <motion.div 
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-xs"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: durations.normal, delay: 0.1, ease: easings.easeOutExpo }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-emerald"></span>
          <span className="text-emerald-800 font-semibold">{activeCount} AI Workers Active</span>
        </motion.div>

        {/* Quick Recruit Button */}
        <Link href="/hire">
          <motion.div
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recruit Worker</span>
          </motion.div>
        </Link>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

        {/* Theme Toggle Button */}
        {mounted && (
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            aria-label="Toggle Theme"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Notifications & Analytics */}
        <div className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Link href="/approvals">
            <motion.div
              className="p-2 rounded-xl hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-slate-100 transition-colors relative"
              title="Approvals & Attention"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5 animate-ping"></span>
              <span className="w-2 h-2 bg-amber-500 rounded-full absolute top-1.5 right-1.5"></span>
            </motion.div>
          </Link>
          
          <Link href="/analytics">
            <motion.div
              className="p-2 rounded-xl hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-900 dark:text-slate-100 transition-colors"
              title="System Analytics"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
            >
              <BarChart3 className="w-4 h-4" />
            </motion.div>
          </Link>
        </div>
        
        {/* User profile dropdown or Sign In button */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <motion.button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:bg-slate-800 transition-all focus:outline-none cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] shadow-xs">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[11px] flex items-center justify-center text-xs font-bold text-emerald-800">
                  {userInitials}
                </div>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform duration-200",
                menuOpen && "rotate-180"
              )} />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 py-2 px-1 z-50"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: durations.fast, ease: easings.easeOutExpo }}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      <Bot className="w-3 h-3" />
                      <span>{isConfigured ? 'Supabase Auth' : 'Authenticated'}</span>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 rounded-xl transition-colors"
                  >
                    <SwitchCamera className="w-4 h-4 text-slate-400" />
                    <span>Switch Account</span>
                  </Link>

                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link href="/login">
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </motion.div>
          </Link>
        )}
      </div>
    </header>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
