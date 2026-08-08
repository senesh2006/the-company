import { supabase } from './supabase';

export type AgentStatus = 'Idle' | 'Thinking' | 'Working' | 'Running' | 'Paused' | 'Blocked' | 'Error' | 'Failed' | 'Terminated';
export type AgentRole = 'Manager' | 'Worker' | 'Specialist';
export type TrustTier = 'observe' | 'assist' | 'operate';
export type HiringModel = 'salaried' | 'freelance' | 'contract';
export type ModelId =
  | 'kimi-k3'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'llama-3.1-70b'
  | 'llama-v3-8b'
  | 'qwen2.5-72b'
  | 'deepseek-r1'
  | 'mistral-small-24b';

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
  tier: 'fast' | 'standard' | 'power';
  model_name?: string;
}

// Hardcoded fallback is only used when the backend /models endpoint is unreachable.
export const FALLBACK_MODELS: ModelOption[] = [
  { id: 'kimi-k3', name: 'Llama 3.3 70B', provider: 'Groq', tier: 'power' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'standard' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', tier: 'fast' },
  { id: 'llama-3.1-70b', name: 'Llama 3.3 70B', provider: 'Groq', tier: 'standard' },
  { id: 'llama-v3-8b', name: 'Llama 3.1 8B', provider: 'Groq', tier: 'fast' },
  { id: 'qwen2.5-72b', name: 'Qwen QwQ 32B', provider: 'Groq', tier: 'standard' },
  { id: 'deepseek-r1', name: 'DeepSeek R1 Distill 70B', provider: 'Groq', tier: 'power' },
  { id: 'mistral-small-24b', name: 'Mixtral 8x7B', provider: 'Groq', tier: 'fast' },
];

export const DEFAULT_MODEL: ModelId = 'kimi-k3';

export type KnowledgeCategory = 
  | 'Brand Guidelines' 
  | 'Financial Reports' 
  | 'Product Documentation' 
  | 'Customer Personas' 
  | 'General Knowledge';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  trust_tier: TrustTier;
  specialization_id?: string;
  hiring_model?: HiringModel;
  clean_cycles_count?: number;
  authority_limit_usd?: number;
  currentTask?: string;
  current_task_title?: string;
  task_progress?: number;
  cost_today_usd?: number;
  system_prompt?: string;
  model?: string;
  capabilities?: string[];
}

export interface Task {
  id: string;
  business_id: string;
  agent_id?: string;
  assignee_role?: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'needs_approval' | 'rejected';
  description?: string;
  mandate?: string;
  cadence?: 'once' | 'daily' | 'weekly' | 'on_trigger';
  priority?: 'low' | 'normal' | 'high';
  authority_limit?: Record<string, any>;
  trust_tier?: TrustTier;
  specialization_id?: string;
  shared_memory_refs?: string[];
  files?: string[];
  expected_output?: Record<string, any>;
  result?: string;
  review_verdict?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface Metrics {
  burnRate?: number;
  totalCost: number;
  activeAgents: number;
  totalAgents: number;
  tasksCompleted?: number;
  completedTasks: number;
  totalTasks: number;
  errorRate?: number;
  riskLevel?: string;
}

export interface MemoryEntry {
  id: string;
  business_id?: string;
  key: string;
  value: any;
  tags?: string[];
  updatedBy?: string;
  updated_by?: string;
  timestamp?: string;
  created_at?: string;
}

export interface KnowledgeDocument {
  id: string;
  business_id: string;
  title: string;
  category: KnowledgeCategory | string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  summary: string;
  content: string;
  chunks?: string[];
  metadata?: {
    pages?: number;
    columns?: string[];
    row_count?: number;
    headers?: string[];
    word_count?: number;
    [key: string]: any;
  };
  author?: string;
  created_at: string;
  updated_at: string;
}

export interface AttentionItem {
  id: string;
  type: 'approval' | 'risk' | 'error';
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  timestamp: string;
}

export interface CompanyFeedItem {
  id: string;
  business_id: string;
  agent_id?: string;
  agent_name?: string;
  role?: string;
  mandate?: string;
  trust_tier?: TrustTier;
  action: string;
  details?: Record<string, any>;
  review_status?: string;
  shared_memory_refs?: string[];
  created_at: string;
}

export interface MandatePayload {
  mandate: string;
  cadence?: 'once' | 'daily' | 'weekly' | 'on_trigger';
  priority?: 'low' | 'normal' | 'high';
  assignee_role?: string;
  authority_limit?: Record<string, any>;
  trust_tier?: TrustTier;
  specialization_id?: string;
  shared_memory_refs?: string[];
}

export interface HireWorkerPayload {
  role: string;
  name: string;
  goal?: string;
  trust_tier?: TrustTier;
  specialization_id?: string;
  hiring_model?: HiringModel;
  system_prompt?: string;
  model?: string;
  capabilities?: string[];
}

export interface FinanceAccount {
  code: string;
  name: string;
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'COGS' | 'OPEX' | string;
  type: string;
  balance: number;
  normal_balance: 'Debit' | 'Credit';
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  verified_by_checker?: boolean;
  status: string;
  source?: string;
}

export interface TrialBalance {
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  variance: number;
  summary: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_revenue: number;
    total_cogs: number;
    total_opex: number;
    net_income: number;
  };
}

