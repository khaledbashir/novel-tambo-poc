"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    useTamboContextAttachment,
    type ContextAttachment,
} from "@tambo-ai/react";
import { FileText, Image as ImageIcon } from "lucide-react";

interface ContextAttachmentBadgeProps {
    attachment: ContextAttachment;
    onRemove?: () => void;
    className?: string;
}

/**
 * Badge component for displaying context attachments like documents
 * Shows file icon, name, and remove button
 */
export function ContextAttachmentBadge({
    attachment,
    onRemove,
    className,
}: ContextAttachmentBadgeProps) {
    // Get appropriate icon based on metadata
    const getIcon = () => {
        const type = attachment.metadata?.type as string;
        const name = attachment.name.toLowerCase();

        if (type?.includes("pdf") || name.endsWith(".pdf")) {
            return <FileText className="w-4 h-4 text-red-500" />;
        }

        if (
            type?.includes("word") ||
            type?.includes("document") ||
            name.endsWith(".doc") ||
            name.endsWith(".docx")
        ) {
            return <FileText className="w-4 h-4 text-blue-500" />;
        }

        // Default for images
        if (
            type?.includes("image") ||
            name.match(/\.(png|jpg|jpeg|gif|webp)$/i)
        ) {
            return <ImageIcon className="w-4 h-4 text-green-500" />;
        }

        // Default icon
        return <FileText className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 bg-muted/70 border border-border rounded-md text-sm max-w-[200px]",
                className,
            )}
            title={attachment.name}
        >
            {attachment.icon || getIcon()}
            <span className="truncate flex-1 min-w-0">{attachment.name}</span>
            {onRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 flex-shrink-0 ml-1"
                    onClick={onRemove}
                    aria-label={`Remove ${attachment.name}`}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
