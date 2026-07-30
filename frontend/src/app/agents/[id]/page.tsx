"use client";

import { useParams } from "next/navigation";
import { useAgent, useUpdateAgentStatus, useInjectInstruction } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentStatus } from "@/lib/api";
import { Terminal, Lightbulb, Play, Pause, Trash2, Send } from "lucide-react";
import { useState } from "react";

const statusColors: Record<AgentStatus, string> = {
  Running: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Idle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: agent, isLoading } = useAgent(id);
  const updateStatus = useUpdateAgentStatus();
  const injectInstruction = useInjectInstruction();
  const [instruction, setInstruction] = useState("");

  if (isLoading) return <div className="text-zinc-500">Loading agent data...</div>;
  if (!agent) return <div className="text-red-500">Agent not found.</div>;

  const handleInject = () => {
    if (!instruction.trim()) return;
    injectInstruction.mutate({ id, instruction });
    setInstruction("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{agent.name}</h1>
            <Badge variant="outline" className={statusColors[agent.status]}>{agent.status}</Badge>
          </div>
          <p className="text-zinc-400 mt-1">{agent.role}</p>
        </div>
        
        <div className="flex gap-2">
           {agent.status === 'Running' ? (
              <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Paused' })} className="bg-zinc-900 border-zinc-700">
                <Pause className="h-4 w-4 mr-2" /> Pause
              </Button>
            ) : (
              <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Running' })} className="bg-zinc-900 border-zinc-700">
                <Play className="h-4 w-4 mr-2 text-emerald-500" /> Resume
              </Button>
            )}
            <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Failed' })} className="bg-zinc-900 border-red-900/50 text-red-500 hover:bg-red-950/50">
              <Trash2 className="h-4 w-4 mr-2" /> Kill
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Meta & Injection */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Current State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Current Goal</p>
                <p className="text-sm text-zinc-300">{agent.currentGoal}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Cost So Far</p>
                <p className="text-lg font-mono text-amber-500">${agent.costSoFar.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">Inject Instruction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Override current goal..."
                className="bg-zinc-950 border-zinc-800 resize-none h-24 text-zinc-200"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Button onClick={handleInject} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                <Send className="h-4 w-4 mr-2" /> Inject Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="text-lg flex items-center">
                <Terminal className="h-5 w-5 mr-2 text-zinc-500" /> Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-zinc-800/50">
                {agent.thoughts.map((thought, i) => (
                  <div key={`thought-${i}`} className="p-4 flex gap-4 hover:bg-zinc-800/20">
                    <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Thought</p>
                      <p className="text-sm text-zinc-300">{thought}</p>
                    </div>
                  </div>
                ))}
                {agent.actions.map((action, i) => (
                  <div key={`action-${i}`} className="p-4 flex gap-4 hover:bg-zinc-800/20 bg-zinc-950/30">
                    <Terminal className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Action Call</p>
                      <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">{action}</pre>
                    </div>
                  </div>
                ))}
                {agent.thoughts.length === 0 && agent.actions.length === 0 && (
                   <div className="p-8 text-center text-zinc-500">No activity logged yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
