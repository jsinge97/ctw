import { useParams } from "@tanstack/react-router";
import { DocumentsTab } from "../features/deal-workspace/documents-tab.js";
import { DealWorkspaceShell } from "../features/deal-workspace/workspace-shell.js";

export function DealDocumentsRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/documents" });
  return <DealWorkspaceShell dealId={dealId} activeTab="documents">{(workspace) => <DocumentsTab dealId={dealId} documents={workspace.documents} />}</DealWorkspaceShell>;
}
