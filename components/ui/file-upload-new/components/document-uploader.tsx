"use client";

import React, { useState, useRef, useCallback } from "react";
import {
    CloudUpload,
    FileText,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTamboContextAttachment } from "@tambo-ai/react";

interface DocumentUploaderProps {
    maxFileSize?: number; // in MB
    maxFiles?: number;
    disabled?: boolean;
    className?: string;
    acceptedFileTypes?: string[];
}

export const DocumentUploader = React.memo(function DocumentUploader({
    maxFileSize = 10, // 10MB default
    maxFiles = 5,
    disabled = false,
    className,
    acceptedFileTypes = [
        ".pdf",
        ".doc",
        ".docx",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
}: DocumentUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tambo context attachment hook
    const { addContextAttachment } = useTamboContextAttachment();

    // Format file size to human readable format
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Process and add files as context attachments
    const processFiles = useCallback(
        async (fileList: FileList) => {
            if (disabled) return;

            // Check if adding these files would exceed the max limit
            if (fileList.length > maxFiles) {
                toast.error(
                    `You can only upload a maximum of ${maxFiles} files at once`,
                );
                return;
            }

            for (const file of Array.from(fileList)) {
                // Check file size
                if (file.size > maxFileSize * 1024 * 1024) {
                    toast.error(
                        `File "${file.name}" exceeds the maximum size of ${maxFileSize}MB`,
                    );
                    continue;
                }

                setIsUploading(true);

                try {
                    // Upload and parse the document
                    const formData = new FormData();
                    formData.append("file", file);

                    const response = await fetch("/api/ingest-brief", {
                        method: "POST",
                        body: formData,
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Upload failed");
                    }

                    const result = await response.json();

                    // Add as a context attachment with the extracted text
                    addContextAttachment({
                        name: file.name,
                        icon: <FileText className="w-4 h-4" />,
                        metadata: {
                            type: file.type,
                            size: file.size,
                            uploadedAt: new Date().toISOString(),
                            // Include the extracted text so AI can access it
                            text: result.text,
                            pages: result.pages,
                            wordCount: result.metadata?.wordCount,
                        },
                    });

                    toast.success(
                        `Document "${file.name}" added to conversation`,
                    );
                } catch (error: any) {
                    console.error("Upload error:", error);
                    toast.error(
                        `Failed to upload "${file.name}": ${error.message}`,
                    );
                } finally {
                    setIsUploading(false);
                }
            }
        },
        [maxFiles, maxFileSize, disabled, addContextAttachment],
    );

    // Handle file selection via input
    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files) {
                processFiles(files);
            }
            // Reset the input so the same file can be selected again
            e.target.value = "";
        },
        [processFiles],
    );



    // Drag and drop handlers
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files) {
                processFiles(files);
            }
        },
        [disabled, processFiles],
    );

    // Get icon based on file type
    const getFileIcon = (type: string) => {
        if (type === "application/pdf") {
            return <FileText className="w-4 h-4 text-red-500" />;
        }
        if (
            type === "application/msword" ||
            type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            return <FileText className="w-4 h-4 text-blue-500" />;
        }
        return <FileText className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Upload area */}
            <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                    !disabled && !isUploading && fileInputRef.current?.click()
                }
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={acceptedFileTypes.join(",")}
                    multiple={maxFiles > 1}
                    onChange={handleFileSelect}
                    disabled={disabled || isUploading}
                />

                {isUploading ? (
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                ) : (
                    <CloudUpload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-sm font-medium mb-1">
                    {isUploading
                        ? "Uploading document..."
                        : disabled
                            ? "File upload is disabled"
                            : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">
                    PDF and Word documents (up to {maxFileSize}MB each)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Maximum {maxFiles} file{maxFiles !== 1 ? "s" : ""} at once
                </p>
            </div>
        </div>
    );
});

