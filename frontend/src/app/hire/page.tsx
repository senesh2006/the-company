"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useHireAgent } from "@/lib/queries";
import { TrustTier, HiringModel } from "@/lib/api";

const hireSchema = z.object({
  name: z.string().min(2, "Worker name must be at least 2 characters"),
  role: z.string().min(1, "Please select a role"),
  specialization_id: z.string().min(1, "Specialization ID is required"),
  hiring_model: z.enum(["salaried", "freelance", "contract"]),
  trust_tier: z.enum(["observe", "assist", "operate"]),
  goal: z.string().min(5, "Initial mandate is required (minimum 5 characters)"),
  connected_tools: z.array(z.string()).optional(),
});

type HireFormValues = z.infer<typeof hireSchema>;

interface SpecialistProfile {
  id: string;
  specialization_id: string;
  title: string;
  department: "Accounting & Finance" | "Social & Growth" | "Admin & Operations" | "Market Intelligence" | "Engineering & Data";
  howIWork: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  trackRecord: {
    passRate: number; // e.g. 99.4%
    cleanCyclesPlatform: number; // e.g. 14,200
    avgPromotionDays: number; // e.g. 3.8 days
    riskScore: "Minimal" | "Low" | "Medium";
  };
  skills: string[];
  suggestedGoal: string;
  supportedTools: string[];
  pricing: {
    salaried: string;
    freelance: string;
    contract: string;
  };
}

const SPECIALISTS: SpecialistProfile[] = [
  {
    id: "accountant-specialist",
    specialization_id: "fin-audit-acc-v2",
    title: "Accountant & Controller",
    department: "Accounting & Finance",
    howIWork: "I verify invoices, detect recurring subscription price hikes, and perform multi-point ledger reconciliations before preparing financial digests for founder sign-off.",
    description: "Real-time ledger audit, cash burn forecasting, invoice verification, and automated P&L reporting. Enforces strict authority limits.",
    icon: "account_balance",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    badge: "In-House Standard",
    trackRecord: {
      passRate: 99.7,
      cleanCyclesPlatform: 18450,
      avgPromotionDays: 3.2,
      riskScore: "Minimal"
    },
    skills: ["QuickBooks Sync", "Stripe Reconciliation", "Burn Rate Modeling", "Expense Anomaly Detection"],
    suggestedGoal: "Audit last 30 days of operating expenses, flag any recurring SaaS charge increases over 5%, and model cash runway.",
    supportedTools: ["QuickBooks", "Stripe", "Google Drive", "Slack"],
    pricing: {
      salaried: "$1,800 / mo",
      freelance: "$45 / report",
      contract: "$1,200 / 30-day cap"
    }
  },
  {
    id: "social-media-manager",
    specialization_id: "mkt-social-b2b-v2",
    title: "Social Media & Growth Lead",
    department: "Social & Growth",
    howIWork: "I monitor competitor launches and industry signals to draft high-converting content calendars, staging all assets for one-click approval before publishing.",
    description: "Autonomous competitive intelligence gathering, positioning copy drafts, content calendar management, and engagement analytics.",
    icon: "campaign",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    badge: "High Growth",
    trackRecord: {
      passRate: 98.9,
      cleanCyclesPlatform: 24100,
      avgPromotionDays: 4.1,
      riskScore: "Low"
    },
    skills: ["Content Calendars", "Brave Search Intel", "Notion CMS", "Playwright Automation"],
    suggestedGoal: "Research top 3 trending topics in enterprise AI agents and prepare a 5-post thought leadership draft queue in Notion.",
    supportedTools: ["Notion", "Brave Search", "Playwright", "Twitter/X API"],
    pricing: {
      salaried: "$2,200 / mo",
      freelance: "$60 / campaign",
      contract: "$1,500 / 30-day cap"
    }
  },
  {
    id: "admin-ops-worker",
    specialization_id: "ops-triage-admin-v1",
    title: "Admin & Operations Worker",
    department: "Admin & Operations",
    howIWork: "I triage high-volume founder inboxes, protect focus time on calendars, and resolve tier-1 customer inquiries while escalating complaints.",
    description: "Inbox triage, automated scheduling, calendar conflict resolution, and customer helpdesk ticketing. Never issues refunds unattended.",
    icon: "inbox",
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
    badge: "Essential Ops",
    trackRecord: {
      passRate: 99.4,
      cleanCyclesPlatform: 32000,
      avgPromotionDays: 2.8,
      riskScore: "Minimal"
    },
    skills: ["Inbox Triage", "Calendar Protection", "Helpdesk Ticketing", "Policy Safeguards"],
    suggestedGoal: "Triage pending inbox communications, summarize priority meeting requests, and stage clean calendar slots for Q3 syncs.",
    supportedTools: ["Google Workspace", "Outlook", "Zendesk", "Slack"],
    pricing: {
      salaried: "$1,600 / mo",
      freelance: "$30 / batch",
      contract: "$1,000 / 30-day cap"
    }
  },
  {
    id: "research-intelligence",
    specialization_id: "res-synthesis-deep-v1",
    title: "Intelligence & Market Researcher",
    department: "Market Intelligence",
    howIWork: "I crawl academic databases, patent filings, and market reports to produce rigorous executive briefs with cross-verified citation graphs.",
    description: "Deep multi-source web and paper synthesis, market mapping, technical competitor breakdowns, and cross-agent context injection.",
    icon: "psychology",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    trackRecord: {
      passRate: 99.2,
      cleanCyclesPlatform: 11900,
      avgPromotionDays: 4.5,
      riskScore: "Minimal"
    },
    skills: ["Semantic Synthesis", "Patent Search", "Market Mapping", "Citation Validation"],
    suggestedGoal: "Prepare an executive research brief on emerging autonomous agent frameworks and their multi-tenant security benchmarks.",
    supportedTools: ["Brave Search", "ArXiv API", "Notion", "Google Drive"],
    pricing: {
      salaried: "$2,400 / mo",
      freelance: "$75 / brief",
      contract: "$1,800 / 30-day cap"
    }
  },
  {
    id: "fullstack-engineer",
    specialization_id: "eng-fullstack-ts-py-v2",
    title: "Senior Full-Stack Engineer",
    department: "Engineering & Data",
    howIWork: "I write clean TypeScript and Python code, implement comprehensive unit tests, and submit PRs with clear architectural rationale.",
    description: "End-to-end feature implementation, API integrations, automated refactoring, and database schema migrations.",
    icon: "terminal",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    badge: "High Velocity",
    trackRecord: {
      passRate: 99.1,
      cleanCyclesPlatform: 19800,
      avgPromotionDays: 3.5,
      riskScore: "Low"
    },
    skills: ["FastAPI", "Next.js", "Docker", "PostgreSQL", "Pytest"],
    suggestedGoal: "Refactor backend API endpoints for mandate execution and build strict type validation schemas.",
    supportedTools: ["GitHub", "Docker", "Sentry", "Postgres"],
    pricing: {
      salaried: "$2,800 / mo",
      freelance: "$120 / PR",
      contract: "$2,200 / 30-day cap"
    }
  }
];

