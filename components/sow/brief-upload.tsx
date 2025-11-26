"use client";

import React from 'react';
import { withInteractable } from '@tambo-ai/react';
import { FileText, CheckCircle, Calendar, FileIcon } from 'lucide-react';
import { z } from 'zod';

export const briefUploadSchema = z.object({
    fileName: z.string(),
    pages: z.number(),
    briefText: z.string(),
    uploadedAt: z.string(),
    fileSize: z.number().optional(),
});

export type BriefUploadProps = z.infer<typeof briefUploadSchema>;

const BriefUploadBase: React.FC<BriefUploadProps> = ({
    fileName,
    pages,
    briefText,
    uploadedAt,
    fileSize,
}) => {
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-card rounded-lg border border-border shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Client Brief Uploaded</h3>
                    <p className="text-sm text-muted-foreground">Brief has been parsed and is ready for SOW generation</p>
                </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <FileIcon className="text-muted-foreground" size={20} />
                    <div className="flex-1">
                        <div className="text-sm text-muted-foreground">File Name</div>
                        <div className="font-medium text-foreground">{fileName}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Pages</div>
                        <div className="text-lg font-bold text-foreground">{pages}</div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Size</div>
                        <div className="text-lg font-bold text-foreground">{formatFileSize(fileSize)}</div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Words</div>
                        <div className="text-lg font-bold text-foreground">
                            {briefText ? briefText.split(/\s+/).length.toLocaleString() : 'N/A'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Calendar className="text-muted-foreground" size={16} />
                    <div className="text-sm">
                        <span className="text-muted-foreground">Uploaded: </span>
                        <span className="font-medium text-foreground">{formatDate(uploadedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            {briefText && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="text-sm font-semibold text-foreground mb-2">Brief Preview</div>
                    <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                        {briefText.substring(0, 500)}
                        {briefText.length > 500 && '...'}
                    </div>
                </div>
            )}

            {/* Status */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    ✓ Brief content has been extracted and will be used as context for SOW generation.
                </p>
            </div>
        </div>
    );
};

export const BriefUpload = withInteractable(BriefUploadBase, {
    componentName: 'BriefUpload',
    description: 'Displays metadata and preview for an uploaded and parsed client brief PDF',
    propsSchema: briefUploadSchema,
});

export default BriefUpload;
