import { Button } from "@/components/tailwind/ui/button";
import { cn } from "@/lib/utils";
import { BoldIcon, CodeIcon, ItalicIcon, StrikethroughIcon, UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";
import type { SelectorItem } from "./node-selector";

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;
  const items: SelectorItem[] = [
    {
      name: "bold",
      isActive: (editor) => editor?.isActive("bold") || false,
      command: (editor) => editor?.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      name: "italic",
      isActive: (editor) => editor?.isActive("italic") || false,
      command: (editor) => editor?.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
    },
    {
      name: "underline",
      isActive: (editor) => editor?.isActive("underline") || false,
      command: (editor) => editor?.chain().focus().toggleUnderline().run(),
      icon: UnderlineIcon,
    },
    {
      name: "strike",
      isActive: (editor) => editor?.isActive("strike") || false,
      command: (editor) => editor?.chain().focus().toggleStrike().run(),
      icon: StrikethroughIcon,
    },
    {
      name: "code",
      isActive: (editor) => editor?.isActive("code") || false,
      command: (editor) => editor?.chain().focus().toggleCode().run(),
      icon: CodeIcon,
    },
  ];

  const alignmentItems: SelectorItem[] = [
    {
      name: "align-left",
      isActive: (editor) => editor?.isActive({ textAlign: 'left' }) || false,
      command: (editor) => editor?.chain().focus().setTextAlign('left').run(),
      icon: AlignLeftIcon,
    },
    {
      name: "align-center",
      isActive: (editor) => editor?.isActive({ textAlign: 'center' }) || false,
      command: (editor) => editor?.chain().focus().setTextAlign('center').run(),
      icon: AlignCenterIcon,
    },
    {
      name: "align-right",
      isActive: (editor) => editor?.isActive({ textAlign: 'right' }) || false,
      command: (editor) => editor?.chain().focus().setTextAlign('right').run(),
      icon: AlignRightIcon,
    },
    {
      name: "align-justify",
      isActive: (editor) => editor?.isActive({ textAlign: 'justify' }) || false,
      command: (editor) => editor?.chain().focus().setTextAlign('justify').run(),
      icon: AlignJustifyIcon,
    },
  ];

  return (
    <div className="flex gap-1">
      <div className="flex">
        {items.map((item) => (
          <EditorBubbleItem
            key={item.name}
            onSelect={(editor) => {
              item.command(editor);
            }}
          >
            <Button size="sm" className="rounded-none" variant="ghost" type="button">
              <item.icon
                className={cn("h-4 w-4", {
                  "text-blue-500": item.isActive(editor),
                })}
              />
            </Button>
          </EditorBubbleItem>
        ))}
      </div>
      <div className="h-6 w-px bg-border mx-1" />
      <div className="flex">
        {alignmentItems.map((item) => (
          <EditorBubbleItem
            key={item.name}
            onSelect={(editor) => {
              item.command(editor);
            }}
          >
            <Button size="sm" className="rounded-none" variant="ghost" type="button">
              <item.icon
                className={cn("h-4 w-4", {
                  "text-blue-500": item.isActive(editor),
                })}
              />
            </Button>
          </EditorBubbleItem>
        ))}
      </div>
    </div>
  );
};
