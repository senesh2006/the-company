import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, Network, Database, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Command Center', href: '/', icon: LayoutDashboard },
    { name: 'Org Hierarchy', href: '/hierarchy', icon: Network },
    { name: 'Task Graph', href: '/tasks', icon: Activity },
    { name: 'Shared Memory', href: '/memory', icon: Database },
    { name: 'Cost Dashboard', href: '/dashboard', icon: Cpu },
    { name: 'Needs Attention', href: '/approvals', icon: ShieldAlert },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col glass-panel relative z-10">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" />
          <span className="font-semibold text-lg tracking-tight">The Company</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-800/50 text-emerald-400" 
                  : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
              {item.name}
            </Link>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
        <div>SYSTEM: ONLINE</div>
        <div>V: 2.4.1-alpha</div>
      </div>
    </aside>
  );
}
