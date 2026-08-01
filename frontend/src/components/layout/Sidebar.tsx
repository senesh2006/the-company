"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Network, Database, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Command Center', href: '/', icon: LayoutDashboard },
    { name: 'Agents Fleet', href: '/agents', icon: Network },
    { name: 'Shared Memory', href: '/memory', icon: Database },
    { name: 'Cost Dashboard', href: '/dashboard', icon: Cpu },
    { name: 'Needs Attention', href: '/needs-attention', icon: ShieldAlert },
    { name: 'Hire Agent', href: '/hire', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col relative z-10">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="font-bold text-xl tracking-tighter text-black flex items-center">
            <span className="text-2xl mr-1">W</span>iNK
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-gray-400 mb-2 px-3 uppercase tracking-wider">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive 
                  ? "bg-gray-100 text-black shadow-sm" 
                  : "text-gray-500 hover:text-black hover:bg-gray-50"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-black" : "text-gray-400")} />
              {item.name}
            </Link>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            <img src="https://i.pravatar.cc/150?u=commander" alt="User" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-semibold text-gray-900">Commander</span>
            <span className="text-xs text-gray-500">cmd@thecompany.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
