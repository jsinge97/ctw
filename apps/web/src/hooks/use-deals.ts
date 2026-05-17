import type { DealDto } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDealCards, moveDealStage } from "../lib/api/adapters/deals.js";

export const dealKeys = {
  all: ["deals"] as const,
  cards: () => [...dealKeys.all, "cards"] as const
};

export function useDealCards() {
  return useQuery({
    queryKey: dealKeys.cards(),
    queryFn: listDealCards
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
