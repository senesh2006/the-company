"use client";

import { useMetrics } from '@/lib/queries';

export function Topbar() {
  const { data: metrics } = useMetrics();

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-280px)] h-16 glass-header flex items-center justify-between px-lg py-md z-40">
      <div className="flex items-center gap-md bg-surface-container rounded-full px-lg py-xs w-96">
        <span className="material-symbols-outlined text-secondary">search</span>
        <input 
          className="bg-transparent border-none focus:ring-0 text-body-md w-full placeholder:text-secondary outline-none" 
          placeholder="Search system commands..." 
          type="text"
        />
      </div>
      
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-base text-secondary cursor-pointer hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <div className="w-2 h-2 bg-error rounded-full absolute top-0 right-0 -mr-1 -mt-1"></div>
        </div>
        
        <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-primary transition-colors">settings</span>
        <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-primary transition-colors">help_outline</span>
        
        <div className="h-8 w-[1px] bg-outline-variant"></div>
        
        <div className="flex items-center gap-sm">
          <img 
            className="w-8 h-8 rounded-full border border-primary-container object-cover" 
            alt="User profile" 
            src="https://i.pravatar.cc/150?u=commander" 
          />
        </div>
      </div>
    </header>
  );
}
