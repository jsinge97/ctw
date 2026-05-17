import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { useCurrentSession } from "../hooks/use-current-session.js";

export function RoutingReviewRoute() {
  const session = useCurrentSession();

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>Routing review</h1>
          <p>Low-confidence channel items that need a human filing decision.</p>
        </div>
        <Badge tone="amber">Threshold 80%</Badge>
      </section>
      <section className="split-surface">
        <div className="queue-list">
          <button className="queue-row queue-row-active">
            <strong>401 Bryant - interested party</strong>
            <span>Saw the listing and can tour Friday.</span>
            <Badge tone="amber">41% confidence</Badge>
          </button>
        </div>
        <aside className="detail-panel">
          <h2>File message</h2>
          <p>Subject mentions address; sender is new.</p>
          <div className="action-row">
            <Button variant="primary">Assign to Bryant</Button>
            <Button>Create deal</Button>
            <Button>Unrelated</Button>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
