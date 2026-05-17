import { useParams } from "@tanstack/react-router";
import { ParticipantsTab } from "../features/deal-workspace/participants-tab.js";
import { DealWorkspaceShell, hasEffectiveCapability } from "../features/deal-workspace/workspace-shell.js";
import { useAddParticipant, useUpdateParticipant } from "../hooks/use-deals.js";

export function DealParticipantsRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/participants" });
  const addParticipant = useAddParticipant(dealId);
  const updateParticipant = useUpdateParticipant(dealId);
  return (
    <DealWorkspaceShell dealId={dealId} activeTab="participants">
      {(workspace, session) => (
        <ParticipantsTab
          participants={workspace.participants}
          canManage={hasEffectiveCapability(session, workspace.deal.capabilities, "manageParticipants")}
          hasError={addParticipant.isError || updateParticipant.isError}
          onAddParticipant={(body) => addParticipant.mutate(body)}
          onUpdateParticipant={(participantId, body) => updateParticipant.mutate({ participantId, body })}
        />
      )}
    </DealWorkspaceShell>
  );
}
