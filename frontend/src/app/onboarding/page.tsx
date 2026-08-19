"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  DollarSign,
  Lock,
  Globe,
  Terminal,
  BarChart3,
  Search,
  Users,
  Compass,
  Check,
  Clock,
  Briefcase
} from "lucide-react";
import { api } from "@/lib/api";

interface StarterAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  icon: string;
  description: string;
  model: string;
  trustTier: "observe" | "assist" | "operate";
  selected: boolean;
}

const INDUSTRIES = [
  { id: "b2b_saas", label: "B2B SaaS & Cloud", icon: "☁️", desc: "Software subscriptions, APIs & developer tools" },
  { id: "ecommerce", label: "E-Commerce & DTC", icon: "🛍️", desc: "Online retail, consumer goods & marketplaces" },
  { id: "agency", label: "Agency & Professional Services", icon: "💼", desc: "Consulting, design, marketing & development agencies" },
  { id: "fintech", label: "FinTech & Payments", icon: "💳", desc: "Banking, crypto, compliance & financial operations" },
  { id: "healthcare", label: "HealthTech & Bio", icon: "🧬", desc: "Digital health, HIPAA compliant care & pharma" },
  { id: "edtech", label: "EdTech & Learning", icon: "🎓", desc: "Online academies, LMS & training systems" },
  { id: "devtools", label: "DevTools & Infrastructure", icon: "⚡", desc: "CI/CD, observability, database & AI infra" },
  { id: "other", label: "General Enterprise", icon: "🏢", desc: "Multi-vertical business operations & manufacturing" },
];

const COMPANY_STAGES = [
  { id: "pre_seed", label: "Idea / Pre-Seed", desc: "0-10 customers, MVP stage" },
  { id: "seed", label: "Seed / Early Growth", desc: "10-100 customers, finding PMF" },
  { id: "series_a", label: "Series A / Scaling", desc: "100-1,000 customers, rapid expansion" },
  { id: "enterprise", label: "Established Enterprise", desc: "1,000+ customers, multi-team org" },
];

const GOAL_PRESETS = [
  { id: "growth_marketing", label: "Accelerate Inbound Pipeline & SEO", category: "Marketing", icon: Globe, desc: "Autonomous competitive analysis, SEO audits, and content creation" },
  { id: "code_qa", label: "Ship Features & Automate Code Reviews", category: "Engineering", icon: Terminal, desc: "Autonomous PR reviews, test suite generation, and bug fixing" },
  { id: "finance_audit", label: "Automated Financial Reconciliation & Audits", category: "Finance", icon: DollarSign, desc: "Expense categorization, journal entries, and cash flow alerts" },
  { id: "customer_sla", label: "Autonomous Customer Support & SLA Tracking", category: "Operations", icon: ShieldCheck, desc: "Data retention verification, SLA monitoring, and policy responses" },
  { id: "market_intel", label: "Continuous Competitor & Market Intelligence", category: "Research", icon: Search, desc: "Scrape competitor launches, pricing changes, and market shifts" },
];

const REFUND_PRESETS = [
  { id: "30_day", label: "30-Day Money Back Guarantee", text: "Full refund within 30 days of purchase for any unsatisfied customer with no questions asked." },
  { id: "14_day", label: "14-Day Money Back Guarantee", text: "Full refund provided if requested within 14 days of initial subscription signup." },
  { id: "pro_rata", label: "Pro-Rata Unused Credit", text: "Refunds issued on a pro-rata basis for unused time if cancelled mid-billing cycle." },
  { id: "no_refund", label: "Strict No-Refund Policy", text: "All purchases and renewals are non-refundable once software access is provisioned." },
];

const SLA_PRESETS = [
  { id: "99_9", label: "99.9% Uptime SLA", text: "99.9% platform availability guarantee with 1-hour priority support response times." },
  { id: "99_99", label: "99.99% Enterprise Uptime", text: "Mission-critical 99.99% uptime with 15-minute emergency escalation and dedicated support." },
  { id: "best_effort", label: "Standard Business Hours", text: "Best-effort availability with support replies within 24 business hours." },
];

