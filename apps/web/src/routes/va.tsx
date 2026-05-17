import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function VaRoute() {
  const session = useCurrentSession();

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>VA queue</h1>
          <p>Internal execution work with handoff history and submission review.</p>
        </div>
      </section>
      <section className="split-surface">
        <div className="queue-list">
          <button className="queue-row queue-row-active">
            <strong>Pull estoppel cert</strong>
            <span>Sutter Tower - Floor 14</span>
            <Badge tone="purple">Queued</Badge>
          </button>
        </div>
        <aside className="detail-panel">
          <h2>Pull estoppel cert</h2>
          <p>Reach out to building management.</p>
          <div className="action-row">
            <Button variant="primary">Accept</Button>
            <Button>Submit</Button>
            <Button>Send back</Button>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
