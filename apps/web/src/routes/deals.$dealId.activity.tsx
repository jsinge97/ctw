import { useParams } from "@tanstack/react-router";
import { ActivityTab } from "../features/deal-workspace/activity-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";

export function DealActivityRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/activity" });
  return <DealWorkspaceShell dealId={dealId} activeTab="activity">{(workspace) => <ActivityTab activity={workspace.activity} />}</DealWorkspaceShell>;
}
