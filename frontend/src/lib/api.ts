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

// Use relative path in production since frontend and backend are served together
const rawBaseUrl = process.env.NODE_ENV === 'development' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') 
  : '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const api = {
  // --- Agents list ---
  getAgents: async (): Promise<Agent[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    const data = await res.json();
    // Normalize: ensure every agent has a valid status (DB may have null)
    return (data || []).map((agent: any) => ({
      ...agent,
      status: agent.status || 'Idle',
    }));
  },

  // --- Single agent ---
  getAgent: async (id: string): Promise<Agent | null> => {
    const res = await fetch(`${BASE_URL}/api/v1/agents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch agent details');
    const data = await res.json();
    if (!data) return null;
    return { ...data, status: data.status || 'Idle' };
  },

  // --- Metrics ---
  getMetrics: async (): Promise<Metrics> => {
    const res = await fetch(`${BASE_URL}/api/v1/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  // --- Memory ---
  getMemory: async (): Promise<MemoryEntry[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/memory`);
    if (!res.ok) throw new Error('Failed to fetch memory');
    return res.json();
  },

  // --- Needs Attention ---
  getNeedsAttention: async (): Promise<AttentionItem[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/attention`);
    if (!res.ok) throw new Error('Failed to fetch attention items');
    return res.json();
  },

  // --- Tasks ---
  getTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  // --- Mutations ---
  updateAgentStatus: async (id: string, status: AgentStatus): Promise<void> => {
    await fetch(`${BASE_URL}/api/v1/agents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  injectInstruction: async (id: string, instruction: string): Promise<void> => {
    await fetch(`${BASE_URL}/api/v1/agents/${id}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });
  },

  hireAgent: async (role: string, name: string, goal: string): Promise<void> => {
    await fetch(`${BASE_URL}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name, goal }),
    });
  },
};
