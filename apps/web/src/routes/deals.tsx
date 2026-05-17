import type { DealDto } from "@ctw/contracts";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, GripVertical, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { KanbanBoard, KanbanBoardProvider, KanbanCard, KanbanColumn, KanbanColumnHeader, KanbanColumnList, KanbanColumnTitle } from "../components/ui/kanban.js";
import { Skeleton } from "../components/ui/skeleton.js";
import { useCurrentSession } from "../hooks/use-current-session.js";
import { useDealCards, useMoveDealStage } from "../hooks/use-deals.js";
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
  const moveDeal = useMoveDealStage();
  const navigate = useNavigate();
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [moveFeedback, setMoveFeedback] = useState<{ dealId: string; fromStage: DealDto["stage"]; toStage: DealDto["stage"] } | null>(null);
  const draggingDeal = draggingDealId ? deals.find((deal) => deal.id === draggingDealId) : undefined;

  function moveToStage(deal: DealCardModel, stage: DealDto["stage"]) {
    const reason = stageDropReason(deal, stage);
    if (reason) {
      setDraggingDealId(null);
      return;
    }
    setMoveFeedback({ dealId: deal.id, fromStage: deal.stage, toStage: stage });
    moveDeal.mutate({ dealId: deal.id, stage });
    setDraggingDealId(null);
  }

  return (
    <KanbanBoardProvider>
      {moveFeedback ? (
        <div className="kanban-feedback">
          <span>Moved to {labelForStage(moveFeedback.toStage)}.</span>
          <Button size="sm" onClick={() => moveDeal.mutate({ dealId: moveFeedback.dealId, stage: moveFeedback.fromStage })}>Undo</Button>
        </div>
      ) : null}
      <KanbanBoard aria-label="Deal kanban board">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stage === stage.id);
          const invalidReason = draggingDeal ? stageDropReason(draggingDeal, stage.id) : null;
          return (
            <KanbanColumn
              canDrop={!invalidReason}
              columnId={stage.id}
              invalidReason={invalidReason}
              key={stage.id}
              onDropOverColumn={(data) => {
                const deal = deals.find((item) => item.id === data.id);
                if (deal) moveToStage(deal, stage.id);
              }}
            >
              <KanbanColumnHeader>
                <KanbanColumnTitle columnId={stage.id}>{stage.label}</KanbanColumnTitle>
                <Badge>{stageDeals.length}</Badge>
              </KanbanColumnHeader>
              <KanbanColumnList>
                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    moving={moveDeal.isPending && moveDeal.variables?.dealId === deal.id}
                    onDragEnd={() => setDraggingDealId(null)}
                    onDragStart={() => setDraggingDealId(deal.id)}
                    onOpen={() => void navigate({ to: "/deals/$dealId", params: { dealId: deal.id } })}
                  />
                ))}
              </KanbanColumnList>
              {moveDeal.isError ? <p className="kanban-error">That stage move is not allowed yet.</p> : null}
            </KanbanColumn>
          );
        })}
      </KanbanBoard>
    </KanbanBoardProvider>
  );
}

function DealCard({
  deal,
  moving,
  onDragEnd,
  onDragStart,
  onOpen
}: {
  deal: DealCardModel;
  moving: boolean;
  onDragEnd: () => void;
  onDragStart: () => void;
  onOpen: () => void;
}) {
  return (
    <KanbanCard
      data={{ id: deal.id }}
      disabled={!deal.canMove}
      onClick={onOpen}
      onDragEnd={onDragEnd}
      onKanbanDragStart={onDragStart}
    >
      <span className="deal-card-topline">
        {deal.canMove ? <GripVertical className="drag-handle" size={14} aria-label="Drag to move stage" /> : <span />}
        <span className="avatar avatar-sm">{deal.ownerInitials}</span>
      </span>
      <strong>{deal.title}</strong>
      <span className="muted">{deal.company}</span>
      <span className="next-action">{deal.nextAction}</span>
      <span className="deal-card-footer">
        {moving ? <Badge tone="blue">Moving</Badge> : null}
        {deal.stale ? (
          <Badge tone="amber">
            <AlertCircle size={12} aria-hidden />
            Stale
          </Badge>
        ) : null}
        {deal.pendingApprovals > 0 ? <Badge tone="blue">{deal.pendingApprovals} approval</Badge> : null}
        <span>{deal.lastActivityLabel}</span>
      </span>
    </KanbanCard>
  );
}

export function stageDropReason(deal: DealCardModel, stage: DealDto["stage"]) {
  if (!deal.canMove) return "You do not have permission to move this deal.";
  if (deal.stage === stage) return "Already in this stage.";
  return null;
}

function labelForStage(stage: DealDto["stage"]) {
  return stages.find((item) => item.id === stage)?.label ?? stage;
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
