import type { SendBackVaWorkRequest, VaWorkDecisionRequest } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { decideVaWorkItem, listVaWorkItems, type VaWorkDecisionKind } from "../lib/api/adapters/va-work.js";

export const vaWorkKeys = {
  all: ["va-work"] as const,
  list: () => [...vaWorkKeys.all, "list"] as const
};

export function useVaWorkItems(enabled = true) {
  return useQuery({
    enabled,
    queryKey: vaWorkKeys.list(),
    queryFn: listVaWorkItems
  });
}

export function useDecideVaWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, decision, itemId }: { body: SendBackVaWorkRequest | VaWorkDecisionRequest; decision: VaWorkDecisionKind; itemId: string }) =>
      decideVaWorkItem(itemId, decision, body),
    onSuccess: async () => {
      toast.success("VA queue updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vaWorkKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["app-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["deals"] })
      ]);
    },
    onError: () => toast.error("Could not update VA work item")
  });
}
