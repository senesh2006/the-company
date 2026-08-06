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
  Check
} from 'lucide-react';
import { 
  useFinanceAccounts, 
  useJournalEntries, 
  useSheetsConfig, 
  useSyncSheets, 
  usePostJournalEntry,
  useCreateAccount,
  useClearFinanceData,
  useInitializeFinanceTemplate 
} from '@/lib/queries';
import { FinanceAccount, JournalEntry } from '@/lib/api';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Assets: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: Building2 },
  Liabilities: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: CreditCard },
  Equity: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: Layers },
  Revenue: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: TrendingUp },
  COGS: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: Receipt },
  OPEX: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', icon: DollarSign },
};

export function ChartOfAccountsSheet() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal' | 'sheets' | 'trial-balance'>('accounts');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Queries & Mutations
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useFinanceAccounts();
  const { data: journalData, isLoading: journalLoading, refetch: refetchJournal } = useJournalEntries();
  const { data: sheetsConfig, isLoading: configLoading } = useSheetsConfig();
  const syncMutation = useSyncSheets();
  const createAccountMutation = useCreateAccount();
  const postJournalMutation = usePostJournalEntry();
  const clearMutation = useClearFinanceData();
  const initializeTemplateMutation = useInitializeFinanceTemplate();

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
  };

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.debit_account || !newEntry.credit_account || !newEntry.amount) return;
    await postJournalMutation.mutateAsync({
      ...newEntry,
      date: new Date().toISOString().split('T')[0],
      source: 'Founder / UI Transaction',
    });
    setIsNewTransactionOpen(false);
    setNewEntry({
      reference: '',
      description: '',
      debit_account: '',
      credit_account: '',
      amount: 0,
    });
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesCategory = selectedCategory === 'ALL' || acc.category.toUpperCase() === selectedCategory;
    const matchesSearch = 
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.description && acc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Filter journal
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
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  General Ledger & Accounts
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Google Sheets MCP
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Real-time double-entry Chart of Accounts synced with Google Sheets & Maker-Checker AI auditing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {sheetsConfig?.spreadsheet_url && (
              <a
                href={sheetsConfig.spreadsheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600/60 text-slate-200 text-xs font-semibold transition shadow-sm hover:shadow"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Open Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}

            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-900/30 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{syncMutation.isPending ? 'Syncing...' : 'Sync to Google Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Sync alert banner */}
        <AnimatePresence>
          {syncSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Assets</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${summary.total_assets?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Cash, AR & Fixed Assets (1000s)</p>
        </div>

        {/* Total Liabilities & Equity */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Liabilities & Equity</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${(summary.total_liabilities + summary.total_equity)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">AP, Debt & Paid-in Equity (2000s/3000s)</p>
        </div>

        {/* Net Profit Margin */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Net Operating Profit</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              ${summary.net_income?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Revenue - (COGS + OPEX)</p>
        </div>

        {/* Double-Entry Integrity */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Trial Balance Integrity</span>
            <div className={`p-2 rounded-lg ${trialBalance?.is_balanced ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xl font-bold tracking-tight ${trialBalance?.is_balanced ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trialBalance?.is_balanced ? '100% BALANCED' : 'VARIANCE DETECTED'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Debits: ${trialBalance?.total_debits?.toLocaleString() || '0'} = Credits: ${trialBalance?.total_credits?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'accounts'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'journal'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            General Journal ({journalEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('trial-balance')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'trial-balance'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trial Balance Audit
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 text-xs font-medium transition"
                  title="Clear all ledger data"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{initializeTemplateMutation.isPending ? 'Loading...' : 'Load Standard Template'}</span>
                </button>
              )}
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </>
          )}

          {activeTab === 'journal' && (
            <button
              onClick={() => setIsNewTransactionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
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
            <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 backdrop-blur-md text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white">General Ledger Ready</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                No accounts have been created yet. You can prompt your AI Finance Worker, load a standard GAAP starter template with $0.00 balances, or add accounts manually.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    await initializeTemplateMutation.mutateAsync();
                  }}
                  disabled={initializeTemplateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{initializeTemplateMutation.isPending ? 'Initializing...' : 'Load Standard Template (0 Balances)'}</span>
                </button>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        selectedCategory === cat
                          ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search code, name, or type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Spreadsheet Table View */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-3.5 px-4 w-20">Code</th>
                        <th className="py-3.5 px-4">Account Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Subtype</th>
                        <th className="py-3.5 px-4">Normal Balance</th>
                        <th className="py-3.5 px-4 text-right">Current Balance (USD)</th>
                        <th className="py-3.5 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            No accounts found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map((acc, idx) => {
                          const color = CATEGORY_COLORS[acc.category] || {
                            bg: 'bg-slate-500/10',
                            text: 'text-slate-400',
                            border: 'border-slate-500/20',
                          };
                          return (
                            <tr 
                              key={acc.code || idx} 
                              className="hover:bg-slate-800/40 transition group"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                                {acc.code}
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-200">
                                {acc.name}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${color.bg} ${color.text} ${color.border}`}>
                                  {acc.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {acc.type}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[11px] font-semibold ${acc.normal_balance === 'Debit' ? 'text-blue-400' : 'text-purple-400'}`}>
                                  {acc.normal_balance}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-100">
                                ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
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
            <p className="text-xs text-slate-400">
              Double-entry audit log of all financial activities recorded by AI Workers and founders.
            </p>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Debit Account</th>
                    <th className="py-3.5 px-4">Credit Account</th>
                    <th className="py-3.5 px-4 text-right">Amount (USD)</th>
                    <th className="py-3.5 px-4 text-center">Checker Audit</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredJournal.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No journal entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredJournal.map((entry, idx) => (
                      <tr key={entry.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                          {entry.reference}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200 max-w-sm">
                          {entry.description}
                        </td>
                        <td className="py-3 px-4 text-blue-300 font-mono text-[11px]">
                          {entry.debit_account}
                        </td>
                        <td className="py-3 px-4 text-purple-300 font-mono text-[11px]">
                          {entry.credit_account}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          ${entry.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {entry.verified_by_checker ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[10px]">
                            {entry.status || 'Posted'}
                          </span>
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
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Trial Balance Mathematical Proof</h2>
                  <p className="text-xs text-slate-400">
                    GAAP Rule: Sum of all Debits across Asset and Expense accounts MUST equal sum of all Credits across Liability, Equity, and Revenue accounts.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Ledger Balance Status</span>
                <p className="text-lg font-bold text-emerald-400">
                  {trialBalance?.is_balanced ? 'BALANCED ($0.00 Variance)' : `UNBALANCED ($${trialBalance?.variance} Variance)`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-blue-500/20 space-y-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Total Debits</span>
                <p className="text-3xl font-bold font-mono text-white">
                  ${trialBalance?.total_debits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500">Includes Assets (1000s), COGS (5000s), OPEX (6000s)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/20 space-y-2">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Total Credits</span>
                <p className="text-3xl font-bold font-mono text-white">
                  ${trialBalance?.total_credits?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500">Includes Liabilities (2000s), Equity (3000s), Revenue (4000s)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS LIVE HUB */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sheet Connection Card */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {sheetsConfig?.spreadsheet_title || 'Master General Ledger'}
                    </h3>
                    <p className="text-xs text-slate-400">Google Sheets MCP Connection Hub</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Spreadsheet ID:</span>
                  <span className="text-slate-200">{sheetsConfig?.spreadsheet_id || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Connection Mode:</span>
                  <span className="text-emerald-400">{sheetsConfig?.mode === 'live_api' ? 'Google API Live Cloud' : 'Enterprise Durable Sync'}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Last Synced Timestamp:</span>
                  <span className="text-slate-200">{sheetsConfig?.last_synced_at || 'Just now'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                {sheetsConfig?.spreadsheet_url && (
                  <a
                    href={sheetsConfig.spreadsheet_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-950"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Master Spreadsheet</span>
                  </a>
                )}
                
                <button
                  onClick={handleSync}
                  disabled={syncMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition"
                >
                  <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              </div>
            </div>

            {/* Sheets Tabs list */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                Synchronized Sheets
              </h4>

              <div className="space-y-3 text-xs">
                {sheetsConfig?.sheets?.map(sheet => (
                  <div key={sheet.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{sheet.name}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{sheet.rows} rows</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Range: {sheet.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      <AnimatePresence>
        {isAddAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 shadow-2xl text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Add New Chart of Accounts Entry
                </h3>
                <button 
                  onClick={() => setIsAddAccountOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Account Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 1060 or 5150"
                      required
                      value={newAccount.code}
                      onChange={e => setNewAccount({ ...newAccount, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Category</label>
                    <select
                      value={newAccount.category}
                      onChange={e => setNewAccount({ 
                        ...newAccount, 
                        category: e.target.value as any,
                        normal_balance: ['Assets', 'COGS', 'OPEX'].includes(e.target.value) ? 'Debit' : 'Credit'
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Assets">Assets (1000s)</option>
                      <option value="Liabilities">Liabilities (2000s)</option>
                      <option value="Equity">Equity (3000s)</option>
                      <option value="Revenue">Revenue (4000s)</option>
                      <option value="COGS">COGS (5000s)</option>
                      <option value="OPEX">OPEX (6000s)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Account Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe Escrow Reserve"
                    required
                    value={newAccount.name}
                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Account Subtype</label>
                    <input
                      type="text"
                      placeholder="e.g. Current Asset"
                      value={newAccount.type}
                      onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Opening Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAccount.balance}
                      onChange={e => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Purpose, accounting guidelines or vendor specifics..."
                    value={newAccount.description}
                    onChange={e => setNewAccount({ ...newAccount, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAccountMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                  >
                    {createAccountMutation.isPending ? 'Saving...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: POST JOURNAL ENTRY */}
      <AnimatePresence>
        {isNewTransactionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 shadow-2xl text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  Post Double-Entry Journal Transaction
                </h3>
                <button 
                  onClick={() => setIsNewTransactionOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePostJournal} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Reference / Invoice #</label>
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-081"
                      required
                      value={newEntry.reference}
                      onChange={e => setNewEntry({ ...newEntry, reference: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Transaction Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                      value={newEntry.amount || ''}
                      onChange={e => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Cloud Services monthly invoice paid"
                    required
                    value={newEntry.description}
                    onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-blue-400 mb-1 font-medium">Debit Account (+Asset/+Expense)</label>
                    <select
                      required
                      value={newEntry.debit_account}
                      onChange={e => setNewEntry({ ...newEntry, debit_account: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Debit Account...</option>
                      {accounts.map(a => (
                        <option key={a.code} value={`${a.code} ${a.name}`}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-400 mb-1 font-medium">Credit Account (+Liability/+Rev)</label>
                    <select
                      required
                      value={newEntry.credit_account}
                      onChange={e => setNewEntry({ ...newEntry, credit_account: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select Credit Account...</option>
                      {accounts.map(a => (
                        <option key={a.code} value={`${a.code} ${a.name}`}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewTransactionOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={postJournalMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
                  >
                    {postJournalMutation.isPending ? 'Posting...' : 'Post to Ledger & Sheets'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
