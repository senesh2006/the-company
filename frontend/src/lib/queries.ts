"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getBaseUrl, getAuthHeaders, AgentStatus, HireWorkerPayload, TrustTier, HiringModel, ModelOption } from './api';

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

// --- Finance & Google Sheets Hooks ---
export const useFinanceAccounts = () => {
    return useQuery({
        queryKey: ['finance-accounts'],
        queryFn: api.getFinanceAccounts,
        refetchInterval: 6000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useJournalEntries = () => {
    return useQuery({
        queryKey: ['finance-journal'],
        queryFn: api.getJournalEntries,
        refetchInterval: 6000,
        retry: 1,
        staleTime: 3000,
    });
};

export const useSheetsConfig = () => {
    return useQuery({
        queryKey: ['finance-sheets-config'],
        queryFn: api.getSheetsConfig,
        staleTime: 30000,
    });
};

export const useUpdateSheetsConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.updateSheetsConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-sheets-config'] });
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['finance-journal'] });
        },
    });
};

export const useSyncSheets = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.syncGoogleSheets,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['finance-journal'] });
            queryClient.invalidateQueries({ queryKey: ['finance-sheets-config'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const usePostJournalEntry = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.postJournalEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['finance-journal'] });
            queryClient.invalidateQueries({ queryKey: ['company-feed'] });
        },
    });
};

export const useCreateAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createOrUpdateAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
        },
    });
};

export const useClearFinanceData = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.clearFinanceData,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['finance-journal'] });
            queryClient.invalidateQueries({ queryKey: ['finance-sheets-config'] });
        },
    });
};

export const useInitializeFinanceTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.initializeFinanceTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['finance-journal'] });
            queryClient.invalidateQueries({ queryKey: ['finance-sheets-config'] });
        },
    });
};

export const useDepartmentDetails = (deptId: string) => {
    return useQuery({
        queryKey: ['department-details', deptId],
        queryFn: () => api.getDepartmentDetails(deptId),
        enabled: !!deptId,
        refetchInterval: 10000,
    });
};

export const useToggleDepartmentChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deptId, taskId }: { deptId: string; taskId: number }) =>
            api.toggleDepartmentChecklist(deptId, taskId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['department-details', variables.deptId] });
        },
    });
};

export const useDispatchDepartmentDirective = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deptId, directive, priority }: { deptId: string; directive: string; priority?: string }) =>
            api.dispatchDepartmentDirective(deptId, directive, priority),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['department-details', variables.deptId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['agents'] });
        },
    });
};

// --- WhatsApp (WAHA) Hooks ---

export const useWhatsAppStatus = (session?: string) => {
    return useQuery({
        queryKey: ['whatsapp-status', session || 'default'],
        queryFn: () => api.getWhatsAppStatus(session),
        refetchInterval: 5000,
    });
};

export const useWhatsAppQR = (session?: string) => {
    return useQuery({
        queryKey: ['whatsapp-qr', session || 'default'],
        queryFn: () => api.getWhatsAppQR(session),
        refetchInterval: 3000,
    });
};

export const useStartWhatsAppSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (session?: string) => api.startWhatsAppSession(session),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-qr'] });
        },
    });
};

export const useStopWhatsAppSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (session?: string) => api.stopWhatsAppSession(session),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-qr'] });
        },
    });
};

export const useSendWhatsAppMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ chatId, text, session }: { chatId: string; text: string; session?: string }) =>
            api.sendWhatsAppMessage(chatId, text, session),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
        },
    });
};

// --- Today's Executive Briefing Hooks ---
export const useTodayBriefing = () => {
    return useQuery({
        queryKey: ['today-briefing'],
        queryFn: () => api.getTodayBriefing(false),
        refetchInterval: 30000,
        staleTime: 15000,
        retry: 1,
    });
};

export const useRefreshTodayBriefing = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.refreshTodayBriefing,
        onSuccess: (data) => {
            queryClient.setQueryData(['today-briefing'], data);
        },
    });
};

