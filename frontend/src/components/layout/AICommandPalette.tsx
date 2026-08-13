"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Send, Bot, RefreshCw, X, Zap, Command } from "lucide-react";
import { useDispatchDepartmentDirective } from "@/lib/queries";

export function AICommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [targetDept, setTargetDept] = useState("finance");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const dispatchMutation = useDispatchDepartmentDirective();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      await dispatchMutation.mutateAsync({
        deptId: targetDept,
        directive: prompt,
        priority: "high"
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setPrompt("");
      }, 1200);
    } catch (err) {
      console.error("Failed to execute command", err);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 font-sans text-slate-800 dark:text-slate-200 relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-5 top-5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:text-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Command className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    AI Master Control Palette
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">
                      ⌘K / Ctrl+K
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Issue natural language directives to steer your AI workforce and web app.
                  </p>
                </div>
              </div>

              {isSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <Sparkles className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Directive Executing Autonomously!</h4>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>Target Department:</span>
                      <div className="flex items-center gap-1">
                        {["finance", "marketing", "engineering", "operations"].map(dept => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => setTargetDept(dept)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition capitalize ${
                              targetDept === dept
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder={`e.g. "Audit trial balance, hire a QA tester, and navigate me to engineering..."`}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono">ESC</kbd> to exit</span>
                    <button
                      type="submit"
                      disabled={dispatchMutation.isPending || !prompt.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition active:scale-95"
                    >
                      {dispatchMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Execute Command</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
