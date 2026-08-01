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
          "flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all w-[320px] mb-4 relative z-10",
          isSelected 
            ? "bg-white border-black shadow-md ring-1 ring-black" 
            : "bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow",
          false
        )}
        onClick={() => setSelectedAgentId(node.agent.id)}
      >
        <div className="relative">
          <div className={cn("w-2 h-2 rounded-full absolute -top-1 -right-1", getStatusColor(node.agent.status))} />
          <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
            {getIcon(node.agent.role)}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-900 truncate">{node.agent.name}</h3>
          <p className="text-xs text-gray-500 font-medium truncate">{node.agent.role}</p>
        </div>

        {node.agent.status === 'Running' && node.children.length > 0 && (
          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            SUP
          </div>
        )}
      </motion.div>

      {node.children.length > 0 && (
        <div className="ml-8 pl-8 border-l-2 border-gray-200 relative space-y-4">
          {/* Connector Line Top */}
          <div className="absolute top-0 -left-[2px] w-8 h-[2px] bg-gray-200" />
          
          {node.children.map((child, idx) => (
            <div key={child.agent.id} className="relative">
              {/* Connector Line Side */}
              <div className="absolute top-6 -left-8 w-8 h-[2px] bg-gray-200" />
              <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
