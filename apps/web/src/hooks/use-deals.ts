import type { DealDto } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addParticipant,
  archiveDocument,
  createDocument,
  createTask,
  decideTask,
  getDealWorkspace,
  listDealCards,
  moveDealStage,
  updateDocument,
  updateMessage,
  updateParticipant,
  uploadDocument,
  type TaskDecisionKind
} from "../lib/api/adapters/deals.js";
import type { AddParticipantRequest, CreateTaskRequest, TaskDecisionRequest, UpdateDocumentRequest, UpdateMessageRequest, UpdateParticipantRequest } from "@ctw/contracts";

export const dealKeys = {
  all: ["deals"] as const,
  cards: () => [...dealKeys.all, "cards"] as const,
  workspace: (dealId: string) => [...dealKeys.all, "workspace", dealId] as const
};

export function useDealCards() {
  return useQuery({
    queryKey: dealKeys.cards(),
    queryFn: listDealCards
  });
}

export function useDealWorkspace(dealId: string) {
  return useQuery({
    queryKey: dealKeys.workspace(dealId),
    queryFn: () => getDealWorkspace(dealId)
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, stage }: { dealId: string; stage: DealDto["stage"] }) => moveDealStage(dealId, { stage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all });
    }
  });
}

function useWorkspaceMutation<TInput, TOutput>(dealId: string, mutationFn: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: dealKeys.workspace(dealId) }), queryClient.invalidateQueries({ queryKey: dealKeys.cards() })]);
    }
  });
}

export function useUpdateMessage(dealId: string) {
  return useWorkspaceMutation(dealId, ({ messageId, body }: { messageId: string; body: UpdateMessageRequest }) => updateMessage(dealId, messageId, body));
}

export function useCreateDocument(dealId: string) {
  return useWorkspaceMutation(dealId, (body: UpdateDocumentRequest) => createDocument(dealId, body));
}

export function useUpdateDocument(dealId: string) {
  return useWorkspaceMutation(dealId, ({ documentId, body }: { documentId: string; body: UpdateDocumentRequest }) => updateDocument(dealId, documentId, body));
}

export function useArchiveDocument(dealId: string) {
  return useWorkspaceMutation(dealId, (documentId: string) => archiveDocument(dealId, documentId));
}

export function useUploadDocument(dealId: string) {
  return useWorkspaceMutation(dealId, (file: File) => uploadDocument(dealId, file));
}

export function useCreateTask(dealId: string) {
  return useWorkspaceMutation(dealId, (body: CreateTaskRequest) => createTask(dealId, body));
}

export function useDecideTask(dealId: string) {
  return useWorkspaceMutation(dealId, ({ taskId, decision, body }: { taskId: string; decision: TaskDecisionKind; body: TaskDecisionRequest }) => decideTask(taskId, decision, body));
}

export function useAddParticipant(dealId: string) {
  return useWorkspaceMutation(dealId, (body: AddParticipantRequest) => addParticipant(dealId, body));
}

export function useUpdateParticipant(dealId: string) {
  return useWorkspaceMutation(dealId, ({ participantId, body }: { participantId: string; body: UpdateParticipantRequest }) => updateParticipant(dealId, participantId, body));
}
