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
            } else {
                // Load from localStorage if no documentId
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

            try {
                // Dynamically import html2pdf to avoid SSR issues
                const html2pdf = (await import("html2pdf.js")).default;

                const element = editorRef.current.view.dom;

                // Configure PDF options with explicit typing to prevent incremental errors
                type Html2PdfOptions = {
                    margin: [number, number, number, number];
                    filename: string;
                    image: { type: "jpeg" | "png" | "webp"; quality: number };
                    html2canvas: {
                        scale: number;
                        useCORS: boolean;
                        logging: boolean;
                    };
                    jsPDF: {
                        unit: "mm";
                        format: "a4" | "letter" | "legal" | "tabloid";
                        orientation: "portrait" | "landscape";
                    };
                };

                const opt: Html2PdfOptions = {
                    margin: [10, 10, 20, 10], // Top, Left, Bottom, Right (mm)
                    filename: "SOW_Export.pdf",
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait",
                    },
                };

                // Create a worker instance to handle PDF generation
                const worker = html2pdf().set(opt).from(element);

                // Generate PDF with custom modifications
                worker
                    .toPdf()
                    .get("pdf")
                    .then((pdf: any) => {
                        // Add Green Footer Bar to every page
                        const totalPages = pdf.internal.getNumberOfPages();
                        for (let i = 1; i <= totalPages; i++) {
                            pdf.setPage(i);
                            pdf.setFillColor(0, 208, 132); // #00D084
                            pdf.rect(0, 287, 210, 10, "F"); // Green bar at bottom

                            // Optional: Add legal text
                            if (i === totalPages) {
                                pdf.setFontSize(9);
                                pdf.setTextColor(100, 100, 100);
                                pdf.text(
                                    "*** This concludes the Scope of Work document. ***",
                                    105,
                                    283,
                                    { align: "center" },
                                );
                            }
                        }
                    })
                    .then(() => {
                        // Save the PDF after modifications
                        worker.save();
                    });
            } catch (error) {
                console.error("PDF Export failed:", error);
                notifications.error(
                    "PDF export failed",
                    "Failed to export PDF. Please try again.",
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
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="w-full max-w-none">
                        <EditorContent
                            immediatelyRender={false}
                            initialContent={initialContent ?? undefined}
                            extensions={extensions}
                            className="min-h-full"
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
                                    class: `prose prose-sm dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full prose-a:text-sg-green hover:prose-a:text-sg-green-hover prose-blockquote:border-sg-green prose-strong:text-foreground prose-headings:text-foreground prose-p:text-foreground dark:prose-p:text-foreground prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0`,
                                },
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
                        </EditorContent>
                    </div>
                </div>
            </EditorRoot>
        </div>
    );
};

export default TailwindAdvancedEditor;
