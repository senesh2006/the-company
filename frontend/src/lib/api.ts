import { useAppStore } from './store';

// Types
export type AgentStatus = 'Running' | 'Paused' | 'Idle' | 'Failed';

export interface Agent {
  id: string;
  role: string;
  name: string;
  status: AgentStatus;
  current_task_id?: string;
  confidence?: number;
  cost_today?: number;
  currentGoal?: string;
  costSoFar: number;
  thoughts: string[];
  actions: string[];
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'queued' | 'assigned' | 'running' | 'completed' | 'failed';
  assignee_id?: string;
  assignee_role?: string;
  parent_id?: string;
  result?: string;
}

export interface HierarchyNode {
  agent: Agent;
  children: HierarchyNode[];
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

const rawBaseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export const api = {
  // --- Hierarchy ---
  getHierarchy: async (businessId: string): Promise<HierarchyNode> => {
    const res = await fetch(`${BASE_URL}/api/v1/hierarchy/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch hierarchy');
    return res.json();
  },

  // --- Tasks ---
  getTasks: async (businessId: string): Promise<Task[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/tasks/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.tasks || [];
  },

  // --- Agent Details ---
  getAgentDetails: async (agentId: string): Promise<Agent | null> => {
    const res = await fetch(`${BASE_URL}/api/v1/agents/${agentId}`);
    if (!res.ok) throw new Error('Failed to fetch agent details');
    return res.json();
  },

  // --- Agents list ---
  getAgents: async (): Promise<Agent[]> => {
    const res = await fetch(`${BASE_URL}/api/v1/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  // --- Single agent (alias) ---
  getAgent: async (id: string): Promise<Agent | null> => {
    return api.getAgentDetails(id);
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

  hireAgent: async (role: string, name: string, initialGoal: string): Promise<void> => {
    await fetch(`${BASE_URL}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name, initialGoal }),
    });
  },
};
