import { AppShell } from "../components/app-shell.js";
import { Badge } from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import { useCurrentSession } from "../hooks/use-current-session.js";
import { useDecideVaWorkItem, useVaWorkItems } from "../hooks/use-va-work.js";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function VaRoute() {
  const navigate = useNavigate();
  const session = useCurrentSession();
  const canView = Boolean(session.data?.capabilities.includes("viewVaQueue"));
  const workItems = useVaWorkItems(canView);
  const decide = useDecideVaWorkItem();
  const [selectedId, setSelectedId] = useUrlQueueState("work");
  const activeItems = (workItems.data ?? []).filter((item) => item.status !== "accepted" && item.status !== "canceled");
  const selectedItem = activeItems.find((item) => item.id === selectedId) ?? activeItems[0] ?? null;

  useEffect(() => {
    if (session.isError) void navigate({ to: "/login" });
  }, [navigate, session.isError]);

  return (
    <AppShell session={session.data}>
      <section className="page-header">
        <div>
          <h1>VA queue</h1>
          <p>Internal execution work with handoff history and submission review.</p>
        </div>
      </section>
      {!canView && session.data ? <div className="error-panel">You do not have access to the VA queue.</div> : null}
      {workItems.isPending && canView ? <div className="error-panel error-panel-neutral">Loading VA queue...</div> : null}
      {workItems.isError ? <div className="error-panel">Could not load VA queue.</div> : null}
      <section className="split-surface">
        <div className="queue-list">
          {activeItems.length === 0 ? <p className="empty-state">No VA work is waiting.</p> : null}
          {activeItems.map((item) => (
            <button className={item.id === selectedItem?.id ? "queue-row queue-row-active" : "queue-row"} key={item.id} onClick={() => setSelectedId(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.dealTitle}</span>
              <Badge tone={item.status === "submitted" ? "amber" : "purple"}>{item.status.replace("_", " ")}</Badge>
            </button>
          ))}
        </div>
        <aside className="detail-panel">
          {selectedItem ? (
            <VaDetail
              canApprove={Boolean(session.data?.capabilities.includes("approveProposedAction"))}
              isPending={decide.isPending}
              item={selectedItem}
              onDecide={(decision, body) => decide.mutate({ itemId: selectedItem.id, decision, body })}
            />
          ) : (
            <p className="empty-state">Select a VA work item.</p>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function VaDetail({
  canApprove,
  isPending,
  item,
  onDecide
}: {
  canApprove: boolean;
  isPending: boolean;
  item: NonNullable<ReturnType<typeof useVaWorkItems>["data"]>[number];
  onDecide: (decision: "start" | "accept" | "submit" | "send-back" | "cancel", body: { notes?: string; reason?: string; submittedPayload?: Record<string, unknown> }) => void;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [reason, setReason] = useState("");
  return (
    <>
      <div className="detail-heading">
        <div>
          <h2>{item.title}</h2>
          <p>{item.status.replace("_", " ")} · {item.assignedTo ?? "Unassigned"}</p>
        </div>
        <Badge tone="purple">VA</Badge>
      </div>
      <p>{item.instructions}</p>
      <Link className="button button-secondary button-sm link-button" to="/deals/$dealId" params={{ dealId: item.dealId }}>
        Open deal
      </Link>
      <label className="inline-label">
        Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="action-row">
        {item.status === "queued" ? <Button variant="primary" isLoading={isPending} loadingLabel="Accepting" onClick={() => onDecide("start", { notes })}>Accept</Button> : null}
        {["queued", "in_progress", "sent_back"].includes(item.status) ? <Button isLoading={isPending} loadingLabel="Submitting" onClick={() => onDecide("submit", { notes, submittedPayload: { notes } })}>Submit</Button> : null}
        {item.status === "submitted" && canApprove ? <Button variant="primary" isLoading={isPending} loadingLabel="Accepting" onClick={() => onDecide("accept", { notes })}>Accept submission</Button> : null}
      </div>
      {item.status === "submitted" && canApprove ? (
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim()) onDecide("send-back", { reason: reason.trim(), notes });
          }}
        >
          <label>
            Send back reason
            <input value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <Button type="submit" variant="danger" isLoading={isPending} loadingLabel="Sending back">Send back</Button>
        </form>
      ) : null}
      {item.history.length > 0 ? (
        <div className="activity-list">
          {item.history.map((event) => (
            <div className="activity-row" key={`${event.status}-${event.createdAt}`}>
              <strong>{event.status}</strong>
              <span>{event.actor} · {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric" }).format(new Date(event.createdAt))}</span>
            </div>
          ))}
        </div>
      ) : null}
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