export interface SheetsConfig {
  spreadsheet_id: string;
  spreadsheet_url: string;
  spreadsheet_title: string;
  is_connected: boolean;
  mode: 'live_api' | 'durable_sync';
  last_synced_at: string;
  sheets: Array<{
    name: string;
    rows: number;
    range: string;
  }>;
}

export interface FinanceAccountsResponse {
  accounts: FinanceAccount[];
  total_count: number;
  trial_balance: TrialBalance;
  sheets_config: SheetsConfig;
}

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isLocal = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1';

    // In production (e.g. Railway or custom domain), never call localhost
    if (!isLocal) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1')) {
        return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      }
      // Default to same origin for unified FastAPI + static files deployment
      return '';
    }

    // In local development
    if (process.env.NEXT_PUBLIC_API_URL) {
      const customUrl = process.env.NEXT_PUBLIC_API_URL;
      return customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
    }
    if (window.location.port === '3000' || window.location.port === '3001') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

export const getAuthHeaders = async (customHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { ...customHeaders };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // If supabase fails, continue without token
  }
  return headers;
};

const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = await getAuthHeaders((init?.headers as Record<string, string>) || {});
  return fetch(input, {
    ...init,
    headers,
  });
};

export const api = {
  // --- LLM Models ---
  getAvailableModels: async (): Promise<ModelOption[]> => {
    const baseUrl = getBaseUrl();
    try {
      const res = await authFetch(`${baseUrl}/api/v1/agents/models`);
      if (!res.ok) throw new Error(`Failed to fetch models (${res.status})`);
      const data = await res.json();
      return data.models || FALLBACK_MODELS;
    } catch (e) {
      console.warn('Using fallback model list:', e);
      return FALLBACK_MODELS;
    }
  },

  // --- Agents & AI Workers ---
  getAgents: async (): Promise<Agent[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents`);
    if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
    return res.json();
  },

  getAgent: async (id: string): Promise<Agent> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch agent (${res.status})`);
    return res.json();
  },

  getHierarchy: async (): Promise<Agent[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/hierarchy`);
    if (!res.ok) throw new Error(`Failed to fetch hierarchy (${res.status})`);
    return res.json();
  },

  // --- Trust Tier Promotion / Demotion ---
  promoteWorker: async (agentId: string, targetTier?: TrustTier): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/${agentId}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_tier: targetTier }),
    });
    if (!res.ok) throw new Error(`Failed to promote worker (${res.status})`);
    return res.json();
  },

  demoteWorker: async (agentId: string, reason?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/${agentId}/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error(`Failed to demote worker (${res.status})`);
    return res.json();
  },

  // --- Company Feed Audit Trail ---
  getCompanyFeed: async (limit: number = 50): Promise<CompanyFeedItem[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/tasks/feed?limit=${limit}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  // --- Mandate Dispatching ---
  dispatchMandate: async (payload: MandatePayload): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/tasks/mandate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to dispatch mandate (${res.status})`);
    return res.json();
  },

  // --- Review Task Action ---
  reviewTask: async (taskId: string, verdict: 'approved' | 'rejected' | 'revise', feedback?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/tasks/${taskId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict, feedback }),
    });
    if (!res.ok) throw new Error(`Failed to review task (${res.status})`);
    return res.json();
  },

  // --- Metrics ---
  getMetrics: async (): Promise<Metrics> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch metrics (${res.status})`);
    return res.json();
  },

  // --- Memory & Key-Value Matrix ---
  getMemory: async (): Promise<MemoryEntry[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/memory`);
    if (!res.ok) throw new Error(`Failed to fetch memory (${res.status})`);
    return res.json();
  },

  setMemory: async (key: string, value: any, tags: string[] = []): Promise<MemoryEntry> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, tags }),
    });
    if (!res.ok) throw new Error(`Failed to save memory entry (${res.status})`);
    return res.json();
  },

  // --- Knowledge Base & Document Processing ---
  uploadKnowledgeDocument: async (file: File, category?: string, title?: string): Promise<{ status: string; document: KnowledgeDocument }> => {
    const baseUrl = getBaseUrl();
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    if (title) formData.append('title', title);

    const res = await authFetch(`${baseUrl}/api/v1/memory/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || `Failed to upload document (${res.status})`);
    }
    return res.json();
  },

  getKnowledgeDocuments: async (category?: string): Promise<KnowledgeDocument[]> => {
    const baseUrl = getBaseUrl();
    const url = category && category !== 'all' 
      ? `${baseUrl}/api/v1/memory/documents?category=${encodeURIComponent(category)}`
      : `${baseUrl}/api/v1/memory/documents`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Failed to fetch knowledge documents (${res.status})`);
    return res.json();
  },

  getKnowledgeDocument: async (docId: string): Promise<KnowledgeDocument> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/memory/documents/${docId}`);
    if (!res.ok) throw new Error(`Failed to fetch document ${docId} (${res.status})`);
    return res.json();
  },

  deleteKnowledgeDocument: async (docId: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/memory/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
  },

  searchKnowledge: async (query: string, category?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/memory/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category }),
    });
    if (!res.ok) throw new Error(`Failed to search knowledge (${res.status})`);
    return res.json();
  },

  // --- Needs Attention ---
  getNeedsAttention: async (): Promise<AttentionItem[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/attention`);
    if (!res.ok) throw new Error(`Failed to fetch attention items (${res.status})`);
    return res.json();
  },

  // --- Tasks ---
  getTasks: async (): Promise<Task[]> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/tasks`);
    if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`);
    return res.json();
  },

  createTask: async (payload: { description: string; priority?: number }): Promise<Task> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create task (${res.status})`);
    const data = await res.json();
    return data.task || data;
  },

  // --- Mutations ---
  updateAgentStatus: async (id: string, status: AgentStatus): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Failed to update agent status (${res.status})`);
  },

  injectInstruction: async (id: string, instruction: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/${id}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });
    if (!res.ok) throw new Error(`Failed to inject instruction (${res.status})`);
  },

  hireAgent: async (payload: HireWorkerPayload | { role: string; name: string; goal?: string }): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to hire worker (${res.status})`);
  },

  // --- Finance & Google Sheets ---
  getFinanceAccounts: async (): Promise<FinanceAccountsResponse> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/accounts`);
    if (!res.ok) throw new Error(`Failed to fetch finance accounts (${res.status})`);
    return res.json();
  },

  createOrUpdateAccount: async (payload: Partial<FinanceAccount>): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to save account (${res.status})`);
    return res.json();
  },

  getJournalEntries: async (): Promise<{ entries: JournalEntry[]; total_count: number }> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/journal`);
    if (!res.ok) throw new Error(`Failed to fetch journal entries (${res.status})`);
    return res.json();
  },

  postJournalEntry: async (payload: Partial<JournalEntry>): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to post journal entry (${res.status})`);
    return res.json();
  },

  getTrialBalance: async (): Promise<TrialBalance> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/trial-balance`);
    if (!res.ok) throw new Error(`Failed to fetch trial balance (${res.status})`);
    return res.json();
  },

  getSheetsConfig: async (): Promise<SheetsConfig> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/sheets-config`);
    if (!res.ok) throw new Error(`Failed to fetch sheets config (${res.status})`);
    return res.json();
  },

  syncGoogleSheets: async (): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/sync-sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to sync Google Sheets (${res.status})`);
    return res.json();
  },

  clearFinanceData: async (): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to clear finance data (${res.status})`);
    return res.json();
  },

  initializeFinanceTemplate: async (): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/finance/initialize-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to initialize template (${res.status})`);
    return res.json();
  },

  getDepartmentDetails: async (deptId: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/departments/${deptId}`);
    if (!res.ok) throw new Error(`Failed to fetch department details (${res.status})`);
    return res.json();
  },

  toggleDepartmentChecklist: async (deptId: string, taskId: number): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/departments/${deptId}/checklist/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to toggle checklist task (${res.status})`);
    return res.json();
  },

  dispatchDepartmentDirective: async (deptId: string, directive: string, priority: string = "normal"): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/departments/${deptId}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directive, priority }),
    });
    if (!res.ok) throw new Error(`Failed to dispatch directive (${res.status})`);
    return res.json();
  },

  // --- WhatsApp (WAHA) Methods ---
  getWhatsAppStatus: async (session?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const url = session 
      ? `${baseUrl}/api/v1/whatsapp/status?session=${encodeURIComponent(session)}`
      : `${baseUrl}/api/v1/whatsapp/status`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Failed to fetch WhatsApp status (${res.status})`);
    return res.json();
  },

  startWhatsAppSession: async (session: string = "default"): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/whatsapp/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });
    if (!res.ok) throw new Error(`Failed to start WhatsApp session (${res.status})`);
    return res.json();
  },

  stopWhatsAppSession: async (session: string = "default"): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/whatsapp/session/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });
    if (!res.ok) throw new Error(`Failed to stop WhatsApp session (${res.status})`);
    return res.json();
  },

  getWhatsAppQR: async (session?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const url = session
      ? `${baseUrl}/api/v1/whatsapp/qr?session=${encodeURIComponent(session)}`
      : `${baseUrl}/api/v1/whatsapp/qr`;
    const res = await authFetch(url);
    if (!res.ok) throw new Error(`Failed to fetch WhatsApp QR (${res.status})`);
    return res.json();
  },

  sendWhatsAppMessage: async (chatId: string, text: string, session?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await authFetch(`${baseUrl}/api/v1/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, session }),
    });
    if (!res.ok) throw new Error(`Failed to send WhatsApp message (${res.status})`);
    return res.json();
  },
};
