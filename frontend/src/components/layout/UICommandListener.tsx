"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

interface AIToast {
  id: string;
  title?: string;
  message: string;
  path?: string;
  actionType?: string;
  type?: "info" | "success" | "warning";
}

interface UICommand {
  action: string;
  payload: Record<string, any>;
  business_id: string;
  timestamp: string;
}

interface QuestionModalProps {
  questionId: string;
  question: string;
  context?: string;
  memoryKey: string;
}

const POLL_INTERVAL_MS = 3000;

export function UICommandListener() {
  const router = useRouter();
  const [toasts, setToasts] = useState<AIToast[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuestionModalProps | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastPollTimestamp = useRef<string | null>(null);

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const pollUrl = `${baseUrl}/api/v1/ui/poll`;

    let isSubscribed = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const pollCommands = async () => {
      if (!isSubscribed) return;
      if (typeof window !== "undefined" && !navigator.onLine) return;

      try {
        const params = new URLSearchParams();
        if (lastPollTimestamp.current) {
          params.set("since", lastPollTimestamp.current);
        }
        const res = await fetch(`${pollUrl}?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        const commands: UICommand[] = data.commands || [];

        for (const cmd of commands) {
          // Track latest timestamp
          lastPollTimestamp.current = cmd.timestamp;

          const action = cmd.action;
          const payload = cmd.payload || {};

          if (action === "NAVIGATE") {
            if (payload.path) {
              const toastId = `toast-${Date.now()}-${Math.random()}`;
              setToasts(prev => [
                {
                  id: toastId,
                  title: "AI Guided Navigation",
                  message: payload.message || `AI Agent navigated you to ${payload.path}`,
                  path: payload.path,
                  type: "info"
                },
                ...prev.slice(0, 4)
              ]);
              router.push(payload.path);
            }
          } else if (action === "SHOW_TOAST") {
            const toastId = `toast-${Date.now()}-${Math.random()}`;
            setToasts(prev => [
              {
                id: toastId,
                title: payload.title || "AI Agent Activity",
                message: payload.message || "AI Agent executed an operational directive.",
                type: payload.type || "info"
              },
              ...prev.slice(0, 4)
            ]);
          } else if (action === "ASK_QUESTION") {
            setActiveQuestion({
              questionId: payload.question_id,
              question: payload.question,
              context: payload.context,
              memoryKey: payload.memory_key
            });
          }
        }
      } catch (err) {
        // Silently ignore network errors during polling
      }
    };

    // Start polling loop
    const startPolling = () => {
      pollCommands();
      pollTimer = setInterval(pollCommands, POLL_INTERVAL_MS);
    };

    const handleOnline = () => {
      if (!pollTimer) startPolling();
    };
    const handleOffline = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    startPolling();

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [router]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestion || !questionAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("companyos_token") || "";
      await fetch("/api/v1/memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          key: activeQuestion.memoryKey,
          value: questionAnswer,
          tags: ["user_response", "ask_question"]
        })
      });
      setActiveQuestion(null);
      setQuestionAnswer("");
    } catch (err) {
      console.error("Failed to submit answer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none font-sans">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto bg-slate-900 border border-slate-700/80 text-white p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3 font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>{toast.title || "AI Action"}</span>
                </h5>
                <p className="text-xs text-slate-300 leading-snug">
                  {toast.message}
                </p>
                {toast.path && (
                  <button
                    onClick={() => {
                      router.push(toast.path!);
                      removeToast(toast.id);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
                  >
                    <span>View Page</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {activeQuestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-2xl max-w-lg w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">AI Needs Clarification</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Waiting for your response to proceed</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-5">
                <p className="text-slate-800 dark:text-slate-200 font-medium">{activeQuestion.question}</p>
                {activeQuestion.context && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">Context: {activeQuestion.context}</p>
                )}
              </div>

              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Type your answer here..."
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow disabled:opacity-50"
                />
                
                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !questionAnswer.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answer"}
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
