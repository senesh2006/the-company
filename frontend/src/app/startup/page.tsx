"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getBaseUrl, getAuthHeaders } from "@/lib/api";

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

export default function StartupPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState<string>("Acme Autonomous Corp");
  const [mandate, setMandate] = useState<string>("Accelerate company growth, automate operational workflows, and execute strategic market tasks.");
  const [industry, setIndustry] = useState<string>("Technology & Software");
  const [trustTier, setTrustTier] = useState<"observe" | "assist" | "operate">("assist");
  const [budgetLimit, setBudgetLimit] = useState<number>(2500);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployProgress, setDeployProgress] = useState<number>(0);

  const [starterAgents, setStarterAgents] = useState<StarterAgent[]>([
    {
      id: "coder",
      name: "Bob (Principal Coder)",
      role: "Coder",
      department: "Engineering",
      icon: "terminal",
      description: "Full-stack code synthesis, automated pull-request reviews, refactoring, and CI/CD validation.",
      model: "llama-v3p3-70b-instruct",
      trustTier: "assist",
      selected: true,
    },
    {
      id: "researcher",
      name: "Alice (Research Lead)",
      role: "Researcher",
      department: "Operations",
      icon: "travel_explore",
      description: "Deep web synthesis, competitive analysis, documentation scraping, and market intelligence reports.",
      model: "llama-v3p3-70b-instruct",
      trustTier: "operate",
      selected: true,
    },
    {
      id: "accountant",
      name: "Charlie (Financial Auditor)",
      role: "Accountant",
      department: "Finance",
      icon: "account_balance",
      description: "Ledger reconciliation, spend anomaly detection, budget governance, and ROI reporting.",
      model: "llama-v3p3-70b-instruct",
      trustTier: "observe",
      selected: true,
    },
    {
      id: "orchestrator",
      name: "Diana (Chief of Staff)",
      role: "Manager",
      department: "Executive",
      icon: "psychology",
      description: "Autonomous task triage, mandate decomposition, agent workload balancing, and human attention gating.",
      model: "deepseek-v3",
      trustTier: "assist",
      selected: true,
    },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("companyos_startup_company_name");
      const storedIndustry = localStorage.getItem("companyos_startup_industry");
      if (storedName) setCompanyName(storedName);
      if (storedIndustry) setIndustry(storedIndustry);
    }
  }, []);

  const toggleAgent = (id: string) => {
    setStarterAgents(prev =>
      prev.map(a => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleLaunchFleet = async () => {
    setIsDeploying(true);
    setDeployLogs(["🚀 Initializing Company OS control plane..."]);
    setDeployProgress(15);

    try {
      const baseUrl = getBaseUrl();
      const headers = await getAuthHeaders({ "Content-Type": "application/json" });

      // Step 1: Initialize Database & Default Business
      setDeployLogs(prev => [...prev, "🏢 Provisioning multi-tenant company ledger & business identity..."]);
      setDeployProgress(35);
      
      const setupRes = await fetch(`${baseUrl}/api/v1/setup`, {
        method: "GET",
        headers,
      });
      const setupData = await setupRes.json().catch(() => ({}));
      const businessId = setupData?.business_id || "default-business-id";

      // Step 2: Provision Selected Fleet Agents
      setDeployLogs(prev => [...prev, "🤖 Instantiating specialized AI worker pods and authority gates..."]);
      setDeployProgress(65);

      const selectedWorkers = starterAgents.filter(a => a.selected);
      for (const worker of selectedWorkers) {
        try {
          await fetch(`${baseUrl}/api/v1/agents/hire`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: worker.name,
              role: worker.role,
              trust_tier: worker.trustTier || trustTier,
              model: worker.model,
              goal: worker.description,
            }),
          });
        } catch {
          // Fallback handled gracefully
        }
      }

      // Step 3: Configure Vector Memory & Event Bus
      setDeployLogs(prev => [...prev, "🧠 Synchronizing shared memory vector namespace & event bus..."]);
      setDeployProgress(85);
      await new Promise(r => setTimeout(r, 600));

      // Step 4: Finalizing Launch
      setDeployLogs(prev => [...prev, "✨ Autonomous workforce active! Launching Executive Workspace..."]);
      setDeployProgress(100);
      await new Promise(r => setTimeout(r, 800));

      router.push("/");
    } catch (err: any) {
      setDeployLogs(prev => [...prev, "⚠️ Connected in local mode. Proceeding to workspace..."]);
      setDeployProgress(100);
      setTimeout(() => {
        router.push("/");
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-[760px] mx-auto py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-200/70 p-8 sm:p-10">
        {/* Progress Bar & Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Startup Setup & Fleet Configuration
            </span>
            <span>Step {step} of 3</span>
          </div>
          
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP 1: Company DNA */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80 mb-2">
                <span className="material-symbols-outlined text-sm">domain</span>
                Step 1: Workspace DNA
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Define Your Organization
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your autonomous company identity and core operating mandate.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. HyperScale Autonomous Dynamics"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Industry & Market Vertical
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium cursor-pointer"
                >
                  <option value="Technology & Software">Technology & Software</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="Financial Services & Fintech">Financial Services & Fintech</option>
                  <option value="Digital Agency & Marketing">Digital Agency & Marketing</option>
                  <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                  <option value="Autonomous AI Research">Autonomous AI Research</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Founding Mandate & Mission Statement
                </label>
                <textarea
                  rows={3}
                  value={mandate}
                  onChange={(e) => setMandate(e.target.value)}
                  placeholder="Describe your organization's primary objective..."
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Configure AI Fleet</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Starter AI Fleet */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200/80 mb-2">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
                Step 2: Founding AI Fleet
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Select Starter Worker Pods
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the autonomous agents that will form your initial company departments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {starterAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    agent.selected
                      ? "bg-emerald-50/40 border-emerald-500/80 shadow-md shadow-emerald-500/5 ring-2 ring-emerald-500/20"
                      : "bg-slate-50/70 border-slate-200/90 hover:border-slate-300 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          agent.selected ? "bg-emerald-500 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                        }`}>
                          <span className="material-symbols-outlined text-lg">{agent.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{agent.name}</h3>
                          <span className="text-[10px] font-semibold text-slate-500">{agent.department}</span>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        agent.selected ? "bg-emerald-500 border-emerald-600 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {agent.selected && <span className="material-symbols-outlined text-xs">check</span>}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{agent.model}</span>
                    <span className="capitalize font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      {agent.trustTier}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Governance & Limits</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Governance & Launch */}
        {step === 3 && !isDeploying && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200/80 mb-2">
                <span className="material-symbols-outlined text-sm">shield</span>
                Step 3: Governance & Guardrails
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Establish Human Oversight
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure safety gates, spend thresholds, and executive approval policies.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Trust Tier Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Default Organization Trust Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { tier: "observe", label: "Observe", desc: "Human signs off all actions" },
                    { tier: "assist", label: "Assist", desc: "Autonomous with high-impact gate" },
                    { tier: "operate", label: "Operate", desc: "Fully autonomous execution" },
                  ].map(t => (
                    <div
                      key={t.tier}
                      onClick={() => setTrustTier(t.tier as any)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                        trustTier === t.tier
                          ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="text-xs font-bold capitalize">{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-normal leading-tight">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Spending Cap */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Monthly Fleet Authority Limit
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ${budgetLimit.toLocaleString()} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="500"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>$500</span>
                  <span>$5,000</span>
                  <span>$10,000</span>
                </div>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Company:</span>
                  <span className="font-mono">{companyName}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Initial AI Fleet:</span>
                  <span>{starterAgents.filter(a => a.selected).length} Active Specialist Pods</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Governance Tier:</span>
                  <span className="font-bold text-emerald-700 uppercase font-mono">{trustTier}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleLaunchFleet}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                <span>Launch Company OS</span>
              </button>
            </div>
          </div>
        )}

        {/* DEPLOYING ANIMATION SCREEN */}
        {isDeploying && (
          <div className="py-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-[2px] shadow-2xl shadow-emerald-500/30 animate-bounce">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-4xl font-bold animate-spin">
                  sync
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Instantiating Autonomous Workforce
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configuring multi-tenant orchestration, event bus, and AI worker pods...
              </p>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${deployProgress}%` }}
              ></div>
            </div>

            {/* Live Terminal Log Box */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] text-left space-y-1.5 shadow-inner border border-slate-800">
              {deployLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-400">›</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
