import type { ActivityEventDto } from "@ctw/contracts";
import { History } from "lucide-react";
import { Badge } from "../../components/ui/badge.js";

export function sortActivity(activity: ActivityEventDto[]) {
  return [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ActivityTab({ activity }: { activity: ActivityEventDto[] }) {
  return (
    <section className="activity-feed" aria-label="Activity feed">
      <header className="crud-toolbar">
        <div>
          <h2>Activity</h2>
          <p>Audit, approval, routing, and task history for this deal.</p>
        </div>
        <Badge tone="blue">{activity.length} events</Badge>
      </header>
      {sortActivity(activity).map((event) => (
        <article className="activity-feed-row" key={event.id}>
          <span className="crud-row-icon">
            <History size={16} aria-hidden />
          </span>
          <div>
            <strong>{event.action}</strong>
            <p>{event.summary}</p>
            <span>{event.actor} · {event.type} · {formatDateTime(event.createdAt)}</span>
          </div>
        </article>
      ))}
      {activity.length === 0 ? <p className="empty-state">No activity has been recorded for this deal.</p> : null}
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
