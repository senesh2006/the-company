export type AgentStatus = 'Idle' | 'Thinking' | 'Working' | 'Running' | 'Paused' | 'Blocked' | 'Error' | 'Failed' | 'Terminated';
export type AgentRole = 'Manager' | 'Worker' | 'Specialist';
export type TrustTier = 'observe' | 'assist' | 'operate';
export type HiringModel = 'salaried' | 'freelance' | 'contract';
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

export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      const customUrl = process.env.NEXT_PUBLIC_API_URL;
      return customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
    }
    // Local development with separate Next.js dev server on port 3000/3001
    if (window.location.port === '3000' || window.location.port === '3001') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    // In production / same-origin deployment (e.g. Railway, Docker), use relative path
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

export const api = {
  // --- Agents & AI Workers ---
  getAgents: async (): Promise<Agent[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents`);
    if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
    return res.json();
  },

  getAgent: async (id: string): Promise<Agent> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch agent (${res.status})`);
    return res.json();
  },

  getHierarchy: async (): Promise<Agent[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/hierarchy`);
    if (!res.ok) throw new Error(`Failed to fetch hierarchy (${res.status})`);
    return res.json();
  },

  // --- Trust Tier Promotion / Demotion ---
  promoteWorker: async (agentId: string, targetTier?: TrustTier): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${agentId}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_tier: targetTier }),
    });
    if (!res.ok) throw new Error(`Failed to promote worker (${res.status})`);
    return res.json();
  },

  demoteWorker: async (agentId: string, reason?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${agentId}/demote`, {
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
    const res = await fetch(`${baseUrl}/api/v1/tasks/feed?limit=${limit}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  // --- Mandate Dispatching ---
  dispatchMandate: async (payload: MandatePayload): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/tasks/mandate`, {
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
    const res = await fetch(`${baseUrl}/api/v1/tasks/${taskId}/review`, {
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
    const res = await fetch(`${baseUrl}/api/v1/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch metrics (${res.status})`);
    return res.json();
  },

  // --- Memory & Key-Value Matrix ---
  getMemory: async (): Promise<MemoryEntry[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory`);
    if (!res.ok) throw new Error(`Failed to fetch memory (${res.status})`);
    return res.json();
  },

  setMemory: async (key: string, value: any, tags: string[] = []): Promise<MemoryEntry> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory`, {
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

    const res = await fetch(`${baseUrl}/api/v1/memory/upload`, {
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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch knowledge documents (${res.status})`);
    return res.json();
  },

  getKnowledgeDocument: async (docId: string): Promise<KnowledgeDocument> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory/documents/${docId}`);
    if (!res.ok) throw new Error(`Failed to fetch document ${docId} (${res.status})`);
    return res.json();
  },

  deleteKnowledgeDocument: async (docId: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory/documents/${docId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
  },

  searchKnowledge: async (query: string, category?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory/search`, {
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
    const res = await fetch(`${baseUrl}/api/v1/attention`);
    if (!res.ok) throw new Error(`Failed to fetch attention items (${res.status})`);
    return res.json();
  },

  // --- Tasks ---
  getTasks: async (): Promise<Task[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/tasks`);
    if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`);
    return res.json();
  },

  // --- Mutations ---
  updateAgentStatus: async (id: string, status: AgentStatus): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Failed to update agent status (${res.status})`);
  },

  injectInstruction: async (id: string, instruction: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });
    if (!res.ok) throw new Error(`Failed to inject instruction (${res.status})`);
  },

  hireAgent: async (payload: HireWorkerPayload | { role: string; name: string; goal?: string }): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to hire worker (${res.status})`);
  },
};
