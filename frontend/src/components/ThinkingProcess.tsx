"use client";

import React, { useMemo } from "react";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
  ChainOfThoughtImage,
} from "@/components/ai-elements/chain-of-thought";
import { Image } from "@/components/ai-elements/image";
import {
  Brain,
  SearchIcon,
  ImageIcon,
  Terminal,
  Cpu,
  ShieldCheck,
  Globe,
  Database,
  CheckCircle2,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface ParsedStepItem {
  id: string | number;
  label: string;
  description?: string;
  icon?: LucideIcon;
  status: "pending" | "active" | "complete" | "error";
  urls?: string[];
  image?: {
    src: string;
    caption?: string;
  };
  duration?: string | number;
}

export interface ThinkingProcessProps {
  /**
   * Raw text of thoughts or markdown reasoning
   */
  thoughtContent?: string;
  /**
   * Array of individual thought/reasoning steps if available
   */
  steps?: (string | ParsedStepItem)[];
  /**
   * Title displayed in the thinking bar (e.g. "Personal Assistant is Reasoning", "Thought Process")
   */
  title?: string;
  /**
   * Dynamic status message when thinking (e.g. "Analyzing mandate and evaluating tools...")
   */
  statusMessage?: string;
  /**
   * LLM model name that generated this thought trace
   */
  model?: string;
  /**
   * Duration in seconds or formatted string (e.g. "Thought for 4.2s")
   */
  duration?: string | number;
  /**
   * Whether the AI worker is actively thinking right now
   */
  isThinking?: boolean;
  /**
   * Initial expanded state
   */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Extracts <thought>...</thought>, <think>...</think>, <reasoning>...</reasoning>,
 * or Markdown style reasoning headers from text, returning the thought portion and clean final answer.
 */
export function extractThoughts(rawText: string): {
  thoughts: string | null;
  cleanContent: string;
  steps?: string[];
} {
  if (!rawText) return { thoughts: null, cleanContent: "", steps: [] };

  // Match XML/HTML style tags: <thought>, <think>, <reasoning>, <reason>, <thought_process>, <cognitive_trace>
  const thoughtTagRegex =
    /<(thought|think|reasoning|reason|thought_process|cognitive_trace)>([\s\S]*?)<\/\1>/gi;
  const matches: string[] = [];
  let clean = rawText;

  let match: RegExpExecArray | null;
  while ((match = thoughtTagRegex.exec(rawText)) !== null) {
    if (match[2] && match[2].trim()) {
      matches.push(match[2].trim());
    }
  }

  if (matches.length > 0) {
    clean = rawText.replace(thoughtTagRegex, "").trim();
    const combinedThoughts = matches.join("\n\n");
    // Parse individual numbered or bulleted step chunks
    const stepChunks = combinedThoughts
      .split(/(?=(?:^\s*\d+[\.\)]|\n\s*\d+[\.\)]|\n\s*•|\n\s*-\s*|\n\s*###))/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return {
      thoughts: combinedThoughts,
      cleanContent: clean,
      steps: stepChunks.length > 1 ? stepChunks : undefined,
    };
  }

  // Match Markdown style: ### Thought Process ... ### Final Deliverables / Answer
  const mdThoughtRegex =
    /(?:###\s*(?:Thought Process|Internal Reasoning|Analysis & Strategy|Reasoning Trace|Agent Reasoning|Cognitive Trace)\s*\n)([\s\S]*?)(?=(?:\n###\s*|\n##\s*|$))/i;
  const mdMatch = rawText.match(mdThoughtRegex);
  if (mdMatch && mdMatch[1].trim()) {
    const thoughts = mdMatch[1].trim();
    const cleanContent = rawText.replace(mdThoughtRegex, "").trim();
    const stepChunks = thoughts
      .split(/(?=(?:^\s*\d+[\.\)]|\n\s*\d+[\.\)]|\n\s*•|\n\s*-\s*|\n\s*###))/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return {
      thoughts,
      cleanContent,
      steps: stepChunks.length > 1 ? stepChunks : undefined,
    };
  }

  return { thoughts: null, cleanContent: rawText, steps: [] };
}

/**
 * Parses raw text step or string into a structured Step item with detected icons, search URLs, images, and tool acts.
 */
function parseStepString(raw: string, index: number, isLast: boolean, isThinking: boolean): ParsedStepItem {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || `Step ${index + 1}`;
  const description = lines.length > 1 ? lines.slice(1).join("\n") : undefined;

  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s\)\],]+)/gi;
  const foundUrls: string[] = [];
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(raw)) !== null) {
    if (urlMatch[1]) {
      foundUrls.push(urlMatch[1]);
    }
  }

  // Detect Image markdown: ![caption](url)
  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+|data:image\/[^;]+;base64,[^\s\)]+)\)/i;
  const imgMatch = raw.match(imageRegex);
  let parsedImage: { src: string; caption?: string } | undefined = undefined;
  if (imgMatch) {
    parsedImage = {
      caption: imgMatch[1] || "Generated image",
      src: imgMatch[2],
    };
  }

  // Choose appropriate icon
  const lower = raw.toLowerCase();
  let stepIcon: LucideIcon = Cpu;

  if (lower.includes("search") || lower.includes("find") || lower.includes("lookup") || foundUrls.length > 0) {
    stepIcon = SearchIcon;
  } else if (lower.includes("image") || lower.includes("photo") || lower.includes("visual") || parsedImage) {
    stepIcon = ImageIcon;
  } else if (lower.includes("terminal") || lower.includes("code") || lower.includes("git") || lower.includes("sandbox") || lower.includes("tool")) {
    stepIcon = Terminal;
  } else if (lower.includes("memory") || lower.includes("database") || lower.includes("ledger") || lower.includes("vault")) {
    stepIcon = Database;
  } else if (lower.includes("maker-checker") || lower.includes("governance") || lower.includes("verify") || lower.includes("audit") || lower.includes("policy")) {
    stepIcon = ShieldCheck;
  } else if (lower.includes("mandate") || lower.includes("scope") || lower.includes("objective")) {
    stepIcon = Brain;
  }

  const status: "pending" | "active" | "complete" = isThinking
    ? isLast
      ? "active"
      : "complete"
    : "complete";

  return {
    id: index,
    label: firstLine.replace(/^[\d\.\)\-\•\#\*\s]+/, "").trim() || firstLine,
    description: description,
    icon: stepIcon,
    status: status,
    urls: foundUrls.length > 0 ? Array.from(new Set(foundUrls)) : undefined,
    image: parsedImage,
  };
}

