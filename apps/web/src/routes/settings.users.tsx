import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/app-shell.js";
import { UsersSettingsScreen } from "../features/settings/users-settings-screen.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function SettingsUsersRoute() {
  const navigate = useNavigate();
  const session = useCurrentSession();
  const canView = Boolean(session.data?.capabilities.includes("viewSettingsUsers"));

  useEffect(() => {
    if (session.isError) void navigate({ to: "/login" });
  }, [navigate, session.isError]);

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>User settings</h1>
          <p>Organization users, invitations, and role state.</p>
        </div>
      </section>
      {session.isPending ? <div className="error-panel error-panel-neutral">Loading settings...</div> : null}
      {!canView && session.data ? <div className="error-panel">You do not have access to user settings.</div> : null}
      {canView ? <UsersSettingsScreen session={session.data} /> : null}
    </AppShell>
  );
}
