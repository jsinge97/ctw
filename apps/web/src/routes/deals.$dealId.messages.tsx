import { useParams } from "@tanstack/react-router";
import { MessagesTab } from "../features/deal-workspace/messages-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";
import { useUpdateMessage } from "../hooks/use-deals.js";

export function DealMessagesRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/messages" });
  const updateMessage = useUpdateMessage(dealId);
  return (
    <DealWorkspaceShell dealId={dealId} activeTab="messages">
      {(workspace, session) => (
        <MessagesTab
          messages={workspace.messages}
          canManage={Boolean(session?.capabilities.includes("routeWork"))}
          isUpdating={updateMessage.isPending}
          onUpdateMessage={(messageId, body) => updateMessage.mutate({ messageId, body })}
        />
      )}
    </DealWorkspaceShell>
  );
}
