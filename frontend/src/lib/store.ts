import { create } from 'zustand';

interface AppState {
  businessId: string;
  isMockMode: boolean;
  selectedAgentId: string | null;
  setBusinessId: (id: string) => void;
  toggleMockMode: () => void;
  setSelectedAgentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  businessId: '123e4567-e89b-12d3-a456-426614174000', // Default mock/demo business ID
  isMockMode: true,
  selectedAgentId: null,
  setBusinessId: (id) => set({ businessId: id }),
  toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
