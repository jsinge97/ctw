import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getCurrentSession, login, logout } from "../lib/api/adapters/session.js";
import { queryClient } from "../lib/query-client.js";

export function useCurrentSession() {
  return useQuery({
    queryKey: ["session", "current"],
    queryFn: getCurrentSession,
    retry: false
  });
}

export function useLogin() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      toast.success("Signed in");
      queryClient.setQueryData(["session", "current"], session);
      void navigate({ to: session.homeRoute });
    },
    onError: () => toast.error("Could not sign in")
  });
}

export function useLogout() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      toast.success("Signed out");
      queryClient.removeQueries({ queryKey: ["session", "current"] });
      void navigate({ to: "/login" });
    }
  });
}
