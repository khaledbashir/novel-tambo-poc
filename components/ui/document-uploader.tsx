"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploaderProps {
    onUploadSuccess?: (result: any) => void;
    acceptedTypes?: string[];
    maxSizeMB?: number;
}

export function DocumentUploader({
    onUploadSuccess,
    acceptedTypes = [".pdf", ".doc", ".docx"],
    maxSizeMB = 10
}: DocumentUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{
        name: string;
        size: number;
        type: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(fileExtension)) {
            toast.error(`Please upload a valid file type: ${acceptedTypes.join(', ')}`);
            return;
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            toast.error(`File is too large. Maximum size is ${maxSizeMB}MB`);
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
                size: file.size,
                type: file.type
            });

            toast.success("Document uploaded and processed successfully!");

            if (onUploadSuccess) {
                onUploadSuccess(result);
            }

            // Dispatch custom event for other components to listen
            window.dispatchEvent(new CustomEvent('document-uploaded', {
                detail: {
                    text: result.text,
                    fileName: file.name,
                    metadata: result.metadata
                }
            }));

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload document");
            setUploadedFile(null);
        } finally {
            setIsUploading(false);
            // Clear input so same file can be selected again
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

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={acceptedTypes.join(',')}
                className="hidden"
                disabled={isUploading}
            />

            {!uploadedFile ? (
                <button
                    onClick={triggerFileSelect}
                    disabled={isUploading}
                    className="w-full group relative"
                    type="button"
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
                            Click to upload PDF or Word document (max {maxSizeMB}MB)
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Supported: {acceptedTypes.join(', ')}
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

export default DocumentUploader;
