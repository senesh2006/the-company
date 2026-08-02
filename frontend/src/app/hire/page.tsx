"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useHireAgent } from "@/lib/queries";

const hireSchema = z.object({
  name: z.string().min(2, "Worker name must be at least 2 characters"),
  role: z.string().min(1, "Please select a role"),
  goal: z.string().min(5, "Initial directive is required (minimum 5 characters)"),
});

type HireFormValues = z.infer<typeof hireSchema>;

interface SpecialistProfile {
  id: string;
  title: string;
  department: "Engineering" | "Growth" | "Finance" | "Research" | "Governance";
  description: string;
  icon: string;
  color: string;
  badge?: string;
  rating: number;
  skills: string[];
  suggestedGoal: string;
  cost: string;
  available: boolean;
}

const SPECIALISTS: SpecialistProfile[] = [
  {
    id: "software-engineer",
    title: "Senior Software Engineer",
    department: "Engineering",
    description: "Autonomous full-stack development, continuous refactoring, automated unit test suites, and microservice integrations.",
    icon: "terminal",
    color: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
    badge: "Most Popular",
    rating: 4.98,
    skills: ["TypeScript", "Python", "Docker", "FastAPI", "Next.js"],
    suggestedGoal: "Audit repository code architecture, implement missing integration tests, and optimize database connection pools.",
    cost: "$2,800 / mo",
    available: true,
  },
  {
    id: "growth-marketing",
    title: "Marketing Lead",
    department: "Growth",
    description: "Analyzes competitive landscapes, drafts high-converting positioning copy, and orchestrates multivariate ad experiments.",
    icon: "campaign",
    color: "from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30",
    badge: "Top Rated",
    rating: 4.95,
    skills: ["Copywriting", "SEO Optimization", "Funnel Analytics", "Competitor Intel"],
    suggestedGoal: "Perform comprehensive competitor keyword analysis and draft 5 customer acquisition landing page variations.",
    cost: "$2,400 / mo",
    available: true,
  },
  {
    id: "financial-analyst",
    title: "Finance Manager",
    department: "Finance",
    description: "Real-time ledger audit, cash burn forecasting, recurring expense anomaly detection, and automated P&L reporting.",
    icon: "account_balance",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    badge: "Enterprise",
    rating: 4.97,
    skills: ["Audit Ledgers", "Burn Rate Forecast", "Variance Analysis", "Tax Ingestion"],
    suggestedGoal: "Reconcile recent SaaS subscription charges and model runway scenarios for Q3 operating expenditures.",
    cost: "$2,600 / mo",
    available: true,
  },
  {
    id: "research-director",
    title: "Intelligence Researcher",
    department: "Research",
    description: "Synthesizes multi-source academic, patent, and market intelligence into executive summaries and technical briefings.",
    icon: "psychology",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    rating: 4.91,
    skills: ["Semantic Synthesis", "Patent Search", "Market Mapping", "Citation Graphs"],
    suggestedGoal: "Generate an executive briefing on emergent multimodal LLM architectures and their enterprise benchmark scores.",
    cost: "$2,200 / mo",
    available: true,
  },
  {
    id: "governance-officer",
    title: "Chief Compliance Officer",
    department: "Governance",
    description: "Continuous audit of AI agent actions against SOC2, GDPR, and organizational policies. Enforces strict escalation gates.",
    icon: "policy",
    color: "from-rose-500/20 to-orange-500/20 text-rose-400 border-rose-500/30",
    badge: "Security Tier 1",
    rating: 4.99,
    skills: ["Policy Gates", "Audit Logs", "PII Redaction", "SLA Guardrails"],
    suggestedGoal: "Scan all operational task logs for PII exposure and generate an automated weekly compliance report.",
    cost: "$3,000 / mo",
    available: true,
  },
  {
    id: "data-ops-engineer",
    title: "Data Pipeline Specialist",
    department: "Engineering",
    description: "Automates streaming ingestion pipelines, warehouse schema migrations, and data quality validation checks.",
    icon: "database",
    color: "from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30",
    rating: 4.88,
    skills: ["ETL", "PostgreSQL", "Data Cleansing", "Schema Sync"],
    suggestedGoal: "Set up automated schema validation rules for all incoming customer webhook payloads.",
    cost: "$2,100 / mo",
    available: true,
  }
];

