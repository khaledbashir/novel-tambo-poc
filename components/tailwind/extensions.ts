import {
    AIHighlight,
    CharacterCount,
    CodeBlockLowlight,
    Color,
    CustomKeymap,
    GlobalDragHandle,
    HighlightExtension,
    HorizontalRule,
    Mathematics,
    Placeholder,
    StarterKit,
    TaskItem,
    TaskList,
    TextStyle,
    TiptapImage,
    TiptapLink,
    TiptapUnderline,
    Twitter,
    UploadImagesPlugin,
    Youtube,
} from "novel";

import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { TextAlign } from "@tiptap/extension-text-align";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";

import { MarkdownExtension } from "./markdown-extension";

import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";

//TODO I am using cx here to get tailwind autocomplete working, idk if someone else can write a regex to just capture the class key in objects
const aiHighlight = AIHighlight;
//You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;
const tiptapLink = TiptapLink.configure({
    HTMLAttributes: {
        class: cx(
            "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer",
        ),
    },
});

const tiptapImage = TiptapImage.extend({
    addProseMirrorPlugins() {
        return [
            UploadImagesPlugin({
                imageClass: cx("opacity-40 rounded-lg border border-stone-200"),
            }),
        ];
    },
}).configure({
    allowBase64: true,
    HTMLAttributes: {
        class: cx("rounded-lg border border-muted"),
    },
});

const taskList = TaskList.configure({
    HTMLAttributes: {
        class: cx("not-prose pl-2 "),
    },
});
const taskItem = TaskItem.configure({
    HTMLAttributes: {
        class: cx("flex gap-2 items-start my-4"),
    },
    nested: true,
});

const horizontalRule = HorizontalRule.configure({
    HTMLAttributes: {
        class: cx("mt-4 mb-6 border-t border-muted-foreground"),
    },
});

const starterKit = StarterKit.configure({
    bulletList: {
        HTMLAttributes: {
            class: cx("list-disc list-outside leading-3 -mt-2"),
        },
    },
    orderedList: {
        HTMLAttributes: {
            class: cx("list-decimal list-outside leading-3 -mt-2"),
        },
    },
    listItem: {
        HTMLAttributes: {
            class: cx("leading-normal -mb-2"),
        },
    },
    blockquote: {
        HTMLAttributes: {
            class: cx("border-l-4 border-primary"),
        },
    },
    code: {
        HTMLAttributes: {
            class: cx("rounded-md bg-muted  px-1.5 py-1 font-mono font-medium"),
            spellcheck: "false",
        },
    },
    codeBlock: false,
    // Table configuration removed - not supported in current StarterKit version
    // table: {
    //   HTMLAttributes: {
    //     class: cx("border-collapse table-auto w-full my-4 border border-border"),
    //   },
    // },
    // tableRow: {
    //   HTMLAttributes: {
    //     class: cx("border-b border-border"),
    //   },
    // },
    // tableCell: {
    //   HTMLAttributes: {
    //     class: cx("border border-border px-4 py-2 text-foreground"),
    //   },
    // },
    // tableHeader: {
    //   HTMLAttributes: {
    //     class: cx("border border-border px-4 py-2 bg-muted/50 font-semibold text-foreground"),
    //   },
    // },
    horizontalRule: false,
    dropcursor: {
        color: "#DBEAFE",
        width: 4,
    },
    gapcursor: false,
});

const table = Table.configure({
    HTMLAttributes: {
        class: cx(
            "border-collapse table-auto w-full my-4 border border-border",
        ),
    },
    resizable: true,
});

const tableRow = TableRow.configure({
    HTMLAttributes: {
        class: cx("border-b border-border"),
    },
});

const tableCell = TableCell.configure({
    HTMLAttributes: {
        class: cx("border border-border px-4 py-2 text-foreground relative"),
    },
});

const tableHeader = TableHeader.configure({
    HTMLAttributes: {
        class: cx(
            "border border-border px-4 py-2 bg-muted/50 font-semibold text-foreground relative",
        ),
    },
});

const codeBlockLowlight = CodeBlockLowlight.configure({
    // configure lowlight: common /  all / use highlightJS in case there is a need to specify certain language grammars only
    // common: covers 37 language grammars which should be good enough in most cases
    lowlight: createLowlight(common),
});

const youtube = Youtube.configure({
    HTMLAttributes: {
        class: cx("rounded-lg border border-muted"),
    },
    inline: false,
});

const twitter = Twitter.configure({
    HTMLAttributes: {
        class: cx("not-prose"),
    },
    inline: false,
});

const mathematics = Mathematics.configure({
    HTMLAttributes: {
        class: cx("text-foreground rounded p-1 hover:bg-accent cursor-pointer"),
    },
    katexOptions: {
        throwOnError: false,
    },
});

const characterCount = CharacterCount.configure();

const textAlign = TextAlign.configure({
    types: ["heading", "paragraph"],
    defaultAlignment: "left",
});

const markdownExtension = MarkdownExtension.configure({
    html: true,
    tightLists: true,
    tightListClass: "tight",
    bulletListMarker: "-",
    linkify: false,
    breaks: false,
    transformPastedText: false,
    transformCopiedText: false,
});

export const defaultExtensions = [
    starterKit,
    placeholder,
    tiptapLink,
    tiptapImage,
    taskList,
    taskItem,
    horizontalRule,
    aiHighlight,
    codeBlockLowlight,
    youtube,
    twitter,
    mathematics,
    characterCount,
    TiptapUnderline,
    markdownExtension,
    HighlightExtension,
    TextStyle,
    Color,
    CustomKeymap,
    GlobalDragHandle,
    table,
    tableRow,
    tableCell,
    tableHeader,
    textAlign,
];
