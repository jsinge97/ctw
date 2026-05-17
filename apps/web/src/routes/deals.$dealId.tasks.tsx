import { useParams } from "@tanstack/react-router";
import { TasksTab } from "../features/deal-workspace/tasks-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";
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
          canApprove={Boolean(session?.capabilities.includes("approveProposedAction"))}
          canComplete={Boolean(session?.capabilities.includes("completeAssignedTask"))}
          canCreate={Boolean(session?.capabilities.includes("createTask"))}
          canEdit={Boolean(session?.capabilities.includes("editTask"))}
          hasError={createTask.isError || decideTask.isError}
          onCreateTask={(body) => createTask.mutate(body)}
          onDecideTask={(taskId, decision, body) => decideTask.mutate({ taskId, decision, body })}
        />
      )}
    </DealWorkspaceShell>
  );
}
