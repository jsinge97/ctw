import type { DocumentDto, UpdateDocumentRequest } from "@ctw/contracts";
import { Archive, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { useUrlPanelState } from "./panel-search.js";

const documentTypes = ["unknown", "loi", "lease", "om", "estoppel", "comp_set", "other"] as const;

export function groupDocumentsByType(documents: DocumentDto[]) {
  return documents.reduce<Record<string, DocumentDto[]>>((groups, document) => {
    groups[document.documentType] = [...(groups[document.documentType] ?? []), document];
    return groups;
  }, {});
}

export function DocumentsTab({
  canManage,
  documents,
  hasError,
  onArchiveDocument,
  onCreateDocument,
  onUpdateDocument,
  onUploadDocument
}: {
  canManage: boolean;
  documents: DocumentDto[];
  hasError: boolean;
  onArchiveDocument: (documentId: string) => void;
  onCreateDocument: (body: UpdateDocumentRequest) => void;
  onUpdateDocument: (documentId: string, body: UpdateDocumentRequest) => void;
  onUploadDocument: (file: File) => void;
}) {
  const [selectedId, setSelectedId] = useUrlPanelState("document");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftFolder, setDraftFolder] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const groupedDocuments = groupDocumentsByType(documents);
  const selectedDocument = documents.find((document) => document.id === selectedId) ?? documents[0] ?? null;

  return (
    <div className="crud-surface">
      <section className="crud-list" aria-label="Documents">
        <header className="crud-toolbar">
          <div>
            <h2>Documents</h2>
            <p>Classified files, versions, folders, and shared visibility.</p>
          </div>
          {canManage ? (
            <label className="upload-button">
              <Upload size={16} aria-hidden />
              Upload
              <input
                type="file"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) onUploadDocument(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
        </header>
        {documentTypes.map((type) => {
          const items = groupedDocuments[type] ?? [];
          if (items.length === 0) return null;
          return (
            <div className="document-group" key={type}>
              <h3>{type.replace("_", " ")}</h3>
              {items.map((document) => (
                <button className={document.id === selectedDocument?.id ? "crud-row crud-row-active" : "crud-row"} key={document.id} onClick={() => setSelectedId(document.id)}>
                  <span className="crud-row-icon">
                    <FileText size={16} aria-hidden />
                  </span>
                  <span>
                    <strong>{document.title}</strong>
                    <span>{document.folder ?? "No folder"} · {document.latestVersion}</span>
                  </span>
                  <span className="crud-row-meta">
                    <Badge tone={document.classificationStatus === "classified" ? "green" : "amber"}>{document.classificationStatus}</Badge>
                    <Badge tone={document.visibility === "shared" ? "green" : "amber"}>{document.visibility}</Badge>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </section>

      <aside className="crud-detail" aria-label="Document detail">
        {canManage ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draftTitle.trim()) return;
              onCreateDocument({ title: draftTitle.trim(), folder: draftFolder.trim() || null, tags: parseTags(draftTags) });
              setDraftTitle("");
              setDraftFolder("");
              setDraftTags("");
            }}
          >
            <h2>Add document metadata</h2>
            <label>
              Title
              <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="New lease.pdf" />
            </label>
            <label>
              Folder
              <input value={draftFolder} onChange={(event) => setDraftFolder(event.target.value)} placeholder="Diligence" />
            </label>
            <label>
              Tags
              <input value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="lease, signed" />
            </label>
            <Button type="submit">Add metadata</Button>
          </form>
        ) : null}

        {selectedDocument && canManage ? (
          <DocumentEditor
            document={selectedDocument}
            onArchive={() => onArchiveDocument(selectedDocument.id)}
            onSave={(body) => onUpdateDocument(selectedDocument.id, body)}
          />
        ) : selectedDocument ? (
          <div className="detail-editor">
            <h2>{selectedDocument.title}</h2>
            <p>{selectedDocument.documentType.replace("_", " ")} · {selectedDocument.visibility}</p>
          </div>
        ) : (
          <p>No documents yet.</p>
        )}
        {hasError ? <p className="form-error">Document change failed.</p> : null}
      </aside>
    </div>
  );
}

function DocumentEditor({ document, onArchive, onSave }: { document: DocumentDto; onArchive: () => void; onSave: (body: { title?: string; documentType?: DocumentDto["documentType"]; visibility?: DocumentDto["visibility"]; folder?: string | null; tags?: string[] }) => void }) {
  const [title, setTitle] = useState(document.title);
  const [folder, setFolder] = useState(document.folder ?? "");
  const [tags, setTags] = useState(document.tags.join(", "));
  const [documentType, setDocumentType] = useState<DocumentDto["documentType"]>(document.documentType);
  const [visibility, setVisibility] = useState<DocumentDto["visibility"]>(document.visibility);

  return (
    <form
      className="detail-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title: title.trim(), documentType, visibility, folder: folder.trim() || null, tags: parseTags(tags) });
      }}
    >
      <h2>{document.title}</h2>
      <label>
        Rename
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
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
        Folder
        <input value={folder} onChange={(event) => setFolder(event.target.value)} />
      </label>
      <label>
        Tags
        <input value={tags} onChange={(event) => setTags(event.target.value)} />
      </label>
      <div className="action-row">
        <Button type="submit">Save document</Button>
        <Button type="button" variant="danger" onClick={onArchive}>
          <Archive size={16} aria-hidden />
          Archive
        </Button>
      </div>
    </form>
  );
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}
