export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "SOW Compliance Workbench" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Draft, validate and export Statements of Work (SOW) with AI-assisted authoring, document uploads, and one-click PDF export. This workspace connects to the SOW database and Tambo AI services for intelligent suggestions.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Quick Start" }],
    },
    {
      type: "codeBlock",
      attrs: { language: null },
      content: [
        { type: "text", text: "Open a new SOW → use the slash menu to insert sections and AI suggestions." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Key Features" }],
    },
    {
      type: "orderedList",
      attrs: { tight: true, start: 1 },
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "SOW templates and section blocks (Milestones, Deliverables, Pricing)" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "AI authoring and compliance hints (type ++ to get suggestions)" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Upload and attach supporting documents (PDFs) to SOW entries" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Save drafts to the project database and export final SOW as PDF" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Integration with Tambo AI for contextual recommendations" }],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Tips" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "- Use the slash menu to insert standard SOW blocks quickly." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "- Press ++ to trigger AI suggestions for wording and compliance notes." },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "- Attach supporting PDFs using drag & drop, then export the SOW when ready." },
      ],
    },
  ],
};
