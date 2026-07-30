"use client";

import { useAgents, useMetrics, useNeedsAttention } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Activity, ServerCrash, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import { AgentStatus } from "@/lib/api";

const statusColors: Record<AgentStatus, string> = {
  Running: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Idle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function Dashboard() {
  const { data: metrics } = useMetrics();
  const { data: agents } = useAgents();
  const { data: needsAttention } = useNeedsAttention();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Control Plane</h1>
        <p className="text-zinc-400">Overview of your autonomous fleet.</p>
      </div>

      {needsAttention && needsAttention.length > 0 && (
        <Alert variant="destructive" className="bg-red-950/20 border-red-900/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>You have {needsAttention.length} tasks blocked and waiting for human approval.</span>
            <Link href="/needs-attention" className="text-sm font-medium underline underline-offset-4">
              Review Now
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{metrics?.activeAgents || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Running Tasks</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{metrics?.runningTasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Failed Tasks</CardTitle>
            <ServerCrash className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{metrics?.failedTasks || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Cost Today</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">${metrics?.totalCostToday.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">Live Fleet Status</h2>
          <Link href="/agents" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            View All →
          </Link>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/30">
          <div className="p-4 grid grid-cols-5 text-sm font-medium text-zinc-400 border-b border-zinc-800">
            <div>Agent Name</div>
            <div>Role</div>
            <div>Status</div>
            <div className="col-span-2">Current Goal</div>
          </div>
          <div className="divide-y divide-zinc-800">
            {agents?.map((agent) => (
              <div key={agent.id} className="p-4 grid grid-cols-5 text-sm items-center hover:bg-zinc-800/30 transition-colors">
                <div className="font-medium text-zinc-200">
                  <Link href={`/agents/${agent.id}`} className="hover:underline">
                    {agent.name}
                  </Link>
                </div>
                <div className="text-zinc-500">{agent.role}</div>
                <div>
                  <Badge variant="outline" className={statusColors[agent.status]}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="col-span-2 text-zinc-400 truncate pr-4" title={agent.currentGoal}>
                  {agent.currentGoal}
                </div>
              </div>
            ))}
            {(!agents || agents.length === 0) && (
              <div className="p-8 text-center text-zinc-500">No agents hired yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
