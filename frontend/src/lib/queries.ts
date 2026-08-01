"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AgentStatus } from './api';

export const useAgents = () => {
    return useQuery({
        queryKey: ['agents'],
        queryFn: api.getAgents,
        refetchInterval: 5000,
    });
};

export const useAgent = (id: string) => {
    return useQuery({
        queryKey: ['agent', id],
        queryFn: () => api.getAgent(id),
        refetchInterval: 5000,
    });
};

export const useMetrics = () => {
    return useQuery({
        queryKey: ['metrics'],
        queryFn: api.getMetrics,
        refetchInterval: 5000,
    });
};

export const useMemory = () => {
    return useQuery({
        queryKey: ['memory'],
        queryFn: api.getMemory,
        refetchInterval: 5000,
    });
};

export const useNeedsAttention = () => {
    return useQuery({
        queryKey: ['needs-attention'],
        queryFn: api.getNeedsAttention,
        refetchInterval: 5000,
    });
};

export const useTasks = () => {
    return useQuery({
        queryKey: ['tasks'],
        queryFn: api.getTasks,
        refetchInterval: 5000,
    });
};

export const useHireAgent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role, name, goal }: { role: string, name: string, goal: string }) => 
            api.hireAgent(role, name, goal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            queryClient.invalidateQueries({ queryKey: ['metrics'] });
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