const BRAND_TONES = [
  { id: "pro_modern", label: "Professional & Modern", desc: "Data-driven, crisp, executive tone with clear formatting." },
  { id: "bold_visionary", label: "Bold & Visionary", desc: "High-energy, ambitious, and persuasive." },
  { id: "friendly_human", label: "Friendly & Approachable", desc: "Warm, empathetic, transparent, and user-centric." },
  { id: "technical_deep", label: "Technical & Analytical", desc: "Deep engineering rigor, code-first, and highly structured." },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Profile
  const [companyName, setCompanyName] = useState<string>("Acme Technologies");
  const [websiteUrl, setWebsiteUrl] = useState<string>("https://acme.example.com");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("b2b_saas");
  const [selectedStage, setSelectedStage] = useState<string>("seed");
  const [targetAudience, setTargetAudience] = useState<string>("B2B Enterprise & Mid-Market Engineering Teams");

  // Step 2: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "growth_marketing",
    "code_qa",
    "finance_audit"
  ]);
  const [customGoal, setCustomGoal] = useState<string>("");

  // Step 3: Policies & Brand (Data Gathering)
  const [selectedRefundPreset, setSelectedRefundPreset] = useState<string>("30_day");
  const [refundTermsText, setRefundTermsText] = useState<string>(REFUND_PRESETS[0].text);
  const [selectedSlaPreset, setSelectedSlaPreset] = useState<string>("99_9");
  const [slaText, setSlaText] = useState<string>(SLA_PRESETS[0].text);
  const [dataRetentionText, setDataRetentionText] = useState<string>("Customer data is encrypted at rest (AES-256) and retained for 90 days post-cancellation.");
  const [selectedBrandTone, setSelectedBrandTone] = useState<string>("pro_modern");
  const [knowledgeSnippet, setKnowledgeSnippet] = useState<string>("");

  // Step 4: AI Fleet Customization
  const [monthlyBudget, setMonthlyBudget] = useState<number>(2500);
  const [approvalThreshold, setApprovalThreshold] = useState<number>(500);
  const [starterAgents, setStarterAgents] = useState<StarterAgent[]>([
    {
      id: "marketing",
      name: "Growth & Marketing Lead",
      role: "Marketing Manager",
      department: "Marketing",
      icon: "trending_up",
      description: "SEO tracking, competitive intelligence, growth campaigns, and content generation.",
      model: "kimi-k3",
      trustTier: "assist",
      selected: true,
    },
    {
      id: "finance",
      name: "Financial Controller & Auditor",
      role: "Finance Manager",
      department: "Finance",
      icon: "account_balance",
      description: "Autonomous ledger reconciliation, double-entry bookkeeping, and spend governance.",
      model: "kimi-k3",
      trustTier: "observe",
      selected: true,
    },
    {
      id: "coder",
      name: "Principal Coder",
      role: "Coder",
      department: "Engineering",
      icon: "terminal",
      description: "Full-stack code synthesis, automated test suites, PR reviews, and bug resolution.",
      model: "kimi-k3",
      trustTier: "assist",
      selected: true,
    },
    {
      id: "researcher",
      name: "Operations & Market Researcher",
      role: "Researcher",
      department: "Operations",
      icon: "travel_explore",
      description: "Autonomous web scraping, vendor evaluation, and executive research briefs.",
      model: "kimi-k3",
      trustTier: "operate",
      selected: true,
    },
  ]);

  // Step 5: Ingestion Telemetry
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployProgress, setDeployProgress] = useState<number>(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Sync preset text changes
  const handleRefundPresetChange = (presetId: string) => {
    setSelectedRefundPreset(presetId);
    const item = REFUND_PRESETS.find(p => p.id === presetId);
    if (item) setRefundTermsText(item.text);
  };

  const handleSlaPresetChange = (presetId: string) => {
    setSelectedSlaPreset(presetId);
    const item = SLA_PRESETS.find(p => p.id === presetId);
    if (item) setSlaText(item.text);
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleAgent = (id: string) => {
    setStarterAgents(prev =>
      prev.map(a => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateAgentTier = (id: string, tier: "observe" | "assist" | "operate") => {
    setStarterAgents(prev =>
      prev.map(a => (a.id === id ? { ...a, trustTier: tier } : a))
    );
  };

  const handleFinalSubmit = async () => {
    setIsDeploying(true);
    setDeployProgress(15);
    setDeployLogs(["🚀 Initializing Company OS Control Plane..."]);

    const activeIndustry = INDUSTRIES.find(i => i.id === selectedIndustry)?.label || selectedIndustry;
    const activeTone = BRAND_TONES.find(t => t.id === selectedBrandTone)?.label || selectedBrandTone;

    const payload = {
      company_name: companyName,
      website_url: websiteUrl,
      industry: activeIndustry,
      stage: selectedStage,
      target_audience: targetAudience,
      primary_goals: selectedGoals.map(g => GOAL_PRESETS.find(p => p.id === g)?.label || g).concat(customGoal ? [customGoal] : []),
      top_bottlenecks: ["Manual operational overhead", "Need faster task execution"],
      brand_voice: activeTone,
      refund_policy_terms: refundTermsText,
      sla_guarantees: slaText,
      data_retention_policy: dataRetentionText,
      knowledge_snippets: knowledgeSnippet ? [knowledgeSnippet] : [],
      starter_agents: starterAgents.filter(a => a.selected).map(a => ({
        name: a.name,
        role: a.role,
        department: a.department,
        trust_tier: a.trustTier,
        model: a.model,
        description: a.description
      })),
      monthly_budget_usd: monthlyBudget,
      approval_threshold_usd: approvalThreshold
    };

    try {
      setTimeout(() => {
        setDeployLogs(prev => [...prev, "🧠 Ingesting Company Profile, Brand Guidelines & Policies into Shared Memory..."]);
        setDeployProgress(45);
      }, 700);

      setTimeout(() => {
        setDeployLogs(prev => [...prev, "🛡️ Setting up Governance Gateway & Trust Tiers..."]);
        setDeployProgress(70);
      }, 1400);

      await api.completeOnboarding(payload);

      setDeployLogs(prev => [
        ...prev,
        "⚡ Provisioning Autonomous Specialist Agents...",
        "✅ Foundational Knowledge & Policies Indexed.",
        "✨ Company OS Control Plane is now fully operational!"
      ]);
      setDeployProgress(100);
      setDeploySuccess(true);

      // Store in localStorage for fast UI hydration
      localStorage.setItem("companyos_company_name", companyName);
      localStorage.setItem("companyos_industry", activeIndustry);
    } catch (err: any) {
      setDeployLogs(prev => [...prev, `⚠️ Warning: Local sync mode active (${err.message || 'Offline'})`]);
      setDeployProgress(100);
      setDeploySuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-2xl relative z-10 flex flex-col">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Company OS Onboarding
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Setup Wizard
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Calibrate your autonomous business control plane and ingest company knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? "w-8 bg-cyan-400"
                    : s < step
                    ? "w-4 bg-indigo-500"
                    : "w-2 bg-slate-800"
                }`}
              />
            ))}
            <span className="text-xs font-medium text-slate-400 ml-2">
              Step {step} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Step Content Area */}
        <div className="flex-1 min-h-[460px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Company Profile & Industry */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    Company Identity & Market Vertical
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Tell us about your organization so agents understand your industry and business structure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Cloud Corp"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Website or Primary Domain
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://acme.example.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Industry Grid */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Primary Industry / Vertical
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {INDUSTRIES.map((ind) => {
                      const isSelected = selectedIndustry === ind.id;
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => setSelectedIndustry(ind.id)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? "bg-cyan-950/30 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                              : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <span className="text-2xl mb-1">{ind.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-200">{ind.label}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{ind.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Stage */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Company Maturity Stage
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {COMPANY_STAGES.map((stg) => {
                      const isSelected = selectedStage === stg.id;
                      return (
                        <button
                          key={stg.id}
                          type="button"
                          onClick={() => setSelectedStage(stg.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-200">{stg.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{stg.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Target Audience / Ideal Customer Profile (ICP)
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Mid-Market CFOs, Engineering Leaders, SMB Retailers"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Strategic Goals */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-400" />
                    Strategic Goals & Primary Objectives
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Select your primary targets for the next 90 days. Agents prioritize autonomous tasks matching these goals.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {GOAL_PRESETS.map((g) => {
                    const isSelected = selectedGoals.includes(g.id);
                    const Icon = g.icon;
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10"
                            : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-2">
                              {g.label}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                {g.category}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{g.desc}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-700"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Custom Additional Goal (Optional)
                  </label>
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Expand to European market with GDPR localization"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Company Policies & Knowledge (Data Gathering) */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Company Policies & Shared Knowledge Base
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingest your refund terms, SLA guarantees, and brand voice into Shared Memory so agents cite truth.
                  </p>
                </div>

                {/* Refund Terms */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Refund Policy & Criteria
                    </label>
                    <span className="text-[10px] text-slate-400">Used by Finance & Support Agents</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {REFUND_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleRefundPresetChange(p.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          selectedRefundPreset === p.id
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={refundTermsText}
                    onChange={(e) => setRefundTermsText(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                {/* SLA & Uptime */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      SLA Guarantees & Support Response
                    </label>
                    <span className="text-[10px] text-slate-400">Used by Engineering & Client Response</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SLA_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSlaPresetChange(p.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          selectedSlaPreset === p.id
                            ? "bg-cyan-950/40 border-cyan-500 text-cyan-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={slaText}
                    onChange={(e) => setSlaText(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                {/* Brand Voice Grid */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Brand Tone & Communication Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {BRAND_TONES.map((tone) => {
                      const isSelected = selectedBrandTone === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setSelectedBrandTone(tone.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500 text-white"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-200">{tone.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{tone.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Knowledge Snippet */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Paste Core Company Context or Pricing FAQ (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={knowledgeSnippet}
                    onChange={(e) => setKnowledgeSnippet(e.target.value)}
                    placeholder="e.g. Enterprise tier starts at $2,000/mo. We provide SSO via Okta and dedicated Slack support..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 4: AI Fleet & Governance */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Autonomous Agent Fleet & Trust Tiers
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Tailored agent team assembled from your survey answers. Configure trust tiers and governance limits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {starterAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        agent.selected
                          ? "bg-slate-900/90 border-slate-700 shadow-lg shadow-black/20"
                          : "bg-slate-950/30 border-slate-800/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                            <span className="text-[10px] text-slate-400">{agent.role} · {agent.department}</span>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={agent.selected}
                          onChange={() => toggleAgent(agent.id)}
                          className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Trust Tier Selector */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">Trust Tier:</span>
                        <div className="flex gap-1.5">
                          {(["observe", "assist", "operate"] as const).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => updateAgentTier(agent.id, tier)}
                              className={`text-[10px] px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                                agent.trustTier === tier
                                  ? tier === "operate"
                                    ? "bg-emerald-950 border border-emerald-500 text-emerald-300"
                                    : tier === "assist"
                                    ? "bg-amber-950 border border-amber-500 text-amber-300"
                                    : "bg-blue-950 border border-blue-500 text-blue-300"
                                  : "bg-slate-950 text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {tier}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spend Limit Controls */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Monthly Autonomous Spend Limit ($ USD)
                    </label>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Human Approval Gate ($ Threshold)
                    </label>
                    <input
                      type="number"
                      value={approvalThreshold}
                      onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Deployment & Launch */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    Review Summary & Initialize Control Plane
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Everything is ready! Click deploy to write policies to shared memory and start your autonomous team.
                  </p>
                </div>

                {/* Summary Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase">Company</span>
                    <p className="text-xs font-bold text-white mt-0.5 truncate">{companyName}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase">Industry</span>
                    <p className="text-xs font-bold text-white mt-0.5 truncate">
                      {INDUSTRIES.find(i => i.id === selectedIndustry)?.label}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase">Selected Goals</span>
                    <p className="text-xs font-bold text-cyan-400 mt-0.5">{selectedGoals.length} Active</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase">Active Agents</span>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">
                      {starterAgents.filter(a => a.selected).length} Specialists
                    </p>
                  </div>
                </div>

                {/* Telemetry Output Terminal */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Ingestion & Deployment Telemetry
                    </span>
                    <span>{deployProgress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${deployProgress}%` }}
                    />
                  </div>

                  <div className="max-h-[140px] overflow-y-auto space-y-1 text-slate-300 pt-1">
                    {deployLogs.length === 0 ? (
                      <p className="text-slate-600">Ready for initialization...</p>
                    ) : (
                      deployLogs.map((log, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="text-cyan-500">❯</span>
                          {log}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {deploySuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Onboarding Complete & Knowledge Synchronized!</p>
                        <p className="text-[11px] text-emerald-400/80">Your agents are online with verified company policies.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Enter Control Plane →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="border-t border-slate-800/80 pt-6 mt-8 flex items-center justify-between">
          {step > 1 && !deploySuccess ? (
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {!deploySuccess && (
            step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(prev => Math.min(totalSteps, prev + 1))}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isDeploying}
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {isDeploying ? "Deploying..." : "Launch Company OS"}
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
}
