import { Extension, ExtensionConfig } from "@tiptap/core";
import {
    MarkdownSerializer,
    defaultMarkdownSerializer,
} from "prosemirror-markdown";

interface MarkdownOptions {
    html?: boolean;
    tightLists?: boolean;
    tightListClass?: string;
    bulletListMarker?: string;
    linkify?: boolean;
    breaks?: boolean;
    transformPastedText?: boolean;
    transformCopiedText?: boolean;
}

// Create markdown extension that provides storage API for TipTap 2.x
// This extension provides the storage.markdown API that other parts of the code use
export const MarkdownExtension = Extension.create<MarkdownOptions>({
    name: "markdown",

    addOptions() {
        return {
            html: true,
            tightLists: true,
            tightListClass: "tight",
            bulletListMarker: "-",
            linkify: false,
            breaks: false,
            transformPastedText: false,
            transformCopiedText: false,
        };
    },

    addStorage() {
        return {
            markdown: {
                serializer: {
                    serialize: (content: any) => {
                        try {
                            // Use the default markdown serializer
                            // This works with ProseMirror nodes
                            return defaultMarkdownSerializer.serialize(content);
                        } catch (error) {
                            console.warn(
                                "Markdown serialization error:",
                                error,
                            );
                            return "";
                        }
                    },
                },
                // getMarkdown will be set up in onCreate() with access to this.editor
                getMarkdown: () => {
                    console.warn(
                        "getMarkdown called before editor initialization",
                    );
                    return "";
                },
            },
        };
    },

    onCreate() {
        // Set up getMarkdown and serializer when the editor is created
        if (this.editor) {
            const schema = this.editor.schema;

            // Always set up getMarkdown as a function that uses this.editor
            // Try to create a schema-specific serializer if possible
            let serializer: MarkdownSerializer;

            try {
                // Check if MarkdownSerializer has a fromSchema static method
                if (
                    typeof (MarkdownSerializer as any).fromSchema === "function"
                ) {
                    serializer = (MarkdownSerializer as any).fromSchema(schema);
                } else {
                    // Fallback to default serializer
                    serializer = defaultMarkdownSerializer;
                }
            } catch (error) {
                // Fallback to default serializer if schema-specific creation fails
                console.warn(
                    "Could not create schema-specific markdown serializer, using default:",
                    error,
                );
                serializer = defaultMarkdownSerializer;
            }

            try {
                const base: any = serializer ?? defaultMarkdownSerializer;
                const nodes = {
                    ...((base && (base as any).nodes) ||
                        (defaultMarkdownSerializer as any).nodes ||
                        {}),
                    // Add hardBreak handler to fix "Token type `hardBreak` not supported" error
                    hardBreak: (
                        state: any,
                        node: any,
                        parent: any,
                        index: any,
                    ) => {
                        // Render as two spaces + newline (standard markdown line break)
                        state.write("  \n");
                    },
                    // Add bulletList handler
                    bulletList: (state: any, node: any) => {
                        state.renderList(node, "  ", () => (node.attrs.bullet || "-") + " ");
                    },
                    // Add orderedList handler
                    orderedList: (state: any, node: any) => {
                        const start = node.attrs.start || 1;
                        const maxW = String(start + node.childCount - 1).length;
                        const space = maxW + 2;
                        state.renderList(node, " ".repeat(space), (index: number) => {
                            const n = start + index;
                            return n + ". " + " ".repeat(maxW - String(n).length);
                        });
                    },
                    // Add listItem handler
                    listItem: (state: any, node: any) => {
                        state.renderContent(node);
                    },
                    // Add table handlers to prevent "Token type `table` not supported" warnings
                    table: (state: any, node: any) => {
                        // Tables don't have a standard markdown representation
                        // Convert to plain text or skip
                        state.write("\n\n[Table content omitted in markdown export]\n\n");
                    },
                    tableRow: (state: any, node: any) => {
                        // Skip table rows in markdown
                    },
                    tableCell: (state: any, node: any) => {
                        // Skip table cells in markdown
                    },
                    tableHeader: (state: any, node: any) => {
                        // Skip table headers in markdown
                    },
                };
                const marks = {
                    ...((base && (base as any).marks) ||
                        (defaultMarkdownSerializer as any).marks ||
                        {}),
                } as Record<string, any>;
                if (!marks["ai-highlight"]) {
                    marks["ai-highlight"] = {
                        open: "==",
                        close: "==",
                        mixable: true,
                        expelEnclosingWhitespace: true,
                    };
                }
                // Add bold mark support to fix "Mark type `bold` not supported by Markdown renderer"
                if (!marks["bold"]) {
                    marks["bold"] = {
                        open: "**",
                        close: "**",
                        mixable: true,
                        expelEnclosingWhitespace: true,
                    };
                }
                // Add italic mark support
                if (!marks["italic"]) {
                    marks["italic"] = {
                        open: "_",
                        close: "_",
                        mixable: true,
                        expelEnclosingWhitespace: true,
                    };
                }
                // Add strike mark support
                if (!marks["strike"]) {
                    marks["strike"] = {
                        open: "~~",
                        close: "~~",
                        mixable: true,
                        expelEnclosingWhitespace: true,
                    };
                }
                // Add code mark support
                if (!marks["code"]) {
                    marks["code"] = {
                        open: "`",
                        close: "`",
                        mixable: false,
                        expelEnclosingWhitespace: true,
                    };
                }
                // Add link mark support
                if (!marks["link"]) {
                    marks["link"] = {
                        open: "[",
                        close: "]",
                        mixable: true,
                        expelEnclosingWhitespace: true,
                    };
                }
                const safeSerializer = new (MarkdownSerializer as any)(
                    nodes,
                    marks,
                );
                serializer = safeSerializer as MarkdownSerializer;
            } catch (error) {
                console.warn(
                    "Failed to augment markdown serializer, using base serializer:",
                    error,
                );
            }

            // Set up the serializer with access to the schema-specific serializer
            this.editor.storage.markdown.serializer = {
                serialize: (content: any) => {
                    try {
                        return serializer.serialize(content);
                    } catch (error) {
                        console.warn("Markdown serialization error:", error);
                        // Fallback to default
                        try {
                            return defaultMarkdownSerializer.serialize(content);
                        } catch (e2) {
                            try {
                                const doc: any =
                                    content ?? this.editor.state.doc;
                                return String(doc?.textContent ?? "");
                            } catch {
                                return "";
                            }
                        }
                    }
                },
            };

            // Set up getMarkdown as a function that uses this.editor
            this.editor.storage.markdown.getMarkdown = () => {
                try {
                    return serializer.serialize(this.editor.state.doc);
                } catch (error) {
                    console.warn("Get markdown error:", error);
                    try {
                        return defaultMarkdownSerializer.serialize(
                            this.editor.state.doc,
                        );
                    } catch (e2) {
                        try {
                            return String(
                                this.editor.state.doc.textContent ?? "",
                            );
                        } catch {
                            return "";
                        }
                    }
                }
            };
        }
    },
});
