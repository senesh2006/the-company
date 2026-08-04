"use client";

import { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown formatter for agent output.
 * Converts markdown tables, ASCII tables, bold, italic, code blocks, and lists
 * into clean HTML so the output does not render as raw ASCII art.
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

  // Process pipe-delimited table blocks line by line.
  processed = convertPipeTableBlocks(processed);

  // Convert simple ASCII tables (lines with at least 3 columns separated by 2+ spaces).
  // Avoid lines that already contain pipes (handled above) or that look like single sentences.
  processed = processed.replace(
    /((?:^\s*\S+(?:\s{2,}\S+){2,}\s*$(?:\n?))+)/gm,
    (block: string) => {
      if (block.includes("|")) return block;
      return convertAsciiTable(block);
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

function isPipeTableLine(line: string): boolean {
  const trimmed = line.trim();
  // Detect any line with 2+ pipe delimiters that yields at least 2 non-empty cells.
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  if (pipeCount < 2) return false;
  const cells = splitPipeCells(trimmed);
  return cells.filter((c) => c.trim() !== "").length >= 2;
}

function isSeparatorLine(line: string): boolean {
  const cells = splitPipeCells(line);
  return cells.length > 0 && cells.every((c) => /^[-:\s|]+$/.test(c.trim()));
}

function splitPipeCells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isEmptyRow(row: string[]): boolean {
  return row.length === 0 || row.every((c) => c.trim() === "");
}

function convertPipeTableBlocks(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isPipeTableLine(line)) {
      // Gather the whole table block (consecutive table-like lines).
      const blockLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && isPipeTableLine(lines[j])) {
        blockLines.push(lines[j]);
        j++;
      }

      // Convert even single-row pipe tables so clean rows like "A | B | C" render nicely.
      if (blockLines.length >= 1) {
        const tableHtml = convertPipeTableBlock(blockLines);
        result.push(tableHtml);
        i = j;
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

function convertPipeTableBlock(lines: string[]): string {
  const rows = lines.map(splitPipeCells);
  const maxCols = Math.max(...rows.map((r) => r.length));

  if (maxCols < 2) return lines.join("\n");

  let headers: string[];
  let body: string[][];

  if (rows.length > 1 && isSeparatorLine(lines[1])) {
    headers = rows[0].map((c) => c.trim());
    body = rows.slice(2).filter((r) => !isEmptyRow(r));
  } else {
    // For a single-row block without a header separator, use generic column headers.
    headers = rows[0].map((c) => c.trim());
    body = rows.slice(1).filter((r) => !isEmptyRow(r));
    if (body.length === 0) {
      // Single data row: turn the row itself into the body and use generic headers.
      headers = Array.from({ length: maxCols }, (_, idx) => `Col ${idx + 1}`);
      body = [rows[0].map((c) => c.trim())];
    }
  }

  while (headers.length < maxCols) headers.push("");
  body = body.map((r) => {
    const padded = [...r];
    while (padded.length < maxCols) padded.push("");
    return padded.slice(0, maxCols);
  });

  return buildTableHtml(headers, body);
}

function convertAsciiTable(block: string): string {
  const lines = block.trim().split("\n").map((l) => l.trim()).filter((l) => l);
  if (lines.length < 2) return block;

  const rows = lines.map((line) => line.split(/\s{2,}/).map((c) => c.trim()).filter((c) => c !== ""));
  if (rows.some((r) => r.length < 2)) return block;

  const maxCols = Math.max(...rows.map((r) => r.length));
  const headers = rows[0].map((c) => c.trim());
  const body = rows.slice(1).filter((r) => !isEmptyRow(r));

  while (headers.length < maxCols) headers.push("");
  const paddedBody = body.map((r) => {
    const padded = [...r];
    while (padded.length < maxCols) padded.push("");
    return padded.slice(0, maxCols);
  });

  return buildTableHtml(headers, paddedBody);
}

function buildTableHtml(headers: string[], body: string[][]): string {
  const cellClass = "px-2 py-1.5 text-[11px] text-slate-700 border-b border-slate-100 align-top whitespace-normal break-all min-w-0";
  const headerClass = "px-2 py-1.5 text-left text-[10px] font-bold text-slate-600 border-b border-slate-200 align-top whitespace-normal break-all min-w-0";

  const headerHtml = `<thead class="bg-slate-50"><tr>${headers
    .map((h) => `<th class="${headerClass}">${h}</th>`)
    .join("")}</tr></thead>`;

  const bodyHtml = `<tbody>${body
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td class="${cellClass}">${cell}</td>`)
          .join("")}</tr>`
    )
    .join("")}</tbody>`;

  return `
    <div class="overflow-x-auto rounded-xl border border-slate-200 my-3">
      <table class="w-full text-left border-collapse table-auto">
        ${headerHtml}
        ${bodyHtml}
      </table>
    </div>
  `;
}
