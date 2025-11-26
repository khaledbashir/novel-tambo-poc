"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/tailwind/ui/scroll-area";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
    DocumentUploader,
    DocumentPreview,
    UploadedDocument,
} from "@/components/ui/file-upload-new";

interface Message {
    id: string;
    content: string;
    documents?: UploadedDocument[];
    sender: "user" | "assistant";
    timestamp: Date;
}

interface MessageInputWithDocumentsProps {
    onSendMessage?: (content: string, documents: UploadedDocument[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    allowMultipleDocuments?: boolean;
    maxDocumentSize?: number; // in MB
    maxDocuments?: number;
}

export function MessageInputWithDocuments({
    onSendMessage,
    placeholder = "Type your message...",
    disabled = false,
    className = "",
    allowMultipleDocuments = true,
    maxDocumentSize = 10, // 10MB default
    maxDocuments = 5,
}: MessageInputWithDocumentsProps) {
    const [content, setContent] = useState("");
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Handle sending a message
    const handleSend = useCallback(() => {
        if (
            (!content.trim() && documents.length === 0) ||
            disabled ||
            isUploading
        )
            return;

        // Filter only successfully uploaded documents
        const validDocuments = documents.filter(
            (doc) => doc.status === "success",
        );

        if (content.trim() || validDocuments.length > 0) {
            if (onSendMessage) {
                onSendMessage(content, validDocuments);
            }
            // Clear input and documents after sending
            setContent("");
            setDocuments([]);
            setShowUploader(false);

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    }, [content, documents, disabled, isUploading, onSendMessage]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    // Auto-resize textarea
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value;
            setContent(value);

            // Auto-resize
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            }
        },
        [],
    );

    // Remove a document
    const handleRemoveDocument = useCallback((id: string) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }, []);

    // Check if any documents are still uploading
    React.useEffect(() => {
        const hasUploading = documents.some(
            (doc) => doc.status === "uploading",
        );
        setIsUploading(hasUploading);
    }, [documents]);

    // Add documents from the uploader
    const handleDocumentsChange = useCallback(
        (updatedDocuments: UploadedDocument[]) => {
            setDocuments((prev) => {
                const newDocs = [...prev];
                updatedDocuments.forEach((updatedDoc) => {
                    const index = newDocs.findIndex((d) => d.id === updatedDoc.id);
                    if (index !== -1) {
                        newDocs[index] = updatedDoc;
                    } else {
                        newDocs.push(updatedDoc);
                    }
                });
                return newDocs;
            });

            // Show a success toast when documents are added
            const successCount = updatedDocuments.filter(
                (doc) => doc.status === "success",
            ).length;
            const uploadingCount = updatedDocuments.filter(
                (doc) => doc.status === "uploading",
            ).length;

            if (successCount > 0 && uploadingCount === 0) {
                toast.success(`${successCount} document(s) added to message`);
            }
        },
        [],
    );

    const isSendDisabled =
        disabled || (!content.trim() && documents.length === 0) || isUploading;

    return (
        <div className={`border rounded-lg bg-background ${className}`}>
            <div className="p-3">
                {/* Document preview */}
                {documents.length > 0 && (
                    <div className="mb-2">
                        <DocumentPreview
                            documents={documents}
                            onRemove={handleRemoveDocument}
                            compact={true}
                        />
                    </div>
                )}

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full resize-none border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed"
                    rows={1}
                    style={{
                        minHeight: "24px",
                        maxHeight: "200px",
                    }}
                />
            </div>

            {/* Document uploader - shown when toggle is active */}
            {showUploader && (
                <div className="px-3 pb-3">
                    <div className="relative">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowUploader(false)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2 mb-4">
                            <DocumentUploader
                                // @ts-ignore - Prop interface mismatch
                                onDocumentsChange={handleDocumentsChange}
                                maxFileSize={10 * 1024 * 1024}
                                maxFiles={5}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between p-2 pt-0">
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowUploader(!showUploader)}
                        disabled={disabled}
                    >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">Attach document</span>
                    </Button>
                </div>
                <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isSendDisabled}
                    onClick={handleSend}
                >
                    {isUploading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send message</span>
                </Button>
            </div>
        </div>
    );
}

// Example usage component
export function MessageInputExample() {
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSendMessage = (
        content: string,
        documents: UploadedDocument[],
    ) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            documents,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
    };

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className="flex justify-end">
                            <div className="max-w-[80%] bg-primary text-primary-foreground p-3 rounded-lg">
                                {message.content && <p>{message.content}</p>}
                                {message.documents &&
                                    message.documents.length > 0 && (
                                        <div className="mt-2">
                                            <DocumentPreview
                                                documents={message.documents}
                                                compact={true}
                                            />
                                        </div>
                                    )}
                                <div className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4">
                <MessageInputWithDocuments onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
}