// --- Integrations & Composio Connections Hooks ---
export const useConnections = () => {
    return useQuery({
        queryKey: ['connections'],
        queryFn: api.getConnections,
        refetchInterval: 15000,
        staleTime: 5000,
    });
};

export const useDiscoveredTools = () => {
    return useQuery({
        queryKey: ['discovered-tools'],
        queryFn: api.getDiscoveredTools,
        refetchInterval: 20000,
        staleTime: 10000,
    });
};

export const useInitiateConnection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { toolkit: string; redirect_url?: string }) =>
            api.initiateConnection(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['discovered-tools'] });
        },
    });
};

export const useDisconnectConnection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (toolkit: string) => api.disconnectConnection(toolkit),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['discovered-tools'] });
        },
    });
};

// --- Automated Routines Hooks ---

export const useRoutines = () => {
    return useQuery({
        queryKey: ['routines'],
        queryFn: api.getRoutines,
        refetchInterval: 15000,
        staleTime: 5000,
    });
};

export const useCreateRoutine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: api.createRoutine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
};

export const useUpdateRoutine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
            api.updateRoutine(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
};

export const useDeleteRoutine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.deleteRoutine(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
        },
    });
};

export const useRunRoutine = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.runRoutine(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['audit-feed'] });
        },
    });
};

// --- Live Task Execution Stream (SSE) ---

export interface TaskStreamEvent {
    node: string;
    status: string;
    content: any;
    timestamp?: string;
}

export const useTaskStream = (businessId?: string, taskId?: string) => {
    const [events, setEvents] = useState<TaskStreamEvent[]>([]);
    const [supervisorPlan, setSupervisorPlan] = useState<any>(null);
    const [workerResults, setWorkerResults] = useState<any[]>([]);
    const [synthesisResult, setSynthesisResult] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [streamError, setStreamError] = useState<string | null>(null);

    useEffect(() => {
        if (!businessId || !taskId) {
            setIsStreaming(false);
            return;
        }

        let isMounted = true;
        const abortController = new AbortController();

        const startStream = async () => {
            try {
                setIsStreaming(true);
                setStreamError(null);

                const baseUrl = getBaseUrl();
                const url = `${baseUrl}/api/v1/tasks/${businessId}/${taskId}/stream`;
                const headers = await getAuthHeaders();

                const response = await fetch(url, {
                    headers: {
                        ...headers,
                        Accept: 'text/event-stream',
                    },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`Stream connection failed: ${response.statusText}`);
                }

                const reader = response.body?.getReader();
                if (!reader) return;

                const decoder = new TextDecoder();
                let buffer = '';

                while (isMounted) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const chunk of lines) {
                        const trimmed = chunk.trim();
                        if (trimmed.startsWith('data:')) {
                            try {
                                const rawJson = trimmed.slice(5).trim();
                                if (!rawJson) continue;
                                const eventData: TaskStreamEvent = JSON.parse(rawJson);
                                if (!isMounted) break;

                                setEvents((prev) => [...prev, eventData]);

                                if (eventData.node === 'global_supervisor') {
                                    setSupervisorPlan(eventData.content);
                                } else if (eventData.node?.startsWith('worker_')) {
                                    setWorkerResults((prev) => [...prev, eventData.content]);
                                } else if (eventData.node === 'executive_synthesis') {
                                    setSynthesisResult(eventData.content?.synthesis || null);
                                } else if (eventData.node === 'end') {
                                    if (eventData.content?.result) {
                                        setSynthesisResult(eventData.content.result);
                                    }
                                    setIsStreaming(false);
                                }
                            } catch (parseErr) {
                                console.debug('Error parsing SSE event chunk:', parseErr);
                            }
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError' && isMounted) {
                    setStreamError(err.message || 'Stream connection error');
                }
            } finally {
                if (isMounted) {
                    setIsStreaming(false);
                }
            }
        };

        startStream();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [businessId, taskId]);

    return {
        events,
        supervisorPlan,
        workerResults,
        synthesisResult,
        isStreaming,
        streamError,
    };
};