export function ThinkingProcess({
  thoughtContent,
  steps,
  title = "Thought Process",
  statusMessage,
  model,
  duration,
  isThinking = false,
  defaultExpanded = false,
  className = "",
}: ThinkingProcessProps) {
  // If there's no thoughts and not currently thinking, render nothing
  if (!thoughtContent && (!steps || steps.length === 0) && !isThinking) {
    return null;
  }

  // Process structured steps
  const processedSteps: ParsedStepItem[] = useMemo(() => {
    if (steps && steps.length > 0) {
      return steps.map((s, idx) => {
        if (typeof s === "string") {
          return parseStepString(s, idx, idx === steps.length - 1, isThinking);
        }
        return s;
      });
    }

    if (thoughtContent) {
      const chunks = thoughtContent
        .split(/(?=(?:^\s*\d+[\.\)]|\n\s*\d+[\.\)]|\n\s*•|\n\s*-\s*|\n\s*###))/m)
        .map((c) => c.trim())
        .filter(Boolean);

      if (chunks.length > 1) {
        return chunks.map((c, idx) =>
          parseStepString(c, idx, idx === chunks.length - 1, isThinking)
        );
      }
    }

    if (isThinking) {
      return [
        {
          id: "active-stream",
          label: statusMessage || "Active Cognitive Reasoning Stream...",
          description: "AI Worker is actively formulating reasoning, evaluating tools, and generating real-time deliverables...",
          icon: Brain,
          status: "active",
        },
      ];
    }

    return [];
  }, [steps, thoughtContent, isThinking, statusMessage]);

  const copyText = useMemo(() => {
    if (thoughtContent) return thoughtContent;
    if (steps && steps.length > 0) {
      return steps
        .map((s) => (typeof s === "string" ? s : `${s.label}\n${s.description || ""}`))
        .join("\n\n");
    }
    return statusMessage || title;
  }, [thoughtContent, steps, statusMessage, title]);

  return (
    <ChainOfThought
      defaultOpen={defaultExpanded || isThinking}
      status={isThinking ? "active" : "complete"}
      className={className}
    >
      <ChainOfThoughtHeader
        title={isThinking ? (title.includes("is Reasoning") ? title : `${title}`) : title}
        model={model}
        duration={duration}
        copyContent={copyText}
      />

      <ChainOfThoughtContent>
        {processedSteps.length > 0 ? (
          processedSteps.map((step, idx) => (
            <ChainOfThoughtStep
              key={step.id || idx}
              label={step.label}
              description={step.description}
              icon={step.icon}
              status={step.status}
              duration={step.duration}
            >
              {/* Search Results */}
              {step.urls && step.urls.length > 0 && (
                <ChainOfThoughtSearchResults>
                  {step.urls.map((url) => {
                    let hostname = url;
                    try {
                      hostname = new URL(url).hostname;
                    } catch {
                      // fallback
                    }
                    return (
                      <ChainOfThoughtSearchResult key={url} url={url}>
                        {hostname}
                      </ChainOfThoughtSearchResult>
                    );
                  })}
                </ChainOfThoughtSearchResults>
              )}

              {/* Step Image */}
              {step.image && (
                <ChainOfThoughtImage caption={step.image.caption}>
                  <Image
                    src={step.image.src}
                    alt={step.image.caption || "Deliverable"}
                    className="max-h-48 w-auto rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                </ChainOfThoughtImage>
              )}
            </ChainOfThoughtStep>
          ))
        ) : thoughtContent ? (
          <ChainOfThoughtStep
            label="Internal Reasoning & Execution Analysis"
            icon={Brain}
            status="complete"
          >
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-50/70 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[350px] overflow-y-auto select-text">
              {thoughtContent}
            </div>
          </ChainOfThoughtStep>
        ) : null}
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
