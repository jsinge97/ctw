import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { useCurrentSession } from "../hooks/use-current-session.js";
import { useResolveRoutingReviewItem, useRoutingReviewItems } from "../hooks/use-routing-review.js";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function RoutingReviewRoute() {
  const navigate = useNavigate();
  const session = useCurrentSession();
  const canView = Boolean(session.data?.capabilities.includes("viewRoutingReview"));
  const items = useRoutingReviewItems(canView);
  const resolveItem = useResolveRoutingReviewItem();
  const [selectedId, setSelectedId] = useUrlQueueState("item");
  const openItems = (items.data ?? []).filter((item) => item.status === "open");
  const selectedItem = openItems.find((item) => item.id === selectedId) ?? openItems[0] ?? null;

  useEffect(() => {
    if (session.isError) void navigate({ to: "/login" });
  }, [navigate, session.isError]);

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>Routing review</h1>
          <p>Low-confidence channel items that need a human filing decision.</p>
        </div>
        <Badge tone="amber">Threshold 80%</Badge>
      </section>
      {!canView && session.data ? <div className="error-panel">You do not have access to routing review.</div> : null}
      {items.isPending && canView ? <div className="error-panel error-panel-neutral">Loading routing review...</div> : null}
      {items.isError ? <div className="error-panel">Could not load routing review.</div> : null}
      <section className="split-surface">
        <div className="queue-list">
          {openItems.length === 0 ? <p className="empty-state">No messages need routing review.</p> : null}
          {openItems.map((item) => (
            <button className={item.id === selectedItem?.id ? "queue-row queue-row-active" : "queue-row"} key={item.id} onClick={() => setSelectedId(item.id)}>
              <strong>{item.subject ?? item.preview}</strong>
              <span>{item.preview}</span>
              <span className="queue-meta">
                <Badge tone="amber">{Math.round(item.confidence * 100)}% confidence</Badge>
                <span>{item.ageLabel}</span>
              </span>
            </button>
          ))}
        </div>
        <aside className="detail-panel">
          {selectedItem ? (
            <RoutingReviewDetail
              isPending={resolveItem.isPending}
              item={selectedItem}
              onAssign={() => selectedItem.suggestedDealId ? resolveItem.mutate({ itemId: selectedItem.id, body: { resolution: "assign", dealId: selectedItem.suggestedDealId } }) : undefined}
              onCreate={(title) => resolveItem.mutate({ itemId: selectedItem.id, body: { resolution: "create_deal", newDealTitle: title } })}
              onUnrelated={() => resolveItem.mutate({ itemId: selectedItem.id, body: { resolution: "unrelated" } })}
            />
          ) : (
            <p className="empty-state">Select a message to review.</p>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function RoutingReviewDetail({
  isPending,
  item,
  onAssign,
  onCreate,
  onUnrelated
}: {
  isPending: boolean;
  item: NonNullable<ReturnType<typeof useRoutingReviewItems>["data"]>[number];
  onAssign: () => void;
  onCreate: (title: string) => void;
  onUnrelated: () => void;
}) {
  const [title, setTitle] = useState(item.suggestedDealTitle ?? item.subject ?? "");
  return (
    <>
      <h2>File message</h2>
      <p>{item.explanation}</p>
      <div className="message-body">{item.preview}</div>
      <div className="facts-grid">
        <span>Sender</span>
        <strong>{item.sender}</strong>
        <span>Suggested deal</span>
        <strong>{item.suggestedDealTitle ?? "No suggested deal"}</strong>
      </div>
      <div className="action-row">
        {item.suggestedDealId ? (
          <Button variant="primary" isLoading={isPending} loadingLabel="Assigning" onClick={onAssign}>
            Assign to {item.suggestedDealTitle ?? "deal"}
          </Button>
        ) : null}
        <Button isLoading={isPending} loadingLabel="Marking" onClick={onUnrelated}>Unrelated</Button>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) onCreate(title.trim());
        }}
      >
        <label>
          Create new deal
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <Button type="submit" isLoading={isPending} loadingLabel="Creating">Create and file</Button>
      </form>
    </>
  );
}

function useUrlQueueState(paramName: string) {
  const readValue = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(paramName));
  const [value, setValue] = useState<string | null>(readValue);
  function updateValue(nextValue: string | null) {
    const url = new URL(window.location.href);
    if (nextValue) url.searchParams.set(paramName, nextValue);
    else url.searchParams.delete(paramName);
    window.history.replaceState({}, "", url);
    setValue(nextValue);
  }
  return [value, updateValue] as const;
}
