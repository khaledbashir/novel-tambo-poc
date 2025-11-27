"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, FileText, Folder, X } from "lucide-react";
import { ThemeToggle } from "@/components/tailwind/ui/theme-toggle";

interface Workspace {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

interface Document {
    id: string;
    name: string;
    workspace_id: string;
    tambo_thread_id: string;
    created_at: string;
    updated_at: string;
}

export function Sidebar({
    className,
    selectedDocument,
    selectedWorkspace,
    onDocumentSelect,
    onWorkspaceSelect,
}: {
    className?: string;
    selectedDocument: string | null;
    selectedWorkspace: string | null;
    onDocumentSelect: (id: string | null) => void;
    onWorkspaceSelect: (id: string | null) => void;
}) {
    const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<{
        type: "workspace" | "document";
        id: string;
        name: string;
    } | null>(null);
    const [showModal, setShowModal] = React.useState<
        "workspace" | "document" | null
    >(null);
    const [modalInput, setModalInput] = React.useState("");

    // Fetch workspaces on component mount
    React.useEffect(() => {
        fetchWorkspaces();
    }, []);

    // Fetch documents when a workspace is selected
    React.useEffect(() => {
        if (selectedWorkspace) {
            fetchDocuments(selectedWorkspace);
        } else {
            setDocuments([]);
        }
    }, [selectedWorkspace]);

    const fetchWorkspaces = async () => {
        try {
            const response = await fetch("/api/workspaces");
            const data = await response.json();

            // Ensure we always set an array, even on error
            if (Array.isArray(data)) {
                setWorkspaces(data);
            } else {
                console.error("API returned non-array data:", data);
                setWorkspaces([]);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
            setWorkspaces([]);
        }
    };

    const fetchDocuments = async (workspaceId: string) => {
        try {
            const response = await fetch(
                `/api/documents?workspaceId=${workspaceId}`,
            );
            const data = await response.json();

            // Ensure we always set an array, even on error
            if (Array.isArray(data)) {
                setDocuments(data);
            } else {
                console.error("API returned non-array data:", data);
                setDocuments([]);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            setDocuments([]);
        }
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalInput.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/workspaces", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: modalInput }),
            });

            if (response.ok) {
                const newWorkspace = await response.json();
                fetchWorkspaces();
                onWorkspaceSelect(newWorkspace.id);
                setShowModal(null);
                setModalInput("");
            }
        } catch (error) {
            console.error("Failed to create workspace:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalInput.trim() || !selectedWorkspace) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: modalInput,
                    workspaceId: selectedWorkspace,
                }),
            });

            if (response.ok) {
                const newDoc = await response.json();
                fetchDocuments(selectedWorkspace);
                onDocumentSelect(newDoc.id);
                setShowModal(null);
                setModalInput("");
            }
        } catch (error) {
            console.error("Failed to create document:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteWorkspace = async (id: string) => {
        if (!confirm("Delete this workspace and all its documents?")) return;

        try {
            const response = await fetch(`/api/workspaces/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchWorkspaces();
                if (selectedWorkspace === id) {
                    onWorkspaceSelect(null);
                    setDocuments([]);
                }
            }
        } catch (error) {
            console.error("Failed to delete workspace:", error);
        }
    };

    const deleteDocument = async (id: string) => {
        if (!confirm("Delete this document?")) return;

        try {
            const response = await fetch(`/api/documents/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                fetchDocuments(selectedWorkspace!);
                if (selectedDocument === id) {
                    onDocumentSelect(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
    };

    const renameWorkspace = async (id: string, name: string) => {
        try {
            const response = await fetch(`/api/workspaces/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                fetchWorkspaces();
                setEditingItem(null);
            }
        } catch (error) {
            console.error("Failed to rename workspace:", error);
        }
    };

    const renameDocument = async (id: string, name: string) => {
        try {
            const response = await fetch(`/api/documents/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                fetchDocuments(selectedWorkspace!);
                setEditingItem(null);
            }
        } catch (error) {
            console.error("Failed to rename document:", error);
        }
    };

    return (
        <>
            <div
                className={cn(
                    "w-64 h-full overflow-y-auto flex-shrink-0 bg-gradient-to-b from-card to-card/95 border-r border-border/50 flex flex-col shadow-lg",
                    className,
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center justify-center">
                        <img
                            src="/images/footer-logo.svg"
                            alt="Logo"
                            className="h-8 w-auto invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 border-b border-border/50">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setShowModal("workspace");
                                setModalInput("");
                            }}
                            disabled={isLoading}
                            className="group flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <Plus
                                size={16}
                                className="group-hover:rotate-90 transition-transform duration-200"
                            />
                            Client
                        </button>
                        <button
                            onClick={() => {
                                if (!selectedWorkspace) return;
                                setShowModal("document");
                                setModalInput("");
                            }}
                            disabled={isLoading || !selectedWorkspace}
                            className="group flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                            title={
                                !selectedWorkspace
                                    ? "Select a client first"
                                    : "Create new project"
                            }
                        >
                            <Plus
                                size={16}
                                className="group-hover:rotate-90 transition-transform duration-200"
                            />
                            Project
                        </button>
                    </div>
                </div>

                {/* Workspaces List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3">
                        {workspaces.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Folder className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">
                                    No Clients Yet
                                </p>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Create a client workspace to organize SOWs
                                </p>
                                <button
                                    onClick={() => {
                                        setShowModal("workspace");
                                        setModalInput("");
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
                                >
                                    + Create First Client
                                </button>
                            </div>
                        ) : (
                            workspaces.map((workspace) => (
                                <div key={workspace.id} className="mb-2">
                                    <div
                                        className={cn(
                                            "group p-3 rounded-lg cursor-pointer transition-all duration-200",
                                            selectedWorkspace === workspace.id
                                                ? "bg-gradient-to-r from-primary/20 to-primary/10 shadow-md"
                                                : "hover:bg-accent/50",
                                        )}
                                        onClick={() =>
                                            onWorkspaceSelect(workspace.id)
                                        }
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1 min-w-0">
                                                <div
                                                    className={cn(
                                                        "p-1.5 rounded-md mr-3 transition-colors",
                                                        selectedWorkspace ===
                                                            workspace.id
                                                            ? "bg-primary/20"
                                                            : "bg-muted",
                                                    )}
                                                >
                                                    <Folder
                                                        className={cn(
                                                            "w-4 h-4",
                                                            selectedWorkspace ===
                                                                workspace.id
                                                                ? "text-primary"
                                                                : "text-muted-foreground",
                                                        )}
                                                    />
                                                </div>
                                                {editingItem?.type ===
                                                    "workspace" &&
                                                    editingItem.id ===
                                                    workspace.id ? (
                                                    <input
                                                        type="text"
                                                        defaultValue={
                                                            workspace.name
                                                        }
                                                        autoFocus
                                                        onBlur={(e) =>
                                                            renameWorkspace(
                                                                workspace.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {
                                                                renameWorkspace(
                                                                    workspace.id,
                                                                    e
                                                                        .currentTarget
                                                                        .value,
                                                                );
                                                            } else if (
                                                                e.key ===
                                                                "Escape"
                                                            ) {
                                                                setEditingItem(
                                                                    null,
                                                                );
                                                            }
                                                        }}
                                                        className="flex-1 px-2 py-1 text-sm border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                ) : (
                                                    <div className="font-medium text-sm truncate">
                                                        {workspace.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingItem({
                                                            type: "workspace",
                                                            id: workspace.id,
                                                            name: workspace.name,
                                                        });
                                                    }}
                                                    className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
                                                    title="Rename"
                                                >
                                                    <Edit className="w-3.5 h-3.5 text-primary" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteWorkspace(
                                                            workspace.id,
                                                        );
                                                    }}
                                                    className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents under this workspace */}
                                    {selectedWorkspace === workspace.id &&
                                        documents.length > 0 && (
                                            <div className="ml-8 mt-2 space-y-1">
                                                {documents.map((document) => (
                                                    <div
                                                        key={document.id}
                                                        className={cn(
                                                            "group p-2.5 rounded-md cursor-pointer transition-all duration-200",
                                                            selectedDocument ===
                                                                document.id
                                                                ? "bg-primary/10 shadow-sm"
                                                                : "hover:bg-accent/30",
                                                        )}
                                                        onClick={() =>
                                                            onDocumentSelect(
                                                                document.id,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center flex-1 min-w-0">
                                                                <FileText
                                                                    className={cn(
                                                                        "w-3.5 h-3.5 mr-2 flex-shrink-0",
                                                                        selectedDocument ===
                                                                            document.id
                                                                            ? "text-primary"
                                                                            : "text-muted-foreground",
                                                                    )}
                                                                />
                                                                {editingItem?.type ===
                                                                    "document" &&
                                                                    editingItem.id ===
                                                                    document.id ? (
                                                                    <input
                                                                        type="text"
                                                                        defaultValue={
                                                                            document.name
                                                                        }
                                                                        autoFocus
                                                                        onBlur={(
                                                                            e,
                                                                        ) =>
                                                                            renameDocument(
                                                                                document.id,
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        onKeyDown={(
                                                                            e,
                                                                        ) => {
                                                                            if (
                                                                                e.key ===
                                                                                "Enter"
                                                                            ) {
                                                                                renameDocument(
                                                                                    document.id,
                                                                                    e
                                                                                        .currentTarget
                                                                                        .value,
                                                                                );
                                                                            } else if (
                                                                                e.key ===
                                                                                "Escape"
                                                                            ) {
                                                                                setEditingItem(
                                                                                    null,
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-2 py-1 text-xs border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                                                        onClick={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="text-xs truncate">
                                                                        {
                                                                            document.name
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setEditingItem(
                                                                            {
                                                                                type: "document",
                                                                                id: document.id,
                                                                                name: document.name,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-primary/10 rounded transition-colors"
                                                                    title="Rename"
                                                                >
                                                                    <Edit className="w-3 h-3 text-primary" />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        deleteDocument(
                                                                            document.id,
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3 h-3 text-destructive" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-border/50 bg-card/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    {showModal === "workspace"
                                        ? "Create Client"
                                        : "Create Project"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(null);
                                        setModalInput("");
                                    }}
                                    className="p-1 hover:bg-accent rounded-md transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <form
                            onSubmit={
                                showModal === "workspace"
                                    ? handleCreateWorkspace
                                    : handleCreateDocument
                            }
                            className="p-6"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {showModal === "workspace"
                                            ? "Client Name"
                                            : "Project Name"}
                                    </label>
                                    <input
                                        type="text"
                                        value={modalInput}
                                        onChange={(e) =>
                                            setModalInput(e.target.value)
                                        }
                                        placeholder={
                                            showModal === "workspace"
                                                ? "e.g., Acme Corp"
                                                : "e.g., Website Redesign"
                                        }
                                        autoFocus
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(null);
                                            setModalInput("");
                                        }}
                                        className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            isLoading || !modalInput.trim()
                                        }
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isLoading ? "Creating..." : "Create"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
