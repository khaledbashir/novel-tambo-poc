# SOW Template System

## Overview
The SOW editor now includes a **branded template system** that automatically applies consistent branding to every document inserted into the editor.

## Features

### 1. **Branded Table Headers**
- All table headers (`<th>`) automatically display with:
  - Background color: **#00D084** (Social Garden Green)
  - Text color: **White**
  - Bold font weight
  - Proper contrast for accessibility

### 2. **Logo Header**
- Every inserted SOW document includes the Social Garden logo at the top
- Logo is automatically centered
- Maximum width: 200px for optimal display
- Source: `/images/logogreendark.png`

### 3. **Professional Footer**
- Each document concludes with:
  - A horizontal rule separator
  - Centered text: "*** This concludes the Scope of Work document. ***"

### 4. **Consistent Styling**
- Tables maintain brand colors throughout the document
- Proper spacing between sections
- Professional typography and layout

## How It Works

### Template Insertion
When you click **"Insert to Editor"** on a SOW document:

1. **Logo** - Inserted at the top, automatically centered
2. **Title & Client** - Project title and client name
3. **Scopes** - Each scope with:
   - Scope heading
   - Description (italicized)
   - Deliverables (bullet list)
   - Pricing table (with branded green headers)
   - Assumptions (bullet list)
   - Scope total
4. **Financial Summary** - Complete breakdown with GST
5. **Project Overview** - If provided
6. **Budget Notes** - If provided
7. **Footer** - Professional closing statement

### Files Modified

#### `/lib/editor/insert-sow.ts`
- Core insertion logic
- Handles content structure and formatting
- Includes error handling and logging

#### `/styles/prosemirror.css`
- Branded table header styling
- Logo centering CSS
- Visual consistency rules

#### `/components/tailwind/markdown-extension.ts`
- Table node handlers for markdown export
- Prevents console warnings
- Graceful fallback for unsupported nodes

#### `/components/tailwind/advanced-editor.tsx`
- Event listener for SOW insertion
- Error handling and user feedback
- Data transformation

## Customization

### Changing Brand Colors
Edit `/styles/prosemirror.css`:

```css
.ProseMirror th {
  background-color: #00D084; /* Change this */
  color: white;
}
```

### Changing Logo
1. Replace `/public/images/logogreendark.png` with your logo
2. Or update the path in `/lib/editor/insert-sow.ts`:

```typescript
chain.insertContent({
    type: "image",
    attrs: {
        src: "/images/your-logo.png", // Change this
        alt: "Your Company",
        title: "Your Company",
    },
});
```

### Changing Footer Text
Edit `/lib/editor/insert-sow.ts`:

```typescript
chain.insertContent({
    type: "paragraph",
    attrs: { textAlign: "center" },
    content: [
        {
            type: "text",
            text: "Your custom footer text here",
        },
    ],
});
```

## Benefits

1. **Consistency** - Every document follows the same professional format
2. **Branding** - Automatic brand application without manual effort
3. **Time Saving** - No need to manually add logos or style tables
4. **Professional** - Client-ready documents from the start
5. **Reusable** - Template applies to all SOW documents

## Future Enhancements

Potential improvements for the template system:

- [ ] Multiple template options (e.g., "Minimal", "Detailed", "Executive")
- [ ] Custom color schemes per client
- [ ] Template preview before insertion
- [ ] Save custom templates
- [ ] Template variables (e.g., company address, contact info)
- [ ] Export templates as reusable components

## Troubleshooting

### Logo Not Appearing
- Ensure `/public/images/logogreendark.png` exists
- Check browser console for 404 errors
- Verify image path is correct

### Tables Not Styled
- Clear browser cache
- Check that `prosemirror.css` is loaded
- Verify CSS specificity isn't being overridden

### Insertion Errors
- Check browser console for detailed error messages
- Ensure editor is fully loaded before insertion
- Verify SOW data structure matches expected format

## Technical Notes

- **TipTap Compatibility**: Images are block-level nodes and cannot be wrapped in paragraphs
- **Markdown Export**: Tables are noted as "[Table content omitted in markdown export]" since standard markdown doesn't support complex tables
- **Error Handling**: All insertion operations are wrapped in try-catch blocks with detailed logging
