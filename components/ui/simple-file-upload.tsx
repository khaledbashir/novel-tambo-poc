"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SimpleFileUploadProps {
    onUploadComplete: (result: any) => void;
}

export function SimpleFileUpload({ onUploadComplete }: SimpleFileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File is too large (max 10MB)");
            return;
        }

        setFileName(file.name);
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
            toast.success("File uploaded and analyzed successfully");
            onUploadComplete(result);

            // Clear input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload file");
            setFileName(null);
        } finally {
            setIsUploading(false);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
            />

            {!fileName ? (
                <button
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all group"
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Upload Client Brief
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                        Click to upload a PDF document (max 10MB). The AI will analyze it to generate your SOW.
                    </p>
                </button>
            ) : (
                <div className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-xs">
                                    {fileName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Analyzing content...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            Ready for generation
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {!isUploading && (
                            <button
                                onClick={() => setFileName(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
                                title="Remove file"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {isUploading && (
                        <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full animate-progress-indeterminate origin-left"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
