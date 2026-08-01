"use client";

import { useAgents, useUpdateAgentStatus } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pause, Play, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type AgentStatus } from "@/lib/api";

const statusColors: Record<AgentStatus, string> = {
  Running: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Idle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const updateStatus = useUpdateAgentStatus();

  if (isLoading) {
    return <div className="text-zinc-500">Loading fleet data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agents Fleet</h1>
          <p className="text-gray-500">Manage your autonomous workforce.</p>
        </div>
        <Link href="/hire">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 font-medium">
            Hire New Agent
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {agents?.map((agent) => (
          <Card key={agent.id} className="bg-white border-gray-200 shadow-sm rounded-2xl flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">{agent.name}</CardTitle>
                  <p className="text-sm font-medium text-gray-500 mt-1">{agent.role}</p>
                </div>
                <Badge variant="outline" className={statusColors[agent.status]}>
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Goal</p>
                <p className="text-sm font-medium text-gray-700 line-clamp-2">{agent.currentGoal || 'No goal assigned'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Action</p>
                <p className="text-sm font-medium text-gray-700 truncate">{agent.actions?.[agent.actions.length - 1] || 'No actions yet'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cost</p>
                <p className="text-lg font-bold text-gray-900">${agent.costSoFar?.toFixed(2) ?? '0.00'}</p>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-gray-100 flex justify-between gap-2 bg-gray-50/50 rounded-b-2xl">
              <div className="flex gap-2">
                {agent.status === 'Running' ? (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white border-gray-200 hover:bg-gray-100 text-gray-600"
                    onClick={() => updateStatus.mutate({ id: agent.id, status: 'Paused' })}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white border-gray-200 hover:bg-gray-100 text-blue-600"
                    onClick={() => updateStatus.mutate({ id: agent.id, status: 'Running' })}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-white border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-400"
                  onClick={() => updateStatus.mutate({ id: agent.id, status: 'Failed' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full">
                  Details <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {(!agents || agents.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
          <p className="text-gray-500 font-medium mb-4">No agents in the fleet.</p>
          <Link href="/hire">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">Hire your first agent</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