export default function HirePage() {
  const hireAgent = useHireAgent();
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistProfile | null>(SPECIALISTS[0]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [hiringModel, setHiringModel] = useState<HiringModel>("salaried");
  const [trustTier, setTrustTier] = useState<TrustTier>("observe");
  const [connectedTools, setConnectedTools] = useState<string[]>(["Google Drive", "Slack"]);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<HireFormValues>({
    resolver: zodResolver(hireSchema),
    defaultValues: {
      role: SPECIALISTS[0].title,
      name: SPECIALISTS[0].title,
      specialization_id: SPECIALISTS[0].specialization_id,
      hiring_model: "salaried",
      trust_tier: "observe",
      goal: SPECIALISTS[0].suggestedGoal,
      connected_tools: ["Google Drive", "Slack"]
    }
  });

  const onSubmit = (data: HireFormValues) => {
    hireAgent.mutate({
      role: data.role,
      name: data.name,
      goal: data.goal,
      trust_tier: data.trust_tier as TrustTier,
      specialization_id: data.specialization_id,
      hiring_model: data.hiring_model as HiringModel,
    }, {
      onSuccess: () => {
        window.location.href = "/agents";
      },
    });
  };

  const handleSelectSpecialist = (spec: SpecialistProfile) => {
    setSelectedSpecialist(spec);
    setValue("role", spec.title);
    setValue("name", spec.title);
    setValue("specialization_id", spec.specialization_id);
    setValue("goal", spec.suggestedGoal);
  };

  const toggleTool = (tool: string) => {
    const updated = connectedTools.includes(tool)
      ? connectedTools.filter(t => t !== tool)
      : [...connectedTools, tool];
    setConnectedTools(updated);
    setValue("connected_tools", updated);
  };

  const departments = ["All", "Accounting & Finance", "Social & Growth", "Admin & Operations", "Market Intelligence", "Engineering & Data"];

  const filteredSpecialists = SPECIALISTS.filter((spec) => {
    const matchesDept = selectedDepartment === "All" || spec.department === selectedDepartment;
    const matchesQuery = 
      spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                HireMarket v6.0
              </span>
              <span className="text-xs text-slate-500">• Governed In-House Specialists</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Recruit AI Workers</h1>
            <p className="text-sm text-slate-400 mt-1">
              Select pre-evaluated specialist profiles with verified platform track records and governed trust tiers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search roles or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-64"
            />
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedDepartment === dept
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Specialists Catalog + Onboarding Configuration */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Specialist Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {filteredSpecialists.map((spec) => {
            const isSelected = selectedSpecialist?.id === spec.id;
            return (
              <div
                key={spec.id}
                onClick={() => handleSelectSpecialist(spec)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-white/[0.06] border-cyan-500/50 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/15"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center border ${spec.color}`}>
                      <span className="material-symbols-outlined text-22">{spec.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-base">{spec.title}</h3>
                        {spec.badge && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                            {spec.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{spec.department} • <code className="text-[11px] text-slate-500">{spec.specialization_id}</code></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{spec.pricing.salaried}</div>
                    <div className="text-[11px] text-emerald-400 font-medium">{spec.trackRecord.passRate}% Pass Rate</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {spec.description}
                </p>

                {/* Track Record Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-white/5 text-center">
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Platform Clean Cycles</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">{spec.trackRecord.cleanCyclesPlatform.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Avg Time to Assist</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">{spec.trackRecord.avgPromotionDays} days</div>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Risk Profile</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-0.5">{spec.trackRecord.riskScore}</div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {spec.skills.map((skill) => (
                    <span key={skill} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Onboarding & Contract Drawer (5 cols) */}
        <div className="lg:col-span-5">
          {selectedSpecialist ? (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sticky top-6 backdrop-blur-md">
              
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border ${selectedSpecialist.color}`}>
                  <span className="material-symbols-outlined text-20">{selectedSpecialist.icon}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Hire {selectedSpecialist.title}</h2>
                  <p className="text-xs text-slate-400">Configure mandate contract & governance gates</p>
                </div>
              </div>

              {/* How I Work Statement */}
              <div className="mt-4 p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium mb-1">
                  <span className="material-symbols-outlined text-14">psychology</span>
                  <span>Operational Philosophy (&quot;How I Work&quot;)</span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  &quot;{selectedSpecialist.howIWork}&quot;
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
                
                {/* Worker Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Worker Name / Designation</label>
                  <input
                    {...register("name")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                </div>

                {/* Hiring Model Selector (PRD v6.0 §5.2) */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Hiring Model</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "salaried", label: "Salaried", price: selectedSpecialist.pricing.salaried, desc: "Monthly retainer" },
                      { id: "freelance", label: "Freelance", price: selectedSpecialist.pricing.freelance, desc: "Per-output fee" },
                      { id: "contract", label: "Contract", price: selectedSpecialist.pricing.contract, desc: "Volume cap" },
                    ].map((model) => (
                      <button
                        type="button"
                        key={model.id}
                        onClick={() => {
                          setHiringModel(model.id as HiringModel);
                          setValue("hiring_model", model.id as HiringModel);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          watch("hiring_model") === model.id
                            ? "bg-cyan-500/10 border-cyan-500/40 text-white ring-1 ring-cyan-500/20"
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-semibold">{model.label}</div>
                        <div className="text-[11px] text-cyan-400 mt-0.5">{model.price}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{model.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trust Tier Seeding (PRD v6.0 §5.3 & §6.1) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Seeded Trust Tier</label>
                    <span className="text-[10px] text-slate-400">Earned Trust Protocol</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "observe", label: "Observe (Recommended)", desc: "100% review gate", color: "text-amber-400 border-amber-500/30" },
                      { id: "assist", label: "Assist", desc: "Low-risk unattended", color: "text-blue-400 border-blue-500/30" },
                      { id: "operate", label: "Operate", desc: "Authority limit $1k", color: "text-emerald-400 border-emerald-500/30" },
                    ].map((tier) => (
                      <button
                        type="button"
                        key={tier.id}
                        onClick={() => {
                          setTrustTier(tier.id as TrustTier);
                          setValue("trust_tier", tier.id as TrustTier);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          watch("trust_tier") === tier.id
                            ? "bg-white/10 border-white/30 text-white ring-1 ring-white/20"
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-xs font-semibold">{tier.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tier.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Connections */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tool Onboarding & Permissions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpecialist.supportedTools.map((tool) => {
                      const isConnected = connectedTools.includes(tool);
                      return (
                        <button
                          type="button"
                          key={tool}
                          onClick={() => toggleTool(tool)}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
                            isConnected
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-white/5 text-slate-400 border-white/5 hover:border-white/15"
                          }`}
                        >
                          <span className="material-symbols-outlined text-12">
                            {isConnected ? "check_circle" : "add_circle"}
                          </span>
                          <span>{tool}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Initial Mandate Directive */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Mandate Contract</label>
                  <textarea
                    rows={3}
                    {...register("goal")}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 resize-none font-mono"
                  />
                  {errors.goal && <p className="text-xs text-rose-400 mt-1">{errors.goal.message}</p>}
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={hireAgent.isPending}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {hireAgent.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Onboarding AI Worker...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-18">person_add</span>
                      <span>Execute Mandate & Recruit</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center text-slate-400">
              Select a specialist profile from the catalog to configure onboarding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
