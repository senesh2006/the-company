"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AgentStatus, HireWorkerPayload, TrustTier, HiringModel } from './api';

export const useAgents = () => {
    return useQuery({
        queryKey: ['agents'],
        queryFn: api.getAgents,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useAgent = (id: string) => {
    return useQuery({
        queryKey: ['agent', id],
        queryFn: () => api.getAgent(id),
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

export const useNeedsAttention = () => {
    return useQuery({
        queryKey: ['needs-attention'],
        queryFn: api.getNeedsAttention,
        refetchInterval: 5000,
        retry: 1,
        staleTime: 3000,
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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['agent', variables.id] });
        },
    });
};

export const useInjectInstruction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, instruction }: { id: string, instruction: string }) => 
            api.injectInstruction(id, instruction),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['agent', variables.id] });
        },
    });
};
