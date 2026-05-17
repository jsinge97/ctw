import { useQuery } from "@tanstack/react-query";
import { globalSearch } from "../lib/api/adapters/search.js";

export function useGlobalSearch(query: string, enabled = true) {
  return useQuery({
    enabled: enabled && query.trim().length >= 2,
    queryKey: ["global-search", query.trim()],
    queryFn: () => globalSearch(query),
    staleTime: 15_000
  });
}
