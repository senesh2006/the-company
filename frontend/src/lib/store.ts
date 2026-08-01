import { create } from 'zustand';

interface AppState {
  businessId: string;
  selectedAgentId: string | null;
  setBusinessId: (id: string) => void;
  setSelectedAgentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  businessId: '123e4567-e89b-12d3-a456-426614174000', // Default business ID
  selectedAgentId: null,
  setBusinessId: (id) => set({ businessId: id }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
