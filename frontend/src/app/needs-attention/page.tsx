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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
          Needs Attention
        </h1>
        <p className="text-gray-500">Tasks blocked and awaiting human decision.</p>
      </div>

      <div className="space-y-4">
        {items?.map((item) => (
          <Card key={item.id} className="bg-white border-red-200 shadow-sm rounded-2xl overflow-hidden ring-1 ring-red-100">
            <CardHeader className="pb-2 bg-red-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-red-600 font-bold">Blocked: {item.agentName}</CardTitle>
                  <p className="text-sm font-medium text-gray-500 mt-1">Agent ID: <Link href={`/agents/${item.agentId}`} className="hover:underline">{item.agentId}</Link></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-bold text-amber-600">{item.type}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-1">Issue:</p>
                <p className="text-sm font-medium text-gray-600">{item.title}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-1">Details:</p>
                <p className="text-sm font-medium text-gray-600">{item.description}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/50 pt-4">
              <Button className="bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-sm font-medium">
                <Check className="h-4 w-4 mr-2" /> Approve Action
              </Button>
              <Button variant="outline" className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm">
                <Edit className="h-4 w-4 mr-2" /> Modify Action
              </Button>
              <Button variant="outline" className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm">
                <X className="h-4 w-4 mr-2" /> Reject & Fail
              </Button>
              <Button variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm ml-auto">
                <Hand className="h-4 w-4 mr-2" /> Take Over Manually
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(!items || items.length === 0) && (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
            <Check className="h-12 w-12 text-green-400 mb-4" />
            <p className="text-gray-900 text-lg font-bold">All clear!</p>
            <p className="text-gray-500 font-medium mt-1">No agents require human intervention right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
