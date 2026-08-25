"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Sparkles, Loader2, ChevronDown, FileSpreadsheet, ExternalLink, Square, Pencil, RotateCcw } from "lucide-react";
import { useCreateTask, useSheetsConfig } from "@/lib/queries";
import { api } from "@/lib/api";
import { AssistantAvatar } from "@/components/ui/AssistantAvatar";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MilestoneMap, MilestoneItem } from "@/components/MilestoneMap";
import { GoogleSheetMiniWindow } from "@/components/finance/GoogleSheetMiniWindow";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  milestones?: MilestoneItem[];
  progress?: number;
  isStopped?: boolean;
}

export function PersonalAssistantBlob() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSheetWindowOpen, setIsSheetWindowOpen] = useState(false);
  const [sheetWindowUrl, setSheetWindowUrl] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const isCancelledRef = useRef<boolean>(false);
  const { data: sheetsConfig } = useSheetsConfig();
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

  const handleEditPrompt = (promptText: string) => {
    setInput(promptText);
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = promptText.length;
          inputRef.current.selectionEnd = promptText.length;
        }
      }, 50);
    }
  };

  const handleStopAgent = async () => {
    isCancelledRef.current = true;
    setIsLoading(false);
    
    if (activeTaskId) {
      try {
        await api.cancelTask(activeTaskId);
      } catch (e) {
        console.error("Error cancelling task:", e);
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `stop-${Date.now()}`,
        role: "assistant",
        content: "⏹️ **Agent execution stopped by user.** You can click **Edit Prompt** below to modify your directive or submit a new instruction.",
        timestamp: new Date(),
        isStopped: true,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      handleStopAgent();
      return;
    }
    if (!input.trim()) return;

    const taskText = input.trim();
    setLastUserPrompt(taskText);
    setInput("");
    setIsLoading(true);
    isCancelledRef.current = false;
    setActiveTaskId(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: taskText,
      timestamp: new Date(),
    };

    const assistantMsgId = `assistant-${Date.now()}`;

    // Check if user specifically requested to open or preview the Google Sheet
    const lowerText = taskText.toLowerCase();
    const isDirectSheetRequest = 
      lowerText.includes("open the google sheet") ||
      lowerText.includes("open sheet") ||
      lowerText.includes("show sheet") ||
      lowerText.includes("preview sheet") ||
      lowerText.includes("view sheet") ||
      lowerText.includes("sheet window") ||
      lowerText.includes("google sheet window");

    if (isDirectSheetRequest) {
      setIsSheetWindowOpen(true);
    }

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

      if (isCancelledRef.current) return;

      // Case 1: Pure Conversational Reply
      if (res.type === "chat_reply" || !res.is_task) {
        // If the reply contains a sheet link or user asked for sheets, ensure sheet window is prepared
        if (res.reply && res.reply.includes("docs.google.com/spreadsheets")) {
          const match = res.reply.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+[^\s\)]*/);
          if (match) {
            setSheetWindowUrl(match[0]);
          }
        }

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
      if (taskId) {
        setActiveTaskId(taskId);
      }
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
        if (isCancelledRef.current) {
          break;
        }

        await new Promise((r) => setTimeout(r, 2000));
        if (isCancelledRef.current) break;
        attempts++;

        try {
          const updatedTask: any = await api.getTaskById(taskId);
          if (isCancelledRef.current) break;

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

              if (finalResult.includes("docs.google.com/spreadsheets")) {
                const match = finalResult.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+[^\s\)]*/);
                if (match) {
                  setSheetWindowUrl(match[0]);
                }
              }

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
      if (!isCancelledRef.current) {
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
      }
    } finally {
      setIsLoading(false);
      setActiveTaskId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Helper to extract spreadsheet link from text
  const extractSheetUrl = (text: string): string | null => {
    const match = text.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+[^\s\)]*/);
    return match ? match[0] : null;
  };

  return (
    <>
      {/* Live Google Sheet Mini Window */}
      <GoogleSheetMiniWindow
        isOpen={isSheetWindowOpen}
        onClose={() => setIsSheetWindowOpen(false)}
        customSpreadsheetUrl={sheetWindowUrl || sheetsConfig?.spreadsheet_url}
        customTitle={sheetsConfig?.spreadsheet_title || "Google Sheets Ledger"}
      />

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

              <div className="flex items-center gap-1.5">
                {isLoading && (
                  <button
                    onClick={handleStopAgent}
                    title="Stop current agent operation"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-bold shadow-xs transition cursor-pointer active:scale-95 animate-pulse"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50" style={{ minHeight: 200 }}>
              {messages.map((msg) => {
                const sheetUrl = msg.role === "assistant" ? extractSheetUrl(msg.content) : null;
                const hasSheetMention = msg.role === "assistant" && (sheetUrl || msg.content.toLowerCase().includes("google sheet"));

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`${
                        msg.role === "user"
                          ? "max-w-[85%] bg-emerald-600 text-white rounded-br-lg"
                          : msg.milestones && msg.milestones.length > 0
                          ? "w-full max-w-[98%] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-lg shadow-sm"
                          : "max-w-[85%] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-lg shadow-sm"
                      } px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed min-w-0 group relative`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="space-y-3">
                          {msg.milestones && msg.milestones.length > 0 && (
                            <div className="mb-2">
                              <MilestoneMap milestones={msg.milestones} progress={msg.progress} compact={false} />
                            </div>
                          )}
                          <MarkdownRenderer content={msg.content} />

                          {/* Quick Action: Open Mini Window */}
                          {hasSheetMention && (
                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (sheetUrl) setSheetWindowUrl(sheetUrl);
                                  setIsSheetWindowOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold transition shadow-2xs cursor-pointer active:scale-95"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>📊 Open in Mini Window</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span>{msg.content}</span>
                          <button
                            type="button"
                            onClick={() => handleEditPrompt(msg.content)}
                            className="self-end inline-flex items-center gap-1 text-[10px] text-emerald-200 hover:text-white font-semibold transition opacity-80 hover:opacity-100 cursor-pointer pt-0.5"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                            <span>Edit prompt</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Agent working on mandate...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopAgent}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition cursor-pointer active:scale-95"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Edit Last Prompt Chip */}
            {lastUserPrompt && !isLoading && (
              <div className="px-4 py-1.5 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate flex-1">
                  Last: <span className="italic font-normal text-slate-700 dark:text-slate-300">&ldquo;{lastUserPrompt.slice(0, 38)}{lastUserPrompt.length > 38 ? "..." : ""}&rdquo;</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleEditPrompt(lastUserPrompt)}
                  className="shrink-0 inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Prompt</span>
                </button>
              </div>
            )}

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
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopAgent}
                  title="Stop agent execution"
                  className="shrink-0 w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
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
