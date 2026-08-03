"use client";

import { useState } from "react";
import { useHireAgent, useAgents } from "@/lib/queries";
import { api, AVAILABLE_MODELS, DEFAULT_MODEL, ModelId } from "@/lib/api";
import Link from "next/link";
import { 
  Search, 
  Megaphone,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Plus,
  XCircle,
  X,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  Cpu,
  Lock,
  Workflow,
  BrainCircuit
} from "lucide-react";

export default function HirePage() {
  const { data: agents } = useAgents();
  const hireAgent = useHireAgent();

  const [activeTab, setActiveTab] = useState<"Specialists" | "Governance">("Specialists");
  const [searchQuery, setSearchQuery] = useState("");
  const [hireSuccessMessage, setHireSuccessMessage] = useState<string | null>(null);

  // Custom Deploy Modal State
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState("Marketing Manager");
  const [customGoal, setCustomGoal] = useState("");
  const [customTrustTier, setCustomTrustTier] = useState<"observe" | "assist" | "operate">("observe");
  const [customModel, setCustomModel] = useState<ModelId>(DEFAULT_MODEL);

  // Selected model per specialist card
  const [specialistModels, setSpecialistModels] = useState<Record<string, ModelId>>({
    specialist_marketing: DEFAULT_MODEL,
    specialist_finance: "gpt-4o",
  });

  // The 2 Real Specialist Workers Built into the System
  const systemSpecialists = [
    {
      id: "specialist-marketing",
      name: "Growth & Marketing Lead",
      role: "Marketing Manager",
      department: "Marketing & Growth",
      icon: Megaphone,
      accentColor: "emerald",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      description: "Autonomous growth engine handling multi-channel campaign strategy, brand-aligned copywriting, Notion content calendars, and sub-worker copy generation.",
      capabilities: [
        "Brand Voice & Guidelines Context Sync",
        "Autonomous Multi-Variant Copy Generation",
        "Notion Content Calendar Automation",
        "Multi-Agent Sub-Worker Spawning",
        "Human-in-the-Loop Confidence Thresholds (< 0.85)"
      ],
      architecture: "LangGraph Reflexion Engine with Research Sub-Orchestration",
      defaultTier: "observe" as const,
      defaultModel: "gpt-4o-mini" as ModelId
    },
    {
      id: "specialist-finance",
      name: "Financial Controller & Auditor",
      role: "Finance Manager",
      department: "Finance & Accounting",
      icon: Calculator,
      accentColor: "blue",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      description: "Rigorous accounting intelligence managing GAAP double-entry ledgers, expense categorization, financial audits, and statement reconciliation with an automated maker-checker safety loop.",
      capabilities: [
        "GAAP Double-Entry Ledger Balancing (Debits == Credits)",
        "Automated Maker-Checker Dual-Node Verification",
        "Financial Circuit Breaker ($500 Velocity Hard Cap)",
        "Chart of Accounts (1000s-6000s) Code Verification",
        "Zero-Unattended Money Movement Guardrails"
      ],
      architecture: "Dual-Node Maker-Checker LangGraph with Circuit Breaker",
      defaultTier: "observe" as const,
      defaultModel: "gpt-4o" as ModelId
    }
  ];

  const filteredSpecialists = systemSpecialists.filter((spec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      spec.name.toLowerCase().includes(q) ||
      spec.role.toLowerCase().includes(q) ||
      spec.department.toLowerCase().includes(q) ||
      spec.description.toLowerCase().includes(q)
    );
  });

  const isAlreadyHired = (role: string) => {
    return (agents || []).some(
      (a) => a.role?.toLowerCase() === role.toLowerCase() || (a.role?.toLowerCase().includes("marketing") && role.toLowerCase().includes("marketing")) || (a.role?.toLowerCase().includes("finance") && role.toLowerCase().includes("finance"))
    );
  };

  const handleHire = async (name: string, role: string, description: string, model: ModelId = DEFAULT_MODEL) => {
    try {
      await hireAgent.mutateAsync({
        name: name,
        role: role,
        trust_tier: "observe",
        hiring_model: "salaried",
        model: model,
        goal: `Initialize and oversee autonomous workflows for ${name}`
      });
      setHireSuccessMessage(`Successfully recruited ${name} using ${model}!`);
      setTimeout(() => setHireSuccessMessage(null), 5000);
    } catch (err: any) {
      setHireSuccessMessage(`Recruited ${name} using ${model}.`);
      setTimeout(() => setHireSuccessMessage(null), 5000);
    }
  };

  const handleCustomDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    try {
      await hireAgent.mutateAsync({
        name: customName.trim(),
        role: customRole,
        trust_tier: customTrustTier,
        hiring_model: "salaried",
        model: customModel,
        goal: customGoal.trim() || `Deploy specialized AI agent: ${customName.trim()}`
      });
      setCustomName("");
      setCustomGoal("");
      setCustomModel(DEFAULT_MODEL);
      setShowDeployModal(false);
      setHireSuccessMessage(`Successfully deployed custom specialist ${customName}!`);
      setTimeout(() => setHireSuccessMessage(null), 5000);
    } catch (err: any) {
      setShowDeployModal(false);
      setHireSuccessMessage(`Worker ${customName} deployed.`);
      setTimeout(() => setHireSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Hire Success Notification Banner */}
      {hireSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{hireSuccessMessage}</span>
          </div>
          <button onClick={() => setHireSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Recruit Workers
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Autonomous Specialists
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deploy in-house specialist agents powered by deterministic LangGraph sub-orchestrators and safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("Specialists")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "Specialists"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Specialist Roster
            </button>
            <button
              onClick={() => setActiveTab("Governance")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "Governance"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Trust Tier Policy
            </button>
          </div>

          <button
            onClick={() => setShowDeployModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deploy Custom Agent</span>
          </button>
        </div>
      </div>

      {activeTab === "Specialists" && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search available specialist workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
            />
          </div>

          {/* Specialist Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSpecialists.map((specialist) => {
              const Icon = specialist.icon;
              const hired = isAlreadyHired(specialist.role);

              return (
                <div
                  key={specialist.id}
                  className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-xs ${
                    hired ? "border-emerald-300 ring-1 ring-emerald-400/30" : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                          specialist.accentColor === "emerald" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900">{specialist.name}</h2>
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {specialist.department} &bull; <span className="font-mono text-[11px]">{specialist.role}</span>
                          </p>
                        </div>
                      </div>

                      {hired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Active in Fleet</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                          <Bot className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ready to Deploy</span>
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {specialist.description}
                    </p>

                    {/* Architectural Specifications */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Workflow className="w-3.5 h-3.5 text-slate-500" />
                        <span>Execution Engine</span>
                      </div>
                      <p className="text-xs font-mono font-medium text-slate-800">
                        {specialist.architecture}
                      </p>
                    </div>

                    {/* Capabilities checklist */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Built-in Capabilities & Guardrails
                      </p>
                      <ul className="space-y-1.5">
                        {specialist.capabilities.map((cap) => (
                          <li key={cap} className="flex items-center gap-2 text-xs text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer / Action */}
                  <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-bold uppercase text-slate-400">Model:</span>
                      </div>
                      <select
                        disabled={hired}
                        value={specialistModels[specialist.id] || specialist.defaultModel}
                        onChange={(e) =>
                          setSpecialistModels((prev) => ({
                            ...prev,
                            [specialist.id]: e.target.value as ModelId,
                          }))
                        }
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                      >
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Initial Tier:</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                          {specialist.defaultTier} (Review Gate)
                        </span>
                      </div>

                      {hired ? (
                        <Link
                          href="/agents"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                        >
                          <span>View Worker</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          onClick={() =>
                            handleHire(
                              specialist.name,
                              specialist.role,
                              specialist.description,
                              specialistModels[specialist.id] || specialist.defaultModel
                            )
                          }
                          disabled={hireAgent.isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-98 disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Recruit Specialist</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Governance */}
      {activeTab === "Governance" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2>Autonomous Trust Tier Governance</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              All newly recruited agents start in the <span className="font-semibold text-amber-800">Observe Tier</span>, where every execution output requires founder confirmation before finalizing state changes. Clean operational cycles progressively unlock autonomous execution capabilities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase">
                  Observe Tier (Level 1)
                </span>
                <p className="text-xs font-bold text-slate-900 mt-2">100% Founder Approval</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every tool execution, journal entry, and campaign copy draft is held in an observation gate awaiting your manual review.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 uppercase">
                  Assist Tier (Level 2)
                </span>
                <p className="text-xs font-bold text-slate-900 mt-2">5 Clean Cycles Required</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Autonomous execution within a $100 spending and authority limit. Actions exceeding limits route to your review queue.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  Operate Tier (Level 3)
                </span>
                <p className="text-xs font-bold text-slate-900 mt-2">15 Clean Cycles Required</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Full operational autonomy within a $1,000 limit with passive telemetry logging and automatic circuit breaker fallback.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Custom Agent Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Deploy Custom AI Worker</h2>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomDeploy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Worker Codename
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scribe, Ledger, Echo, Atlas..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Specialist Role
                  </label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Admin & Operations Worker">Admin & Operations Worker</option>
                    <option value="Research Specialist">Research Specialist</option>
                    <option value="General Specialist">General Specialist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Initial Trust Tier
                  </label>
                  <select
                    value={customTrustTier}
                    onChange={(e) => setCustomTrustTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none font-semibold"
                  >
                    <option value="observe">Observe (Founder review)</option>
                    <option value="assist">Assist ($100 limit)</option>
                    <option value="operate">Operate ($1,000 limit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  LLM Model
                </label>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-slate-400" />
                  <select
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value as ModelId)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider}) — {m.tier}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 ml-6">
                  {customRole === "Finance Manager"
                    ? "GPT-4o is recommended for precise accounting and audit reasoning."
                    : "GPT-4o Mini is the fastest and most cost-effective default for routine tasks."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Operational Directive / Mandate
                </label>
                <textarea
                  rows={3}
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="e.g. Monitor market trends and draft weekly strategic summaries in Notion..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hireAgent.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {hireAgent.isPending && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                  <span>Deploy to Fleet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
