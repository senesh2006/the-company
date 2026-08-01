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

// Default agent fields
const defaultAgent = (partial: Partial<Agent> & { id: string; role: string; name: string }): Agent => ({
  costSoFar: 0,
  thoughts: [],
  actions: [],
  status: 'Idle',
  ...partial,
});

// Mock Data
const MOCK_AGENTS: Agent[] = [
  defaultAgent({ id: 'global-supervisor', role: 'Global Supervisor', name: 'Global Supervisor', status: 'Running', costSoFar: 0, thoughts: ['Analyzing incoming request...', 'Delegating sub-tasks to workers.'], actions: ['create_task(researcher-1, "Research AutoGen vs LangGraph")'] }),
  defaultAgent({ id: 'researcher-1', role: 'Researcher', name: 'Web Scraper Alpha', status: 'Running', current_task_id: 'task-1', confidence: 92, cost_today: 4.50, costSoFar: 4.50, currentGoal: 'Compare AutoGen and LangGraph frameworks', thoughts: ['Starting documentation scrape...'], actions: ['web_search("LangGraph routing docs")'] }),
  defaultAgent({ id: 'sub-researcher-1', role: 'Data Scraper', name: 'Temp Sub-Worker', status: 'Running', current_task_id: 'task-1.1', confidence: 88, cost_today: 0.50, costSoFar: 0.50, currentGoal: 'Scrape LangGraph documentation' }),
  defaultAgent({ id: 'coder-1', role: 'Coder', name: 'Logic Builder', status: 'Idle', confidence: 95, cost_today: 2.10, costSoFar: 2.10, currentGoal: 'Waiting for research results' }),
  defaultAgent({ id: 'writer-1', role: 'Writer', name: 'Report Generator', status: 'Running', current_task_id: 'task-2', confidence: 98, cost_today: 1.25, costSoFar: 1.25, currentGoal: 'Draft executive summary' }),
];

const MOCK_TASKS: Task[] = [
  { id: 'task-1', description: 'Research AutoGen vs LangGraph', status: 'running', assignee_id: 'researcher-1', assignee_role: 'Researcher' },
  { id: 'task-1.1', description: 'Scrape LangGraph Docs', status: 'running', assignee_id: 'sub-researcher-1', assignee_role: 'Data Scraper', parent_id: 'task-1' },
  { id: 'task-2', description: 'Draft Executive Summary', status: 'running', assignee_id: 'writer-1', assignee_role: 'Writer' },
];

const MOCK_METRICS: Metrics = {
  totalAgents: 5,
  activeAgents: 3,
  totalTasks: 3,
  completedTasks: 0,
  totalCost: 8.35,
  riskLevel: 'low',
};

const MOCK_MEMORY: MemoryEntry[] = [
  { id: 'm1', key: 'langgraph_overview', value: 'LangGraph uses explicit StateGraph edges with conditional routing...', updatedBy: 'researcher-1', timestamp: new Date().toISOString() },
  { id: 'm2', key: 'autogen_overview', value: 'AutoGen 0.4 uses AgentChat teams with event-driven handoffs...', updatedBy: 'sub-researcher-1', timestamp: new Date().toISOString() },
];

const MOCK_ATTENTION: AttentionItem[] = [
  { id: 'a1', type: 'approval', title: 'High-cost operation pending', description: 'Researcher wants to scrape 15 additional documentation pages. Estimated cost: $2.50.', agentId: 'researcher-1', agentName: 'Web Scraper Alpha', timestamp: new Date().toISOString() },
];

const BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : '';

// Helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- Hierarchy ---
  getHierarchy: async (businessId: string): Promise<HierarchyNode> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) {
      await delay(300);
      return {
        agent: MOCK_AGENTS.find(a => a.id === 'global-supervisor')!,
        children: [
          {
            agent: MOCK_AGENTS.find(a => a.id === 'researcher-1')!,
            children: [
              { agent: MOCK_AGENTS.find(a => a.id === 'sub-researcher-1')!, children: [] }
            ]
          },
          { agent: MOCK_AGENTS.find(a => a.id === 'coder-1')!, children: [] },
          { agent: MOCK_AGENTS.find(a => a.id === 'writer-1')!, children: [] }
        ]
      };
    }
    const res = await fetch(`${BASE_URL}/api/v1/hierarchy/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch hierarchy');
    return res.json();
  },

  // --- Tasks ---
  getTasks: async (businessId: string): Promise<Task[]> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_TASKS;
    const res = await fetch(`${BASE_URL}/api/v1/tasks/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.tasks || [];
  },

  // --- Agent Details ---
  getAgentDetails: async (agentId: string): Promise<Agent | null> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_AGENTS.find(a => a.id === agentId) || null;
    const res = await fetch(`${BASE_URL}/api/v1/agents/${agentId}`);
    if (!res.ok) throw new Error('Failed to fetch agent details');
    return res.json();
  },

  // --- Agents list ---
  getAgents: async (): Promise<Agent[]> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_AGENTS;
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
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_METRICS;
    const res = await fetch(`${BASE_URL}/api/v1/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  // --- Memory ---
  getMemory: async (): Promise<MemoryEntry[]> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_MEMORY;
    const res = await fetch(`${BASE_URL}/api/v1/memory`);
    if (!res.ok) throw new Error('Failed to fetch memory');
    return res.json();
  },

  // --- Needs Attention ---
  getNeedsAttention: async (): Promise<AttentionItem[]> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_ATTENTION;
    const res = await fetch(`${BASE_URL}/api/v1/attention`);
    if (!res.ok) throw new Error('Failed to fetch attention items');
    return res.json();
  },

  // --- Mutations ---
  updateAgentStatus: async (id: string, status: AgentStatus): Promise<void> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) { await delay(200); return; }
    await fetch(`${BASE_URL}/api/v1/agents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  },

  injectInstruction: async (id: string, instruction: string): Promise<void> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) { await delay(200); return; }
    await fetch(`${BASE_URL}/api/v1/agents/${id}/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });
  },

  hireAgent: async (role: string, name: string, initialGoal: string): Promise<void> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) { await delay(200); return; }
    await fetch(`${BASE_URL}/api/v1/agents/hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name, initialGoal }),
    });
  },
};
