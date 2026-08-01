"use client";

import { useParams } from "next/navigation";
import { useAgent, useUpdateAgentStatus, useInjectInstruction } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type AgentStatus } from "@/lib/api";
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

  if (isLoading) return <div className="text-gray-500 font-medium">Loading agent data...</div>;
  if (!agent) return <div className="text-red-500 font-medium">Agent not found.</div>;

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{agent.name}</h1>
            <Badge variant="outline" className={statusColors[agent.status]}>{agent.status}</Badge>
          </div>
          <p className="text-gray-500 mt-1 font-medium">{agent.role}</p>
        </div>
        
        <div className="flex gap-2">
           {agent.status === 'Running' ? (
              <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Paused' })} className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm">
                <Pause className="h-4 w-4 mr-2" /> Pause
              </Button>
            ) : (
              <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Running' })} className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm">
                <Play className="h-4 w-4 mr-2 text-blue-500" /> Resume
              </Button>
            )}
            <Button variant="outline" onClick={() => updateStatus.mutate({ id, status: 'Failed' })} className="bg-white border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm">
              <Trash2 className="h-4 w-4 mr-2" /> Kill
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Meta & Injection */}
        <div className="space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-2xl pb-4">
              <CardTitle className="text-lg text-gray-900 font-bold">Current State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Current Goal</p>
                <p className="text-sm font-medium text-gray-700">{agent.currentGoal || 'No goal assigned'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Cost So Far</p>
                <p className="text-xl font-bold text-gray-900">${agent.costSoFar?.toFixed(2) ?? '0.00'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-2xl pb-4">
              <CardTitle className="text-lg text-gray-900 font-bold">Inject Instruction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Textarea 
                placeholder="Override current goal..."
                className="bg-white border-gray-200 resize-none h-24 text-gray-900 focus:ring-1 focus:ring-blue-500"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Button onClick={handleInject} className="w-full bg-black text-white hover:bg-gray-800 font-medium">
                <Send className="h-4 w-4 mr-2" /> Inject Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-gray-200 shadow-sm rounded-2xl h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
              <CardTitle className="text-lg flex items-center text-gray-900 font-bold">
                <Terminal className="h-5 w-5 mr-2 text-gray-500" /> Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 bg-gray-50/30">
              <div className="divide-y divide-gray-100">
                {(agent.thoughts ?? []).map((thought: string, i: number) => (
                  <div key={`thought-${i}`} className="p-5 flex gap-4 hover:bg-gray-50 transition-colors">
                    <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Thought</p>
                      <p className="text-sm font-medium text-gray-700">{thought}</p>
                    </div>
                  </div>
                ))}
                {(agent.actions ?? []).map((action: string, i: number) => (
                  <div key={`action-${i}`} className="p-5 flex gap-4 bg-gray-50/50 hover:bg-gray-100 transition-colors border-l-4 border-blue-500">
                    <Terminal className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Action Call</p>
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap font-medium bg-white p-3 rounded-lg border border-gray-200 shadow-sm mt-2">{action}</pre>
                    </div>
                  </div>
                ))}
                {(agent.thoughts ?? []).length === 0 && (agent.actions ?? []).length === 0 && (
                   <div className="p-8 text-center text-gray-500 font-medium">No activity logged yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
