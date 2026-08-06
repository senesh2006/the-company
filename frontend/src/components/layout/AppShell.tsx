"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AgentDetailPanel } from "@/components/AgentDetailPanel";
import { AnimatePresence, motion } from "framer-motion";
import { easings, durations } from "@/lib/motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAuthOrOnboardingPage = 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname === "/startup";

  if (isAuthOrOnboardingPage) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: durations.normal, ease: easings.easeOutExpo }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
      <main className="lg:ml-[280px] pt-20 px-4 md:px-6 lg:px-10 pb-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: durations.normal, ease: easings.easeOutExpo }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <AgentDetailPanel />
    </div>
  );
}
