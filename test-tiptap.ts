import { Table } from "@tiptap/extension-table";
import { Editor } from "@tiptap/core";

console.log("Table extension:", Table);
console.log("Table name:", Table?.name);

const editor = new Editor({
    extensions: [
        Table.configure({
            resizable: true,
        }),
    ],
});

console.log("Editor commands:", Object.keys(editor.commands));
console.log("Has insertTable:", !!editor.commands.insertTable);
