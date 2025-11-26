"use client";

import React, { useState } from "react";
import SOWFileUpload from "@/components/ui/file-upload/sow/sow-file-upload";
import { UploadedFile } from "@/hooks/use-file-upload";
import { FileText, ArrowRight } from "lucide-react";

export const SimpleSOWPage = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);

    const handleFilesChange = (newFiles: UploadedFile[]) => {
        setFiles(newFiles);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        SOW Generator
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Upload your client brief or requirements to get started.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm p-8">
                    <SOWFileUpload
                        onFilesChange={handleFilesChange}
                        title="Upload Documents"
                        description="Attach PDF or Word documents containing project requirements."
                        className="w-full"
                    />

                    {files.length > 0 && (
                        <div className="mt-8 flex justify-end">
                            <button
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                onClick={() => alert("SOW Generation started with " + files.length + " files!")}
                            >
                                Generate SOW
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        <p>Supports PDF & Word</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        <p>AI Analysis</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        <p>Instant Generation</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
