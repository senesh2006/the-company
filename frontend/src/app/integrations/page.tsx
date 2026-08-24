"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useConnections, 
  useInitiateConnection, 
  useDisconnectConnection,
  useDiscoveredTools
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
  ArrowRight,
  CreditCard,
  Target,
  Kanban,
  CheckSquare,
  Share2,
  Headphones,
  Database,
  Layers,
  Code2,
  Terminal,
  Search,
  ChevronDown,
  ChevronUp
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
    toolkit: "googlesheets",
    name: "Google Sheets",
    category: "Spreadsheets & Finance",
    description: "Sync trial balances, financial journals, multi-entity group models, and automated rollups directly with Google Sheets.",
    icon: FileSpreadsheet,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    agents: ["Finance Manager", "Personal Assistant", "Bookkeeper"],
    capabilities: ["Sync trial balance", "Append journal entries", "Setup Chart of Accounts", "Read/Write cells"]
  },
  {
    toolkit: "gmail",
    name: "Gmail",
    category: "Communication",
    description: "Connect your Google inbox to allow AI Workers to search emails, draft replies, and triage incoming client inquiries.",
    icon: Mail,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    agents: ["Marketing Manager", "Personal Assistant", "Support"],
    capabilities: ["Read inbox", "Draft & send emails", "Triage unread messages", "Search invoices"]
  },
  {
    toolkit: "slack",
    name: "Slack",
    category: "Collaboration",
    description: "Enable agents to post announcements, read team channels, and alert you in real-time on priority operations.",
    icon: MessageSquare,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    agents: ["Marketing Manager", "Finance Manager", "Personal Assistant"],
    capabilities: ["Send channel messages", "Inter-department alerts", "Thread replies", "Direct messages"]
  },
  {
    toolkit: "github",
    name: "GitHub",
    category: "Engineering",
    description: "Authorize access to repositories for code inspection, bug reporting, PR generation, and CI/CD status.",
    icon: GitBranch,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    agents: ["Software Engineer", "Architecture Lead"],
    capabilities: ["Browse repositories", "Create PRs & issues", "Review commits", "Run test checks"]
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
    capabilities: ["Check availability", "Schedule events", "Conflict detection", "Update invitations"]
  },
  {
    toolkit: "notion",
    name: "Notion",
    category: "Productivity",
    description: "Link your Notion workspace to read content calendars, internal SOPs, databases, and export generated research.",
    icon: FileText,
    color: "text-slate-900 dark:text-slate-100",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    agents: ["Marketing Manager", "Research Specialist"],
    capabilities: ["Read & update content calendar", "Draft SOP documents", "Query databases", "Export research"]
  },
  {
    toolkit: "stripe",
    name: "Stripe",
    category: "Billing & Payments",
    description: "Inspect customer invoices, track subscription metrics, inspect payouts, and audit payment processing fees.",
    icon: CreditCard,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    agents: ["Finance Manager", "Bookkeeper"],
    capabilities: ["List customer invoices", "Check account balances", "Track payment volume", "Subscription status"]
  },
  {
    toolkit: "hubspot",
    name: "HubSpot",
    category: "Sales & CRM",
    description: "Synchronize customer leads, track pipeline deal stages, and automate marketing attribution data.",
    icon: Target,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    agents: ["Marketing Manager", "Sales Specialist"],
    capabilities: ["Create CRM deals", "Update contact records", "Track sales pipeline", "Sync lead notes"]
  },
  {
    toolkit: "jira",
    name: "Jira",
    category: "Project Management",
    description: "Connect Atlassian Jira to manage sprint backlogs, log engineering tickets, and monitor release roadmaps.",
    icon: Kanban,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    agents: ["Engineering Worker", "Operations Specialist"],
    capabilities: ["Create sprint tickets", "Update issue status", "Query agile boards", "Assign priorities"]
  },
  {
    toolkit: "linear",
    name: "Linear",
    category: "Issue Tracking",
    description: "Streamline engineering workflows with high-velocity issue creation, project cycles, and roadmap tracking.",
    icon: CheckSquare,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    agents: ["Software Engineer", "Operations Specialist"],
    capabilities: ["Create Linear issues", "Filter project cycles", "Update task state", "Assign team labels"]
  },
  {
    toolkit: "twitter",
    name: "Twitter / X",
    category: "Social & Outreach",
    description: "Enable the Marketing Specialist to schedule marketing tweets, monitor brand mentions, and publish threads.",
    icon: Share2,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    agents: ["Marketing Manager"],
    capabilities: ["Post tweets & threads", "Monitor replies", "Analyze engagement", "Schedule campaigns"]
  },
  {
    toolkit: "discord",
    name: "Discord",
    category: "Community",
    description: "Broadcast engineering releases, product announcements, and alert community moderators.",
    icon: Headphones,
    color: "text-indigo-600",
    bgColor: "bg-indigo-600/10",
    borderColor: "border-indigo-600/20",
    agents: ["Marketing Manager", "Engineering Worker"],
    capabilities: ["Send channel embeds", "Broadcast announcements", "Community alerts", "Webhook dispatch"]
  },
  {
    toolkit: "airtable",
    name: "Airtable",
    category: "Databases",
    description: "Connect relational bases to sync inventory records, content pipelines, and custom customer tracking grids.",
    icon: Database,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    agents: ["Marketing Manager", "Finance Manager", "Research Specialist"],
    capabilities: ["Query base records", "Insert grid rows", "Update field values", "Sync table schemas"]
  },
  {
    toolkit: "asana",
    name: "Asana",
    category: "Workflow",
    description: "Coordinate team deliverables, operational checklists, and multi-department task milestones.",
    icon: Layers,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    agents: ["Personal Assistant", "Operations Specialist"],
    capabilities: ["Create project tasks", "Set due dates", "Update milestone status", "Track team workflows"]
  }
];

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const { data: connectionsData, isLoading, refetch, isFetching } = useConnections();
  const { data: discoveredData, isLoading: isDiscoveredLoading } = useDiscoveredTools();
  const initiateMutation = useInitiateConnection();
  const disconnectMutation = useDisconnectConnection();

  const [connectingToolkit, setConnectingToolkit] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [toolSearch, setToolSearch] = useState("");
  const [expandedToolSchema, setExpandedToolSchema] = useState<string | null>(null);

  // Handle URL query feedback upon OAuth callback redirect
  useEffect(() => {
    const connectedToolkit = searchParams.get("connected");
    const status = searchParams.get("status");

    if (connectedToolkit) {
      setNotification({
        message: `Successfully connected ${connectedToolkit.toUpperCase()} account! AI agents now have dynamic MCP access.`,
        type: "success"
      });
      refetch();
    }
  }, [searchParams, refetch]);

  const connections = connectionsData?.connections || [];
  const connectedCount = connections.filter(c => c.status === "connected").length;
  const discoveredTools = discoveredData?.discovered_tools || [];

  const filteredDiscoveredTools = discoveredTools.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.toolkit.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.description.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const handleConnect = async (toolkit: string) => {
    try {
      setConnectingToolkit(toolkit);
      const res = await initiateMutation.mutateAsync({
        toolkit,
        redirect_url: window.location.origin + "/integrations"
      });

      if (res?.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        setNotification({
          message: `Connection initialized for ${toolkit.toUpperCase()}. Complete authentication in the prompt.`,
          type: "info"
        });
      }
    } catch (err: any) {
      setNotification({
        message: `Failed to connect ${toolkit}: ${err.message || "Unknown error"}`,
        type: "info"
      });
    } finally {
      setConnectingToolkit(null);
    }
  };

  const handleDisconnect = async (toolkit: string) => {
    try {
      await disconnectMutation.mutateAsync(toolkit);
      setNotification({
        message: `Disconnected ${toolkit.toUpperCase()}.`,
        type: "info"
      });
    } catch (err: any) {
      setNotification({
        message: `Failed to disconnect ${toolkit}: ${err.message || "Unknown error"}`,
        type: "info"
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Connected Toolkits & MCP Tools
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3 h-3" />
              Dynamic Tool Discovery Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Authenticate once with OAuth through Composio. Agents dynamically discover and execute MCP tools scoped to your active connections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            <span>{isFetching ? "Syncing..." : "Refresh Discovery"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm border",
              notification.type === "success" 
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                : "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200 border-blue-200 dark:border-blue-800"
            )}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Connected Toolkits</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {connectedCount} <span className="text-xs font-normal text-slate-400">/ {TOOLKIT_METAS.length} available</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Live Discovered Actions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {discoveredTools.length} <span className="text-xs font-normal text-slate-400">active tools</span>
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
              Scoped OAuth & RLS Active
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Available Toolkits */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Cable className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Available Toolkits for Connection</span>
        </h2>

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
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {meta.name}
                        </h3>
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
                      Discovered Actions
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
                      Scoped Specialists
                    </p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {meta.agents.join(", ")}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(meta.toolkit)}
                      disabled={disconnectMutation.isPending}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Disconnect Account
                    </button>
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
      </div>

      {/* Live Discovered Tools & Schemas Explorer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Live Discovered MCP Tools & Execution Schemas</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active tools synthesized on the fly from your connected integrations and available to AI specialists.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Search discovered tools..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {isDiscoveredLoading ? (
          <div className="py-12 flex items-center justify-center gap-3 text-xs text-slate-500 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Discovering tools from active connections...</span>
          </div>
        ) : filteredDiscoveredTools.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-600 dark:text-slate-300">No discovered tools matching query.</p>
            <p>Connect a toolkit above (Google Sheets, Gmail, Slack, GitHub) to discover live tools.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDiscoveredTools.map((tool) => {
              const isSchemaOpen = expandedToolSchema === tool.name;

              return (
                <div
                  key={tool.name}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {tool.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {tool.category} • Action: <span className="font-mono text-emerald-600 dark:text-emerald-400">{tool.action_slug}</span>
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {tool.toolkit}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Schema Toggle */}
                  {tool.input_schema && Object.keys(tool.input_schema).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <button
                        onClick={() => setExpandedToolSchema(isSchemaOpen ? null : tool.name)}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{isSchemaOpen ? "Hide Parameters Schema" : "View Parameter Schema"}</span>
                        {isSchemaOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <AnimatePresence>
                        {isSchemaOpen && (
                          <motion.pre
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 p-3 rounded-lg bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto border border-slate-800"
                          >
                            {JSON.stringify(tool.input_schema, null, 2)}
                          </motion.pre>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security & Architecture Footer Notice */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <Lock className="w-5 h-5" />
          <h3 className="text-sm font-bold tracking-tight">Zero-Trust Credential Architecture</h3>
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
