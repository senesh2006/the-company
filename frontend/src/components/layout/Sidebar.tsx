"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BrainCircuit, Database, UserPlus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNeedsAttention } from "@/lib/queries";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents Fleet', href: '/agents', icon: Users },
  { name: 'Shared Memory', href: '/memory', icon: Database },
  { name: 'Hire Agent', href: '/hire', icon: UserPlus },
  { name: 'Needs Attention', href: '/needs-attention', icon: AlertTriangle, hasBadge: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: needsAttention } = useNeedsAttention();
  const alertCount = needsAttention?.length || 0;

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-800">
        <BrainCircuit className="h-6 w-6 text-zinc-100 mr-2" />
        <span className="text-lg font-bold text-zinc-100 tracking-tight">The Company</span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
                  'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )}
              >
                <div className="flex items-center">
                  <item.icon
                    className={cn(
                      isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-300',
                      'mr-3 h-5 w-5 flex-shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {item.hasBadge && alertCount > 0 && (
                  <span className="bg-red-500/10 text-red-500 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
