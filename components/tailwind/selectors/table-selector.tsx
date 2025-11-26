"use client";

import { useEditor } from "novel";
import {
    Check,
    Plus,
    Trash,
    Minus,
    CornerLeftUp,
    CornerRightUp,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/tailwind/ui/popover";
import { cn } from "@/lib/utils";

export const TableSelector = () => {
    const { editor } = useEditor();

    if (!editor) {
        return null;
    }

    const isInTable = editor.isActive("table");

    const handleInsertTable = () => {
        editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
    };

    const handleAddColumnBefore = () => {
        editor.chain().focus().addColumnBefore().run();
    };

    const handleAddColumnAfter = () => {
        editor.chain().focus().addColumnAfter().run();
    };

    const handleDeleteColumn = () => {
        editor.chain().focus().deleteColumn().run();
    };

    const handleAddRowBefore = () => {
        editor.chain().focus().addRowBefore().run();
    };

    const handleAddRowAfter = () => {
        editor.chain().focus().addRowAfter().run();
    };

    const handleDeleteRow = () => {
        editor.chain().focus().deleteRow().run();
    };

    const handleDeleteTable = () => {
        editor.chain().focus().deleteTable().run();
    };

    const handleToggleHeaderColumn = () => {
        editor.chain().focus().toggleHeaderColumn().run();
    };

    const handleToggleHeaderRow = () => {
        editor.chain().focus().toggleHeaderRow().run();
    };

    const handleToggleHeaderCell = () => {
        editor.chain().focus().toggleHeaderCell().run();
    };

    const handleMergeCells = () => {
        editor.chain().focus().mergeCells().run();
    };

    const handleSplitCell = () => {
        editor.chain().focus().splitCell().run();
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 w-8 p-0",
                        isInTable && "bg-accent text-accent-foreground",
                    )}
                >
                    <span className="sr-only">Table options</span>
                    <div className="flex flex-col justify-center items-center gap-[2px]">
                        <div className="flex gap-[2px]">
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        </div>
                        <div className="flex gap-[2px]">
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        </div>
                        <div className="flex gap-[2px]">
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                            <div className="w-[2px] h-[2px] bg-current rounded-full"></div>
                        </div>
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-full p-1">
                {!isInTable ? (
                    <div
                        className="flex items-center justify-center p-1 text-sm text-center cursor-pointer hover:bg-accent rounded"
                        onClick={handleInsertTable}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Insert Table
                    </div>
                ) : (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-xs text-muted-foreground px-2 py-1">
                                Column
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddColumnBefore}
                                className="h-8 justify-start"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Add Before
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddColumnAfter}
                                className="h-8 justify-start"
                            >
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Add After
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteColumn}
                                className="h-8 justify-start"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-xs text-muted-foreground px-2 py-1">
                                Row
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddRowBefore}
                                className="h-8 justify-start"
                            >
                                <ArrowUp className="mr-2 h-4 w-4" />
                                Add Before
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddRowAfter}
                                className="h-8 justify-start"
                            >
                                <ArrowDown className="mr-2 h-4 w-4" />
                                Add After
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteRow}
                                className="h-8 justify-start"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-xs text-muted-foreground px-2 py-1">
                                Cell
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMergeCells}
                                className="h-8 justify-start"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Merge
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSplitCell}
                                className="h-8 justify-start"
                            >
                                <Minus className="mr-2 h-4 w-4" />
                                Split
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleHeaderColumn}
                                className="h-8 justify-start"
                            >
                                <CornerLeftUp className="mr-2 h-4 w-4" />
                                Header Column
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleHeaderRow}
                                className="h-8 justify-start"
                            >
                                <CornerRightUp className="mr-2 h-4 w-4" />
                                Header Row
                            </Button>
                        </div>
                        <div className="border-t mt-1 pt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteTable}
                                className="h-8 w-full justify-start text-red-500"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Table
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
