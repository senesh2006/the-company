"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useConnections, 
  useInitiateConnection, 
  useDisconnectConnection 
} from "@/lib/queries";
import { 
  Cable, 
  Mail, 
  MessageSquare, 
  FileText, 
  GitBranch, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Lock,
  Cpu,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolkitMeta {
  toolkit: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  agents: string[];
  capabilities: string[];
}

const TOOLKIT_METAS: ToolkitMeta[] = [
  {
    toolkit: "gmail",
    name: "Gmail",
    category: "Communication",
    description: "Connect your Google inbox to allow AI Workers to search emails, draft replies, and triage incoming inquiries.",
    icon: Mail,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    agents: ["Marketing Manager", "Personal Assistant"],
    capabilities: ["Read inbox", "Draft & send emails", "Triage unread messages"]
  },
  {
    toolkit: "slack",
    name: "Slack",
    category: "Collaboration",
    description: "Enable agents to post announcements, read team channels, and alert you on priority operations.",
    icon: MessageSquare,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    agents: ["Marketing Manager", "Finance Manager", "Personal Assistant"],
    capabilities: ["Send channel messages", "Inter-department alerts", "Thread replies"]
  },
  {
    toolkit: "notion",
    name: "Notion",
    category: "Productivity",
    description: "Link your Notion workspace to read content calendars, internal SOPs, and export generated research.",
    icon: FileText,
    color: "text-slate-900 dark:text-slate-100",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    agents: ["Marketing Manager", "Research Specialist"],
    capabilities: ["Read & update content calendar", "Draft SOP documents", "Knowledge export"]
  },
  {
    toolkit: "github",
    name: "GitHub",
    category: "Engineering",
    description: "Authorize access to repositories for code inspection, bug reporting, and PR generation.",
    icon: GitBranch,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    agents: ["Engineering Worker", "Coder"],
    capabilities: ["Browse repositories", "Create PRs & issues", "Run test checks"]
  },
  {
    toolkit: "googlecalendar",
    name: "Google Calendar",
    category: "Calendar",
    description: "Allow your Personal Assistant to inspect schedules, find meeting slots, and book operational syncs.",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    agents: ["Personal Assistant"],
    capabilities: ["Check availability", "Schedule events", "Conflict detection"]
  },
  {
    toolkit: "googlesheets",
    name: "Google Sheets",
    category: "Spreadsheets",
    description: "Sync trial balances, financial journals, and revenue dashboards directly with your spreadsheets.",
    icon: FileSpreadsheet,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    agents: ["Finance Manager", "Bookkeeper"],
    capabilities: ["Sync trial balance", "Read ledger entries", "Automated rollups"]
  }
];

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const { data: connectionsData, isLoading, refetch, isFetching } = useConnections();
  const initiateMutation = useInitiateConnection();
  const disconnectMutation = useDisconnectConnection();

  const [connectingToolkit, setConnectingToolkit] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Handle URL query feedback upon OAuth callback redirect
  useEffect(() => {
    const connectedToolkit = searchParams.get("connected");
    const status = searchParams.get("status");

    if (connectedToolkit) {
      setNotification({
        message: `Successfully connected ${connectedToolkit.toUpperCase()} account! AI agents now have scoped MCP access.`,
        type: "success"
      });
      refetch();
    }
  }, [searchParams, refetch]);

  const connections = connectionsData?.connections || [];
  const connectedCount = connections.filter(c => c.status === "connected").length;

  const handleConnect = async (toolkit: string) => {
    try {
      setConnectingToolkit(toolkit);
      const res = await initiateMutation.mutateAsync({
        toolkit,
        redirect_url: typeof window !== "undefined" ? `${window.location.origin}/api/v1/connections/callback` : undefined
      });

      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      }
    } catch (err: any) {
      setNotification({
        message: err?.message || `Failed to initiate connection for ${toolkit}`,
        type: "info"
      });
      setConnectingToolkit(null);
    }
  };

  const handleDisconnect = async (toolkit: string) => {
    if (!confirm(`Are you sure you want to disconnect ${toolkit.toUpperCase()}? AI workers will no longer have access to this account.`)) {
      return;
    }
    try {
      await disconnectMutation.mutateAsync(toolkit);
      setNotification({
        message: `Disconnected ${toolkit.toUpperCase()}.`,
        type: "info"
      });
    } catch (err: any) {
      setNotification({
        message: err?.message || `Failed to disconnect ${toolkit}`,
        type: "info"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Per-User Composio Connectors
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Model Context Protocol (MCP)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Cable className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            Integrations & App Connectors
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Authenticate your individual workspace tools. When an AI specialist worker needs to draft emails, query tickets, or update sheets, actions are strictly scoped to your authorized sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-emerald-600")} />
            Sync Status
          </button>
        </div>
      </div>

      {/* Live Notification Feedback */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm",
              notification.type === "success"
                ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
            )}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs md:text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telemetry Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Connected Toolkits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {connectedCount} <span className="text-xs font-normal text-slate-400">/ {TOOLKIT_METAS.length} active</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">MCP Protocol Routing</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic User Session
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Security & Isolation</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Row Level Security (RLS) Active
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Toolkits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLKIT_METAS.map((meta) => {
          const connection = connections.find(c => c.toolkit === meta.toolkit);
          const isConnected = connection?.status === "connected";
          const isPending = connection?.status === "pending" || connectingToolkit === meta.toolkit;
          const Icon = meta.icon;

          return (
            <motion.div
              key={meta.toolkit}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-2xl p-6 bg-white dark:bg-slate-900 border transition-all shadow-sm flex flex-col justify-between",
                isConnected 
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20" 
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div className="space-y-4">
                {/* Header with Icon and Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border", meta.bgColor, meta.borderColor)}>
                      <Icon className={cn("w-5 h-5", meta.color)} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {meta.name}
                      </h2>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {meta.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                        Connecting...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[40px]">
                  {meta.description}
                </p>

                {/* Capabilities list */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Agent Capabilities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.capabilities.map((cap, i) => (
                      <span 
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assigned AI Workers */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Scoped Workers
                  </p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {meta.agents.join(", ")}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDisconnect(meta.toolkit)}
                      disabled={disconnectMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Disconnect Account
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(meta.toolkit)}
                    disabled={isPending || initiateMutation.isPending}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Initiating OAuth...
                      </>
                    ) : (
                      <>
                        Connect {meta.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security & Architecture Footer Notice */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <Lock className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-tight">Zero-Trust Credential Architecture</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Company OS connects to Composio using secure server-side OAuth handshakes. Your authentication tokens are never exposed to browser clients or saved in plain text. Each AI worker invocation requests a short-lived MCP tool session strictly limited to your authorized account.
        </p>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          Loading Integrations...
        </div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
