# PDF Upload Fix - Implementation Guide

## Problem
The `@tambo-ai/react` package (v0.65.1) only accepts image files, not PDFs. The error occurs because the package is installed from npm and our local changes to `/tambo/react-sdk/src/hooks/use-message-images.ts` are not being used.

## Solutions

### Option 1: Use the Custom Hook (RECOMMENDED - Quick Fix)

I've created a fixed hook at `/novel-tambo-poc/hooks/use-message-files.ts` that accepts both images and PDFs.

**To use it:**

1. In any component where you want to upload PDFs, import the custom hook instead of the Tambo one:

```tsx
// Instead of:
// import { useTamboThreadInput } from '@tambo-ai/react';

// Use:
import { useMessageFiles } from '@/hooks/use-message-files';

function YourComponent() {
  const { files, addFiles, removeFile } = useMessageFiles();
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    try {
      await addFiles(fileList);
      console.log('Files uploaded:', files);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={handleFileUpload}
      />
      {files.map(file => (
        <div key={file.id}>
          {file.name}
          <button onClick={() => removeFile(file.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### Option 2: Rebuild and Link the Local Tambo Package

This requires fixing the build errors in the tambo package:

```bash
cd /novel-tambo-poc/tambo/react-sdk
pnpm install
pnpm build

# Then link it to your app
cd /novel-tambo-poc
pnpm link ./tambo/react-sdk
```

**Issues:** The tambo package has TypeScript errors in tests that prevent building.

### Option 3: Patch the node_modules Package Directly (TEMPORARY)

For immediate testing, you can directly edit the installed package:

```bash
# Edit this file:
nano node_modules/@tambo-ai/react/esm/hooks/use-message-images.js

# Find line ~40 and change:
# if (!file.type.startsWith("image/"))
# to:
# if (!file.type.startsWith("image/") && file.type !== "application/pdf")

# And line ~58:
# const imageFiles = files.filter((file) => file.type.startsWith("image/"));
# to:
# const validFiles = files.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
```

**Warning:** This will be overwritten when you run `pnpm install` again.

### Option 4: Use patch-package (BEST for Production)

Install patch-package to persist changes to node_modules:

```bash
pnpm add -D patch-package

# Make the changes to node_modules as described in Option 3

# Then create a patch:
npx patch-package @tambo-ai/react

# Add to package.json scripts:
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

This will automatically apply your fixes after every `pnpm install`.

## Current Status

✅ **Fixed files created:**
- `/novel-tambo-poc/hooks/use-message-files.ts` - Custom hook that works with PDFs
- `/novel-tambo-poc/tambo/react-sdk/src/hooks/use-message-images.ts` - Updated source (not being used)
- `/novel-tambo-poc/components/tambo/message-input.tsx` - Updated to accept PDFs in file input

❌ **Not working yet:**
- The Tambo package in node_modules still has the old code
- Need to either use the custom hook OR rebuild the package

## Recommended Next Steps

1. **For immediate testing:** Use Option 1 (custom hook) in your components
2. **For production:** Use Option 4 (patch-package) to persist the fix
3. **Long term:** Submit a PR to the @tambo-ai/react repository with the PDF support changes

## Testing

Once implemented, test with:

```bash
# 1. Try uploading a PDF file
# 2. Try uploading an image (regression test)
# 3. Try drag-and-drop with PDF
# 4. Verify error messages are correct
```

## Example Component

See `/novel-tambo-poc/components/export-to-pdf-button.tsx` for a complete example of file handling.
