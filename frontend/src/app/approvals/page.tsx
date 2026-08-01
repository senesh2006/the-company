"use client";

import { useMetrics } from "@/lib/queries";

export default function ApprovalsPage() {
  const { data: metrics } = useMetrics();
  
  // Example metric values that could be passed from backend eventually
  const pendingApprovals = 24;
  const approvalRate = 92;
  const avgResponseTime = "12m";

  return (
    <div className="p-xl flex-1 max-w-[1440px] mx-auto w-full">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-lg mb-xl">
        <div>
          <h2 className="text-display-lg font-display-lg text-on-background">Human-in-the-Loop Approvals</h2>
          <p className="text-body-lg font-body-lg text-secondary mt-2">Review and authorize high-stakes actions requested by AI agents.</p>
        </div>
        
        <div className="flex gap-md overflow-x-auto pb-2 md:pb-0">
          {/* Metrics */}
          <div className="bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl p-md border border-outline-variant flex flex-col justify-center min-w-[140px]">
            <span className="text-label-caps font-label-caps text-secondary uppercase tracking-wider">Total Pending</span>
            <span className="text-headline-md font-headline-md text-error mt-1">{pendingApprovals}</span>
          </div>
          <div className="bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl p-md border border-outline-variant flex flex-col justify-center min-w-[140px]">
            <span className="text-label-caps font-label-caps text-secondary uppercase tracking-wider">Approval Rate</span>
            <span className="text-headline-md font-headline-md text-primary mt-1">{approvalRate}%</span>
          </div>
          <div className="bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl p-md border border-outline-variant flex flex-col justify-center min-w-[140px]">
            <span className="text-label-caps font-label-caps text-secondary uppercase tracking-wider">Avg Response Time</span>
            <span className="text-headline-md font-headline-md text-on-background mt-1">{avgResponseTime}</span>
          </div>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-md mb-lg border-b border-outline-variant pb-xs">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          <button className="whitespace-nowrap pb-3 border-b-2 border-primary text-primary font-headline-sm text-headline-sm">Pending ({pendingApprovals})</button>
          <button className="whitespace-nowrap pb-3 border-b-2 border-transparent text-secondary font-headline-sm text-headline-sm hover:text-on-background transition-colors">Approved</button>
          <button className="whitespace-nowrap pb-3 border-b-2 border-transparent text-secondary font-headline-sm text-headline-sm hover:text-on-background transition-colors">Rejected</button>
          <button className="whitespace-nowrap pb-3 border-b-2 border-transparent text-secondary font-headline-sm text-headline-sm hover:text-on-background transition-colors flex items-center gap-1">
            Flagged <span className="material-symbols-outlined text-error text-sm">flag</span>
          </button>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md text-secondary hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter
          </button>
          <button className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md text-secondary hover:bg-surface-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sort</span> Sort
          </button>
        </div>
      </div>

      {/* Approval Queue Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg">
        
        {/* High Priority Item */}
        <div className="xl:col-span-8 bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl border-l-4 border-error border-y border-r border-outline-variant p-lg flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                 <span className="material-symbols-outlined text-secondary text-2xl">account_balance</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-sm font-headline-sm text-on-background">Vendor Payment Authorization</h3>
                  <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-label-caps font-label-caps flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span> High Priority
                  </span>
                </div>
                <p className="text-body-md font-body-md text-secondary mt-1">Requested by <span className="font-medium text-on-background">FinanceAgent_Alpha</span> • 5 mins ago</p>
              </div>
            </div>
            <button className="text-secondary hover:text-on-background">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md mb-6">
            <h4 className="text-label-caps font-label-caps text-secondary uppercase mb-2">Action Preview</h4>
            <div className="font-code-sm text-code-sm text-on-background bg-surface-container-low p-3 rounded border border-outline-variant/50 overflow-x-auto whitespace-pre">
              {`> INITIATE_TRANSFER {
  amount: "$54,000.00 USD",
  destination: "Vendor_TechCorp_Inc",
  invoice_ref: "INV-2023-8991",
  risk_score: 0.82 /* Flagged: Amount exceeds standard auto-approval threshold */
}`}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <button className="text-secondary font-body-md text-body-md hover:text-on-background underline decoration-outline-variant underline-offset-4 flex items-center gap-1 w-fit">
              View Full Details <span className="material-symbols-outlined text-sm">open_in_new</span>
            </button>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 rounded-lg text-body-md font-body-md text-secondary border border-outline-variant hover:bg-surface-container transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">edit_note</span> Ask Revision
              </button>
              <button className="px-6 py-2 rounded-lg text-body-md font-body-md text-error border border-error hover:bg-error/10 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">close</span> Reject
              </button>
              <button className="px-6 py-2 rounded-lg text-body-md font-body-md text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
                <span className="material-symbols-outlined text-sm">check</span> Approve Action
              </button>
            </div>
          </div>
        </div>
        
        {/* Medium Priority Item (Social Media) */}
        <div className="xl:col-span-4 bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl border border-outline-variant p-lg flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-secondary-container/50 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">campaign</span>
                </div>
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-on-background">Publish Campaign</h3>
                  <p className="text-body-md font-body-md text-secondary">MarketingBot • 15m ago</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary text-label-caps font-label-caps flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Med
              </span>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 mb-6">
              <p className="text-body-md font-body-md text-on-background line-clamp-3">
                "🚀 Revolutionize your workflow with Company OS! We're rolling out new AI agent capabilities that handle the busywork so you can focus on strategy. Link in bio to see the demo! #AI #Productivity #SaaS"
              </p>
              <div className="mt-2 text-label-caps font-label-caps text-secondary flex gap-2">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">image</span> 1 Attached</span>
                <span>• Platforms: LinkedIn, X</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="w-full py-2 rounded-lg text-body-md font-body-md text-primary-container bg-primary-container/10 hover:bg-primary-container/20 font-bold transition-colors flex justify-center items-center gap-2 border border-primary-container/20">
              <span className="material-symbols-outlined text-sm">check</span> Approve
            </button>
            <div className="flex gap-2">
              <button className="w-1/2 py-2 rounded-lg text-body-md font-body-md text-secondary border border-outline-variant hover:bg-surface-container transition-colors">
                Reject
              </button>
              <button className="w-1/2 py-2 rounded-lg text-body-md font-body-md text-secondary border border-outline-variant hover:bg-surface-container transition-colors">
                Details
              </button>
            </div>
          </div>
        </div>

        {/* Mass Data Deletion (Critical) */}
        <div className="xl:col-span-12 bg-surface/95 backdrop-blur-sm shadow-sm rounded-xl border-l-4 border-error border-y border-r border-outline-variant p-lg flex flex-col lg:flex-row items-start lg:items-center justify-between hover:shadow-md transition-shadow gap-md">
          <div className="flex gap-6 items-center flex-1">
            <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-error text-xl">delete_sweep</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-headline-sm font-headline-sm text-on-background">Bulk Record Deletion Request</h3>
                <span className="px-2 py-0.5 rounded-full bg-error text-white text-label-caps font-label-caps flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">warning</span> CRITICAL
                </span>
              </div>
              <p className="text-body-md font-body-md text-secondary mt-1">
                <span className="font-medium text-on-background">DataOps_Agent</span> is requesting permission to hard-delete <span className="font-code-sm text-error font-bold">12,450</span> stale user records based on the new GDPR compliance policy update.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:ml-6 w-full lg:w-auto">
            <button className="px-4 py-2 rounded-lg text-body-md font-body-md text-secondary border border-outline-variant hover:bg-surface-container transition-colors flex items-center gap-2">
              View Audit Log
            </button>
            <button className="px-6 py-2 rounded-lg text-body-md font-body-md text-error border border-error hover:bg-error/10 transition-colors flex-1 lg:flex-none justify-center">
              Deny
            </button>
            <button className="px-6 py-2 rounded-lg text-body-md font-body-md text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm flex-1 lg:flex-none">
              <span className="material-symbols-outlined text-sm">verified_user</span> Authorize Deletion
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
