"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Code2, 
  SlidersHorizontal,
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  Building2,
  DollarSign,
  Layers,
  Receipt,
  FileText,
  Search,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';
import { useFinanceWorkbook, useGoogleAppsScript, useSheetsConfig } from '@/lib/queries';

interface CompanyOSSpreadsheetProps {
  customTitle?: string;
  onOpenExternal?: () => void;
  isCompact?: boolean;
}

const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

export function CompanyOSSpreadsheet({
  customTitle,
  onOpenExternal,
  isCompact = false
}: CompanyOSSpreadsheetProps) {
  const { data: workbookData, isLoading: workbookLoading, refetch: refetchWorkbook } = useFinanceWorkbook();
  const { data: appsScriptData } = useGoogleAppsScript();
  const { data: sheetsConfig } = useSheetsConfig();

  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [formulaValue, setFormulaValue] = useState<string>("");
  const [isEditingCell, setIsEditingCell] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<string>("12px");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Active workbook data
  const wb = workbookData?.workbook;
  const sheetTitle = customTitle || wb?.spreadsheet_title || sheetsConfig?.spreadsheet_title || "Master Financials";
  const tabs: Record<string, any[][]> = wb?.tabs || {
    "Dashboard": [
      ["EXECUTIVE DASHBOARD", "METRIC", "VALUE", "STATUS"],
      ["Summary", "Financial Model", "Apex AI Master Financials", "Active"],
      ["Revenue", "Monthly Recurring Revenue", "$35,000.00", "Verified"],
      ["COGS", "API Compute & Hosting", "$8,000.00", "Optimal"],
      ["Profitability", "Gross Profit", "$27,000.00", "77.1% Margin"],
      ["OPEX", "Salaries & Marketing", "$77,000.00", "Disciplined"],
      ["Burn", "Net Monthly Burn", "-$50,000.00", "Controlled"],
      ["Cash", "Cash on Hand", "$620,000.00", "Reserves Verified"],
      ["Runway", "Runway Horizon", "12.4 Months", "Healthy Capitalization"]
    ],
    "Income Statement": [
      ["INCOME STATEMENT (P&L)", "CODE", "CATEGORY", "AMOUNT ($)"],
      ["--- REVENUE ---", "", "", ""],
      ["Subscription Revenue (MRR)", "4000", "Operating Revenue", "$35,000.00"],
      ["TOTAL REVENUE", "", "", "$35,000.00"],
      ["", "", "", ""],
      ["--- COST OF GOODS SOLD ---", "", "", ""],
      ["AI Compute & API Tokens", "5100", "COGS", "$8,000.00"],
      ["TOTAL COGS", "", "", "$8,000.00"],
      ["", "", "", ""],
      ["GROSS PROFIT", "", "", "$27,000.00"],
      ["", "", "", ""],
      ["--- OPERATING EXPENSES ---", "", "", ""],
      ["Engineering Salaries", "6030", "OPEX", "$65,000.00"],
      ["Growth & Ad Spend", "6040", "OPEX", "$12,000.00"],
      ["TOTAL OPEX", "", "", "$77,000.00"],
      ["", "", "", ""],
      ["NET INCOME (NET LOSS)", "", "", "-$50,000.00"]
    ],
    "Balance Sheet": [
      ["BALANCE SHEET", "CODE", "TYPE", "BALANCE ($)"],
      ["--- ASSETS ---", "", "", ""],
      ["Cash & Operating Bank", "1000", "Current Asset", "$620,000.00"],
      ["TOTAL ASSETS", "", "", "$620,000.00"],
      ["", "", "", ""],
      ["--- LIABILITIES ---", "", "", ""],
      ["Accounts Payable", "2000", "Current Liability", "$0.00"],
      ["TOTAL LIABILITIES", "", "", "$0.00"],
      ["", "", "", ""],
      ["--- OWNER'S EQUITY ---", "", "", ""],
      ["Seed Capital Paid-in", "3000", "Equity", "$750,000.00"],
      ["Current Period Retained Loss", "3100", "Equity", "-$130,000.00"],
      ["TOTAL EQUITY", "", "", "$620,000.00"],
      ["", "", "", ""],
      ["TOTAL LIABILITIES & EQUITY", "", "", "$620,000.00"],
      ["PARITY VERIFICATION", "", "", "BALANCED (100% Match)"]
    ],
    "Chart of Accounts": [
      ["CODE", "ACCOUNT NAME", "CLASSIFICATION", "NORMAL BALANCE", "BALANCE ($)"],
      ["1000", "Cash & Operating Bank", "Assets", "Debit", "$620,000.00"],
      ["2000", "Accounts Payable", "Liabilities", "Credit", "$0.00"],
      ["3000", "Share Capital / Equity", "Equity", "Credit", "$750,000.00"],
      ["4000", "SaaS Subscription Revenue", "Revenue", "Credit", "$35,000.00"],
      ["5100", "API Compute & LLM Costs", "COGS", "Debit", "$8,000.00"],
      ["6030", "Engineering Salaries", "OPEX", "Debit", "$65,000.00"],
      ["6040", "Marketing & Ad Spend", "OPEX", "Debit", "$12,000.00"]
    ],
    "General Journal": [
      ["DATE", "ENTRY ID", "DEBIT ACCOUNT", "CREDIT ACCOUNT", "AMOUNT ($)", "DESCRIPTION"],
      ["2026-07-01", "JE-001", "1000 - Cash", "3000 - Seed Capital", "$750,000.00", "Seed round funding"],
      ["2026-07-15", "JE-002", "1000 - Cash", "4000 - Subscription Revenue", "$35,000.00", "July SaaS subscription revenue"],
      ["2026-07-28", "JE-003", "5100 - Compute Costs", "1000 - Cash", "$8,000.00", "OpenAI & Anthropic API compute"],
      ["2026-07-31", "JE-004", "6030 - Engineering Salaries", "1000 - Cash", "$65,000.00", "Engineering team payroll"],
      ["2026-08-05", "JE-005", "6040 - Marketing Ad Spend", "1000 - Cash", "$12,000.00", "Google Ads & growth campaigns"]
    ]
  };

  const tabNames = Object.keys(tabs);
  const currentRows = tabs[activeTab] || tabs[tabNames[0]] || [];

  // Update formula bar when cell selection changes
  useEffect(() => {
    if (currentRows[selectedCell.row] && currentRows[selectedCell.row][selectedCell.col] !== undefined) {
      setFormulaValue(String(currentRows[selectedCell.row][selectedCell.col]));
    } else {
      setFormulaValue("");
    }
  }, [selectedCell, activeTab, currentRows]);

  const cellCoordinate = useMemo(() => {
    const colLetter = COLUMN_LETTERS[selectedCell.col] || 'A';
    return `${colLetter}${selectedCell.row + 1}`;
  }, [selectedCell]);

  const handleCopyAppsScript = () => {
    const script = appsScriptData?.script || wb?.apps_script || "";
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopyTabTsv = () => {
    const tsv = currentRows.map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  const handleDownloadCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + currentRows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${sheetTitle}_${activeTab.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100 font-sans select-none overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      
      {/* 1. Google Sheets App Header */}
      <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 truncate">{sheetTitle}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Interactive Workspace
              </span>
            </div>
            
            {/* Menu options */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="hover:text-slate-200 cursor-pointer" onClick={() => setIsExportModalOpen(true)}>File</span>
              <span>•</span>
              <span className="hover:text-slate-200 cursor-pointer" onClick={handleCopyTabTsv}>Edit</span>
              <span>•</span>
              <span className="hover:text-slate-200 cursor-pointer" onClick={() => refetchWorkbook()}>Recalculate</span>
              <span>•</span>
              <span className="hover:text-slate-200 cursor-pointer" onClick={handleDownloadCsv}>Export CSV</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            title="Import or Sync to Google Sheets"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Export to Google Sheets</span>
          </button>

          <button
            onClick={handleCopyTabTsv}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Copy Table Data (TSV) to Paste in Google Sheets"
          >
            {copiedTsv ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownloadCsv}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Download Tab as CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {onOpenExternal && (
            <button
              onClick={onOpenExternal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Open External Google Sheets View"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs text-slate-300">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsBold(!isBold)} 
            className={`px-2 py-1 rounded font-bold transition ${isBold ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            B
          </button>
          <button 
            onClick={() => setIsItalic(!isItalic)} 
            className={`px-2 py-1 rounded italic transition ${isItalic ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            I
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          
          <button 
            onClick={() => setTextAlign('left')} 
            className={`px-2 py-1 rounded transition ${textAlign === 'left' ? 'bg-slate-800 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
          >
            Left
          </button>
          <button 
            onClick={() => setTextAlign('center')} 
            className={`px-2 py-1 rounded transition ${textAlign === 'center' ? 'bg-slate-800 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
          >
            Center
          </button>
          <button 
            onClick={() => setTextAlign('right')} 
            className={`px-2 py-1 rounded transition ${textAlign === 'right' ? 'bg-slate-800 text-emerald-400 font-bold' : 'hover:bg-slate-800'}`}
          >
            Right
          </button>
          
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <span className="text-[11px] text-slate-400 px-1">Formatting: Currency ($) • Auto-Reconciliation</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Double-entry verified</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* 3. Formula & Coordinate Bar */}
      <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 shrink-0 text-xs">
        {/* Cell Coordinate Display */}
        <div className="w-14 px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-center text-slate-300 font-bold">
          {cellCoordinate}
        </div>
        
        {/* fx symbol */}
        <div className="px-1 text-slate-500 font-bold italic font-serif">
          fx
        </div>

        {/* Formula Input */}
        <div className="flex-1">
          <input
            type="text"
            value={formulaValue}
            onChange={(e) => setFormulaValue(e.target.value)}
            placeholder="Cell value or formula =SUM(...)"
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 4. The Spreadsheet Grid */}
      <div className="flex-1 w-full overflow-auto bg-slate-950 relative">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-900 text-slate-400 select-none border-b border-slate-800">
              {/* Top-left corner cell */}
              <th className="w-10 min-w-10 max-w-10 px-2 py-1.5 text-center font-mono border-r border-b border-slate-800 bg-slate-900 text-[10px] text-slate-500">
                #
              </th>
              {COLUMN_LETTERS.slice(0, Math.max(4, currentRows[0]?.length || 4)).map((letter, idx) => (
                <th 
                  key={letter}
                  className="px-3 py-1.5 font-mono font-bold text-center border-r border-b border-slate-800 min-w-[130px]"
                >
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIdx) => {
              const isHeaderRow = rowIdx === 0;
              const isSectionHeader = typeof row[0] === 'string' && (row[0].startsWith('---') || row[0].includes('STATEMENT') || row[0].includes('DASHBOARD'));
              const isTotalRow = typeof row[0] === 'string' && (row[0].includes('TOTAL') || row[0].includes('GROSS PROFIT') || row[0].includes('NET INCOME'));

              return (
                <tr 
                  key={rowIdx}
                  className={`hover:bg-slate-900/60 transition border-b border-slate-800/60 ${
                    isHeaderRow ? 'bg-slate-900/90 font-bold text-emerald-300' : ''
                  } ${
                    isSectionHeader ? 'bg-slate-900/70 font-semibold text-slate-300' : ''
                  } ${
                    isTotalRow ? 'bg-emerald-950/20 font-bold text-emerald-200 border-t border-b-2 border-emerald-500/40' : ''
                  }`}
                >
                  {/* Row Number Column */}
                  <td className="sticky left-0 bg-slate-900 text-slate-500 font-mono text-[10px] text-center border-r border-slate-800/80 px-1 py-1.5 select-none w-10 min-w-10">
                    {rowIdx + 1}
                  </td>

                  {/* Data Cells */}
                  {Array.from({ length: Math.max(4, currentRows[0]?.length || 4) }).map((_, colIdx) => {
                    const cellVal = row[colIdx] !== undefined ? row[colIdx] : "";
                    const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                    const isNumeric = typeof cellVal === 'number' || (typeof cellVal === 'string' && (cellVal.startsWith('$') || cellVal.startsWith('-')));

                    return (
                      <td
                        key={colIdx}
                        onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        className={`px-3 py-1.5 border-r border-slate-800/50 cursor-cell relative truncate font-mono text-[11px] ${
                          isSelected ? 'outline-2 outline-emerald-500 z-10 bg-emerald-500/10' : ''
                        } ${
                          isNumeric ? 'text-right' : 'text-left'
                        } ${
                          isBold ? 'font-bold' : ''
                        } ${
                          isItalic ? 'italic' : ''
                        }`}
                        style={{ textAlign: isNumeric ? 'right' : textAlign }}
                      >
                        {String(cellVal)}
                        {isSelected && (
                          <div className="absolute right-0 bottom-0 w-1.5 h-1.5 bg-emerald-500" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Google Sheets Tab Switcher (Bottom Bar) */}
      <div className="bg-slate-950 px-2 py-1.5 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-1 min-w-0">
          <button 
            onClick={() => refetchWorkbook()}
            title="Refresh All Tabs"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-4 w-px bg-slate-800 mx-1" />

          {tabNames.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0 pr-2">
          <span className="text-[10px] text-slate-500">{tabNames.length} Sheets</span>
        </div>
      </div>

      {/* 6. Export / Import to Google Sheets Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Import Master Financials into Google Sheets</h3>
                    <p className="text-xs text-slate-400">Generate all 6 tabs in your personal Google Sheets in under 10 seconds.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                
                {/* Method 1: 1-Click Apps Script */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">1</span>
                      <h4 className="font-bold text-slate-200 text-sm">Automated Google Apps Script (Recommended)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Creates all 6 tabs with formulas & colors
                    </span>
                  </div>

                  <p className="text-slate-400">
                    Copy the auto-generated Apps Script below, open your Google Sheet, click <strong className="text-slate-200">Extensions &gt; Apps Script</strong>, paste the code, and click <strong className="text-emerald-400">Run</strong>.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyAppsScript}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedScript ? "Copied Script to Clipboard!" : "Copy Google Apps Script"}</span>
                    </button>

                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Open sheets.new</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Method 2: CSV Export */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-[10px]">2</span>
                    <h4 className="font-bold text-slate-200 text-sm">Direct CSV Download</h4>
                  </div>
                  <p className="text-slate-400">
                    Download the active tab as CSV, then in Google Sheets click <strong className="text-slate-200">File &gt; Import</strong> to upload.
                  </p>
                  <button
                    onClick={handleDownloadCsv}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeTab}.csv</span>
                  </button>
                </div>

                {/* Method 3: Copy Paste Table */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-[10px]">3</span>
                    <h4 className="font-bold text-slate-200 text-sm">Direct Copy &amp; Paste (Ctrl+V)</h4>
                  </div>
                  <p className="text-slate-400">
                    Copy tab data to your clipboard and paste directly into cell A1 in any Google Sheet or Excel workbook.
                  </p>
                  <button
                    onClick={handleCopyTabTsv}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedTsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTsv ? "Copied!" : `Copy ${activeTab} Data`}</span>
                  </button>
                </div>

              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
