"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useCreateTask } from "@/lib/queries";
import { api } from "@/lib/api";
import { AssistantAvatar } from "@/components/ui/AssistantAvatar";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MilestoneMap, MilestoneItem } from "@/components/MilestoneMap";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  milestones?: MilestoneItem[];
  progress?: number;
}

export function PersonalAssistantBlob() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your Personal Assistant. Tell me what you need and I'll delegate it to the right team members.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const createTask = useCreateTask();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) setPulseActive(false);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const taskText = input.trim();
    setInput("");
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;

    // Prepare previous history
    const historyPayload = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await api.assistantChat({
        message: taskText,
        history: historyPayload,
      });

      // Case 1: Pure Conversational Reply
      if (res.type === "chat_reply" || !res.is_task) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: res.reply || "I'm on it! Let me know if you need anything else.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Case 2: Actionable Task Dispatched
      const taskId = res.task_id;
      const initialAck = res.reply || `🤖 *Coordinating mandate with ${res.assignee_role || "specialist team"}...*`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: initialAck,
          timestamp: new Date(),
        },
      ]);

      if (!taskId || taskId === "undefined" || taskId === "null") {
        return;
      }

      // Poll task until supervisor finishes executive synthesis
      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // Up to 2 minutes

      while (!completed && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        try {
          const updatedTask: any = await api.getTaskById(taskId);
          if (updatedTask) {
            const ms = updatedTask.milestones;
            const prog = updatedTask.progress;

            if (updatedTask.status === "completed" || updatedTask.status === "failed") {
              completed = true;
              const finalResult =
                updatedTask.result ||
                (updatedTask.status === "completed"
                  ? "✅ Mandate successfully completed by your team."
                  : "❌ Mandate execution encountered an issue.");

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: finalResult, milestones: ms, progress: 100 }
                    : msg
                )
              );
              break;
            } else {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, milestones: ms, progress: prog }
                    : msg
                )
              );
            }
          }
        } catch {
          // Continue polling
        }
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Something went wrong: ${err.message || "Unable to reach assistant"}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.some((m) => m.id === assistantMsgId)
          ? prev.map((m) => (m.id === assistantMsgId ? errorMessage : m))
          : [...prev, errorMessage]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-[60] w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
            style={{ maxHeight: "min(560px, calc(100vh - 160px))" }}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center border border-white/30 overflow-hidden shrink-0">
                  <AssistantAvatar className="w-full h-full scale-[1.35]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Personal Assistant</h3>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    Online • Ready to coordinate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white dark:bg-slate-900/20 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50" style={{ minHeight: 200 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`${
                      msg.role === "user"
                        ? "max-w-[85%] bg-emerald-600 text-white rounded-br-lg"
                        : msg.milestones && msg.milestones.length > 0
                        ? "w-full max-w-[98%] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-lg shadow-sm"
                        : "max-w-[85%] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-lg shadow-sm"
                    } px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed min-w-0`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-3">
                        {msg.milestones && msg.milestones.length > 0 && (
                          <div className="mb-2">
                            <MilestoneMap milestones={msg.milestones} progress={msg.progress} compact={false} />
                          </div>
                        )}
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Dispatching to team...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-end gap-2 shrink-0"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you need..."
                rows={1}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 resize-none font-medium max-h-20"
                style={{ minHeight: 38 }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0 w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Blob Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] cursor-pointer group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Pulse rings */}
        {pulseActive && !isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
            <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse" />
          </>
        )}

        {/* Main blob */}
        <div
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isOpen
              ? "bg-slate-800 shadow-slate-300"
              : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-300/50 hover:shadow-emerald-400/60 hover:shadow-xl"
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="bot"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full p-1"
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                   <AssistantAvatar className="w-full h-full scale-[1.25]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </>
  );
}
