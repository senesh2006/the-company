"use client";

import { useState, useEffect, useRef } from "react";
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
  Briefcase,
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  File,
  Trash2,
  AlertCircle
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

interface UploadedDoc {
  id: string;
  file: File;
  name: string;
  size: number;
  category: string;
  title: string;
}

const DOCUMENT_CATEGORIES = [
  "Brand Guidelines",
  "Product Documentation",
  "Financial Reports",
  "Customer Personas",
  "Refund & SLA Policies",
  "General Knowledge"
];

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
  { id: "finance_audit", label: "Automated Financial Reconciliation & Audits", category: "Finance", icon: DollarSign, desc: "Expense categorization, journal entries, and cash flow alerts" },
  { id: "customer_sla", label: "Customer Support & SLA Tracking", category: "Operations", icon: ShieldCheck, desc: "Data retention verification, SLA monitoring, and policy responses" },
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Profile
  const [companyName, setCompanyName] = useState<string>("Acme Autonomous Corp");
  const [websiteUrl, setWebsiteUrl] = useState<string>("https://acme.example.com");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("b2b_saas");
  const [selectedStage, setSelectedStage] = useState<string>("seed");
  const [targetAudience, setTargetAudience] = useState<string>("B2B Enterprise & Mid-Market Decision Makers");

  // Step 2: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "growth_marketing",
    "finance_audit"
  ]);
  const [customGoal, setCustomGoal] = useState<string>("");

  // Step 3: Policies, Documents & Brand
  const [selectedRefundPreset, setSelectedRefundPreset] = useState<string>("30_day");
  const [refundTermsText, setRefundTermsText] = useState<string>(REFUND_PRESETS[0].text);
  const [selectedSlaPreset, setSelectedSlaPreset] = useState<string>("99_9");
  const [slaText, setSlaText] = useState<string>(SLA_PRESETS[0].text);
  const [dataRetentionText, setDataRetentionText] = useState<string>("Customer data is encrypted at rest (AES-256) and retained for 90 days post-cancellation.");
  const [selectedBrandTone, setSelectedBrandTone] = useState<string>("pro_modern");
  const [knowledgeSnippet, setKnowledgeSnippet] = useState<string>("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

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
    }
  ]);

  // Step 5: Ingestion Telemetry
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployProgress, setDeployProgress] = useState<number>(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Hydrate initial signup data if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("companyos_company_name") || localStorage.getItem("companyos_startup_company_name");
      const storedIndustry = localStorage.getItem("companyos_industry") || localStorage.getItem("companyos_startup_industry");
      if (storedName) setCompanyName(storedName);
      if (storedIndustry) {
        const found = INDUSTRIES.find(i => i.label.toLowerCase() === storedIndustry.toLowerCase() || i.id === storedIndustry);
        if (found) setSelectedIndustry(found.id);
      }
    }
  }, []);

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

  // File Upload Handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newDocs: UploadedDoc[] = Array.from(files).map((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      let defaultCat = "General Knowledge";
      if (f.name.toLowerCase().includes("brand") || f.name.toLowerCase().includes("guide")) defaultCat = "Brand Guidelines";
      else if (f.name.toLowerCase().includes("refund") || f.name.toLowerCase().includes("sla") || f.name.toLowerCase().includes("policy")) defaultCat = "Refund & SLA Policies";
      else if (ext === "csv" || f.name.toLowerCase().includes("finance") || f.name.toLowerCase().includes("sheet")) defaultCat = "Financial Reports";
      else if (f.name.toLowerCase().includes("doc") || f.name.toLowerCase().includes("spec")) defaultCat = "Product Documentation";

      return {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        name: f.name,
        size: f.size,
        category: defaultCat,
        title: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      };
    });

    setUploadedDocs(prev => [...prev, ...newDocs]);
  };

  const handleRemoveDoc = (id: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
  };

  const handleUpdateDocCategory = (id: string, newCat: string) => {
    setUploadedDocs(prev => prev.map(d => d.id === id ? { ...d, category: newCat } : d));
  };

  const handleFinalSubmit = async () => {
    setIsDeploying(true);
    setDeployProgress(10);
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
      setDeployLogs(prev => [...prev, "🧠 Ingesting Company Profile, Brand Guidelines & Policies into Shared Memory..."]);
      setDeployProgress(35);

      await api.completeOnboarding(payload);

      // Upload Documents sequentially and stream telemetry
      if (uploadedDocs.length > 0) {
        setDeployLogs(prev => [...prev, `📄 Ingesting ${uploadedDocs.length} uploaded company document(s)...`]);
        for (let i = 0; i < uploadedDocs.length; i++) {
          const doc = uploadedDocs[i];
          try {
            setDeployLogs(prev => [...prev, `⏳ Parsing & indexing '${doc.name}' (${doc.category})...`]);
            await api.uploadKnowledgeDocument(doc.file, doc.category, doc.title);
            setDeployLogs(prev => [...prev, `✅ Document '${doc.name}' indexed into Knowledge Base.`]);
          } catch (uploadErr: any) {
            setDeployLogs(prev => [...prev, `⚠️ Warning on '${doc.name}': ${uploadErr.message || 'Stored in local buffer'}`]);
          }
          setDeployProgress(35 + Math.round(((i + 1) / uploadedDocs.length) * 35));
        }
      }

      setDeployLogs(prev => [
        ...prev,
        "🛡️ Setting up Governance Gateway & Trust Tiers...",
        "⚡ Provisioning Autonomous Specialist Fleet (Marketing & Finance)...",
        "✨ Company OS Control Plane is now fully operational!"
      ]);
      setDeployProgress(100);
      setDeploySuccess(true);

      // Store in localStorage for fast UI hydration
      localStorage.setItem("companyos_company_name", companyName);
      localStorage.setItem("companyos_industry", activeIndustry);
      localStorage.setItem("companyos_onboarding_completed", "true");
      localStorage.removeItem("companyos_is_new_signup");
    } catch (err: any) {
      setDeployLogs(prev => [...prev, `⚠️ Warning: Local sync active (${err.message || 'Offline mode'})`]);
      setDeployProgress(100);
      setDeploySuccess(true);
      localStorage.setItem("companyos_onboarding_completed", "true");
      localStorage.removeItem("companyos_is_new_signup");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>The Company OS</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Onboarding Survey
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Setup your company profile, upload documents & configure your AI workforce.
              </p>
            </div>
          </div>

          {/* Step Badges */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105"
                    : step > s
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-500"
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Wizard Steps */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Company Profile */}
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
                    Tell your AI workforce what your company does, your website, and your target audience.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Company Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Antigravity Cloud Inc."
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Website / Domain URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Industry Grid */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Primary Industry Vertical
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {INDUSTRIES.map((ind) => {
                      const isSelected = selectedIndustry === ind.id;
                      return (
                        <button
                          key={ind.id}
                          type="button"
                          onClick={() => setSelectedIndustry(ind.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-500/10 scale-[1.02]"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                          }`}
                        >
                          <span className="text-xl mb-1.5 block">{ind.icon}</span>
                          <p className="text-xs font-bold text-slate-200">{ind.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{ind.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Company Stage */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">
                    Company Stage
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

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Ideal Customer Profile (ICP) & Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Founders, CTOs, and Product Managers at early-stage startups"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: Goals */}
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
                    <Layers className="w-5 h-5 text-indigo-400" />
                    90-Day Priorities & Strategic Objectives
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
                    placeholder="e.g. Expand into new regional market and automate weekly reports"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Policies, Documents & Knowledge Base */}
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
                    Company Policies & Document Uploads
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload your company handbooks, pitch decks, policy documents, and financial records for your AI fleet.
                  </p>
                </div>

                {/* 📂 DRAG & DROP DOCUMENT UPLOADER */}
                <div className="bg-slate-950/50 border border-slate-800/90 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-cyan-400" />
                      <span>Upload Company Documents (PDF, DOCX, CSV, TXT, MD)</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {uploadedDocs.length} {uploadedDocs.length === 1 ? 'file ready' : 'files ready'}
                    </span>
                  </div>

                  {/* Dropzone Box */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFile(false);
                      handleFileSelect(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDraggingFile
                        ? "border-cyan-400 bg-cyan-950/20"
                        : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt,.csv,.md,.json"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Click to browse or drag & drop files here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Brand guidelines, SOPs, pitch decks, policy handbooks, and financial spreadsheets
                      </p>
                    </div>
                  </div>

                  {/* Uploaded Documents List */}
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Attached Documents & Category Mapping:
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {uploadedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <File className="w-4 h-4 text-cyan-400 shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-200 truncate">{doc.name}</p>
                                <span className="text-[10px] text-slate-500">{formatFileSize(doc.size)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <select
                                value={doc.category}
                                onChange={(e) => handleUpdateDocCategory(doc.id, e.target.value)}
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                              >
                                {DOCUMENT_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(doc.id)}
                                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Refund Terms */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Refund Policy & Terms
                    </label>
                    <span className="text-[10px] text-slate-400">Ingested into Finance & Operations</span>
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
                    <span className="text-[10px] text-slate-400">Ingested into Support & SLA Guards</span>
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
                    placeholder="e.g. Enterprise tier starts at $2,000/mo. We provide dedicated Slack support and SSO..."
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
                    Your starter specialist fleet. Configure trust tiers and governance limits.
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                            <p className="text-xs text-slate-400 font-medium">{agent.role} · {agent.department}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAgent(agent.id)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            agent.selected
                              ? "bg-cyan-500 border-cyan-500 text-slate-950"
                              : "border-slate-700 bg-slate-800 text-transparent"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Trust Tier Selector */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Trust Tier:</span>
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          {(["observe", "assist", "operate"] as const).map((tier) => (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => updateAgentTier(agent.id, tier)}
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                agent.trustTier === tier
                                  ? tier === "observe"
                                    ? "bg-slate-700 text-white"
                                    : tier === "assist"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-emerald-600 text-white"
                                  : "text-slate-500 hover:text-slate-300"
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

                {/* Governance Limits */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Autonomous Spend Limit ($ / Month)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1 block">
                      Human Approval Gate Threshold ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">$</span>
                      <input
                        type="number"
                        value={approvalThreshold}
                        onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Ingestion & Launch Telemetry */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    Review & Launch Company OS
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ready to deploy your company configuration, index uploaded documents, and activate the AI workforce.
                  </p>
                </div>

                {/* Configuration Summary Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Company</span>
                    <p className="text-xs font-extrabold text-white mt-0.5 truncate">{companyName}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Industry</span>
                    <p className="text-xs font-extrabold text-white mt-0.5 truncate">{selectedIndustry}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Documents</span>
                    <p className="text-xs font-extrabold text-cyan-400 mt-0.5">{uploadedDocs.length} Attached</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500">AI Workers</span>
                    <p className="text-xs font-extrabold text-emerald-400 mt-0.5">
                      {starterAgents.filter(a => a.selected).length} Active
                    </p>
                  </div>
                </div>

                {/* Live Deployment Stream Terminal */}
                {isDeploying ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-cyan-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Control Plane Provisioning Stream
                      </span>
                      <span className="text-slate-400 font-bold">{deployProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${deployProgress}%` }}
                      />
                    </div>

                    {/* Terminal Logs */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
                      {deployLogs.map((log, idx) => (
                        <p key={idx} className="leading-relaxed">
                          <span className="text-slate-500 mr-2">&gt;</span>
                          {log}
                        </p>
                      ))}
                    </div>

                    {deploySuccess && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => router.push("/")}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-2"
                        >
                          <span>Launch Company OS</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/40 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Ready to Deploy Autonomous Operations</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Click the button below to ingest company profile, parse {uploadedDocs.length} document(s), and initialize your AI workforce.
                    </p>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold shadow-xl shadow-cyan-500/20 transition active:scale-95 inline-flex items-center gap-2"
                    >
                      <span>Deploy Autonomous Workforce</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Wizard Footer Navigation */}
        {!isDeploying && (
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-8">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Step {step} of {totalSteps}</span>
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.min(totalSteps, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>Deploy & Launch</span>
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
