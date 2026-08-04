"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AgentStatus, HireWorkerPayload, TrustTier, HiringModel, ModelOption } from './api';

export const useAgents = () => {
    return useQuery({
        queryKey: ['agents'],
        queryFn: api.getAgents,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useAvailableModels = () => {
    return useQuery<ModelOption[]>({
        queryKey: ['available-models'],
        queryFn: api.getAvailableModels,
        retry: 1,
        staleTime: 60000,
    });
};

export const useAgent = (id: string) => {
    return useQuery({
        queryKey: ['agent', id],
        queryFn: () => api.getAgent(id),
        enabled: Boolean(id),
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useHierarchy = () => {
    return useQuery({
        queryKey: ['hierarchy'],
        queryFn: api.getHierarchy,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useMetrics = () => {
    return useQuery({
        queryKey: ['metrics'],
        queryFn: api.getMetrics,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useMemory = () => {
    return useQuery({
        queryKey: ['memory'],
        queryFn: api.getMemory,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useKnowledgeDocuments = (category?: string) => {
    return useQuery({
        queryKey: ['knowledge-documents', category || 'all'],
        queryFn: () => api.getKnowledgeDocuments(category),
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useKnowledgeDocument = (docId: string) => {
    return useQuery({
        queryKey: ['knowledge-document', docId],
        queryFn: () => api.getKnowledgeDocument(docId),
        enabled: Boolean(docId),
        retry: 1,
    });
};

export const useUploadDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, category, title }: { file: File; category?: string; title?: string }) =>
            api.uploadKnowledgeDocument(file, category, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
            queryClient.invalidateQueries({ queryKey: ['memory'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (docId: string) => api.deleteKnowledgeDocument(docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
            queryClient.invalidateQueries({ queryKey: ['memory'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useSetMemory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value, tags }: { key: string; value: any; tags?: string[] }) =>
            api.setMemory(key, value, tags),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memory'] });
        },
    });
};

export const useNeedsAttention = () => {
    return useQuery({
        queryKey: ['needs-attention'],
        queryFn: api.getNeedsAttention,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useApprovals = () => {
    return useQuery({
        queryKey: ['approvals'],
        queryFn: api.getNeedsAttention,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useResolveApproval = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ approvalId, status, reason }: { approvalId: string; status: 'approved' | 'rejected' | 'revise'; reason?: string }) =>
            api.reviewTask(approvalId, status, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['needs-attention'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useTasks = () => {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: api.getTasks,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ title, assigned_agent_id, priority, description }: { title: string; assigned_agent_id?: string; priority?: string; description?: string }) =>
            api.dispatchMandate({
                mandate: `${title}: ${description || ''}`,
                priority: priority === 'P0' ? 'high' : priority === 'P1' ? 'normal' : 'low',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useCompanyFeed = (limit: number = 50) => {
    return useQuery({
        queryKey: ['company-feed', limit],
        queryFn: () => api.getCompanyFeed(limit),
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useHireAgent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: HireWorkerPayload | { role: string; name: string; goal?: string; trust_tier?: TrustTier; specialization_id?: string; hiring_model?: HiringModel }) => 
            api.hireAgent(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useUpdateAgentStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string, status: AgentStatus }) => 
            api.updateAgentStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
        },
    });
};

export const usePromoteWorker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ agentId, targetTier }: { agentId: string; targetTier?: TrustTier }) =>
            api.promoteWorker(agentId, targetTier),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useDemoteWorker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ agentId, reason }: { agentId: string; reason?: string }) =>
            api.demoteWorker(agentId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useInjectInstruction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, instruction }: { id: string, instruction: string }) => 
            api.injectInstruction(id, instruction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};
