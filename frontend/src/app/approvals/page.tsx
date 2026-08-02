"use client";

import { useState } from "react";
import { useApprovals, useResolveApproval, useTasks, useAgents } from "@/lib/queries";
import { 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  FileText, 
  SlidersHorizontal, 
  ArrowUpDown,
  MoreVertical,
  RotateCcw,
  Paperclip,
  Trash2,
  Megaphone,
  CreditCard,
  Database,
  ShieldAlert,
  Bot,
  CheckCircle2,
  Sparkles
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

  // Combine approvals from both attention items and review tasks
  const rawApprovals = dbApprovals || [];
  
  // Real or fallback mapped items
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

  // Default demonstration approvals if database currently has zero pending approvals
  const defaultDemonstrations: ApprovalDisplayItem[] = [
    {
      id: "appr-1",
      title: "Vendor Payment Authorization",
      priority: "High Priority",
      priorityType: "high",
      requester: "FinanceAgent_Alpha",
      timeAgo: "5 mins ago",
      icon: CreditCard,
      iconBg: "bg-slate-100 text-slate-700",
      codePayload: `> INITIATE_TRANSFER {
  amount: "$54,000.00 USD",
  destination: "Vendor_TechCorp_Inc",
  invoice_ref: "INV-2023-8991",
  risk_score: 0.82 /* Flagged: Amount exceeds standard auto-approval threshold */
}`,
      status: "pending"
    },
    {
      id: "appr-2",
      title: "Publish Campaign",
      priority: "Med",
      priorityType: "med",
      requester: "MarketingBot",
      timeAgo: "15m ago",
      icon: Megaphone,
      iconBg: "bg-blue-50 text-blue-700",
      campaignText: "🚀 Revolutionize your workflow with Company OS! We're rolling out new AI agent capabilities th...",
      attachmentCount: 1,
      platforms: "LinkedIn, Twitter",
      status: "pending"
    },
    {
      id: "appr-3",
      title: "Bulk Record Deletion Request",
      priority: "CRITICAL",
      priorityType: "critical",
      requester: "DataOps_Agent",
      timeAgo: "1h ago",
      icon: Trash2,
      iconBg: "bg-rose-50 text-rose-700",
      description: "DataOps_Agent is requesting permission to hard-delete 12,450 stale user records based on the new GDPR compliance policy update.",
      status: "pending"
    }
  ];

  const approvalsToDisplay = dynamicApprovals.length > 0 ? dynamicApprovals : defaultDemonstrations;
  const pendingCount = dynamicApprovals.length > 0 ? dynamicApprovals.length : defaultDemonstrations.length;

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
            <span className="text-xl font-extrabold text-rose-600 font-mono">
              {pendingCount}
            </span>
          </div>

          {/* Box 2: Approval Rate */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Approval Rate
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              96%
            </span>
          </div>

          {/* Box 3: Avg Response Time */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg. Response Time
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              8m
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

      {/* 3. Approvals Cards Grid / Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Main Action Review (Col 8/12) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-bold text-slate-900">
                      {approvalsToDisplay[0]?.title || "Vendor Payment Authorization"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                      • High Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Requested by {approvalsToDisplay[0]?.requester || "Finance Specialist"} • {approvalsToDisplay[0]?.timeAgo || "5 mins ago"}
                  </p>
                </div>
              </div>

              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Action Preview Terminal Code Box */}
            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Action Preview / Mandate
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {approvalsToDisplay[0]?.codePayload || approvalsToDisplay[0]?.description || `> INITIATE_OPERATION {
  mandate: "${approvalsToDisplay[0]?.title}",
  requester: "${approvalsToDisplay[0]?.requester}",
  status: "awaiting_founder_review",
  authority_tier: "Observe -> Requires explicit approval"
}`}
              </div>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <span>Verified Governance Log</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(approvalsToDisplay[0]?.id || "appr-1", "revise")}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Ask Revision</span>
              </button>

              <button
                onClick={() => handleAction(approvalsToDisplay[0]?.id || "appr-1", "rejected")}
                className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 shadow-xs"
              >
                ✕ Reject
              </button>

              <button
                onClick={() => handleAction(approvalsToDisplay[0]?.id || "appr-1", "approved")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                ✓ Approve Action
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Publish Campaign / Action (Col 4/12) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {approvalsToDisplay[1]?.title || "Publish Campaign"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                    • Med
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {approvalsToDisplay[1]?.requester || "MarketingBot"} • {approvalsToDisplay[1]?.timeAgo || "15m ago"}
                </p>
              </div>
            </div>

            {/* Campaign Preview Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
              <p className="leading-relaxed font-medium">
                &ldquo;{approvalsToDisplay[1]?.campaignText || approvalsToDisplay[1]?.description || "Revolutionize your workflow with Company OS! We are rolling out automated AI execution loops..."}&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> 1 Attached
                </span>
                <span>Platforms: Channels, Web</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-5 mt-4 border-t border-slate-100">
            <button
              onClick={() => handleAction(approvalsToDisplay[1]?.id || "appr-2", "approved")}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Approve</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(approvalsToDisplay[1]?.id || "appr-2", "rejected")}
                className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction(approvalsToDisplay[1]?.id || "appr-2", "revise")}
                className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
              >
                Revise
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Bulk Record Deletion Request (Full Width Banner) */}
        <div className="lg:col-span-12 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  {approvalsToDisplay[2]?.title || "Bulk Record Deletion Request"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  ▲ CRITICAL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                <span className="font-bold text-slate-800">{approvalsToDisplay[2]?.requester || "DataOps_Agent"}</span> is requesting permission to hard-delete <span className="font-bold text-rose-600 font-mono">12,450</span> stale user records based on GDPR compliance policy update.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            <button
              onClick={() => handleAction(approvalsToDisplay[2]?.id || "appr-3", "revise")}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
            >
              Request Changes
            </button>
            <button
              onClick={() => handleAction(approvalsToDisplay[2]?.id || "appr-3", "rejected")}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 shadow-xs"
            >
              Deny
            </button>
            <button
              onClick={() => handleAction(approvalsToDisplay[2]?.id || "appr-3", "approved")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              Authorize Action
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
