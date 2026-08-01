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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Agents Fleet</h1>
          <p className="text-zinc-400">Manage your autonomous workforce.</p>
        </div>
        <Link href="/hire">
          <Button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
            Hire New Agent
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {agents?.map((agent) => (
          <Card key={agent.id} className="bg-zinc-900/50 border-zinc-800 flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-800/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-zinc-100">{agent.name}</CardTitle>
                  <p className="text-sm text-zinc-500 mt-1">{agent.role}</p>
                </div>
                <Badge variant="outline" className={statusColors[agent.status]}>
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Current Goal</p>
                <p className="text-sm text-zinc-300 line-clamp-2">{agent.currentGoal || 'No goal assigned'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Last Action</p>
                <p className="text-sm text-zinc-300 truncate">{agent.actions?.[agent.actions.length - 1] || 'No actions yet'}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cost</p>
                <p className="text-sm font-mono text-amber-500">${agent.costSoFar?.toFixed(2) ?? '0.00'}</p>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-zinc-800/50 flex justify-between gap-2">
              <div className="flex gap-2">
                {agent.status === 'Running' ? (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-zinc-950 border-zinc-800 hover:bg-zinc-800"
                    onClick={() => updateStatus.mutate({ id: agent.id, status: 'Paused' })}
                  >
                    <Pause className="h-4 w-4 text-zinc-400" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-zinc-950 border-zinc-800 hover:bg-zinc-800"
                    onClick={() => updateStatus.mutate({ id: agent.id, status: 'Running' })}
                  >
                    <Play className="h-4 w-4 text-emerald-500" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-zinc-950 border-zinc-800 hover:bg-red-950/50 hover:border-red-900/50 hover:text-red-500"
                  onClick={() => updateStatus.mutate({ id: agent.id, status: 'Failed' })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/agents/${agent.id}`}>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-zinc-100">
                  Details <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {(!agents || agents.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20">
          <p className="text-zinc-400 mb-4">No agents in the fleet.</p>
          <Link href="/hire">
            <Button className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700">Hire your first agent</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
