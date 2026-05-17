import { Navigate } from "@tanstack/react-router";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function IndexRoute() {
  const session = useCurrentSession();
  if (session.isPending) return null;
  if (session.isError || !session.data) return <Navigate to="/login" />;
  return <Navigate to={session.data.homeRoute} />;
}
