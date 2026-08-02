"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AgentDetailPanel } from "@/components/AgentDetailPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        {children}
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <Topbar />
      <main className="ml-[280px] pt-20 px-6 md:px-10 pb-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
      <AgentDetailPanel />
    </>
  );
}
