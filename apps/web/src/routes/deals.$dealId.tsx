import { useParams } from "@tanstack/react-router";
import { DealWorkspaceShell, OverviewTab } from "../features/deal-workspace/workspace-shell.js";

export function DealWorkspaceRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId" });

  return <DealWorkspaceShell dealId={dealId} activeTab="overview">{(workspace) => <OverviewTab workspace={workspace} />}</DealWorkspaceShell>;
}
