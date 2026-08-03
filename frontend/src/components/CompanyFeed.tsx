"use client";

import { useState, useEffect } from "react";
import { api, CompanyFeedItem, MandatePayload, TrustTier } from "@/lib/api";
import { useAgents } from "@/lib/queries";
import { 
  Send, CheckCircle2, XCircle, RotateCcw, AlertTriangle, 
  Clock, Cpu, Sparkles, Terminal, Layers
} from "lucide-react";

export function CompanyFeed() {
  const { data: agents } = useAgents();
  const [feedItems, setFeedItems] = useState<CompanyFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mandateText, setMandateText] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedCadence, setSelectedCadence] = useState<"once" | "daily" | "weekly">("once");
  const [selectedPriority, setSelectedPriority] = useState<"low" | "normal" | "high">("normal");
  const [isDispatching, setIsDispatching] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "dispatch">("feed");

  const loadFeed = async () => {
    try {
      const items = await api.getCompanyFeed(40);
      setFeedItems(items);
    } catch (e) {
      console.error("Failed to load feed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandateText.trim() || isDispatching) return;

    setIsDispatching(true);
    try {
      const payload: MandatePayload = {
        mandate: mandateText.trim(),
        cadence: selectedCadence,
        priority: selectedPriority,
        assignee_role: selectedRole === "all" ? undefined : selectedRole,
        trust_tier: "observe",
      };
      await api.dispatchMandate(payload);
      setMandateText("");
      setActiveTab("feed");
      await loadFeed();
    } catch (e: any) {
      alert("Failed to dispatch mandate: " + e.message);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleReview = async (taskId: string, verdict: "approved" | "rejected" | "revise", feedback?: string) => {
    try {
      await api.reviewTask(taskId, verdict, feedback);
      setReviewingId(null);
      setRevisionFeedback("");
      await loadFeed();
    } catch (e: any) {
      alert("Review action failed: " + e.message);
    }
  };

  const getTierColor = (tier?: TrustTier) => {
    if (tier === "operate") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (tier === "assist") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-amber-100 text-amber-800 border-amber-300";
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return "Just now";
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-6">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Company Feed</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-semibold">
                Live Audit Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time multi-agent execution trail with founder review gates
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "feed"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "dispatch"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            Issue Mandate
          </button>
        </div>
      </div>

      {/* Tab: Dispatch Mandate */}
      {activeTab === "dispatch" && (
        <form onSubmit={handleDispatch} className="p-5 rounded-2xl bg-slate-50 border border-emerald-200 space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Mandate Contract Schema (PRD v6.0 §6.2)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mandate Directive / Output Requirement
            </label>
            <textarea
              rows={3}
              value={mandateText}
              onChange={(e) => setMandateText(e.target.value)}
              placeholder="e.g. Conduct a comprehensive cash runway audit for Q3 and draft 3 marketing copy variants in Notion."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Assignee / Role */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Target Specialist / Router</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Robin (Autonomous Orchestrator)</option>
                <option value="Accountant & Controller">Accountant & Controller</option>
                <option value="Social Media & Growth Lead">Social Media & Growth Lead</option>
                <option value="Admin & Operations Worker">Admin & Operations Worker</option>
                <option value="Intelligence & Market Researcher">Intelligence Researcher</option>
                <option value="Senior Software Engineer">Senior Software Engineer</option>
              </select>
            </div>

            {/* Cadence */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Execution Cadence</label>
              <select
                value={selectedCadence}
                onChange={(e) => setSelectedCadence(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="once">Run Once</option>
                <option value="daily">Daily Cron Loop</option>
                <option value="weekly">Weekly Strategic Loop</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Priority Level</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal</option>
                <option value="high">High (Urgent)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!mandateText.trim() || isDispatching}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDispatching ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Submitting Mandate Contract...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Mandate to Autonomous Fleet</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab: Feed List */}
      {activeTab === "feed" && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-mono">Syncing live company audit trail...</p>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No feed items recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">Dispatch a mandate to initiate autonomous worker actions.</p>
            </div>
          ) : (
            feedItems.map((item) => {
              const tier = item.trust_tier || "observe";
              const isNeedsReview = item.review_status === "pending" || item.review_status === "observe_gate";
              const isReviewingThis = reviewingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  {/* Top line: Worker + Tier + Time */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900">{item.agent_name || item.role || "Autonomous Worker"}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${getTierColor(tier)}`}>
                        {tier}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>

                  {/* Mandate & Action Details */}
                  <div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {item.action}
                    </p>
                    {item.mandate && (
                      <p className="text-[11px] text-slate-600 font-mono mt-1 bg-white p-2 rounded-lg border border-slate-200">
                        Mandate: &quot;{item.mandate}&quot;
                      </p>
                    )}
                  </div>

                  {/* Shared Memory References */}
                  {item.shared_memory_refs && item.shared_memory_refs.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-mono">Memory Context:</span>
                      {item.shared_memory_refs.map((ref) => (
                        <span key={ref} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-emerald-800 border border-slate-200 font-medium">
                          #{ref}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Review Gate (PRD v6.0 §07 & §6.1) */}
                  {isNeedsReview && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Observe Tier Review Gate</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium">Requires Founder Approval</span>
                      </div>

                      {isReviewingThis ? (
                        <div className="space-y-2 pt-1">
                          <input
                            type="text"
                            value={revisionFeedback}
                            onChange={(e) => setRevisionFeedback(e.target.value)}
                            placeholder="Provide specific feedback for revision..."
                            className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(item.id, "revise", revisionFeedback)}
                              disabled={!revisionFeedback.trim()}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                              Submit Revision Request
                            </button>
                            <button
                              onClick={() => setReviewingId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleReview(item.id, "approved")}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Record Clean Cycle
                          </button>
                          <button
                            onClick={() => setReviewingId(item.id)}
                            className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Revise (Max 2)
                          </button>
                          <button
                            onClick={() => handleReview(item.id, "rejected", "Founder rejected output")}
                            className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject & Demote
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
