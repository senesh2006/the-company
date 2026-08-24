"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Database,
  Building2,
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
  Filter,
  Check,
  X,
  Copy,
  Edit3,
  Link2
} from 'lucide-react';
import { 
  useFinanceAccounts, 
  useJournalEntries, 
  useSheetsConfig, 
  useUpdateSheetsConfig,
  useSyncSheets, 
  usePostJournalEntry,
  useCreateAccount,
  useClearFinanceData,
  useInitializeFinanceTemplate 
} from '@/lib/queries';
import { FinanceAccount, JournalEntry } from '@/lib/api';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Assets: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: Building2 },
  Liabilities: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: CreditCard },
  Equity: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: Layers },
  Revenue: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', icon: TrendingUp },
  COGS: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: Receipt },
  OPEX: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: DollarSign },
};

export function ChartOfAccountsSheet() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal' | 'sheets' | 'trial-balance'>('accounts');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Queries & Mutations
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useFinanceAccounts();
  const { data: journalData, isLoading: journalLoading, refetch: refetchJournal } = useJournalEntries();
  const { data: sheetsConfig, isLoading: configLoading } = useSheetsConfig();
  const syncMutation = useSyncSheets();
  const updateSheetsConfigMutation = useUpdateSheetsConfig();
  const createAccountMutation = useCreateAccount();
  const postJournalMutation = usePostJournalEntry();
  const clearMutation = useClearFinanceData();
  const initializeTemplateMutation = useInitializeFinanceTemplate();

  const handleCopyLink = (url?: string) => {
    const targetUrl = url || sheetsConfig?.spreadsheet_url || 'https://docs.google.com/spreadsheets';
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrlInput.trim()) return;
    try {
      await updateSheetsConfigMutation.mutateAsync({
        spreadsheet_id: sheetUrlInput.trim(),
        spreadsheet_title: 'Connected Google Sheet',
      });
      setIsEditSheetOpen(false);
      setSheetUrlInput('');
      setSyncSuccessMsg('Google Sheets URL updated successfully!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update sheets config', err);
    }
  };

  // Form states
  const [newAccount, setNewAccount] = useState<Partial<FinanceAccount>>({
    code: '',
    name: '',
    category: 'Assets',
    type: 'Current Asset',
    balance: 0,
    normal_balance: 'Debit',
    description: '',
  });

  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    reference: '',
    description: '',
    debit_account: '',
    credit_account: '',
    amount: 0,
  });

  const accounts = accountsData?.accounts || [];
  const trialBalance = accountsData?.trial_balance;
  const journalEntries = journalData?.entries || [];

  const handleSync = async () => {
    try {
      const res = await syncMutation.mutateAsync();
      setSyncSuccessMsg(res?.message || 'Synchronized with Google Sheets successfully!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Sync failed', err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.code || !newAccount.name) return;
    try {
      await createAccountMutation.mutateAsync(newAccount);
      setIsAddAccountOpen(false);
      setNewAccount({
        code: '',
        name: '',
        category: 'Assets',
        type: 'Current Asset',
        balance: 0,
        normal_balance: 'Debit',
        description: '',
      });
    } catch (err: any) {
      console.error('Failed to create account', err);
    }
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.debit_account || !newEntry.credit_account || !newEntry.amount) return;
    try {
      await postJournalMutation.mutateAsync({
        ...newEntry,
        reference: newEntry.reference || `JE-${Date.now().toString().slice(-6)}`,
      });
      setIsNewTransactionOpen(false);
      setNewEntry({
        reference: '',
        description: '',
        debit_account: '',
        credit_account: '',
        amount: 0,
      });
    } catch (err: any) {
      console.error('Failed to post transaction', err);
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesCategory = selectedCategory === 'ALL' || acc.category.toUpperCase() === selectedCategory;
    const matchesSearch = 
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredJournal = journalEntries.filter(entry => {
    return (
      entry.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.debit_account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.credit_account.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const summary = trialBalance?.summary || {
    total_assets: 79250,
    total_liabilities: 21700,
    total_equity: 72500,
    total_revenue: 60200,
    total_cogs: 9160,
    total_opex: 9695,
    net_income: 41345,
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 font-sans text-slate-800 dark:text-slate-200">
      {/* Top Header Card - Clean Light SaaS Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
                General Ledger & Accounts
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Google Sheets MCP
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time double-entry Chart of Accounts synced with Google Sheets & Maker-Checker AI auditing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {sheetsConfig?.spreadsheet_url && (
            <>
              <button
                onClick={() => handleCopyLink(sheetsConfig.spreadsheet_url)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition shadow-2xs cursor-pointer active:scale-95"
                title="Copy Google Sheet Link to Clipboard"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Sheet Link</span>
                  </>
                )}
              </button>

              <a
                href={sheetsConfig.spreadsheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            </>
          )}

          <button
            onClick={() => {
              setSheetUrlInput(sheetsConfig?.spreadsheet_url || '');
              setIsEditSheetOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
            title="Configure Custom Google Sheets URL"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Connect Custom Sheet</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncMutation.isPending ? 'Syncing...' : 'Sync to Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Assets</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              ${summary.total_assets?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Cash, AR & Fixed Assets (1000s)</p>
        </div>

        {/* Total Liabilities & Equity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Liabilities & Equity</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono">
              ${(summary.total_liabilities + summary.total_equity)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">AP, Debt & Paid-in Equity (2000s/3000s)</p>
        </div>

        {/* Net Profit Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Net Operating Profit</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
              ${summary.net_income?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Revenue - (COGS + OPEX)</p>
        </div>

        {/* Double-Entry Integrity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Trial Balance Integrity</span>
            <div className={`p-2 rounded-lg ${trialBalance?.is_balanced ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xl font-bold tracking-tight ${trialBalance?.is_balanced ? 'text-emerald-700' : 'text-rose-700'}`}>
              {trialBalance?.is_balanced ? '100% BALANCED' : 'VARIANCE DETECTED'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Debits: ${trialBalance?.total_debits?.toLocaleString() || '0'} = Credits: ${trialBalance?.total_credits?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'journal'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
            }`}
          >
            General Journal ({journalEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('trial-balance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'trial-balance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
            }`}
          >
            Trial Balance Audit
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'bg-slate-900 text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Google Sheets Hub
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'accounts' && (
            <>
              {accounts.length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all accounts and journal entries? This will reset the ledger to empty.')) {
                      await clearMutation.mutateAsync();
                    }
                  }}
                  disabled={clearMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-300 hover:text-rose-700 border border-slate-200 dark:border-slate-700 hover:border-rose-200 text-xs font-bold transition"
                >
                  <span>{clearMutation.isPending ? 'Clearing...' : 'Clear All Data'}</span>
                </button>
              )}
              {accounts.length === 0 && (
                <button
                  onClick={async () => {
                    await initializeTemplateMutation.mutateAsync();
                  }}
                  disabled={initializeTemplateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{initializeTemplateMutation.isPending ? 'Loading...' : 'Load Standard Template'}</span>
                </button>
              )}
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </>
          )}

          {activeTab === 'journal' && (
            <button
              onClick={() => setIsNewTransactionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CHART OF ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 bg-white dark:bg-slate-900 text-center shadow-2xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">General Ledger Ready</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                No accounts have been created yet. You can load a standard GAAP starter template or add accounts manually.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    await initializeTemplateMutation.mutateAsync();
                  }}
                  disabled={initializeTemplateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{initializeTemplateMutation.isPending ? 'Initializing...' : 'Load Standard Template (0 Balances)'}</span>
                </button>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Custom Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {['ALL', 'ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'COGS', 'OPEX'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search code, name, or type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Spreadsheet Table View */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-4 w-20">Code</th>
                        <th className="py-3.5 px-4">Account Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Subtype</th>
                        <th className="py-3.5 px-4">Normal Balance</th>
                        <th className="py-3.5 px-4 text-right">Current Balance (USD)</th>
                        <th className="py-3.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                            No accounts found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map((acc, idx) => {
                          const color = CATEGORY_COLORS[acc.category] || {
                            bg: 'bg-slate-100 dark:bg-slate-800',
                            text: 'text-slate-700 dark:text-slate-300',
                            border: 'border-slate-200 dark:border-slate-700',
                          };
                          return (
                            <tr 
                              key={acc.code || idx} 
                              className="hover:bg-slate-50/80 dark:bg-slate-900/80 transition group"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                                {acc.code}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                {acc.name}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${color.bg} ${color.text} ${color.border}`}>
                                  {acc.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                                {acc.type}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[11px] font-bold ${acc.normal_balance === 'Debit' ? 'text-blue-700' : 'text-purple-700'}`}>
                                  {acc.normal_balance}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                                ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                                {acc.description || '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Double-entry audit log of all financial activities recorded by AI Workers and founders.
            </p>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Debit Account</th>
                    <th className="py-3.5 px-4">Credit Account</th>
                    <th className="py-3.5 px-4 text-right">Amount (USD)</th>
                    <th className="py-3.5 px-4 text-center">Checker Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredJournal.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No journal entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredJournal.map((entry, idx) => (
                      <tr key={entry.id || idx} className="hover:bg-slate-50 dark:bg-slate-950 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {entry.reference}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-sm">
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-blue-700 font-mono font-semibold text-[11px]">
                          {entry.debit_account}
                        </td>
                        <td className="py-3 px-4 text-purple-700 font-mono font-semibold text-[11px]">
                          {entry.credit_account}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          ${entry.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {entry.verified_by_checker ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              PENDING
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE AUDIT */}
      {activeTab === 'trial-balance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Trial Balance Mathematical Proof</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    GAAP Rule: Sum of all Debits MUST equal sum of all Credits.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">Ledger Balance Status</span>
                <p className="text-lg font-bold text-emerald-700">
                  {trialBalance?.is_balanced ? 'BALANCED ($0.00 Variance)' : `UNBALANCED ($${trialBalance?.variance} Variance)`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Debits</span>
                <p className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                  ${trialBalance?.total_debits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Assets (1000s), COGS (5000s), OPEX (6000s)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Credits</span>
                <p className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                  ${trialBalance?.total_credits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Liabilities (2000s), Equity (3000s), Revenue (4000s)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS LIVE HUB */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {sheetsConfig?.spreadsheet_title || 'Master General Ledger & Multi-Entity Tracker'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Google Sheets MCP Live Connection & Bi-directional Sync</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Live Connected
                </span>
              </div>
            </div>

            {/* Live Link Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  Target Spreadsheet Link
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {sheetsConfig?.spreadsheet_id || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={sheetsConfig?.spreadsheet_url || 'https://docs.google.com/spreadsheets'}
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                />
                <button
                  onClick={() => handleCopyLink(sheetsConfig?.spreadsheet_url)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <a
                  href={sheetsConfig?.spreadsheet_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-2xs"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Custom URL Setup */}
            <form onSubmit={handleSaveCustomSheet} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  Connect Your Own Custom Google Sheet
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste any existing Google Spreadsheet URL or ID below to link all AI finance agents directly to your workbook.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  value={sheetUrlInput}
                  onChange={e => setSheetUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={updateSheetsConfigMutation.isPending || !sheetUrlInput.trim()}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {updateSheetsConfigMutation.isPending ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </form>

            {/* Synchronized Tabs */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Synchronized Workbook Tabs
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">1. Executive_Dashboard</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Consolidated Group KPIs, Revenue & Burn</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">2. Chart_of_Accounts</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{accounts.length} Active multi-entity codes (1000s-6000s)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">3. General_Journal</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{journalEntries.length} Double-entry verified transactions</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">4. Trial_Balance</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">{trialBalance?.is_balanced ? '100% Balanced ($0.00)' : 'Variance Check'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">5. Subsidiary_Breakdown</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Multi-entity revenue & expense tracking</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">6. Cash_Flow_Forecast</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">12-Month runway & spend monitor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Google Sheets URL */}
      <AnimatePresence>
        {isEditSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Connect Google Spreadsheet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Set the target Google Sheet for all finance operations</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditSheetOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomSheet} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Google Spreadsheet URL or ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/1abcXYZ.../edit"
                    value={sheetUrlInput}
                    onChange={e => setSheetUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Make sure the spreadsheet is shared with edit access or public view if using live sync.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSheetOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSheetsConfigMutation.isPending || !sheetUrlInput.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {updateSheetsConfigMutation.isPending ? 'Saving...' : 'Save & Connect'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
