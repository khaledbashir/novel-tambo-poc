"use client";

import React, { useState, useRef } from "react";
import { Upload, File, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
}

interface FileUploadProps {
    onFilesChange?: (files: UploadedFile[]) => void;
    maxFiles?: number;
    accept?: string;
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFilesChange,
    maxFiles = 5,
    accept = "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    className,
    children,
    disabled = false,
}) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList: FileList) => {
        const newFiles: UploadedFile[] = [];
        const totalFiles = files.length + fileList.length;

        if (totalFiles > maxFiles) {
            alert(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        Array.from(fileList).forEach((file) => {
            if (file.type && accept.includes(file.type)) {
                const uploadedFile: UploadedFile = {
                    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: URL.createObjectURL(file),
                };
                newFiles.push(uploadedFile);
            } else {
                alert(
                    `${file.name} is not a supported file type. Please upload PDF or Word documents.`,
                );
            }
        });

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        if (onFilesChange) {
            onFilesChange(updatedFiles);
        }
    };

    const removeFile = (id: string) => {
        const updatedFiles = files.filter((file) => file.id !== id);
        setFiles(updatedFiles);
        if (onFilesChange) {
            onFilesChange(updatedFiles);
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const openFileDialog = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (type: string) => {
        if (type === "application/pdf") {
            return <File className="h-8 w-8 text-red-500" />;
        }
        return <FileText className="h-8 w-8 text-blue-500" />;
    };

    return (
        <div className={cn("w-full", className)}>
            <input
                type="file"
                ref={inputRef}
                onChange={handleChange}
                accept={accept}
                multiple={maxFiles > 1}
                disabled={disabled}
                className="hidden"
            />

            {children ? (
                <div onClick={openFileDialog}>{children}</div>
            ) : (
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                        dragActive
                            ? "border-primary bg-primary/10"
                            : "border-muted-foreground/25",
                        disabled && "cursor-not-allowed opacity-50",
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                >
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                        {dragActive
                            ? "Drop the files here"
                            : "Drag and drop files here"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Supported formats: PDF and Word documents (.pdf, .doc,
                        .docx)
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Maximum files: {maxFiles}
                    </p>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Uploaded Files:</p>
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    {getFileIcon(file.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="p-1 rounded-full hover:bg-muted"
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
