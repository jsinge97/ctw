import type { DealDto } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDealWorkspace, listDealCards, moveDealStage } from "../lib/api/adapters/deals.js";

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