export default function HirePage() {
  const hireAgent = useHireAgent();
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistProfile | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<HireFormValues>({
    resolver: zodResolver(hireSchema),
  });

  const onSubmit = (data: HireFormValues) => {
    hireAgent.mutate(data, {
      onSuccess: () => {
        // Full page navigation for reliability in static exports
        window.location.href = "/agents";
      },
    });
  };

  const handleSelectSpecialist = (spec: SpecialistProfile) => {
    setSelectedSpecialist(spec);
    setValue("role", spec.title);
    setValue("name", spec.title);
    setValue("goal", spec.suggestedGoal);
  };

  const filteredSpecialists = SPECIALISTS.filter((spec) => {
    const matchesDept = selectedDepartment === "All" || spec.department === selectedDepartment;
    const matchesQuery = 
      spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Recruitment Plane
              </span>
              <span className="text-xs text-slate-400 font-mono">Autonomous Deployment Pipeline</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight">
              Recruit AI Workers
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Expand your decentralized autonomous workforce with pre-configured specialist agents designed for high-concurrency enterprise execution.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="/agents" 
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">groups</span>
              Active Workforce ({SPECIALISTS.length} Templates)
            </a>
          </div>
        </div>
      </header>

      {/* Deployment Configuration Modal / Drawer */}
      {selectedSpecialist && (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 border border-emerald-500/40 p-8 backdrop-blur-2xl shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedSpecialist.color} flex items-center justify-center border shadow-lg`}>
                <span className="material-symbols-outlined text-3xl">{selectedSpecialist.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedSpecialist.department}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Template: {selectedSpecialist.id}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1">Deploying {selectedSpecialist.title}</h2>
              </div>
            </div>
            <button 
              onClick={() => setSelectedSpecialist(null)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Worker Display Name
                </label>
                <input 
                  {...register("name")}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-xs text-slate-200 font-medium outline-none transition-colors"
                  placeholder="e.g. Senior Software Engineer - Core Backend"
                />
                {errors.name && <p className="text-rose-400 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Specialized Role Tag
                </label>
                <input 
                  {...register("role")}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-xs text-slate-200 font-medium outline-none transition-colors"
                  placeholder="e.g. Senior Software Engineer"
                />
                {errors.role && <p className="text-rose-400 text-xs">{errors.role.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Initial Directive & First Task Assignment</span>
                <span className="text-[11px] text-slate-400 lowercase font-normal">Worker will immediately plan & execute this goal</span>
              </label>
              <textarea 
                {...register("goal")}
                rows={4}
                placeholder="Detail the first mission, guidelines, repository context, or deliverables for this worker..."
                className="w-full p-4 bg-slate-950/80 border border-slate-800 focus:border-emerald-500/60 rounded-xl text-xs text-slate-200 leading-relaxed outline-none transition-colors resize-none"
              />
              {errors.goal && <p className="text-rose-400 text-xs">{errors.goal.message}</p>}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="material-symbols-outlined text-base">verified</span>
                  Zero-configuration onboarding
                </span>
                <span>•</span>
                <span>Instant cluster provisioning</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedSpecialist(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hireAgent.isPending}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {hireAgent.isPending ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      Provisioning Worker...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">rocket_launch</span>
                      Recruit & Deploy Worker
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI specialists by skill, role, or capability..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500/50 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["All", "Engineering", "Growth", "Finance", "Research", "Governance"].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedDepartment === dept 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Specialists Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpecialists.map((spec) => (
          <div 
            key={spec.id}
            onClick={() => handleSelectSpecialist(spec)}
            className="group cursor-pointer bento-card p-6 flex flex-col justify-between gap-5 relative hover:border-emerald-500/40 hover:shadow-2xl transition-all duration-300"
          >
            <div>
              {/* Header: Avatar, Badge, Department */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${spec.color} flex items-center justify-center shrink-0 border shadow-inner group-hover:scale-105 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{spec.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {spec.department}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {spec.title}
                    </h3>
                  </div>
                </div>

                {spec.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {spec.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                {spec.description}
              </p>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-1.5">
                {spec.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 text-[10px] font-mono border border-slate-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer: Rating, Cost, Deploy Action */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span>{spec.rating}</span>
                <span className="text-slate-500 font-normal text-[11px] ml-1 font-mono">{spec.cost}</span>
              </div>

              <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1 group-hover:translate-x-0.5">
                Recruit
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
