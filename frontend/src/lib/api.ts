import { useAppStore } from './store';

// Types
export type AgentStatus = 'Running' | 'Paused' | 'Idle' | 'Failed';
export type TrustTier = 'observe' | 'assist' | 'operate';
export type HiringModel = 'salaried' | 'freelance' | 'contract';

export interface Agent {
  id: string;
  role: string;
  name: string;
  status: AgentStatus;
  trust_tier?: TrustTier;
  specialization_id?: string;
  hiring_model?: HiringModel;
  clean_cycles_count?: number;
  authority_limit_usd?: number;
  business_id?: string;
  current_task_id?: string;
  created_at?: string;
  system_prompt?: string;
  model?: string;
  capabilities?: string[];
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'queued' | 'assigned' | 'running' | 'completed' | 'failed' | 'rejected' | 'needs_approval';
  business_id?: string;
  assignee_id?: string;
  assignee_role?: string;
  mandate?: string;
  cadence?: 'once' | 'daily' | 'weekly' | 'on_trigger';
  priority?: 'low' | 'normal' | 'high' | number;
  trust_tier?: TrustTier;
  authority_limit?: Record<string, any>;
  shared_memory_refs?: string[];
  result?: string;
  retry_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Metrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  totalCost: number;
  riskLevel: 'low' | 'medium' | 'high';
  businessId?: string;
  business_id?: string;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  updatedBy: string;
  timestamp: string;
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
    if (window.location.port === '3000' || window.location.port === '3001') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return '';
  }
  const defaultUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');
  return defaultUrl.endsWith('/') ? defaultUrl.slice(0, -1) : defaultUrl;
};

export const api = {
  // --- Agents list ---
  getAgents: async (): Promise<Agent[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents`);
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Failed to fetch agents (${res.status}): ${errorText}`);
    }
    const data = await res.json();
    return (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status || 'Idle',
      trust_tier: agent.trust_tier || 'observe',
      clean_cycles_count: agent.clean_cycles_count || 0,
      authority_limit_usd: agent.authority_limit_usd ?? (agent.trust_tier === 'operate' ? 1000 : agent.trust_tier === 'assist' ? 100 : 0)
    }));
  },

  // --- Single agent ---
  getAgent: async (id: string): Promise<Agent | null> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch agent details (${res.status})`);
    }
    const data = await res.json();
    if (!data) return null;
    return {
      ...data,
      status: data.status || 'Idle',
      trust_tier: data.trust_tier || 'observe',
      clean_cycles_count: data.clean_cycles_count || 0,
      authority_limit_usd: data.authority_limit_usd ?? (data.trust_tier === 'operate' ? 1000 : data.trust_tier === 'assist' ? 100 : 0)
    };
  },

  // --- Promote & Demote Workers ---
  promoteWorker: async (id: string, target_tier?: TrustTier, reason?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_tier, reason }),
    });
    if (!res.ok) throw new Error(`Failed to promote worker (${res.status})`);
    return res.json();
  },

  demoteWorker: async (id: string, reason?: string): Promise<any> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/${id}/demote`, {
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
      // Fallback
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

  // --- Memory ---
  getMemory: async (): Promise<MemoryEntry[]> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/memory`);
    if (!res.ok) throw new Error(`Failed to fetch memory (${res.status})`);
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
