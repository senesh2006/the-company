import { useAppStore } from './store';

// Types
export type AgentStatus = 'Running' | 'Paused' | 'Idle' | 'Failed';

export interface Agent {
  id: string;
  role: string;
  name: string;
  status: AgentStatus;
  business_id?: string;
  current_task_id?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'queued' | 'assigned' | 'running' | 'completed' | 'failed';
  business_id?: string;
  assignee_id?: string;
  priority?: number;
  result?: string;
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

// Use intelligent baseUrl detection:
// 1. Explicit NEXT_PUBLIC_API_URL if configured
// 2. In browser on Next.js port (3000/3001), auto-target FastAPI on port 8000 with matching hostname (localhost/127.0.0.1)
// 3. When served by FastAPI directly, use relative path ('')
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL) {
      const customUrl = process.env.NEXT_PUBLIC_API_URL;
      return customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
    }
    // If accessing via Next.js dev or standalone server on port 3000/3001, route to FastAPI on port 8000
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
    // Normalize: ensure every agent has a valid status (DB may have null)
    return (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status || 'Idle',
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
    return { ...data, status: data.status || 'Idle' };
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

  hireAgent: async (role: string, name: string, goal: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name, goal }),
    });
    if (!res.ok) throw new Error(`Failed to hire agent (${res.status})`);
  },
};
