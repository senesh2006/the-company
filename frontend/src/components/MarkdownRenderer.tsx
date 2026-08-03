"use client";

import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown formatter for agent output.
 * Converts markdown tables, bold, italic, code blocks, and lists to clean HTML
 * so the output does not render as raw ASCII art.
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const html = useMemo(() => formatMarkdown(content), [content]);

  return (
    <div
      className={`prose prose-sm max-w-none prose-slate ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMarkdown(content: string): string {
  if (!content) return "";

  // Preserve code blocks before processing other markdown.
  const codeBlocks: { placeholder: string; html: string }[] = [];
  let processed = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({
      placeholder,
      html: `<pre class="rounded-xl bg-slate-900 text-slate-100 p-3 overflow-x-auto text-[11px] font-mono"><code>${escapeHtml(code)}</code></pre>`,
    });
    return placeholder;
  });

  // Inline code.
  processed = processed.replace(/`([^`]+)`/g, "<code class=\"px-1 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono\">$1</code>");

  // Bold / italic.
  processed = processed
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

  // Convert markdown tables to HTML tables.
  processed = processed.replace(
    /(?:\|(.+?)\|\n\|(?:[-:\|\s]+?)\|\n)((?:\|.+?\|\n?)+)/g,
    (match, headerRow, bodyRows) => {
      const headers = headerRow
        .split("|")
        .map((h: string) => h.trim())
        .filter(Boolean);
      const rows = bodyRows
        .trim()
        .split("\n")
        .map((line: string) =>
          line
            .split("|")
            .map((cell: string) => cell.trim())
            .filter(Boolean)
        )
        .filter((row: string[]) => row.length > 0);

      const headerHtml = `<thead class="bg-slate-100"><tr>${headers
        .map((h: string) => `<th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 border-b border-slate-200">${h}</th>`)
        .join("")}</tr></thead>`;
      const bodyHtml = `<tbody>${rows
        .map(
          (row: string[]) =>
            `<tr>${row
              .map((cell: string) => `<td class="px-3 py-2 text-[11px] text-slate-700 border-b border-slate-100">${cell}</td>`)
              .join("")}</tr>`
        )
        .join("")}</tbody>`;
      return `<div class="overflow-x-auto rounded-xl border border-slate-200 my-3"><table class="w-full text-left border-collapse">${headerHtml}${bodyHtml}</table></div>`;
    }
  );

  // Convert simple ASCII tables (lines with at least 3 columns separated by 2+ spaces).
  processed = processed.replace(
    /((?:^\s*\S+(?:\s{2,}\S+)+\s*$\n?)+)/gm,
    (block: string) => {
      const lines = block.trim().split("\n").filter((l) => l.trim());
      if (lines.length < 2) return block;

      const rows = lines.map((line) => line.trim().split(/\s{2,}/).filter(Boolean));
      if (rows.some((r) => r.length < 2)) return block;

      // Treat first line as header if it looks like headers (no numbers or differs from rest).
      const hasNumericRow = rows.some((r) => r.some((c) => /^[\$\d,.-]+$/.test(c)));
      const header = hasNumericRow ? rows[0] : rows[0];
      const body = hasNumericRow ? rows.slice(1) : rows;

      const headerHtml = `<thead class="bg-slate-100"><tr>${header
        .map((h: string) => `<th class="px-3 py-2 text-left text-[10px] font-bold text-slate-600 border-b border-slate-200">${h}</th>`)
        .join("")}</tr></thead>`;
      const bodyHtml = `<tbody>${body
        .map(
          (row: string[]) =>
            `<tr>${row
              .map((cell: string) => `<td class="px-3 py-2 text-[11px] text-slate-700 border-b border-slate-100">${cell}</td>`)
              .join("")}</tr>`
        )
        .join("")}</tbody>`;
      return `<div class="overflow-x-auto rounded-xl border border-slate-200 my-3"><table class="w-full text-left border-collapse">${headerHtml}${bodyHtml}</table></div>`;
    }
  );

  // Headings.
  processed = processed
    .replace(/^######\s*(.+)$/gm, "<h6 class=\"text-[11px] font-bold text-slate-800 mt-3 mb-1\">$1</h6>")
    .replace(/^#####\s*(.+)$/gm, "<h5 class=\"text-xs font-bold text-slate-800 mt-3 mb-1\">$1</h5>")
    .replace(/^####\s*(.+)$/gm, "<h4 class=\"text-xs font-bold text-slate-800 mt-3 mb-1\">$1</h4>")
    .replace(/^###\s*(.+)$/gm, "<h3 class=\"text-sm font-bold text-slate-800 mt-4 mb-2\">$1</h3>")
    .replace(/^##\s*(.+)$/gm, "<h2 class=\"text-sm font-bold text-slate-800 mt-4 mb-2\">$1</h2>")
    .replace(/^#\s*(.+)$/gm, "<h1 class=\"text-base font-bold text-slate-800 mt-4 mb-2\">$1</h1>");

  // Bullet lists.
  processed = processed.replace(/(?:^\s*[-*]\s+.+\n?)+/gm, (listBlock: string) => {
    const items = listBlock
      .trim()
      .split("\n")
      .map((line) => line.replace(/^\s*[-*]\s+/, ""))
      .map((line) => `<li class="ml-4 text-[11px] text-slate-700 leading-relaxed">${line}</li>`)
      .join("");
    return `<ul class="list-disc space-y-1 my-2">${items}</ul>`;
  });

  // Numbered lists.
  processed = processed.replace(/(?:^\s*\d+\.\s+.+\n?)+/gm, (listBlock: string) => {
    const items = listBlock
      .trim()
      .split("\n")
      .map((line) => line.replace(/^\s*\d+\.\s+/, ""))
      .map((line) => `<li class="ml-4 text-[11px] text-slate-700 leading-relaxed">${line}</li>`)
      .join("");
    return `<ol class="list-decimal space-y-1 my-2">${items}</ol>`;
  });

  // Blockquotes.
  processed = processed.replace(/^>\s*(.+)$/gm, "<blockquote class=\"border-l-2 border-emerald-400 pl-3 italic text-[11px] text-slate-600 my-2\">$1</blockquote>");

  // Horizontal rules.
  processed = processed.replace(/^---+$/gm, "<hr class=\"border-slate-200 my-3\" />");

  // Paragraphs - split by double newlines.
  const paragraphs = processed.split(/\n\n+/).map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return trimmed;
    return `<p class="text-[11px] text-slate-700 leading-relaxed mb-2">${trimmed.replace(/\n/g, "<br />")}</p>`;
  });

  processed = paragraphs.join("");

  // Restore code blocks.
  codeBlocks.forEach(({ placeholder, html }) => {
    processed = processed.replace(placeholder, html);
  });

  return processed;
}
