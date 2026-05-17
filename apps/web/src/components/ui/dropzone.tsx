import { UploadCloud } from "lucide-react";
import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { cn } from "../../lib/cn.js";
import { Button } from "./button.js";
import { Spinner } from "./spinner.js";

export type DropzoneUploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
};

type DropzoneProps = {
  accept?: Accept;
  disabled?: boolean;
  items?: DropzoneUploadItem[];
  maxSize?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

export function Dropzone({ accept, disabled = false, items = [], maxSize, multiple = true, onFiles }: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => onFiles(acceptedFiles), [onFiles]);
  const { getInputProps, getRootProps, isDragActive, fileRejections } = useDropzone({ disabled, multiple, onDrop, ...(accept !== undefined ? { accept } : {}), ...(maxSize !== undefined ? { maxSize } : {}) });
  const rejectionMessage = fileRejections[0]?.errors[0]?.message;
  const activeUploads = items.filter((item) => item.status === "uploading").length;

  return (
    <div className="dropzone-shell">
      <div {...getRootProps({ className: cn("dropzone", isDragActive ? "dropzone-active" : null, disabled ? "dropzone-disabled" : null) })}>
        <input {...getInputProps({ style: { display: "none" } })} />
        <span className="dropzone-icon">
          {activeUploads > 0 ? <Spinner size="sm" /> : <UploadCloud size={18} aria-hidden />}
        </span>
        <div>
          <strong>{isDragActive ? "Drop documents here" : "Drop documents to upload"}</strong>
          <span>PDFs, images, Word docs, and deal files. Uploads appear below as they process.</span>
        </div>
        <Button type="button" size="sm" disabled={disabled}>Browse</Button>
      </div>
      {rejectionMessage ? <p className="form-error">{rejectionMessage}</p> : null}
      {items.length > 0 ? (
        <ol className="upload-progress-list" aria-label="Upload progress">
          {items.map((item) => (
            <li className="upload-progress-row" key={item.id}>
              <div>
                <strong>{item.fileName}</strong>
                <span>{uploadStatusLabel(item)}</span>
              </div>
              <div className="upload-progress-track" role="progressbar" aria-label={`${item.fileName} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.status === "uploading" ? item.progress : item.status === "success" ? 100 : undefined}>
                <span className={item.status === "error" ? "upload-progress-bar upload-progress-bar-error" : "upload-progress-bar"} style={{ width: `${item.status === "error" ? Math.max(item.progress, 8) : item.progress}%` }} />
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function uploadStatusLabel(item: DropzoneUploadItem) {
  if (item.status === "success") return "Uploaded";
  if (item.status === "error") return item.error ?? "Upload failed";
  return `${item.progress}% uploaded`;
}
