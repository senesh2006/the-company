"use client";

import { useAppStore } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Zap, DollarSign } from 'lucide-react';

export function Topbar() {
  const { isMockMode, toggleMockMode } = useAppStore();

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Control Plane</h1>
        
        <div className="h-6 w-px bg-zinc-800" />
        
        <div className="flex items-center gap-2">
          <Switch 
            id="mock-mode" 
            checked={isMockMode} 
            onCheckedChange={toggleMockMode}
            className="data-[state=checked]:bg-emerald-500"
          />
          <Label htmlFor="mock-mode" className="text-xs text-zinc-400 font-mono flex items-center gap-1 cursor-pointer">
            <Zap className="w-3 h-3 text-emerald-400" />
            MOCK MODE
          </Label>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-zinc-500">BURN RATE (TODAY)</span>
          <span className="text-sm font-mono text-rose-400 flex items-center">
            <DollarSign className="w-3 h-3" />
            14.28
          </span>
        </div>
        
        <div className="h-8 w-px bg-zinc-800" />
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-zinc-500">GLOBAL RISK</span>
          <span className="text-sm font-mono text-emerald-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            LOW
          </span>
        </div>
      </div>
    </header>
  );
}
