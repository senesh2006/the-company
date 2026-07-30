"use client";

import { useMemory } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertTriangle } from "lucide-react";

export default function MemoryPage() {
  const { data: memory, isLoading } = useMemory();

  if (isLoading) return <div className="text-zinc-500">Loading memory...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Shared Memory</h1>
        <p className="text-zinc-400">Global state accessible by all agents in the swarm.</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="border-b border-zinc-800/50">
          <CardTitle className="text-lg flex items-center">
            <Database className="h-5 w-5 mr-2 text-zinc-500" /> Key-Value Store
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800/50">
            {memory && Object.entries(memory).map(([key, value]) => {
              const isFlag = key.startsWith('FLAG_');
              return (
                <div key={key} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 ${isFlag ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'hover:bg-zinc-800/30'}`}>
                  <div className="flex-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-zinc-300">{key}</span>
                      {isFlag && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0"><AlertTriangle className="w-3 h-3 mr-1"/> Flag</Badge>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-mono text-sm text-zinc-400 break-all">{value}</span>
                  </div>
                </div>
              );
            })}
            {(!memory || Object.keys(memory).length === 0) && (
               <div className="p-8 text-center text-zinc-500">Memory is empty.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
