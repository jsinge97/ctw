import type { DealDto } from "@ctw/contracts";
import { AlertCircle, GripVertical, Plus } from "lucide-react";
import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { useCurrentSession } from "../hooks/use-current-session.js";
import { useDealCards } from "../hooks/use-deals.js";
import type { DealCardModel } from "../lib/api/adapters/deals.js";

const stages: Array<{ id: DealDto["stage"]; label: string }> = [
  { id: "prospect", label: "Prospect" },
  { id: "loi", label: "LOI" },
  { id: "negotiation", label: "Negotiation" },
  { id: "diligence", label: "Diligence" },
  { id: "close", label: "Close" },
  { id: "closed_won", label: "Closed won" },
  { id: "lost", label: "Lost" }
];

export function DealsRoute() {
  const session = useCurrentSession();
  const deals = useDealCards();

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>Deals</h1>
          <p>Stage work, one next action, and review pressure in one scan.</p>
        </div>
        {session.data?.capabilities.includes("editDealFields") ? (
          <Button variant="primary">
            <Plus size={16} aria-hidden />
            New deal
          </Button>
        ) : null}
      </section>

      <section className="filter-bar" aria-label="Deal filters">
        <button className="filter-chip filter-chip-active">All owners</button>
        <button className="filter-chip">Stale</button>
        <button className="filter-chip">Pending approval</button>
        <button className="filter-chip">Participant company</button>
      </section>

      {deals.isPending ? <KanbanSkeleton /> : null}
      {deals.isError ? <div className="error-panel">Could not load deals.</div> : null}
      {deals.data ? <DealKanban deals={deals.data} /> : null}
    </AppShell>
  );
}

function DealKanban({ deals }: { deals: DealCardModel[] }) {
  return (
    <section className="kanban-board" aria-label="Deal kanban board">
      {stages.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage.id);
        return (
          <article className="kanban-column" key={stage.id}>
            <header>
              <span>{stage.label}</span>
              <Badge>{stageDeals.length}</Badge>
            </header>
            <div className="kanban-card-list">
              {stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function DealCard({ deal }: { deal: DealCardModel }) {
  return (
    <Link className="deal-card" to="/deals/$dealId" params={{ dealId: deal.id }}>
      <span className="deal-card-topline">
        {deal.canMove ? <GripVertical size={14} aria-label="Can move stage" /> : <span />}
        <span className="avatar avatar-sm">{deal.ownerInitials}</span>
      </span>
      <strong>{deal.title}</strong>
      <span className="muted">{deal.company}</span>
      <span className="next-action">{deal.nextAction}</span>
      <span className="deal-card-footer">
        {deal.stale ? (
          <Badge tone="amber">
            <AlertCircle size={12} aria-hidden />
            Stale
          </Badge>
        ) : null}
        {deal.pendingApprovals > 0 ? <Badge tone="blue">{deal.pendingApprovals} approval</Badge> : null}
        <span>{deal.lastActivityLabel}</span>
      </span>
    </Link>
  );
}

function KanbanSkeleton() {
  return (
    <section className="kanban-board">
      {stages.slice(0, 5).map((stage) => (
        <article className="kanban-column" key={stage.id}>
          <header>
            <span>{stage.label}</span>
          </header>
          <Skeleton className="skeleton-card" />
          <Skeleton className="skeleton-card" />
        </article>
      ))}
    </section>
  );
}
import { Link } from "@tanstack/react-router";
