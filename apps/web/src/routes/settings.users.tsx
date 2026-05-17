import { AppShell } from "../components/app-shell.js";
import { UsersSettingsScreen } from "../features/settings/users-settings-screen.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function SettingsUsersRoute() {
  const session = useCurrentSession();

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>User settings</h1>
          <p>Organization users, invitations, and role state.</p>
        </div>
      </section>
      <UsersSettingsScreen session={session.data} />
    </AppShell>
  );
}
