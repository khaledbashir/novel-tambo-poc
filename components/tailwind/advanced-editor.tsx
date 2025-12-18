"use client";
import { defaultEditorContent } from "@/lib/content";
import {
    EditorCommand,
    EditorCommandEmpty,
    EditorCommandItem,
    EditorCommandList,
    EditorContent,
    type EditorInstance,
    EditorRoot,
    ImageResizer,
    type JSONContent,
    handleCommandNavigation,
    handleImageDrop,
    handleImagePaste,
    EditorBubble,
} from "novel";
import { Download } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { defaultExtensions } from "./extensions";
import { ColorSelector } from "./selectors/color-selector";
import { LinkSelector } from "./selectors/link-selector";
import { MathSelector } from "./selectors/math-selector";
import { NodeSelector } from "./selectors/node-selector";
import { Separator } from "./ui/separator";
import { notifications } from "@/lib/utils";

import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { uploadFn } from "./image-upload";
import { TextButtons } from "./selectors/text-buttons";
import { TableSelector } from "./selectors/table-selector";
import { slashCommand, suggestionItems, SlashCommandDialogs } from "./slash-command";
import Magic from "./ui/icons/magic";
import { AISelector } from "./generative/ai-selector";
import { removeAIHighlight } from "novel";
import { insertSOWToEditor } from "@/lib/editor/insert-sow";

const hljs = require("highlight.js");

const extensions = [...defaultExtensions, slashCommand];

