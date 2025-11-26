import {
    CheckSquare,
    Code,
    Heading1,
    Heading2,
    Heading3,
    ImageIcon,
    List,
    ListOrdered,
    MessageSquarePlus,
    Text,
    TextQuote,
    Twitter,
    Youtube,
    ArrowDownWideNarrow,
    CheckCheck,
    RefreshCcwDot,
    StepForward,
    WrapText,
    Table as TableIcon,
} from "lucide-react";
import { Command, createSuggestionItems, renderItems } from "novel";
import { uploadFn } from "./image-upload";
import Magic from "./ui/icons/magic";

const dispatchOpenAI = (detail: Record<string, any>) =>
    Promise.resolve().then(() =>
        window.dispatchEvent(new CustomEvent("novel-open-ai", { detail })),
    );

export const suggestionItems = createSuggestionItems([
    {
        title: "Ask AI",
        description: "Use AI to generate or edit content.",
        searchTerms: ["ai", "generate", "ask", "magic"],
        icon: <Magic className="h-[18px] w-[18px] text-purple-500" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            // Dispatch event to open AI selector (overlay now handles display when no selection exists)
            dispatchOpenAI({ option: "continue" });
        },
    },
    {
        title: "Continue Writing",
        description: "AI will continue from where you left off.",
        searchTerms: ["continue", "ai", "generate"],
        icon: <StepForward size={18} className="text-purple-500" />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            dispatchOpenAI({ option: "continue" });
        },
    },
    {
        title: "Improve Writing",
        description: "AI will improve the selected text.",
        searchTerms: ["improve", "enhance", "better", "ai"],
        icon: <RefreshCcwDot size={18} className="text-purple-500" />,
        command: ({ editor, range }) => {
            const selectedText = editor.state.doc.textBetween(
                range.from,
                range.to,
            );
            if (selectedText) {
                dispatchOpenAI({ option: "improve", text: selectedText });
            } else {
                editor.chain().focus().deleteRange(range).run();
                dispatchOpenAI({ option: "continue" });
            }
        },
    },
    {
        title: "Fix Grammar",
        description: "AI will fix grammar and spelling errors.",
        searchTerms: ["fix", "grammar", "spell", "correct", "ai"],
        icon: <CheckCheck size={18} className="text-purple-500" />,
        command: ({ editor, range }) => {
            const selectedText = editor.state.doc.textBetween(
                range.from,
                range.to,
            );
            if (selectedText) {
                dispatchOpenAI({ option: "fix", text: selectedText });
            } else {
                editor.chain().focus().deleteRange(range).run();
                dispatchOpenAI({ option: "continue" });
            }
        },
    },
    {
        title: "Make Shorter",
        description: "AI will make the text more concise.",
        searchTerms: ["shorter", "concise", "summarize", "ai"],
        icon: <ArrowDownWideNarrow size={18} className="text-purple-500" />,
        command: ({ editor, range }) => {
            const selectedText = editor.state.doc.textBetween(
                range.from,
                range.to,
            );
            if (selectedText) {
                dispatchOpenAI({ option: "shorter", text: selectedText });
            } else {
                editor.chain().focus().deleteRange(range).run();
                dispatchOpenAI({ option: "continue" });
            }
        },
    },
    {
        title: "Make Longer",
        description: "AI will expand the text with more details.",
        searchTerms: ["longer", "expand", "elaborate", "ai"],
        icon: <WrapText size={18} className="text-purple-500" />,
        command: ({ editor, range }) => {
            const selectedText = editor.state.doc.textBetween(
                range.from,
                range.to,
            );
            if (selectedText) {
                dispatchOpenAI({ option: "longer", text: selectedText });
            } else {
                editor.chain().focus().deleteRange(range).run();
                dispatchOpenAI({ option: "continue" });
            }
        },
    },
    {
        title: "Send Feedback",
        description: "Let us know how we can improve.",
        icon: <MessageSquarePlus size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            window.open("/feedback", "_blank");
        },
    },
    {
        title: "Text",
        description: "Just start typing with plain text.",
        searchTerms: ["p", "paragraph"],
        icon: <Text size={18} />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .run();
        },
    },
    {
        title: "To-do List",
        description: "Track tasks with a to-do list.",
        searchTerms: ["todo", "task", "list", "check", "checkbox"],
        icon: <CheckSquare size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
    },
    {
        title: "Heading 1",
        description: "Big section heading.",
        searchTerms: ["title", "big", "large"],
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 1 })
                .run();
        },
    },
    {
        title: "Heading 2",
        description: "Medium section heading.",
        searchTerms: ["subtitle", "medium"],
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 2 })
                .run();
        },
    },
    {
        title: "Heading 3",
        description: "Small section heading.",
        searchTerms: ["subtitle", "small"],
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) => {
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode("heading", { level: 3 })
                .run();
        },
    },
    {
        title: "Bullet List",
        description: "Create a simple bullet list.",
        searchTerms: ["unordered", "point"],
        icon: <List size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
    {
        title: "Numbered List",
        description: "Create a list with numbering.",
        searchTerms: ["ordered"],
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
    },
    {
        title: "Quote",
        description: "Capture a quote.",
        searchTerms: ["blockquote"],
        icon: <TextQuote size={18} />,
        command: ({ editor, range }) =>
            editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleNode("paragraph", "paragraph")
                .toggleBlockquote()
                .run(),
    },
    {
        title: "Code",
        description: "Capture a code snippet.",
        searchTerms: ["codeblock"],
        icon: <Code size={18} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: "Table",
        description: "Insert a table.",
        searchTerms: ["table", "grid", "spreadsheet"],
        icon: <TableIcon size={18} />,
        command: ({ editor, range }) => {
            try {
                console.log("Table command triggered");
                console.log("Editor instance:", editor);
                console.log(
                    "Has insertTable command:",
                    !!editor.commands.insertTable,
                );

                // Delete the slash command text
                editor.chain().focus().deleteRange(range).run();

                // Insert the table
                const result = editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();

                console.log("Table insertion result:", result);

                if (!result) {
                    console.error(
                        "Table insertion failed - command returned false",
                    );
                    alert("Failed to insert table. Check console for details.");
                }
            } catch (error) {
                console.error("Error inserting table:", error);
                alert(
                    `Error inserting table: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        },
    },
    {
        title: "Image",
        description: "Upload an image from your computer.",
        searchTerms: ["photo", "picture", "media"],
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            // upload image
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
                if (input.files?.length) {
                    const file = input.files[0];
                    const pos = editor.view.state.selection.from;
                    uploadFn(file, editor.view, pos);
                }
            };
            input.click();
        },
    },
    {
        title: "Youtube",
        description: "Embed a Youtube video.",
        searchTerms: ["video", "youtube", "embed"],
        icon: <Youtube size={18} />,
        command: ({ editor, range }) => {
            const videoLink = prompt("Please enter Youtube Video Link");
            //From https://regexr.com/3dj5t
            const ytregex = new RegExp(
                /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
            );

            if (videoLink && ytregex.test(videoLink)) {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setYoutubeVideo({
                        src: videoLink,
                    })
                    .run();
            } else {
                if (videoLink !== null) {
                    alert("Please enter a correct Youtube Video Link");
                }
            }
        },
    },
    {
        title: "Twitter",
        description: "Embed a Tweet.",
        searchTerms: ["twitter", "embed"],
        icon: <Twitter size={18} />,
        command: ({ editor, range }) => {
            const tweetLink = prompt("Please enter Twitter Link");
            const tweetRegex = new RegExp(
                /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]{1,15})(\/status\/(\d+))?(\/\S*)?$/,
            );

            if (tweetLink && tweetRegex.test(tweetLink)) {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setTweet({
                        src: tweetLink,
                    })
                    .run();
            } else {
                if (tweetLink !== null) {
                    alert("Please enter a correct Twitter Link");
                }
            }
        },
    },
]);

export const slashCommand = Command.configure({
    suggestion: {
        items: () => suggestionItems,
        render: renderItems,
    },
});
