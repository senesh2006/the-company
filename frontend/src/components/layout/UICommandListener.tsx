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

const POLL_INTERVAL_MS = 3000;

export function UICommandListener() {
  const router = useRouter();
  const [toasts, setToasts] = useState<AIToast[]>([]);
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
    </div>
  );
}
