import type { AddParticipantRequest, ParticipantDto, UpdateParticipantRequest } from "@ctw/contracts";
import { RotateCcw, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { useUrlPanelState } from "./panel-search.js";

const roles = ["am", "broker", "client", "client_contact", "va", "observer"] as const;
const capabilityOptions = ["viewDeal", "viewMessages", "viewDocuments", "uploadDocuments", "moveDealStage", "editDealFields"] as const;

export function groupParticipantsByRole(participants: ParticipantDto[]) {
  return participants.reduce<Record<string, ParticipantDto[]>>((groups, participant) => {
    groups[participant.role] = [...(groups[participant.role] ?? []), participant];
    return groups;
  }, {});
}

export function ParticipantsTab({
  canManage,
  hasError,
  isMutating,
  onAddParticipant,
  onUpdateParticipant,
  participants
}: {
  canManage: boolean;
  hasError: boolean;
  isMutating: boolean;
  onAddParticipant: (body: AddParticipantRequest) => void;
  onUpdateParticipant: (participantId: string, body: UpdateParticipantRequest) => void;
  participants: ParticipantDto[];
}) {
  const [selectedId, setSelectedId] = useUrlPanelState("participant");
  const [removedParticipant, setRemovedParticipant] = useState<ParticipantDto | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<ParticipantDto["role"]>("broker");
  const groupedParticipants = useMemo(() => groupParticipantsByRole(participants), [participants]);
  const selectedParticipant = participants.find((participant) => participant.id === selectedId) ?? participants[0] ?? null;

  return (
    <div className="crud-surface">
      <section className="crud-list" aria-label="Participants">
        {canManage ? (
          <form
            className="create-strip"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              onAddParticipant({ name: name.trim(), company: company.trim() || null, role, capabilities: ["viewDeal"] });
              setName("");
              setCompany("");
            }}
          >
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Add participant" />
            <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" />
            <select value={role} onChange={(event) => setRole(event.target.value as ParticipantDto["role"])}>
              {roles.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
            </select>
            <Button type="submit" isLoading={isMutating} loadingLabel="Adding">
              <UserPlus size={16} aria-hidden />
              Add
            </Button>
          </form>
        ) : null}

        {roles.map((item) => {
          const roleParticipants = groupedParticipants[item] ?? [];
          if (roleParticipants.length === 0) return null;
          return (
            <div className="document-group" key={item}>
              <h3>{item.replace("_", " ")}</h3>
              {roleParticipants.map((participant) => (
                <button className={participant.id === selectedParticipant?.id ? "crud-row crud-row-active" : "crud-row"} key={participant.id} onClick={() => setSelectedId(participant.id)}>
                  <span className="crud-row-icon">
                    <Users size={16} aria-hidden />
                  </span>
                  <span>
                    <strong>{participant.name}</strong>
                    <span>{participant.company ?? "No company"}</span>
                  </span>
                  <span className="crud-row-meta">
                    <Badge tone={participant.visibility === "shared" ? "green" : "amber"}>{participant.visibility}</Badge>
                    {canManage ? <span>{participant.capabilities.length} capabilities</span> : null}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </section>

      <aside className="crud-detail" aria-label="Participant detail">
        {removedParticipant ? (
          <div className="undo-strip">
            <span>Removed {removedParticipant.name}</span>
            <Button size="sm" onClick={() => {
              onUpdateParticipant(removedParticipant.id, { status: "active" });
              setRemovedParticipant(null);
            }}>
              <RotateCcw size={14} aria-hidden />
              Undo
            </Button>
          </div>
        ) : null}
        {selectedParticipant && canManage ? (
          <ParticipantEditor
            key={selectedParticipant.id}
            isMutating={isMutating}
            participant={selectedParticipant}
            onRemove={() => {
              setRemovedParticipant(selectedParticipant);
              onUpdateParticipant(selectedParticipant.id, { status: "removed" });
            }}
            onSave={(body) => onUpdateParticipant(selectedParticipant.id, body)}
          />
        ) : selectedParticipant ? (
          <div className="detail-editor">
            <h2>{selectedParticipant.name}</h2>
            <p>{selectedParticipant.role.replace("_", " ")} · {selectedParticipant.company ?? "No company"}</p>
          </div>
        ) : (
          <p>No participants yet.</p>
        )}
        {hasError ? <p className="form-error">Participant change failed.</p> : null}
      </aside>
    </div>
  );
}

function ParticipantEditor({
  isMutating,
  onRemove,
  onSave,
  participant
}: {
  isMutating: boolean;
  onRemove: () => void;
  onSave: (body: { visibility?: ParticipantDto["visibility"]; capabilities?: string[] }) => void;
  participant: ParticipantDto;
}) {
  const [visibility, setVisibility] = useState<ParticipantDto["visibility"]>(participant.visibility);
  const [capabilities, setCapabilities] = useState(participant.capabilities);

  return (
    <form
      className="detail-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ visibility, capabilities });
      }}
    >
      <h2>{participant.name}</h2>
      <p>{participant.role.replace("_", " ")} · {participant.company ?? "No company"}</p>
      <label>
        Visibility
        <select value={visibility} onChange={(event) => setVisibility(event.target.value as ParticipantDto["visibility"])}>
          <option value="internal">Internal</option>
          <option value="shared">Shared</option>
        </select>
      </label>
      <fieldset className="checkbox-grid">
        <legend>Deal capabilities</legend>
        {capabilityOptions.map((capability) => (
          <label key={capability}>
            <input
              checked={capabilities.includes(capability)}
              type="checkbox"
              onChange={(event) => {
                setCapabilities((current) => event.target.checked ? [...current, capability] : current.filter((item) => item !== capability));
              }}
            />
            {capability}
          </label>
        ))}
      </fieldset>
      <div className="action-row">
        <Button type="submit" isLoading={isMutating} loadingLabel="Saving">Save participant</Button>
        <Button type="button" variant="danger" isLoading={isMutating} loadingLabel="Removing" onClick={onRemove}>Remove</Button>
      </div>
    </form>
  );
}
