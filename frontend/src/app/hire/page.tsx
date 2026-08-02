"use client";

import { useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  ArrowRight,
  Database,
  PenTool,
  Building,
  Code,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Plus
} from "lucide-react";

export default function HirePage() {
  const [activeTab, setActiveTab] = useState<"Marketplace" | "Governance" | "Logs">("Marketplace");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [hiredAgentId, setHiredAgentId] = useState<string | null>(null);

  const availableAgents = [
    {
      id: "agent-data-ops",
      name: "Data Ingestion Pro",
      department: "DATA OPS",
      rating: 4.8,
      tags: ["ETL Pipelines", "Cleansing"],
      description: "Automates data extraction, transformation, and loading across modern data warehouses.",
      price: "$45 / hr",
      icon: Database,
      iconBg: "bg-slate-100 text-slate-700"
    },
    {
      id: "agent-copywriter",
      name: "Copywriting Specialist",
      department: "MARKETING",
      rating: 5.0,
      tags: ["SEO", "A/B Testing"],
      description: "Generates high converting ad copy, landing pages, and automated campaign copy.",
      price: "$850 / mo",
      icon: PenTool,
      iconBg: "bg-emerald-50 text-emerald-700"
    },
    {
      id: "agent-finance-audit",
      name: "Financial Auditor",
      department: "FINANCE",
      rating: 4.7,
      tags: ["Compliance", "Reconciliation"],
      description: "Continuous anomaly detection in transactions, vendor invoices, and compliance auditing.",
      price: "$1,400 / mo",
      icon: Building,
      iconBg: "bg-rose-50 text-rose-700"
    },
    {
      id: "agent-code-reviewer",
      name: "Code Review Assistant",
      department: "ENGINEERING",
      rating: 4.9,
      tags: ["CI/CD", "Linting"],
      description: "Analyzes pull requests for logic errors, security flaws, and architectural best practices.",
      price: "$75 / hr",
      icon: Code,
      iconBg: "bg-teal-50 text-teal-700"
    }
  ];

  const filteredAgents = availableAgents.filter((agent) => {
    if (selectedDept === "Marketing" && agent.department !== "MARKETING") return false;
    if (selectedDept === "Engineering" && agent.department !== "ENGINEERING" && agent.department !== "DATA OPS") return false;
    if (selectedDept === "Finance" && agent.department !== "FINANCE") return false;
    if (searchQuery) {
      return (
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleHire = (name: string) => {
    alert(`Successfully deployed and integrated ${name} into your active AI workforce!`);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Sub-nav Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-6 text-xs md:text-sm font-semibold">
          {["Marketplace", "Governance", "Logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-1 transition-all ${
                activeTab === tab
                  ? "text-emerald-800 font-bold border-b-2 border-emerald-700"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert("Custom Agent Builder wizard opening...")}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Deploy Agent</span>
        </button>
      </div>

      {/* 2. Main Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hire Agents
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
          Expand your AI workforce with specialized autonomous agents designed to handle complex operational workflows with precision and reliability.
        </p>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name, skill, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["All Departments", "Marketing", "Engineering", "Finance"].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedDept === dept
                  ? "bg-blue-100 text-blue-800 font-bold border border-blue-200 shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {dept}
            </button>
          ))}

          <button
            onClick={() => alert("Advanced filter panel")}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* 4. Featured Specialists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Featured Specialists</h2>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 shadow-xs">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 shadow-xs">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
          {/* Hero Featured Card 1 (Col 8/12) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
            {/* Visual Graphic */}
            <div className="w-full md:w-48 h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
              <div className="w-24 h-24 rounded-2xl bg-emerald-600/90 shadow-2xl flex items-center justify-center border-2 border-white/60 backdrop-blur-md rotate-6">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between h-full w-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                    Engineering
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-emerald-600" />
                    <span>4.9</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200 ml-auto">
                    Top Rated
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">Senior Security Auditor</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                  Autonomous penetration testing and real time vulnerability scanning across complex microservices and cloud infrastructure.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                <div>
                  <span className="text-base font-extrabold text-slate-900 font-mono">$120.00</span>
                  <span className="text-xs text-slate-500"> / hr</span>
                  <p className="text-[10px] text-slate-400">Compute included</p>
                </div>

                <button
                  onClick={() => handleHire("Senior Security Auditor")}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-105"
                >
                  <span>Hire Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Hero Featured Card 2 (Col 4/12) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  Marketing
                </span>
                <Bookmark className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700" />
              </div>

              <h3 className="text-base font-bold text-slate-900">Growth Strategist Bot</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                Analyzes market trends, optimizes ad spend, and generates multivariate landing page campaigns with automated A/B reporting.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <div>
                <span className="text-base font-extrabold text-slate-900 font-mono">$3,200</span>
                <span className="text-xs text-slate-500"> / mo</span>
              </div>

              <button
                onClick={() => handleHire("Growth Strategist Bot")}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Available Agents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Available Agents</h2>
          <span className="text-xs text-slate-400 font-medium">Showing 24 of 142</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => {
            const Icon = agent.icon;

            return (
              <div
                key={agent.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-xl ${agent.iconBg} border flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>{agent.rating}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {agent.department}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">
                    {agent.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {agent.price}
                  </span>

                  <button
                    onClick={() => handleHire(agent.name)}
                    className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
