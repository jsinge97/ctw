import { useParams } from "@tanstack/react-router";
import { DealWorkspaceShell, OverviewTab } from "../features/deal-workspace/workspace-shell.js";
import { useDecideTask } from "../hooks/use-deals.js";

export function DealWorkspaceRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId" });
  const decideTask = useDecideTask(dealId);

  return (
    <DealWorkspaceShell dealId={dealId} activeTab="overview">
      {(workspace, session) => (
        <OverviewTab
          workspace={workspace}
          session={session}
          isDeciding={decideTask.isPending}
          onDecideTask={(taskId, decision, body) => decideTask.mutate({ taskId, decision, body })}
        />
      )}
    </DealWorkspaceShell>
  );
}
