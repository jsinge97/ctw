import { useQuery } from "@tanstack/react-query";
import { getAppSummary } from "../lib/api/adapters/app-summary.js";

export function useAppSummary(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["app-summary"],
    queryFn: getAppSummary,
    refetchInterval: 30_000
  });
}
