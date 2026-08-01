"use client";

import { useNeedsAttention } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X, Edit, Hand } from "lucide-react";
import Link from "next/link";

export default function NeedsAttentionPage() {
  const { data: items, isLoading } = useNeedsAttention();

  if (isLoading) return <div className="text-zinc-500">Loading items...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          Needs Attention
        </h1>
        <p className="text-zinc-400">Tasks blocked and awaiting human decision.</p>
      </div>

      <div className="space-y-4">
        {items?.map((item) => (
          <Card key={item.id} className="bg-red-950/10 border-red-900/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-red-400">Blocked: {item.agentName}</CardTitle>
                  <p className="text-sm text-zinc-400 mt-1">Agent ID: <Link href={`/agents/${item.agentId}`} className="hover:underline">{item.agentId}</Link></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-mono text-amber-500">{item.type}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="bg-zinc-950/50 rounded-md p-4 border border-zinc-800/50">
                <p className="text-sm font-semibold text-zinc-300 mb-1">Issue:</p>
                <p className="text-sm text-zinc-400">{item.title}</p>
              </div>
              <div className="bg-zinc-950/50 rounded-md p-4 border border-zinc-800/50">
                <p className="text-sm font-semibold text-zinc-300 mb-1">Details:</p>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t border-red-900/20 pt-4">
              <Button className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20">
                <Check className="h-4 w-4 mr-2" /> Approve Action
              </Button>
              <Button variant="outline" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800">
                <Edit className="h-4 w-4 mr-2" /> Modify Action
              </Button>
              <Button variant="outline" className="bg-zinc-900 border-red-900/50 text-red-500 hover:bg-red-950/50">
                <X className="h-4 w-4 mr-2" /> Reject & Fail
              </Button>
              <Button variant="outline" className="bg-zinc-900 border-blue-900/50 text-blue-500 hover:bg-blue-950/50 ml-auto">
                <Hand className="h-4 w-4 mr-2" /> Take Over Manually
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(!items || items.length === 0) && (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20">
            <Check className="h-12 w-12 text-emerald-500/50 mb-4" />
            <p className="text-zinc-400 text-lg font-medium">All clear!</p>
            <p className="text-zinc-500">No agents require human intervention right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
