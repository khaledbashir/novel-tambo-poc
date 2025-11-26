"use client";

import { useState, useCallback } from "react";

export interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    content?: string; // Base64 content for AI processing
}

interface UseFileUploadOptions {
    maxFiles?: number;
    accept?: string[];
    maxSize?: number; // in MB
    onFileUpload?: (files: UploadedFile[]) => void;
    onFileRemove?: (fileId: string, files: UploadedFile[]) => void;
    onError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
    const {
        maxFiles = 5,
        accept = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize = 10, // 10MB default
        onFileUpload,
        onFileRemove,
        onError,
    } = options;

    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const validateFile = useCallback(
        (file: File): boolean => {
            // Check file type
            if (!accept.includes(file.type)) {
                onError?.(
                    `Unsupported file type: ${file.type}. Only PDF and Word documents are allowed.`,
                );
                return false;
            }

            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                onError?.(
                    `File size exceeds maximum allowed size of ${maxSize}MB.`,
                );
                return false;
            }

            return true;
        },
        [accept, maxSize, onError],
    );

    const processFile = useCallback(
        (file: File): Promise<UploadedFile> => {
            return new Promise((resolve, reject) => {
                if (!validateFile(file)) {
                    reject(new Error(`Invalid file: ${file.name}`));
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const uploadedFile: UploadedFile = {
                        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: URL.createObjectURL(file),
                        content: result, // Base64 content for AI processing
                    };
                    resolve(uploadedFile);
                };
                reader.onerror = () =>
                    reject(new Error(`Failed to read file: ${file.name}`));
                reader.readAsDataURL(file);
            });
        },
        [validateFile],
    );

    const handleFiles = useCallback(
        async (fileList: FileList) => {
            if (files.length + fileList.length > maxFiles) {
                onError?.(
                    `You can only upload a maximum of ${maxFiles} files.`,
                );
                return;
            }

            setIsUploading(true);
            try {
                const filePromises = Array.from(fileList).map(processFile);
                const newFiles = await Promise.all(filePromises);

                const updatedFiles = [...files, ...newFiles];
                setFiles(updatedFiles);
                onFileUpload?.(updatedFiles);
            } catch (error) {
                onError?.(
                    `Error processing files: ${error instanceof Error ? error.message : "Unknown error"}`,
                );
            } finally {
                setIsUploading(false);
            }
        },
        [files, maxFiles, processFile, onFileUpload, onError],
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles],
    );

    const removeFile = useCallback(
        (fileId: string) => {
            const updatedFiles = files.filter((file) => file.id !== fileId);
            setFiles(updatedFiles);
            onFileRemove?.(fileId, updatedFiles);
        },
        [files, onFileRemove],
    );

    const clearAllFiles = useCallback(() => {
        setFiles([]);
        onFileUpload?.([]);
    }, [onFileUpload]);

    const getFileIcon = useCallback((type: string) => {
        if (type === "application/pdf") {
            return "📄";
        }
        if (type.includes("word") || type.includes("document")) {
            return "📝";
        }
        return "📎";
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }, []);

    return {
        files,
        isUploading,
        dragActive,
        handleFiles,
        handleDrag,
        handleDrop,
        removeFile,
        clearAllFiles,
        getFileIcon,
        formatFileSize,
        validateFile,
    };
};
