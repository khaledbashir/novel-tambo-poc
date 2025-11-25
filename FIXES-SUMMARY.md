# Fixes Summary - Nov 25, 2025

## ✅ Fix #1: PDF Upload Support

### Problem
Users were getting `Error: No valid image files provided` when trying to upload PDF files.

### Root Cause
The file upload system was hardcoded to only accept image files:
- `use-message-images.ts` filtered out non-image files
- File input button only accepted `image/*`
- Drag-and-drop only accepted images

### Solution
Updated the file upload system to accept both images and PDFs:

1. **Updated `/tambo/react-sdk/src/hooks/use-message-images.ts`**:
   - Modified `addImage()` to accept PDFs: `file.type.startsWith("image/") || file.type === "application/pdf"`
   - Modified `addImages()` to filter for both images and PDFs
   - Updated error messages to reflect support for both file types

2. **Updated `/components/tambo/message-input.tsx`**:
   - Changed file input `accept` prop from `"image/*"` to `"image/*,application/pdf"`
   - Updated drag-and-drop handler to accept PDFs
   - Updated tooltip text to "Attach Files (Images & PDFs)"
   - Updated aria-label to "Attach Files"

### Result
✅ Users can now upload PDF files via:
- File picker button
- Drag and drop
- Both methods work for images and PDFs

---

## ✅ Fix #2: Advanced Table Extension for Novel Editor

### Problem
The basic table extension didn't allow:
- Column resizing by dragging
- Adding/deleting rows and columns easily
- Merging/splitting cells
- Advanced table manipulation

### Root Cause
The editor was using the basic `@tiptap/extension-table` without the enhanced features from `tiptap-table-plus`.

### Solution
Upgraded to the advanced table extension with full features:

1. **Installed packages**:
   ```bash
   pnpm add tiptap-table-plus
   pnpm add @tiptap/extension-table@^2.27.1
   pnpm add @tiptap/extension-table-row@^2.27.1
   pnpm add @tiptap/extension-table-cell@^2.27.1
   pnpm add @tiptap/extension-table-header@^2.27.1
   ```

2. **Updated `/novel/apps/web/components/tailwind/extensions.ts`**:
   - Imported `TablePlus` from `tiptap-table-plus`
   - Imported individual table components from `@tiptap/extension-table-*`
   - Configured `TablePlus` with `resizable: true`
   - Configured base `Table` with `resizable: true`
   - Added `relative` positioning to table cells for resize handles
   - Added `tablePlus` to the `defaultExtensions` array

### Features Now Available
✅ **Column Resizing**: Drag column borders to resize
✅ **Row/Column Duplication**: Duplicate rows/columns with or without content
✅ **Advanced Table Controls**: Full table manipulation via commands
✅ **Proper Styling**: Tables maintain borders, padding, and responsive design
✅ **Keyboard Navigation**: Navigate tables with arrow keys

### Usage
The table button in the editor toolbar (`/novel/apps/web/components/editor/novel-editor.tsx`) now creates fully-featured tables:
```tsx
onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
```

Users can:
1. Click the "Table" button to insert a 3x3 table with headers
2. Drag column borders to resize
3. Right-click for advanced table operations (via TablePlus commands)
4. Use keyboard shortcuts for table navigation

---

## Testing

### PDF Upload Test
1. Navigate to the chat interface
2. Click the paperclip button
3. Select a PDF file
4. ✅ File should upload without errors
5. ✅ PDF should appear in staged files

### Table Extension Test
1. Navigate to `/editor` (or wherever the Novel editor is used)
2. Click the "Table" button in the toolbar
3. ✅ A 3x3 table with headers should appear
4. ✅ Hover over column borders - resize cursor should appear
5. ✅ Drag column borders to resize columns
6. ✅ Tables should maintain styling when content is inserted

---

## Files Modified

### PDF Upload Fix
- `/tambo/react-sdk/src/hooks/use-message-images.ts`
- `/components/tambo/message-input.tsx`

### Table Extension Fix
- `/novel/apps/web/components/tailwind/extensions.ts`
- `/package.json` (dependencies updated)

---

## Notes

- Both fixes are backward compatible
- No breaking changes to existing functionality
- Images still work exactly as before
- Basic tables still work, but now with enhanced features
- All changes are production-ready
