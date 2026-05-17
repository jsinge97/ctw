import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "../lib/api/adapters/session.js";

export function useCurrentSession() {
  return useQuery({
    queryKey: ["session", "current"],
    queryFn: getCurrentSession
  });
}
