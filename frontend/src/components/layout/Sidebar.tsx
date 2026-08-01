"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  
  const mainNavItems = [
    { name: 'Dashboard', href: '/', icon: 'dashboard' },
    { name: 'Agents', href: '/agents', icon: 'smart_toy' },
    { name: 'Tasks', href: '/tasks', icon: 'assignment' },
    { name: 'Memory', href: '/memory', icon: 'memory' },
    { name: 'Cost & Analytics', href: '/analytics', icon: 'analytics' },
  ];

  const opsNavItems = [
    { name: 'Hire Agents', href: '/hire', icon: 'person_add' },
    { name: 'Approvals', href: '/approvals', icon: 'verified_user' },
    { name: 'Hierarchy', href: '/hierarchy', icon: 'account_tree' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest dark:bg-inverse-surface shadow-sm flex flex-col p-lg gap-base z-50">
      <div className="mb-xl px-md pt-lg">
        <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim">Company OS</h1>
        <p className="font-body-md text-body-md text-secondary">AI Control Plane</p>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-md p-md rounded-lg active:scale-95 transition-all",
                isActive 
                  ? "text-primary dark:text-primary-fixed-dim font-bold bg-secondary-container dark:bg-on-secondary-fixed-variant" 
                  : "text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container dark:hover:bg-surface-variant font-body-md transition-colors"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive && "fill")}>{item.icon}</span>
              <span className="font-body-md">{item.name}</span>
            </Link>
          )
        })}

        <div className="pt-xl pb-base px-md text-secondary opacity-50 uppercase text-[10px] font-bold tracking-widest">Operations</div>
        
        {opsNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center gap-md p-md rounded-lg active:scale-95 transition-all",
                isActive 
                  ? "text-primary dark:text-primary-fixed-dim font-bold bg-secondary-container dark:bg-on-secondary-fixed-variant" 
                  : "text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container dark:hover:bg-surface-variant font-body-md transition-colors"
              )}
            >
              <span className={cn("material-symbols-outlined", isActive && "fill")}>{item.icon}</span>
              <span className="font-body-md">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <div className="mt-auto border-t border-outline-variant pt-lg px-md flex items-center gap-md pb-lg">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shrink-0">JD</div>
        <div className="flex-1 min-w-0">
          <p className="font-label-caps text-label-caps text-on-surface truncate">John Doe</p>
          <p className="text-[10px] text-secondary truncate">Administrator</p>
        </div>
        <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-primary shrink-0">settings</span>
      </div>
    </aside>
  );
}

