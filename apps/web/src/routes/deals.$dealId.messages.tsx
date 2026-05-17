import { useParams } from "@tanstack/react-router";
import { MessagesTab } from "../features/deal-workspace/messages-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";

export function DealMessagesRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/messages" });
  return <DealWorkspaceShell dealId={dealId} activeTab="messages">{(workspace) => <MessagesTab dealId={dealId} messages={workspace.messages} />}</DealWorkspaceShell>;
}
