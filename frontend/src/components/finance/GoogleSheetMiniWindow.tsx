"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Sparkles,
  Link2
} from "lucide-react";
import { useSheetsConfig } from "@/lib/queries";

interface GoogleSheetMiniWindowProps {
  isOpen: boolean;
  onClose: () => void;
  customSpreadsheetUrl?: string;
  customTitle?: string;
}

export function GoogleSheetMiniWindow({
  isOpen,
  onClose,
  customSpreadsheetUrl,
  customTitle
}: GoogleSheetMiniWindowProps) {
  const { data: sheetsConfig } = useSheetsConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const rawUrl = customSpreadsheetUrl || sheetsConfig?.spreadsheet_url || "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit";
  const title = customTitle || sheetsConfig?.spreadsheet_title || "Google Sheets Ledger";

  // Extract spreadsheet ID to construct clean embed URL
  const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match ? match[1] : null;
  const embedUrl = spreadsheetId 
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&widget=true&headers=false` 
    : rawUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rawUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`fixed z-[70] shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded
              ? "inset-6 md:inset-12 w-auto h-auto max-w-none max-h-none"
              : "bottom-24 right-6 md:right-[420px] w-[95vw] md:w-[560px] h-[520px] max-h-[calc(100vh-140px)]"
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 select-none border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold truncate text-slate-100">{title}</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Embedded Preview</p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleReload}
                title="Reload Sheet"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleCopyLink}
                title="Copy Sheet URL"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in Full Google Docs Tab"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse Window" : "Expand Window"}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onClose}
                title="Close Window"
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice Bar */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="truncate">
              Editing live in Google Sheets. Changes sync autonomously with Company OS.
            </span>
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0 ml-2 flex items-center gap-1"
            >
              <span>Full Screen</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Embed iframe */}
          <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            <iframe
              key={iframeKey}
              src={embedUrl}
              title="Google Sheet Embedded Preview"
              className="w-full h-full border-0"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
