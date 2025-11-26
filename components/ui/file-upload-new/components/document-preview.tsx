"use client";

import React from "react";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
}

interface DocumentPreviewProps {
  documents: Document[];
  onRemove?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

export function DocumentPreview({
  documents,
  onRemove,
  compact = false,
  className
}: DocumentPreviewProps) {
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get icon based on file type
  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (type === "application/msword" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  if (documents.length === 0) {
    return null;
  }

  if (compact) {
    // Compact view for message area
    return (
      <div className={`flex flex-wrap gap-2 mb-2 ${className}`}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-xs"
          >
            {getFileIcon(doc.type)}
            <span className="truncate max-w-[120px]">{doc.name}</span>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onRemove(doc.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Full view for message preview
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium">Documents</div>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
        >
          <div className="flex items-center space-x-3">
            {getFileIcon(doc.type)}
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.size)} • {doc.uploadedAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {doc.url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(doc.url, "_blank")}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemove(doc.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
