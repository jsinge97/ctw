import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "../components/app-shell.js";
import { OrganizationSettingsScreen } from "../features/settings/organization-settings-screen.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function SettingsRoute() {
  const navigate = useNavigate();
  const session = useCurrentSession();
  const canView = Boolean(session.data?.capabilities.includes("viewSettingsOrganization"));

  useEffect(() => {
    if (session.isError) void navigate({ to: "/login" });
  }, [navigate, session.isError]);

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>Organization settings</h1>
          <p>Channels, routing threshold, and organization profile.</p>
        </div>
      </section>
      {session.isPending ? <div className="error-panel error-panel-neutral">Loading settings...</div> : null}
      {!canView && session.data ? <div className="error-panel">You do not have access to organization settings.</div> : null}
      {canView ? <OrganizationSettingsScreen session={session.data} /> : null}
    </AppShell>
  );
}
