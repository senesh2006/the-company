"use client";

import React, { useState } from "react";
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
  LayoutGrid,
  Globe
} from "lucide-react";
import { useSheetsConfig } from "@/lib/queries";
import { CompanyOSSpreadsheet } from "./CompanyOSSpreadsheet";

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
  const [viewMode, setViewMode] = useState<"builtin" | "external">("builtin");
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const rawUrl = customSpreadsheetUrl || sheetsConfig?.spreadsheet_url || "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit";
  const title = customTitle || sheetsConfig?.spreadsheet_title || "Master Financials";

  // Extract spreadsheet ID to construct clean embed URL
  const match = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = match ? match[1] : null;
  const embedUrl = spreadsheetId 
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview?embedded=true` 
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
          className={`fixed z-[70] shadow-2xl rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded
              ? "inset-4 md:inset-8 w-auto h-auto max-w-none max-h-none"
              : "bottom-20 right-4 md:right-[400px] w-[95vw] md:w-[720px] h-[580px] max-h-[calc(100vh-120px)]"
          }`}
        >
          {/* Header Bar */}
          <div className="px-3.5 py-2.5 bg-slate-950 text-white flex items-center justify-between shrink-0 select-none border-b border-slate-800">
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
                <p className="text-[10px] text-slate-400 truncate">Financial Workspace</p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setViewMode("builtin")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                  viewMode === "builtin"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Built-in Workspace</span>
              </button>

              <button
                onClick={() => setViewMode("external")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                  viewMode === "external"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Google Embed</span>
              </button>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyLink}
                title="Copy Google Sheets URL"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <a
                href={rawUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in Google Sheets (New Tab)"
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

          {/* Main Body */}
          <div className="flex-1 w-full bg-slate-950 relative overflow-hidden flex flex-col">
            {viewMode === "builtin" ? (
              <CompanyOSSpreadsheet
                customTitle={title}
                onOpenExternal={() => setViewMode("external")}
              />
            ) : (
              <div className="flex-1 w-full h-full flex flex-col">
                <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Google Docs iframe preview. Sign in if prompted.</span>
                  <div className="flex items-center gap-2">
                    <button onClick={handleReload} className="text-emerald-400 hover:underline flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Reload</span>
                    </button>
                    <a href={rawUrl} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      <span>Open in Full Screen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <iframe
                  key={iframeKey}
                  src={embedUrl}
                  title="Google Sheet Embedded Preview"
                  className="w-full flex-1 border-0"
                  allow="clipboard-read; clipboard-write"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

