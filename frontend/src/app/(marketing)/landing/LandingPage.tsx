"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, type Variants } from "framer-motion";
import {
  Users,
  Megaphone,
  Calculator,
  Sparkles,
  Search,
  Shield,
  Eye,
  HandHelping,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Lock,
  FileText,
  BarChart3,
  Bot,
  Layers,
  Activity,
  Globe,
  Code2,
  Database
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { easings, durations } from "@/lib/motion";

/* ────────────────────────────────────────────
   Motion helpers (reuse project tokens)
   ──────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easings.easeOutExpo } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easings.easeOutExpo } },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ────────────────────────────────────────────
   Agent data — from backend role definitions
   ──────────────────────────────────────────── */

const AGENTS = [
  {
    name: "Growth & Marketing Lead",
    role: "Marketing Manager",
    department: "Marketing & Growth",
    icon: Megaphone,
    accent: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    description:
      "Autonomous growth engine handling multi-channel campaign strategy, brand-aligned copywriting, and content calendar automation.",
    trustTier: "assist",
  },
  {
    name: "Financial Controller & Auditor",
    role: "Finance Manager",
    department: "Finance & Accounting",
    icon: Calculator,
    accent: "blue",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    description:
      "Rigorous accounting intelligence managing GAAP double-entry ledgers, expense categorization, and automated maker-checker safety loops.",
    trustTier: "observe",
  },
  {
    name: "Personal Assistant",
    role: "Executive Coordinator",
    department: "Administration",
    icon: Sparkles,
    accent: "cyan",
    gradient: "from-cyan-500 to-sky-500",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-800",
    text: "text-cyan-700 dark:text-cyan-400",
    description:
      "Executive coordination managing scheduling, triaging, and central task routing across all specialized workers.",
    trustTier: "assist",
  },
  {
    name: "Operations & Market Researcher",
    role: "Researcher",
    department: "Operations",
    icon: Search,
    accent: "amber",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    description:
      "Deep research and competitive intelligence, market analysis, and data-driven strategic recommendations.",
    trustTier: "operate",
  },
];

const STEPS = [
  {
    icon: Users,
    title: "Hire Agents",
    description: "Recruit specialized AI workers from the marketplace — Marketing, Finance, Engineering, and more.",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  {
    icon: FileText,
    title: "Assign Mandates",
    description: "Describe goals in natural language. Agents decompose work, pick tools, and execute autonomously.",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  {
    icon: Activity,
    title: "Agents Coordinate",
    description: "Workers collaborate via shared memory, escalate low-confidence decisions, and spawn sub-workers.",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800/60",
  },
  {
    icon: CheckCircle2,
    title: "Founder Reviews",
    description: "Approve, audit, and steer via the real-time activity feed. Every action logged. Full control.",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/60",
  },
];

const TRUST_TIERS = [
  {
    tier: "Observe",
    icon: Eye,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
    description: "Agent drafts actions; human approves every step before execution.",
  },
  {
    tier: "Assist",
    icon: HandHelping,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700",
    description: "Agent executes routine tasks; escalates uncertain decisions above a confidence threshold.",
  },
  {
    tier: "Operate",
    icon: Zap,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-300 dark:border-emerald-700",
    description: "Full autonomy within guardrails. Circuit breakers halt on anomalies. Audit trail always active.",
  },
];

/* ────────────────────────────────────────────
   Animated Office Floor SVG (hero illustration)
   ──────────────────────────────────────────── */

function OfficeFloor() {
  return (
    <div className="relative w-full max-w-2xl mx-auto mt-12 lg:mt-0">
      <svg viewBox="0 0 600 340" fill="none" className="w-full h-auto">
        {/* Floor */}
        <rect x="40" y="260" width="520" height="60" rx="16" className="fill-slate-100 dark:fill-slate-800/60" />
        <rect x="40" y="260" width="520" height="60" rx="16" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

        {/* Desk 1 — Marketing */}
        <rect x="80" y="220" width="100" height="40" rx="6" className="fill-white dark:fill-slate-800" />
        <rect x="80" y="220" width="100" height="40" rx="6" className="stroke-emerald-300 dark:stroke-emerald-700" strokeWidth="1.5" />
        <motion.rect x="90" y="228" width="30" height="22" rx="3" className="fill-emerald-100 dark:fill-emerald-900/50"
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
        <text x="130" y="246" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="Inter" fontWeight="600">MKT</text>

        {/* Agent 1 — sitting at desk */}
        <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <circle cx="130" cy="195" r="16" className="fill-emerald-200 dark:fill-emerald-800" />
          <circle cx="130" cy="195" r="16" className="stroke-emerald-500" strokeWidth="2" />
          <circle cx="126" cy="192" r="2" className="fill-emerald-700 dark:fill-emerald-300" />
          <circle cx="134" cy="192" r="2" className="fill-emerald-700 dark:fill-emerald-300" />
          <path d="M124 199 Q130 203 136 199" className="stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="1.5" fill="none" />
          {/* Status dot */}
          <motion.circle cx="143" cy="186" r="4" className="fill-emerald-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }} />
        </motion.g>

        {/* Desk 2 — Finance */}
        <rect x="250" y="220" width="100" height="40" rx="6" className="fill-white dark:fill-slate-800" />
        <rect x="250" y="220" width="100" height="40" rx="6" className="stroke-blue-300 dark:stroke-blue-700" strokeWidth="1.5" />
        <motion.rect x="260" y="228" width="30" height="22" rx="3" className="fill-blue-100 dark:fill-blue-900/50"
          animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <text x="300" y="246" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="Inter" fontWeight="600">FIN</text>

        {/* Agent 2 */}
        <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
          <circle cx="300" cy="195" r="16" className="fill-blue-200 dark:fill-blue-800" />
          <circle cx="300" cy="195" r="16" className="stroke-blue-500" strokeWidth="2" />
          <circle cx="296" cy="192" r="2" className="fill-blue-700 dark:fill-blue-300" />
          <circle cx="304" cy="192" r="2" className="fill-blue-700 dark:fill-blue-300" />
          <path d="M294 199 Q300 203 306 199" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="1.5" fill="none" />
          <motion.circle cx="313" cy="186" r="4" className="fill-blue-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        </motion.g>

        {/* Desk 3 — Engineering */}
        <rect x="420" y="220" width="100" height="40" rx="6" className="fill-white dark:fill-slate-800" />
        <rect x="420" y="220" width="100" height="40" rx="6" className="stroke-cyan-300 dark:stroke-cyan-700" strokeWidth="1.5" />
        <motion.rect x="430" y="228" width="30" height="22" rx="3" className="fill-cyan-100 dark:fill-cyan-900/50"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <text x="470" y="246" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="Inter" fontWeight="600">ENG</text>

        {/* Agent 3 */}
        <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
          <circle cx="470" cy="195" r="16" className="fill-cyan-200 dark:fill-cyan-800" />
          <circle cx="470" cy="195" r="16" className="stroke-cyan-500" strokeWidth="2" />
          <circle cx="466" cy="192" r="2" className="fill-cyan-700 dark:fill-cyan-300" />
          <circle cx="474" cy="192" r="2" className="fill-cyan-700 dark:fill-cyan-300" />
          <path d="M464 199 Q470 203 476 199" className="stroke-cyan-600 dark:stroke-cyan-400" strokeWidth="1.5" fill="none" />
          <motion.circle cx="483" cy="186" r="4" className="fill-cyan-500"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
        </motion.g>

        {/* Connection lines between agents */}
        <motion.path
          d="M146 195 Q220 160 284 195"
          className="stroke-emerald-300/50 dark:stroke-emerald-600/30"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M316 195 Q390 160 454 195"
          className="stroke-blue-300/50 dark:stroke-blue-600/30"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          animate={{ strokeDashoffset: [0, -16] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />

        {/* Floating thought bubbles */}
        <motion.g
          animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="90" y="155" width="80" height="24" rx="12" className="fill-white dark:fill-slate-700" />
          <rect x="90" y="155" width="80" height="24" rx="12" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" />
          <text x="104" y="171" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="'JetBrains Mono'" fontWeight="500">writing...</text>
        </motion.g>

        <motion.g
          animate={{ y: [0, -5, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          <rect x="260" y="155" width="80" height="24" rx="12" className="fill-white dark:fill-slate-700" />
          <rect x="260" y="155" width="80" height="24" rx="12" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" />
          <text x="270" y="171" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="'JetBrains Mono'" fontWeight="500">auditing...</text>
        </motion.g>

        <motion.g
          animate={{ y: [0, -4, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        >
          <rect x="430" y="155" width="80" height="24" rx="12" className="fill-white dark:fill-slate-700" />
          <rect x="430" y="155" width="80" height="24" rx="12" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="1" />
          <text x="444" y="171" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontFamily="'JetBrains Mono'" fontWeight="500">coding...</text>
        </motion.g>
      </svg>

      {/* Glow underneath */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-emerald-500/10 via-emerald-500/5 to-transparent rounded-b-3xl pointer-events-none" />
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Landing Page
   ──────────────────────────────────────────── */

export function LandingPage() {
  const router = useRouter();
  const { signInAsDemo } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const handleDemoClick = async () => {
    setDemoLoading(true);
    try {
      const res = await signInAsDemo();
      if (res?.error) {
        console.error("Demo login failed:", res.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Demo login error:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)] overflow-x-hidden">
      {/* ═══════════════════════════════════════
          NAVIGATION
         ═══════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 inset-x-0 z-50 glass-header"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Wordmark */}
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-600/20">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              Company OS
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#how-it-works" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#agents" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Agents
            </a>
            <a href="#trust" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Trust & Safety
            </a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              Sign In
            </Link>
            <motion.button
              onClick={handleDemoClick}
              disabled={demoLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/25 transition-shadow disabled:opacity-60"
            >
              {demoLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Try the Demo
                </>
              )}
            </motion.button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Menu"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#how-it-works" onClick={() => setNavOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-300">How It Works</a>
              <a href="#agents" onClick={() => setNavOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Agents</a>
              <a href="#trust" onClick={() => setNavOpen(false)} className="block text-sm font-medium text-slate-700 dark:text-slate-300">Trust & Safety</a>
              <Link href="/login" className="block text-sm font-medium text-emerald-700 dark:text-emerald-400">Sign In</Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ═══════════════════════════════════════
          HERO
         ═══════════════════════════════════════ */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center lg:text-left"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-emerald" />
                Multi-Agent AI Workforce Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-slate-50"
            >
              Your AI Workforce.{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Your Rules.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Company OS is a coordinated team of specialized AI agents — Marketing,
              Finance, Engineering — that runs your business day-to-day while you stay
              in control.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <motion.button
                onClick={handleDemoClick}
                disabled={demoLoading}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-bold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-shadow disabled:opacity-60"
              >
                {demoLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Launching...
                  </span>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Try the Demo — Free Instant Access
                  </>
                )}
              </motion.button>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
              No signup required · 1-click instant access · Live demo environment
            </motion.p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <OfficeFloor />
          </motion.div>
        </div>

        {/* Background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-emerald-500/8 via-transparent to-transparent rounded-full pointer-events-none blur-3xl" />
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
         ═══════════════════════════════════════ */}
      <Section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold tracking-wider uppercase mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            From Mandate to Execution in Minutes
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            You give the direction. Your AI workforce handles everything else.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUp}
              className={`relative bento-card p-6 flex flex-col gap-4 ${step.bg} ${step.border}`}
            >
              {/* Step number */}
              <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <span className="text-xs font-extrabold text-slate-400 font-mono">{i + 1}</span>
              </div>

              <div className={`w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border ${step.border} flex items-center justify-center ${step.color}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════
          AGENT ROSTER
         ═══════════════════════════════════════ */}
      <Section id="agents" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase mb-4">
            Agent Roster
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Meet Your AI Workforce
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Specialized agents built for specific business functions, powered by the best LLMs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {AGENTS.map((agent) => (
            <motion.div
              key={agent.name}
              variants={scaleUp}
              className="bento-card p-6 flex flex-col gap-4 group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${agent.gradient} p-[2px] shadow-sm`}>
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
                    <agent.icon className={`w-5 h-5 ${agent.text}`} />
                  </div>
                </div>
                <Badge className={`${agent.bg} ${agent.text} ${agent.border} text-[10px] uppercase tracking-wider`}>
                  {agent.department}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 font-mono">
                  {agent.role}
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                {agent.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trust: {agent.trustTier}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-emerald" />
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════
          TRUST & GOVERNANCE
         ═══════════════════════════════════════ */}
      <Section id="trust" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold tracking-wider uppercase mb-4">
            <Lock className="w-3.5 h-3.5" />
            Trust & Governance
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Autonomy With Guardrails
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Every agent operates within a tiered trust system. You decide how much freedom each one gets.
          </p>
        </motion.div>

        {/* Trust tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {TRUST_TIERS.map((t, i) => (
            <motion.div
              key={t.tier}
              variants={fadeUp}
              className={`bento-card p-6 flex flex-col items-center text-center gap-4 ${t.bg} border ${t.border}`}
            >
              <div className={`w-14 h-14 rounded-2xl border ${t.border} flex items-center justify-center ${t.color} bg-white dark:bg-slate-800`}>
                <t.icon className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${t.color}`}>{t.tier}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.description}
              </p>

              {/* Arrow between cards */}
              {i < TRUST_TIERS.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2">
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Audit trail callout */}
        <motion.div
          variants={fadeUp}
          className="bento-card p-8 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Full Audit Trail
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every action is logged. Every decision is traceable. Financial circuit breakers enforce a $500
              velocity hard cap with zero unattended money movement. Your AI workforce is accountable — always.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
            <span className="text-xs font-bold font-mono">ALWAYS ON</span>
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SOCIAL PROOF / BUILT WITH
         ═══════════════════════════════════════ */}
      <Section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            Built for the Future of Work
          </span>
        </motion.div>

        <motion.h2 variants={fadeUp} className="mt-6 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Real Product. Live Demo. Try It Now.
        </motion.h2>

        <motion.p variants={fadeUp} className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Company OS is a fully functional multi-agent AI platform — not a mockup. Everything you see in the demo is running real AI workflows.
        </motion.p>

        {/* Tech stack badges */}
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            { label: "LangGraph", icon: Globe },
            { label: "Next.js 16", icon: Code2 },
            { label: "Supabase", icon: Database },
            { label: "FastAPI", icon: Zap },
            { label: "Framer Motion", icon: Activity },
          ].map((tech) => (
            <span
              key={tech.label}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-xs"
            >
              <tech.icon className="w-4 h-4 text-slate-400" />
              {tech.label}
            </span>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-10">
          <motion.button
            onClick={handleDemoClick}
            disabled={demoLoading}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-bold shadow-lg shadow-emerald-600/25 transition-shadow"
          >
            <Zap className="w-5 h-5" />
            Launch Live Demo
          </motion.button>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          FINAL CTA + FOOTER
         ═══════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Ready to Meet Your AI Workforce?
          </h2>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            No signup required. Click below and you&apos;re in the control plane in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              onClick={handleDemoClick}
              disabled={demoLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-base font-bold shadow-lg shadow-emerald-600/25"
            >
              <Zap className="w-5 h-5" />
              Try the Demo — Instant Access
            </motion.button>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Create an Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">Company OS</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/pricing" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Sign Up
            </Link>
          </div>

          <span className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Company OS. All rights reserved.
          </span>
        </footer>
      </section>
    </div>
  );
}
