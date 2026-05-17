import { useParams } from "@tanstack/react-router";
import { TasksTab } from "../features/deal-workspace/tasks-tab.js";
import { DealWorkspaceShell, hasEffectiveCapability } from "../features/deal-workspace/workspace-shell.js";
import { useCreateTask, useDecideTask } from "../hooks/use-deals.js";

export function DealTasksRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/tasks" });
  const createTask = useCreateTask(dealId);
  const decideTask = useDecideTask(dealId);
  return (
    <DealWorkspaceShell dealId={dealId} activeTab="tasks">
      {(workspace, session) => (
        <TasksTab
          tasks={workspace.tasks}
          canApprove={hasEffectiveCapability(session, workspace.deal.capabilities, "approveProposedAction")}
          canComplete={hasEffectiveCapability(session, workspace.deal.capabilities, "completeAssignedTask")}
          canCreate={hasEffectiveCapability(session, workspace.deal.capabilities, "createTask")}
          canEdit={hasEffectiveCapability(session, workspace.deal.capabilities, "editTask")}
          hasError={createTask.isError || decideTask.isError}
          onCreateTask={(body) => createTask.mutate(body)}
          onDecideTask={(taskId, decision, body) => decideTask.mutate({ taskId, decision, body })}
        />
      )}
    </DealWorkspaceShell>
  );
}
