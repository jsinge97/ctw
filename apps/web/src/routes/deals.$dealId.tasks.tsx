import { useParams } from "@tanstack/react-router";
import { TasksTab } from "../features/deal-workspace/tasks-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";

export function DealTasksRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/tasks" });
  return <DealWorkspaceShell dealId={dealId} activeTab="tasks">{(workspace) => <TasksTab dealId={dealId} tasks={workspace.tasks} />}</DealWorkspaceShell>;
}
