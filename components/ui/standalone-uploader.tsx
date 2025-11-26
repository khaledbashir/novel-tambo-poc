"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tambo/suggestions-tooltip";

interface StandaloneUploaderProps {
    variant?: "dropzone" | "button";
    className?: string;
}

export function StandaloneUploader({ variant = "dropzone", className }: StandaloneUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{
        name: string;
        size: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        const validTypes = ['.pdf', '.doc', '.docx'];

        if (!validTypes.includes(fileExt)) {
            alert('Please upload PDF or Word documents only');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Maximum size is 10MB');
            return;
        }

        setIsUploading(true);

        try {
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

            setUploadedFile({
                name: file.name,
                size: file.size
            });

            console.log("✅ Document uploaded to Knowledge Base:", result);
            console.log("📤 Dispatching brief-ingested event with:", {
                fileName: file.name,
                isKnowledgeBase: true,
                metadata: result.metadata
            });

            window.dispatchEvent(new CustomEvent('brief-ingested', {
                detail: {
                    text: result.text, // This is now just a confirmation message
                    fileName: file.name,
                    isKnowledgeBase: true, // Flag to indicate RAG usage
                    metadata: result.metadata
                }
            }));

        } catch (error: any) {
            console.error("Upload error:", error);
            alert(error.message || "Failed to upload document");
            setUploadedFile(null);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerUpload = () => fileInputRef.current?.click();

    if (variant === "button") {
        return (
            <>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={isUploading}
                />
                <Tooltip content="Upload Document (PDF/Word)" side="top">
                    <button
                        type="button"
                        onClick={triggerUpload}
                        disabled={isUploading}
                        className={cn(
                            "w-10 h-10 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isUploading && "animate-pulse",
                            className
                        )}
                        aria-label="Upload Brief"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                    </button>
                </Tooltip>
            </>
        );
    }

    return (
        <div className={cn("w-full", className)}>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
            />

            {!uploadedFile ? (
                <button
                    onClick={triggerUpload}
                    disabled={isUploading}
                    type="button"
                    className="w-full group relative"
                >
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            {isUploading ? (
                                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                            ) : (
                                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {isUploading ? "Uploading..." : "Upload Client Brief"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                            Click to upload PDF or Word document (max 10MB)
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Supported: .pdf, .doc, .docx
                        </p>
                    </div>
                </button>
            ) : (
                <div className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {uploadedFile.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    <span>Uploaded • {formatFileSize(uploadedFile.size)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRemove}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors flex-shrink-0 ml-2"
                            title="Remove file"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
