"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";

const pricingTiers = [
  {
    name: "Starter",
    description: "Perfect for individuals and small teams exploring AI autonomy.",
    price: "$49",
    billing: "/month",
    icon: <Zap className="w-5 h-5 text-emerald-500" />,
    features: [
      "Up to 5 Active Agents",
      "Standard Tool Access",
      "Daily Activity Logs",
      "Basic Memory Context",
      "Community Support",
    ],
    buttonText: "Get Started",
    popular: false,
    color: "slate",
  },
  {
    name: "Professional",
    description: "Scale your operations with advanced AI agents and custom mandates.",
    price: "$149",
    billing: "/month",
    icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
    features: [
      "Up to 20 Active Agents",
      "Premium Tool Access (Web & API)",
      "Custom Mandates & Workflows",
      "Extended Memory Context",
      "Priority Email Support",
      "Analytics Dashboard",
    ],
    buttonText: "Start Free Trial",
    popular: true,
    color: "indigo",
  },
  {
    name: "Enterprise",
    description: "For large organizations requiring dedicated infrastructure and security.",
    price: "Custom",
    billing: "pricing",
    icon: <Building2 className="w-5 h-5 text-slate-400" />,
    features: [
      "Unlimited Active Agents",
      "Dedicated Compute Clusters",
      "Custom Tool Integrations",
      "SSO & Advanced Security",
      "24/7 Dedicated Account Manager",
      "SLA Guarantee",
    ],
    buttonText: "Contact Sales",
    popular: false,
    color: "slate",
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              Scale Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Autonomous Workforce</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Choose the perfect plan to unleash AI agents across your organization. Simple, transparent pricing that grows with you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            <span className={`text-sm font-semibold ${!isAnnual ? "text-slate-900" : "text-slate-500"}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isAnnual ? "translate-x-8 bg-emerald-500" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-semibold ${isAnnual ? "text-slate-900" : "text-slate-500"}`}>
              Annually <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">SAVE 20%</span>
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1), duration: 0.6 }}
              className={`relative bg-white rounded-3xl p-8 flex flex-col h-full border ${
                tier.popular 
                  ? "border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105 z-10" 
                  : "border-slate-200 shadow-lg shadow-slate-200/50"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                  {tier.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2 h-10">{tier.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {tier.price !== "Custom" && isAnnual ? `$${Math.round(parseInt(tier.price.replace('$', '')) * 0.8)}` : tier.price}
                  </span>
                  {tier.price !== "Custom" && (
                    <span className="text-sm font-semibold text-slate-400 mb-1">{tier.billing}</span>
                  )}
                </div>
                {tier.price !== "Custom" && isAnnual && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Billed annually</p>
                )}
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  tier.popular
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                    : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md"
                }`}
              >
                {tier.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
