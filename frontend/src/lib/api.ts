import { useAppStore } from './store';

// Types
export interface Agent {
  id: string;
  role: string;
  name: string;
  status: 'idle' | 'running' | 'assigned' | 'failed' | 'paused' | 'temp_supervisor';
  current_task_id?: string;
  confidence?: number;
  cost_today?: number;
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

// Mock Data
const MOCK_AGENTS: Agent[] = [
  { id: 'global-supervisor', role: 'Global Supervisor', name: 'Global Supervisor', status: 'idle' },
  { id: 'researcher-1', role: 'Researcher', name: 'Web Scraper Alpha', status: 'temp_supervisor', current_task_id: 'task-1', confidence: 92, cost_today: 4.50 },
  { id: 'sub-researcher-1', role: 'Data Scraper', name: 'Temp Sub-Worker', status: 'running', current_task_id: 'task-1.1', confidence: 88, cost_today: 0.50 },
  { id: 'coder-1', role: 'Coder', name: 'Logic Builder', status: 'idle', confidence: 95, cost_today: 2.10 },
  { id: 'writer-1', role: 'Writer', name: 'Report Generator', status: 'assigned', current_task_id: 'task-2', confidence: 98, cost_today: 1.25 }
];

const MOCK_TASKS: Task[] = [
  { id: 'task-1', description: 'Research AutoGen vs LangGraph', status: 'running', assignee_id: 'researcher-1', assignee_role: 'Researcher' },
  { id: 'task-1.1', description: 'Scrape LangGraph Docs', status: 'running', assignee_id: 'sub-researcher-1', assignee_role: 'Data Scraper', parent_id: 'task-1' },
  { id: 'task-2', description: 'Draft Executive Summary', status: 'assigned', assignee_id: 'writer-1', assignee_role: 'Writer' }
];

export const api = {
  getHierarchy: async (businessId: string): Promise<HierarchyNode> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
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
    
    // Real API call
    const res = await fetch(`/api/v1/hierarchy/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch hierarchy');
    return res.json();
  },

  getTasks: async (businessId: string): Promise<Task[]> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_TASKS;
    
    const res = await fetch(`/api/v1/tasks/${businessId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const data = await res.json();
    return data.tasks || [];
  },
  
  getAgentDetails: async (agentId: string): Promise<Agent | null> => {
    const isMock = useAppStore.getState().isMockMode;
    if (isMock) return MOCK_AGENTS.find(a => a.id === agentId) || null;
    
    const res = await fetch(`/api/v1/agents/${agentId}`);
    if (!res.ok) throw new Error('Failed to fetch agent details');
    return res.json();
  }
};
