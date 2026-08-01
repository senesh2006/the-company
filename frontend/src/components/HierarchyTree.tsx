"use client";

import { useAppStore } from '@/lib/store';
import { type HierarchyNode } from '@/lib/api';
import { motion } from 'framer-motion';
import { Network, Server, User, TerminalSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyTreeProps {
  data: HierarchyNode;
}

export function HierarchyTree({ data }: HierarchyTreeProps) {
  return (
    <div className="p-8">
      <TreeNode node={data} isRoot={true} />
    </div>
  );
}

function TreeNode({ node, isRoot = false }: { node: HierarchyNode, isRoot?: boolean }) {
  const { selectedAgentId, setSelectedAgentId } = useAppStore();
  const isSelected = selectedAgentId === node.agent.id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'Failed': return 'bg-rose-500';
      case 'Paused': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getIcon = (role: string) => {
    if (role === 'Global Supervisor') return <Server className="w-4 h-4" />;
    if (role === 'Researcher' || role.includes('Scraper')) return <Network className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all w-[320px] mb-4 relative z-10",
          isSelected 
            ? "bg-zinc-900 border-zinc-500 shadow-md" 
            : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900",
          false
        )}
        onClick={() => setSelectedAgentId(node.agent.id)}
      >
        <div className="relative">
          <div className={cn("w-2 h-2 rounded-full absolute -top-1 -right-1", getStatusColor(node.agent.status))} />
          <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
            {getIcon(node.agent.role)}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-medium text-zinc-100 truncate">{node.agent.name}</h3>
          <p className="text-xs text-zinc-500 font-mono truncate">{node.agent.role}</p>
        </div>

        {node.agent.status === 'Running' && node.children.length > 0 && (
          <div className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30">
            SUP
          </div>
        )}
      </motion.div>

      {node.children.length > 0 && (
        <div className="ml-8 pl-8 border-l border-zinc-800 relative space-y-4">
          {/* Connector Line Top */}
          <div className="absolute top-0 -left-px w-8 h-px bg-zinc-800" />
          
          {node.children.map((child, idx) => (
            <div key={child.agent.id} className="relative">
              {/* Connector Line Side */}
              <div className="absolute top-6 -left-8 w-8 h-px bg-zinc-800" />
              <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
