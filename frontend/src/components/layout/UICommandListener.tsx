"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X, Bot, Zap, ExternalLink } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

interface AIToast {
  id: string;
  title?: string;
  message: string;
  path?: string;
  actionType?: string;
  type?: "info" | "success" | "warning";
}

export function UICommandListener() {
  const router = useRouter();
  const [toasts, setToasts] = useState<AIToast[]>([]);

  useEffect(() => {
    const baseUrl = getBaseUrl();
    const streamUrl = `${baseUrl}/api/v1/ui/stream`;
    
    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    const connectSSE = () => {
      if (!isSubscribed) return;
      
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data || data.type === "CONNECTED" || data.type === "PING") return;

            const action = data.action;
            const payload = data.payload || {};

            if (action === "NAVIGATE") {
              if (payload.path) {
                const toastId = `toast-${Date.now()}`;
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
              const toastId = `toast-${Date.now()}`;
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
          } catch (err) {
            // Ignore frame parse errors
          }
        };

        eventSource.onerror = () => {
          // EventSource automatically reconnects; close current instance to prevent duplicate handlers
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Silent reconnect after 3 seconds
          setTimeout(() => {
            if (isSubscribed) connectSSE();
          }, 3000);
        };
      } catch (e) {
        // Quiet fallback
      }
    };

    connectSSE();

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
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
