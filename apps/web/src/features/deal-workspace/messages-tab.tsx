import type { MessageDto } from "@ctw/contracts";
import { EyeOff, FolderSymlink, Lock, MessageSquareText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { useUpdateMessage } from "../../hooks/use-deals.js";
import { useUrlPanelState } from "./panel-search.js";

export function sortMessages(messages: MessageDto[]) {
  return [...messages].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function MessagesTab({ dealId, messages }: { dealId: string; messages: MessageDto[] }) {
  const updateMessage = useUpdateMessage(dealId);
  const [selectedId, setSelectedId] = useUrlPanelState("message");
  const [destinationDealId, setDestinationDealId] = useState("");
  const selectedMessage = messages.find((message) => message.id === selectedId) ?? sortMessages(messages)[0] ?? null;

  return (
    <div className="crud-surface">
      <section className="crud-list" aria-label="Messages">
        <header className="crud-toolbar">
          <div>
            <h2>Messages</h2>
            <p>Email, SMS, notes, and outbound history filed to this deal.</p>
          </div>
          <Badge tone="blue">{messages.length} filed</Badge>
        </header>
        {sortMessages(messages).map((message) => (
          <button className={message.id === selectedMessage?.id ? "crud-row crud-row-active" : "crud-row"} key={message.id} onClick={() => setSelectedId(message.id)}>
            <span className="crud-row-icon">
              <MessageSquareText size={16} aria-hidden />
            </span>
            <span>
              <strong>{message.subject ?? message.preview}</strong>
              <span>{message.preview}</span>
            </span>
            <span className="crud-row-meta">
              <Badge tone={message.visibility === "shared" ? "green" : "amber"}>{message.visibility === "shared" ? "Shared" : "Internal"}</Badge>
              <span>{formatDateTime(message.occurredAt)}</span>
            </span>
          </button>
        ))}
      </section>

      <aside className="crud-detail" aria-label="Message detail">
        {selectedMessage ? (
          <>
            <div className="detail-heading">
              <div>
                <h2>{selectedMessage.subject ?? selectedMessage.preview}</h2>
                <p>{selectedMessage.channelType.toUpperCase()} · {selectedMessage.direction}</p>
              </div>
              {selectedMessage.routingConfidence !== null ? <Badge tone="amber">{Math.round(selectedMessage.routingConfidence * 100)}% routing confidence</Badge> : null}
            </div>
            <div className={selectedMessage.visibility === "internal" ? "message-body message-body-internal" : "message-body"}>{selectedMessage.bodyText}</div>
            <div className="action-row">
              <Button
                onClick={() => updateMessage.mutate({ messageId: selectedMessage.id, body: { visibility: selectedMessage.visibility === "shared" ? "internal" : "shared" } })}
              >
                <ShieldCheck size={16} aria-hidden />
                {selectedMessage.visibility === "shared" ? "Mark internal" : "Share"}
              </Button>
              <Button variant="danger" onClick={() => updateMessage.mutate({ messageId: selectedMessage.id, body: { hidden: true } })}>
                <EyeOff size={16} aria-hidden />
                Hide
              </Button>
              <Button variant="danger" onClick={() => updateMessage.mutate({ messageId: selectedMessage.id, body: { redacted: true } })}>
                <Lock size={16} aria-hidden />
                Redact
              </Button>
            </div>
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!destinationDealId.trim()) return;
                updateMessage.mutate({ messageId: selectedMessage.id, body: { dealId: destinationDealId.trim() } });
                setDestinationDealId("");
              }}
            >
              <label>
                Reassign to deal ID
                <input value={destinationDealId} onChange={(event) => setDestinationDealId(event.target.value)} placeholder="deal_sutter" />
              </label>
              <Button type="submit">
                <FolderSymlink size={16} aria-hidden />
                Reassign
              </Button>
            </form>
            {updateMessage.isError ? <p className="form-error">Message update failed.</p> : null}
          </>
        ) : (
          <p>No messages have been filed to this deal.</p>
        )}
      </aside>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
