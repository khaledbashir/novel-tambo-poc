import React from "react";
import FileUpload from "@/components/ui/file-upload/file-upload";
import type { UploadedFile } from "@/components/ui/file-upload/file-upload";

/**
 * SOW File Upload wrapper
 *
 * A thin wrapper around the generic `FileUpload` component that exposes
 * common defaults and an SOW-focused API for uploading one or more
 * project briefs (PDF/Word) in the SOW flows.
 *
 * This component intentionally keeps the API minimal so it can be
 * easily swapped out for a more advanced uploader later (server
 * integration, chunked uploads, virus scanning, etc.).
 */

export interface SOWFileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function SOWFileUpload({
  onFilesChange,
  maxFiles = 1,
  accept = DEFAULT_ACCEPT,
  className,
  title = "Upload Documents",
  description = "Attach PDF or Word documents containing project requirements.",
  disabled = false,
}: SOWFileUploadProps) {
  /**
   * FileUpload already normalizes the file objects into the `UploadedFile`
   * shape used across the app. We simply pass the props through and provide
   * SOW-specific defaults (maxFiles = 1 and helpful labels).
   *
   * The wrapper exists to centralize SOW-specific UX changes so the rest of
   * the app can just import `SOWFileUpload`.
   */

  return (
    <FileUpload
      onFilesChange={onFilesChange}
      maxFiles={maxFiles}
      accept={accept}
      className={className}
      disabled={disabled}
    >
      {/* Custom simple UI for the SOW wrapper — the generic FileUpload renders children as a clickable area */}
      <div className="text-left">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className="px-4 py-3 rounded-lg border border-dashed border-border/30 bg-background/50">
          <p className="text-sm text-muted-foreground">
            Drag & drop a PDF/Word doc here or click to browse. We recommend high-quality PDF briefs with a single document
            per upload for best results.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {maxFiles === 1 ? "One file only." : `Up to ${maxFiles} files.`}
          </p>
        </div>
      </div>
    </FileUpload>
  );
}
