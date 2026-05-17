import type { ResolveRoutingReviewRequest } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRoutingReviewItems, resolveRoutingReviewItem } from "../lib/api/adapters/routing-review.js";

export const routingReviewKeys = {
  all: ["routing-review"] as const,
  list: () => [...routingReviewKeys.all, "list"] as const
};

export function useRoutingReviewItems(enabled = true) {
  return useQuery({
    enabled,
    queryKey: routingReviewKeys.list(),
    queryFn: listRoutingReviewItems
  });
}

export function useResolveRoutingReviewItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, body }: { body: ResolveRoutingReviewRequest; itemId: string }) => resolveRoutingReviewItem(itemId, body),
    onSuccess: async () => {
      toast.success("Routing review item resolved");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: routingReviewKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["app-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["deals"] })
      ]);
    },
    onError: () => toast.error("Could not resolve routing review item")
  });
}
