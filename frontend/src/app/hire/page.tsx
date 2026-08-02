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
    passRate: number;
    cleanCyclesPlatform: number;
    avgPromotionDays: number;
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
    color: "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200",
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
    color: "from-purple-50 to-pink-50 text-purple-700 border-purple-200",
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
    color: "from-blue-50 to-cyan-50 text-blue-700 border-blue-200",
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
    color: "from-amber-50 to-orange-50 text-amber-700 border-amber-200",
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
    color: "from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200",
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
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-slate-900 border border-emerald-700/50 p-8 shadow-xl text-white">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md uppercase tracking-wider">
                HireMarket v6.0
              </span>
              <span className="text-xs text-emerald-100 font-medium">• Governed In-House Specialists</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Recruit AI Workers</h1>
            <p className="text-sm text-emerald-50 mt-1 max-w-2xl leading-relaxed">
              Select pre-evaluated specialist profiles with verified platform track records and governed trust tiers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search roles or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/15 border border-white/25 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-100/70 focus:outline-none focus:bg-white/20 w-64 backdrop-blur-md"
            />
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-emerald-600/40 no-scrollbar">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDepartment === dept
                  ? "bg-white text-emerald-950 shadow-md font-bold"
                  : "bg-white/10 text-emerald-50 hover:bg-white/20 border border-white/10"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid: Specialists Catalog + Onboarding Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
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
                    ? "bg-emerald-50/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center border ${spec.color}`}>
                      <span className="material-symbols-outlined text-[22px]">{spec.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{spec.title}</h3>
                        {spec.badge && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {spec.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{spec.department} • <code className="text-[11px] text-slate-600 font-mono">{spec.specialization_id}</code></p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{spec.pricing.salaried}</div>
                    <div className="text-[11px] text-emerald-700 font-bold">{spec.trackRecord.passRate}% Pass Rate</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 mt-3 leading-relaxed">
                  {spec.description}
                </p>

                {/* Track Record Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Platform Clean Cycles</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">{spec.trackRecord.cleanCyclesPlatform.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Avg Time to Assist</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">{spec.trackRecord.avgPromotionDays} days</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Risk Profile</div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5">{spec.trackRecord.riskScore}</div>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {spec.skills.map((skill) => (
                    <span key={skill} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-6 shadow-md">
              
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border ${selectedSpecialist.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{selectedSpecialist.icon}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Hire {selectedSpecialist.title}</h2>
                  <p className="text-xs text-slate-500">Configure mandate contract & governance gates</p>
                </div>
              </div>

              {/* How I Work Statement */}
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  <span>Operational Philosophy (&quot;How I Work&quot;)</span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed font-serif">
                  &quot;{selectedSpecialist.howIWork}&quot;
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5">
                
                {/* Worker Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Worker Name / Designation</label>
                  <input
                    {...register("name")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* Hiring Model Selector (PRD v6.0 §5.2) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hiring Model</label>
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
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs font-bold">{model.label}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">{model.price}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{model.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trust Tier Seeding (PRD v6.0 §5.3 & §6.1) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Seeded Trust Tier</label>
                    <span className="text-[10px] text-slate-500 font-mono">Earned Trust Protocol</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "observe", label: "Observe", desc: "100% review gate" },
                      { id: "assist", label: "Assist", desc: "Low-risk unattended" },
                      { id: "operate", label: "Operate", desc: "Authority limit $1k" },
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
                            ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-xs font-bold">{tier.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tier.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Connections */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tool Onboarding & Permissions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpecialist.supportedTools.map((tool) => {
                      const isConnected = connectedTools.includes(tool);
                      return (
                        <button
                          type="button"
                          key={tool}
                          onClick={() => toggleTool(tool)}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all font-medium ${
                            isConnected
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Mandate Contract</label>
                  <textarea
                    rows={3}
                    {...register("goal")}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none font-mono"
                  />
                  {errors.goal && <p className="text-xs text-rose-600 mt-1">{errors.goal.message}</p>}
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={hireAgent.isPending}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {hireAgent.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Onboarding AI Worker...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Execute Mandate & Recruit</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-xs">
              Select a specialist profile from the catalog to configure onboarding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
