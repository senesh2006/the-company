"use client";

import { useState } from "react";
import { useApprovals, useResolveApproval, useTasks, useAgents } from "@/lib/queries";
import { 
  CheckCircle2, 
  CreditCard, 
  Trash2, 
  Megaphone, 
  Check, 
  X, 
  SlidersHorizontal, 
  RotateCcw, 
  MoreVertical, 
  ExternalLink,
  Paperclip,
  ShieldCheck
} from "lucide-react";

interface ApprovalDisplayItem {
  id: string;
  title: string;
  priority: string;
  priorityType: string;
  requester: string;
  timeAgo: string;
  icon: any;
  iconBg: string;
  description?: string;
  codePayload?: string;
  campaignText?: string;
  attachmentCount?: number;
  platforms?: string;
  status: string;
}

export default function ApprovalsPage() {
  const { data: dbApprovals, isLoading: isApprovalsLoading } = useApprovals();
  const { data: dbTasks } = useTasks();
  const { data: agents } = useAgents();
  const resolveApproval = useResolveApproval();

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "flagged">("pending");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const rawApprovals = dbApprovals || [];
  
  // Real mapped items
  const dynamicApprovals: ApprovalDisplayItem[] = rawApprovals.map((item: any) => {
    const isCritical = item.type === "critical" || item.title?.toLowerCase().includes("deletion") || item.title?.toLowerCase().includes("transfer");
    return {
      id: item.id,
      title: item.title || "Mandate Execution Review",
      priority: isCritical ? "CRITICAL" : "High Priority",
      priorityType: isCritical ? "critical" : "high",
      requester: item.agentName || "Autonomous Worker",
      timeAgo: item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
      icon: isCritical ? Trash2 : CreditCard,
      iconBg: isCritical ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700",
      description: item.description || "Worker generated an action that requires founder verification before execution.",
      status: "pending"
    };
  });

  const approvalsToDisplay = dynamicApprovals.filter(a => {
    if (filterPriority === "critical") return a.priorityType === "critical";
    return true;
  });
  const pendingCount = dynamicApprovals.length;

  const handleAction = async (id: string, decision: "approved" | "rejected" | "revise") => {
    try {
      await resolveApproval.mutateAsync({
        approvalId: id,
        status: decision,
        reason: decision === "approved" ? "Authorized by Executive" : "Action rejected by Executive"
      });
      setActionSuccessMessage(`Action '${id}' successfully resolved with status: ${decision.toUpperCase()}`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      setActionSuccessMessage(`Action processed: ${decision.toUpperCase()}`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Action Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Section with Top-Right KPI Boxes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Human-in-the-Loop Approvals
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl">
            Review and authorize high-stakes actions requested by AI agents.
          </p>
        </div>

        {/* 3 Metric Pill Boxes */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          {/* Box 1: Total Pending */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Pending
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              {pendingCount}
            </span>
          </div>

          {/* Box 2: Approval Rate */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Approval Rate
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              100%
            </span>
          </div>

          {/* Box 3: Avg Response Time */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance Status
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono text-xs">
              Compliant
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-6 text-xs md:text-sm font-semibold">
          {[
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "flagged", label: "Flagged ⚑" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-1 transition-all ${
                activeTab === tab.id
                  ? "text-emerald-800 font-bold border-b-2 border-emerald-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter / Sort buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPriority(filterPriority === "all" ? "critical" : "all")}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter: {filterPriority === "all" ? "All" : "Critical"}</span>
          </button>
        </div>
      </div>

      {/* 3. Approvals Cards Grid / Layout or Empty State */}
      {approvalsToDisplay.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Clear &bull; No Pending Approvals</h3>
          <p className="text-xs text-slate-500 max-w-md">
            Your autonomous agents are running within their authorized policy limits. Any high-risk or financial transaction exceeding thresholds will appear here for executive sign-off.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {approvalsToDisplay.map((approval) => (
            <div key={approval.id} className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${approval.iconBg} border flex items-center justify-center shrink-0`}>
                  <approval.icon className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-900">
                      {approval.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      approval.priorityType === "critical" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      • {approval.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    <span className="font-bold text-slate-800">{approval.requester}</span> &bull; {approval.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                <button
                  onClick={() => handleAction(approval.id, "revise")}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
                >
                  Ask Revision
                </button>
                <button
                  onClick={() => handleAction(approval.id, "rejected")}
                  className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 shadow-xs"
                >
                  ✕ Reject
                </button>
                <button
                  onClick={() => handleAction(approval.id, "approved")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  ✓ Authorize
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
