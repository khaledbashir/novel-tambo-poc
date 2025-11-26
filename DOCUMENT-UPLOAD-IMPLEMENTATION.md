
# Document Upload Implementation Plan for Tambo AI

## Overview
This document outlines the proper implementation approach for PDF and Word document upload functionality in a Tambo AI chat interface. The implementation aligns with Tambo's architecture of using Context Attachments for metadata and Tools for document processing.

## Architecture

### 1. Context Attachments for Document References
Context attachments provide visual badges above the message input and automatically send metadata along with the user's message to the AI. For documents, this includes:

- `name`: Display name shown in the badge
- `icon`: Visual indicator of file type
- `metadata`: Object containing:
  - `type`: MIME type (e.g., "application/pdf")
  - `size`: File size in bytes
  - `url`: URL or ID referencing the uploaded document
  - `uploadedAt`: Timestamp of upload

### 2. Tool for Document Processing
A registered tool handles the actual document content processing:
- Receives document ID or URL as a parameter
- Retrieves document from storage
- Extracts text and structure from the document
- Returns processed information to the AI

### 3. File Upload Flow
1. User selects PDF/Word file via UI
2. File is uploaded to server for storage and processing
3. Server returns document ID and URL
4. UI adds document as a context attachment with metadata
5. When user sends a message, attachment metadata is included
6. AI can call the document processing tool with the document ID

## Implementation Components

### 1. Document Uploader Component
A specialized file upload component that:
- Accepts only PDF and Word files
- Shows upload progress and status
- Validates file size and limits
- Provides drag-and-drop interface
- Integrates with server upload API

### 2. Context Attachment Badge Component
A display component for attached documents that:
- Shows appropriate icon based on file type
- Displays file name
- Allows removing attachments
- Integrates with Tambo's context attachment system

### 3. Document Processing Tool
A registered tool that:
- Accepts document ID parameter
- Retrieves document from server or storage
- Extracts text content from PDF/Word documents
- Returns structured information
- Handles errors gracefully

### 4. Integration with Message Input
Modifications to the existing message input component to:
- Add document attachment button
- Show/hide document uploader
- Display context attachment badges
- Handle drag-and-drop of documents
- Ensure attachments are sent with messages

## Technical Implementation

### Frontend File Upload
```typescript
// Example of adding a document as a context attachment
const handleFileUpload = async (file: File) => {
  // Upload to server
  const response = await fetch('/api/upload-document', {
    method: 'POST',
    body: file,
  });
  const { id, url } = await response.json();
  
  // Add as context attachment
  addContextAttachment({
    name: file.name,
    icon: <FileText className="w-4 h-4" />,
    metadata: {
      type: file.type,
      size: file.size,
      url,
      uploadedAt: new Date().toISOString(),
    },
  });
};
```

### Backend Tool Registration
```typescript
// Example of document processing tool
registerTool({
  name: 'processDocument',
  description: 'Extracts text and structure from a PDF or Word document',
  parameters: {
    documentId: {
      type: 'string',
      description: 'ID of the document to process'
    }
  },
  execute: async ({ documentId }) => {
    // Retrieve document from storage
    const document = await getDocument(documentId);
    
    // Process based on type
    if (document.type === 'application/pdf') {
      return await extractFromPdf(document.url);
    } else if (document.type.includes('word')) {
      return await extractFromWord(document.url);
    }
  }
});
```

## Next Steps for Implementation

1. Create a clean DocumentUploader component with proper error handling
2. Implement ContextAttachmentBadge for displaying attachments
3. Modify MessageInput to integrate document upload UI
4. Set up server endpoint for file upload and storage
5. Register a document processing tool
6. Test the complete flow from upload to AI response
7. Add proper error handling and user feedback
8. Implement document preview in chat messages

This approach leverages Tambo AI's architecture effectively by separating document metadata (Context Attachments) from document content (Tools), resulting in a more robust and scalable solution.