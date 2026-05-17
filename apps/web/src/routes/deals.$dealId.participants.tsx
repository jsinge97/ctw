import { useParams } from "@tanstack/react-router";
import { ParticipantsTab } from "../features/deal-workspace/participants-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";

export function DealParticipantsRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/participants" });
  return <DealWorkspaceShell dealId={dealId} activeTab="participants">{(workspace) => <ParticipantsTab dealId={dealId} participants={workspace.participants} />}</DealWorkspaceShell>;
}
