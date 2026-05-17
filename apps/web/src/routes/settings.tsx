import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function SettingsRoute() {
  const session = useCurrentSession();

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>Organization settings</h1>
          <p>Channels, routing threshold, and permission-sensitive defaults.</p>
        </div>
      </section>
      <section className="settings-grid">
        <article className="settings-panel">
          <h2>Routing threshold</h2>
          <p>Messages below the threshold enter routing review.</p>
          <div className="metric-row">
            <strong>80%</strong>
            <Badge tone="amber">Configurable</Badge>
          </div>
          <Button>Preview impact</Button>
        </article>
        <article className="settings-panel">
          <h2>Channels</h2>
          <div className="channel-row">
            <span>deals@northgate.cre</span>
            <Badge tone="green">Resend active</Badge>
          </div>
          <div className="channel-row">
            <span>+1 415 555 0188</span>
            <Badge tone="green">Twilio active</Badge>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
