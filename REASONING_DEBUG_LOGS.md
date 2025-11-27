# Reasoning/Thinking Debug Logging

## Overview
Added comprehensive console logging to track reasoning/thinking data flow through the application.

## Logging Points Added

### 1. **MessageThreadPanel** (`components/tambo/message-thread-panel.tsx`)
- **What it logs**: Raw thread state from Tambo API
- **When**: Every time thread or isIdle state changes
- **Look for**: `[MessageThreadPanel] Tambo thread state:`
- **Shows**:
  - Thread ID
  - Total message count
  - Which messages have reasoning data
  - Actual reasoning content from API

### 2. **ThreadContent** (`components/tambo/thread-content.tsx`)
- **What it logs**: Messages being processed for rendering
- **When**: When messages array changes
- **Look for**: `[ThreadContent] Messages update:`
- **Shows**:
  - Total and filtered message counts
  - Which messages have reasoning
  - Number of reasoning steps per message

### 3. **ThreadContent (per message)** (`components/tambo/thread-content.tsx`)
- **What it logs**: Each individual message as it's rendered
- **When**: During render loop for each message
- **Look for**: `[ThreadContent] Rendering message:`
- **Shows**:
  - Message ID, role, index
  - Whether it's the last message (loading state)
  - Whether it has reasoning data

### 4. **MessageContent** (`components/tambo/message.tsx`)
- **What it logs**: Content rendering decisions
- **When**: When loading state or content changes
- **Look for**: `[MessageContent] Render state:`
- **Shows**:
  - Whether loading indicator is shown
  - Whether message has content
  - Whether message has reasoning
  - Content type

### 5. **ReasoningInfo** (`components/tambo/message.tsx`)
- **What it logs**: Reasoning component lifecycle
- **When**: Multiple points:
  - When component mounts/updates
  - When deciding to render or not
  - When accordion is toggled
- **Look for**: 
  - `[ReasoningInfo] Message data:`
  - `[ReasoningInfo] Not rendering - no reasoning data`
  - `[ReasoningInfo] Rendering reasoning accordion`
  - `[ReasoningInfo] Toggling accordion:`
- **Shows**:
  - Full reasoning data
  - Why component isn't rendering (if no data)
  - Accordion expand/collapse state

## How to Use

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Send a message** to the AI
3. **Watch for logs** in this order:
   ```
   [MessageThreadPanel] Tambo thread state:
   [ThreadContent] Messages update:
   [ThreadContent] Rendering message:
   [MessageContent] Render state:
   [ReasoningInfo] Message data:
   ```

## What to Look For

### ✅ **If reasoning IS working:**
- `[MessageThreadPanel]` shows `messagesWithReasoning` array with data
- `[ReasoningInfo]` shows `hasReasoning: true` and `reasoningLength > 0`
- `[ReasoningInfo]` shows "Rendering reasoning accordion"

### ❌ **If reasoning is NOT working:**
- `[MessageThreadPanel]` shows empty `messagesWithReasoning` array
  - **Problem**: Model not sending reasoning data (need to configure model)
- `[ReasoningInfo]` shows "Not rendering - no reasoning data"
  - **Problem**: Reasoning data not reaching component

### ⏱️ **If it's just slow:**
- `[MessageContent]` shows `isLoading: true` for a long time
- `[ReasoningInfo]` shows `isLoading: true`
  - **Expected**: Thinking models take time to reason

## Next Steps Based on Logs

1. **No reasoning data in API response** → Configure Tambo project to use thinking model
2. **Reasoning data in API but not displayed** → Check component rendering logic
3. **Reasoning displayed but slow** → Normal for thinking models, consider timeout settings
