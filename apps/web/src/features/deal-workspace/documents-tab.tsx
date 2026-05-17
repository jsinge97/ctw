import type { DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { FileText, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { Dropzone, type DropzoneUploadItem } from "../../components/ui/dropzone.js";

const documentTypes = ["unknown", "loi", "lease", "om", "estoppel", "comp_set", "other"] as const;
const documentUploadAccept = {
  "application/msword": [".doc"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/*": [".jpeg", ".jpg", ".png", ".tif", ".tiff"]
};

export function sortDocumentsForList(documents: DocumentDto[]) {
  return [...documents].sort((left, right) => left.title.localeCompare(right.title));
}

export function DocumentsTab({
  canManage,
  documents,
  hasError,
  isMutating,
  onArchiveDocument,
  onUpdateDocument,
  onUploadDocument
}: {
  canManage: boolean;
  documents: DocumentDto[];
  hasError: boolean;
  isMutating: boolean;
  onArchiveDocument: (documentId: string) => void;
  onUpdateDocument: (documentId: string, body: UpdateDocumentRequest) => Promise<unknown>;
  onUploadDocument: (file: File, onProgress: (progress: number) => void) => Promise<unknown>;
}) {
  const [editingDocument, setEditingDocument] = useState<DocumentDto | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [uploadItems, setUploadItems] = useState<DropzoneUploadItem[]>([]);
  const listedDocuments = sortDocumentsForList(documents);
  const handleFiles = useCallback((files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID();
      setUploadItems((items) => [...items, { id, fileName: file.name, progress: 0, status: "uploading" }]);
      void onUploadDocument(file, (progress) => {
        setUploadItems((items) => items.map((item) => item.id === id ? { ...item, progress } : item));
      })
        .then(() => {
          setUploadItems((items) => items.map((item) => item.id === id ? { ...item, progress: 100, status: "success" } : item));
        })
        .catch((error: unknown) => {
          setUploadItems((items) => items.map((item) => item.id === id ? { ...item, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : item));
        });
    }
  }, [onUploadDocument]);

  return (
    <div className="document-list-surface">
      <section className="crud-list document-list-panel" aria-label="Documents">
        <header className="crud-toolbar">
          <div>
            <h2>Documents</h2>
            <p>Files attached to this deal, with editable type, visibility, and tags.</p>
          </div>
        </header>
        {canManage ? <Dropzone accept={documentUploadAccept} disabled={isMutating} items={uploadItems} onFiles={handleFiles} /> : null}
        {listedDocuments.length > 0 ? (
          <div className="document-table" role="list">
            {listedDocuments.map((document) => (
              <div className="crud-row document-row" key={document.id} role="listitem">
                <span className="crud-row-icon">
                  <FileText size={16} aria-hidden />
                </span>
                <span>
                  <strong>{document.title}</strong>
                  <span>{document.documentType.replace("_", " ")} · {document.latestVersion}</span>
                </span>
                <span className="crud-row-meta">
                  <Badge tone={document.classificationStatus === "classified" ? "green" : "amber"}>{document.classificationStatus}</Badge>
                  <Badge tone={document.visibility === "shared" ? "green" : "amber"}>{document.visibility}</Badge>
                  {document.tags.length > 0 ? <span>{document.tags.join(", ")}</span> : null}
                </span>
                {canManage ? (
                  <span className="row-actions">
                    <button
                      aria-expanded={openMenuId === document.id}
                      aria-label={`Actions for ${document.title}`}
                      className="icon-button row-action-button"
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === document.id ? null : document.id)}
                    >
                      <MoreHorizontal size={16} aria-hidden />
                    </button>
                    {openMenuId === document.id ? (
                      <span className="row-action-menu" role="menu">
                        <button
                          role="menuitem"
                          type="button"
                          onClick={() => {
                            setEditingDocument(document);
                            setOpenMenuId(null);
                          }}
                        >
                          <Pencil size={15} aria-hidden />
                          Edit metadata
                        </button>
                        <button
                          role="menuitem"
                          type="button"
                          onClick={() => {
                            onArchiveDocument(document.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <Trash2 size={15} aria-hidden />
                          Delete
                        </button>
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {listedDocuments.length === 0 ? <p className="empty-state document-empty-state">No documents yet.</p> : null}
        {hasError ? <p className="form-error">Document change failed.</p> : null}
      </section>
      {editingDocument ? (
        <EditDocumentDialog
          document={editingDocument}
          isMutating={isMutating}
          onClose={() => setEditingDocument(null)}
          onSave={async (body) => {
            await onUpdateDocument(editingDocument.id, body);
            setEditingDocument(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EditDocumentDialog({ document, isMutating, onClose, onSave }: { document: DocumentDto; isMutating: boolean; onClose: () => void; onSave: (body: { title?: string; documentType?: DocumentDto["documentType"]; visibility?: DocumentDto["visibility"]; tags?: string[] }) => Promise<void> }) {
  const [title, setTitle] = useState(document.title);
  const [tags, setTags] = useState(document.tags.join(", "));
  const [documentType, setDocumentType] = useState<DocumentDto["documentType"]>(document.documentType);
  const [visibility, setVisibility] = useState<DocumentDto["visibility"]>(document.visibility);

  return (
    <div className="dialog-backdrop" role="presentation">
      <form
        aria-modal="true"
        className="dialog form-dialog document-edit-dialog"
        role="dialog"
        aria-labelledby="edit-document-title"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({ title: title.trim(), documentType, visibility, tags: parseTags(tags) }).catch(() => undefined);
        }}
      >
        <div className="dialog-icon dialog-icon-neutral">
          <FileText size={18} aria-hidden />
        </div>
        <div className="detail-editor detail-editor-plain">
          <div className="dialog-title-row">
            <h2 id="edit-document-title">Edit document</h2>
            <button aria-label="Close document editor" className="icon-button" type="button" onClick={onClose}>
              <X size={16} aria-hidden />
            </button>
          </div>
          <label>
            Name
            <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
          </label>
          <label>
            Type
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentDto["documentType"])}>
              {documentTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
            </select>
          </label>
          <label>
            Visibility
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as DocumentDto["visibility"])}>
              <option value="internal">Internal</option>
              <option value="shared">Shared</option>
            </select>
          </label>
          <label>
            Tags
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="lease, signed" />
          </label>
        </div>
        <div className="action-row">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isMutating} loadingLabel="Saving">Save</Button>
        </div>
      </form>
    </div>
  );
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}
