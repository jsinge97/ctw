import { useParams } from "@tanstack/react-router";
import { DocumentsTab } from "../features/deal-workspace/documents-tab.js";
import { DealWorkspaceShell, hasEffectiveCapability } from "../features/deal-workspace/workspace-shell.js";
import { useArchiveDocument, useUpdateDocument, useUploadDocument } from "../hooks/use-deals.js";

export function DealDocumentsRoute() {
  const { dealId } = useParams({ from: "/deals/$dealId/documents" });
  const updateDocument = useUpdateDocument(dealId);
  const archiveDocument = useArchiveDocument(dealId);
  const uploadDocument = useUploadDocument(dealId);
  return (
    <DealWorkspaceShell dealId={dealId} activeTab="documents">
      {(workspace, session) => (
        <DocumentsTab
          documents={workspace.documents}
          canManage={hasEffectiveCapability(session, workspace.deal.capabilities, "uploadDocuments")}
          hasError={updateDocument.isError || archiveDocument.isError || uploadDocument.isError}
          isMutating={updateDocument.isPending || archiveDocument.isPending || uploadDocument.isPending}
          onArchiveDocument={(documentId) => archiveDocument.mutate(documentId)}
          onUpdateDocument={(documentId, body) => updateDocument.mutateAsync({ documentId, body })}
          onUploadDocument={(file) => uploadDocument.mutate(file)}
        />
      )}
    </DealWorkspaceShell>
  );
}