const TailwindAdvancedEditor = ({
    documentId,
    workspaceId,
}: {
    documentId: string | null;
    workspaceId: string | null;
}) => {
    const [initialContent, setInitialContent] = useState<JSONContent | null>(
        defaultEditorContent,
    );
    const [saveStatus, setSaveStatus] = useState("Saved");
    const [charsCount, setCharsCount] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const editorRef = useRef<EditorInstance | null>(null);

    const [openNode, setOpenNode] = useState(false);
    const [openColor, setOpenColor] = useState(false);
    const [openLink, setOpenLink] = useState(false);
    const [openAI, setOpenAI] = useState(false);

    //Apply Codeblock Highlighting on the HTML from editor.getHTML()
    const highlightCodeblocks = (content: string) => {
        const doc = new DOMParser().parseFromString(content, "text/html");
        doc.querySelectorAll("pre code").forEach((el) => {
            // @ts-ignore
            // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
            hljs.highlightElement(el);
        });
        return new XMLSerializer().serializeToString(doc);
    };

    const debouncedUpdates = useDebouncedCallback(
        async (editor: EditorInstance) => {
            const json = editor.getJSON();
            setCharsCount(editor.storage.characterCount.words());

            // Save to localStorage as fallback
            window.localStorage.setItem(
                "html-content",
                highlightCodeblocks(editor.getHTML()),
            );
            window.localStorage.setItem("novel-content", JSON.stringify(json));
            try {
                window.localStorage.setItem(
                    "markdown",
                    editor.storage.markdown.getMarkdown(),
                );
            } catch (error) {
                console.warn(
                    "Failed to get markdown, storing plain text",
                    error,
                );
                try {
                    window.localStorage.setItem(
                        "markdown",
                        String(editor.state.doc?.textContent ?? ""),
                    );
                } catch {
                    window.localStorage.setItem("markdown", "");
                }
            }

            // Save to database if documentId is available
            if (documentId) {
                try {
                    const response = await fetch(`/api/editor-content`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            documentId,
                            content: json,
                            html: highlightCodeblocks(editor.getHTML()),
                        }),
                    });

                    if (response.ok) {
                        setSaveStatus("Saved");
                    } else {
                        setSaveStatus("Error");
                    }
                } catch (error) {
                    console.error("Failed to save to database:", error);
                    setSaveStatus("Error");
                }
            } else {
                setSaveStatus("Saved");
            }
        },
        500,
    );

    useEffect(() => {
        // Load content from database if documentId is available
        const loadContent = async () => {
            setIsLoading(true);

            if (documentId) {
                try {
                    const response = await fetch(
                        `/api/editor-content?documentId=${documentId}`,
                    );
                    if (response.ok) {
                        const data = await response.json();
                        if (data.content) {
                            setInitialContent(data.content);
                            setIsLoading(false);
                            return;
                        }
                    }
                } catch (error) {
                    console.error(
                        "Failed to load content from database:",
                        error,
                    );
                }

                // Fallback to localStorage if database load fails
                const content = window.localStorage.getItem("novel-content");
                if (content) setInitialContent(JSON.parse(content));
            }

            setIsLoading(false);
        };

        loadContent();
    }, [documentId]);

    // Listen for custom event to open AI selector from slash command
    useEffect(() => {
        const handleOpenAI = (event: CustomEvent) => {
            // Defer state changes to a microtask to avoid calling setState during a render/commit
            Promise.resolve().then(() => setOpenAI(true));
            // If there's a specific option and text, we can handle it here
            // The AI selector will handle the actual completion
        };

        window.addEventListener("novel-open-ai", handleOpenAI as EventListener);
        return () => {
            window.removeEventListener(
                "novel-open-ai",
                handleOpenAI as EventListener,
            );
        };
    }, []);

    // Listen for SOW content insertion event
    useEffect(() => {
        const handleInsertSOW = (event: CustomEvent) => {
            const {
                scopes,
                projectTitle,
                clientName,
                projectOverview,
                budgetNotes,
                discount,
            } = event.detail;

            try {
                // Transform the data to match the expected format
                const sowData = {
                    clientName,
                    projectTitle,
                    scopes: scopes.map((scope: any, idx: number) => ({
                        id: `scope-${idx}`,
                        title: scope.title,
                        description: scope.description,
                        roles: (scope.roles || []).map(
                            (row: any, rowIdx: number) => ({
                                id: `role-${idx}-${rowIdx}`,
                                task: row.task,
                                role: row.role,
                                hours: row.hours || 0,
                                rate: row.rate || 0,
                            }),
                        ),
                        deliverables: scope.deliverables || [],
                        assumptions: scope.assumptions || [],
                    })),
                    projectOverview,
                    budgetNotes,
                    discount,
                };

                console.log("Inserting SOW data:", sowData);

                // Check if editor is available
                if (editorRef.current) {
                    insertSOWToEditor(editorRef.current, sowData);
                } else {
                    console.error(
                        "Editor not available - waiting for initialization",
                    );
                    notifications.warning(
                        "Editor loading...",
                        "Waiting for editor to initialize before inserting content.",
                    );

                    // Wait a moment and try again
                    setTimeout(() => {
                        if (editorRef.current) {
                            // Retry the insertSOW operation
                            insertSOWToEditor(editorRef.current, sowData);
                        } else {
                            console.error(
                                "Editor still not available after timeout",
                            );
                            notifications.error(
                                "Editor initialization failed",
                                "Editor is taking too long to initialize. Please refresh the page and try again.",
                            );
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error("Error preparing SOW content:", error);
                notifications.error(
                    "Failed to prepare SOW content",
                    error instanceof Error ? error.message : String(error),
                );
            }
        };

        const handleExportPDF = async () => {
            if (!editorRef.current) {
                notifications.error(
                    "Editor not ready",
                    "Please wait for the editor to fully load.",
                );
                return;
            }

            const htmlContent = editorRef.current.getHTML();

            // Add a print stylesheet to the HTML content for proper rendering
            const styles = `
                <style>
                    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 2cm; }
                    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    img { max-width: 100%; height: auto; }
                    .sow-component-wrapper { margin: 2em 0; page-break-inside: avoid; }
                    h1 { font-size: 24pt; margin-bottom: 0.5em; }
                    h2 { font-size: 18pt; margin-top: 1em; margin-bottom: 0.5em; }
                </style>
            `;

            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>${styles}</head>
                <body>${htmlContent}</body>
                </html>
            `;

            notifications.loading("Generating PDF...");

            try {
                const response = await fetch('/api/export/pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ html: fullHtml }),
                });

                if (!response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    let message = `Export failed (HTTP ${response.status})`;

                    try {
                        if (contentType.includes('application/json')) {
                            const errorData = await response.json();
                            message =
                                errorData?.details ||
                                errorData?.error ||
                                message;
                        } else {
                            const errorText = await response.text();
                            if (errorText) {
                                // Avoid dumping full HTML error pages into the UI
                                const snippet = errorText
                                    .replace(/\s+/g, ' ')
                                    .slice(0, 200);
                                message = `${message}: ${snippet}`;
                            }
                        }
                    } catch {
                        // If parsing fails, fall back to status only
                    }

                    throw new Error(message);
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `SOW_Document_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                notifications.success("PDF Exported", "Your document has been downloaded.");
            } catch (error: any) {
                console.error("PDF Export failed:", error);
                notifications.error(
                    "PDF export failed",
                    error.message || "Failed to export PDF. Please try again.",
                );
            }
        };

        window.addEventListener(
            "insert-sow-content",
            handleInsertSOW as EventListener,
        );
        window.addEventListener(
            "export-editor-pdf",
            handleExportPDF as EventListener,
        );

        return () => {
            window.removeEventListener(
                "insert-sow-content",
                handleInsertSOW as EventListener,
            );
            window.removeEventListener(
                "export-editor-pdf",
                handleExportPDF as EventListener,
            );
        };
    }, []);

    useEffect(() => {
        if (!openAI && editorRef.current) removeAIHighlight(editorRef.current);
    }, [openAI, editorRef.current]);

    // Show loading spinner while content is being fetched
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Editor will render even if editorRef.current is null initially
    // It will be set when the EditorContent component calls onCreate

    return (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
            <SlashCommandDialogs />
            <EditorRoot>
                <div className="sticky top-0 z-50 w-full bg-background border-b border-border px-3 py-2 flex items-center gap-2 flex-shrink-0 shadow-sm">
                    <NodeSelector open={openNode} onOpenChange={setOpenNode} />
                    <Separator orientation="vertical" />
                    <LinkSelector open={openLink} onOpenChange={setOpenLink} />
                    <Separator orientation="vertical" />
                    <MathSelector />
                    <Separator orientation="vertical" />
                    <TextButtons />
                    <Separator orientation="vertical" />
                    <TableSelector />
                    <Separator orientation="vertical" />
                    <ColorSelector
                        open={openColor}
                        onOpenChange={setOpenColor}
                    />
                    <Separator orientation="vertical" />
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent("export-editor-pdf"))}
                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        title="Export PDF"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto [scrollbar-gutter:stable] p-4">
                    <div className="w-full min-w-0 max-w-[900px] xl:max-w-[1200px] mx-auto bg-card p-6 md:p-12 rounded-lg border border-border shadow-sm">
                        <EditorContent
                            immediatelyRender={false}
                            initialContent={initialContent ?? undefined}
                            extensions={extensions}
                            className="w-full min-h-[500px] break-words"
                            onCreate={({ editor }) => {
                                editorRef.current = editor;
                                console.log("Editor initialized successfully");
                            }}
                            onDestroy={() => {
                                editorRef.current = null;
                            }}
                            editorProps={{
                                handleDOMEvents: {
                                    keydown: (_view, event) =>
                                        handleCommandNavigation(event),
                                },
                                handlePaste: (view, event) =>
                                    handleImagePaste(view, event, uploadFn),
                                handleDrop: (view, event, _slice, moved) =>
                                    handleImageDrop(
                                        view,
                                        event,
                                        moved,
                                        uploadFn,
                                    ),
                                attributes: {
                                    class: `prose prose-sm dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full break-words prose-a:text-sg-green hover:prose-a:text-sg-green-hover prose-blockquote:border-sg-green prose-strong:text-foreground prose-headings:text-foreground prose-p:text-foreground dark:prose-p:text-foreground prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0`,
                                    style: 'min-height: 500px; overflow-anchor: auto;',
                                },
                                transformPastedHTML: (html) => html,
                            }}
                            onUpdate={({ editor }) => {
                                debouncedUpdates(editor);
                                setSaveStatus("Unsaved");
                            }}
                            slotAfter={<ImageResizer />}
                        >
                            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                                <EditorCommandEmpty className="px-2 text-muted-foreground">
                                    No results
                                </EditorCommandEmpty>
                                <EditorCommandList>
                                    {suggestionItems.map((item) => (
                                        <EditorCommandItem
                                            value={item.title}
                                            onCommand={() => {
                                                if (
                                                    item.command &&
                                                    editorRef.current
                                                ) {
                                                    item.command({
                                                        editor: editorRef.current,
                                                        range: {
                                                            from: editorRef
                                                                .current.state
                                                                .selection.from,
                                                            to: editorRef
                                                                .current.state
                                                                .selection.to,
                                                        },
                                                    });
                                                }
                                            }}
                                            className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent `}
                                            key={item.title}
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </EditorCommandItem>
                                    ))}
                                </EditorCommandList>
                            </EditorCommand>
                            <EditorBubble
                                tippyOptions={{
                                    placement: "top",
                                    onHidden: () => {
                                        setOpenAI(false);
                                        editorRef.current
                                            ?.chain()
                                            .unsetHighlight()
                                            .run();
                                    },
                                }}
                                className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
                            >
                                {openAI ? (
                                    <AISelector
                                        open={openAI}
                                        onOpenChange={setOpenAI}
                                    />
                                ) : (
                                    <>
                                        <Separator orientation="vertical" />
                                        <NodeSelector
                                            open={openNode}
                                            onOpenChange={setOpenNode}
                                        />
                                        <Separator orientation="vertical" />
                                        <LinkSelector
                                            open={openLink}
                                            onOpenChange={setOpenLink}
                                        />
                                        <Separator orientation="vertical" />
                                        <TextButtons />
                                        <Separator orientation="vertical" />
                                        <TableSelector />
                                        <Separator orientation="vertical" />
                                        <ColorSelector
                                            open={openColor}
                                            onOpenChange={setOpenColor}
                                        />
                                        <Separator orientation="vertical" />
                                        <button
                                            onClick={() => setOpenAI(true)}
                                            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-emerald-600 hover:bg-accent hover:text-emerald-700 transition-colors"
                                        >
                                            <Magic className="h-4 w-4" />
                                            Ask AI
                                        </button>
                                    </>
                                )}
                            </EditorBubble>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
                        </EditorContent>
                    </div>
                </div>
            </EditorRoot>
        </div>
    );
};

export default TailwindAdvancedEditor;
