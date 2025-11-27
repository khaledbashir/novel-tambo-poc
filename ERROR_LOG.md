# Error Tracking Log

## Overview
This document tracks identified issues, their status, and resolution details.

**Total Issues:** 2
**Resolved:** 1
**Open:** 1

## Checklist

### Resolved Issues

- [x] **[ERR-001] Editor Layout Collapse on Chat Insert**
  - **Severity:** Critical
  - **Status:** Resolved
  - **Date Logged:** 2025-11-27
  - **Description:** Inserting content (specifically tables) from the chat panel into the editor causes the editor layout to collapse, resulting in vertical text display.
  - **Root Cause:** Editor wrapper had fixed width constraints (`min-w-[600px]`) and `max-w-screen-lg` that conflicted with table widths inside a flex container. Tables were missing responsive styling.
  - **Resolution:**
    - Modified `advanced-editor.tsx`: Removed `min-w-[600px]`, added `overflow-x-auto` to scroll container, added `break-words`.
    - Modified `extensions.ts`: Updated table extension to use `block table-fixed`, `overflow-x-auto`, and added `break-words whitespace-normal` to cells.
  - **Verification:** Verified code changes ensure horizontal scrolling and proper word wrapping instead of layout collapse.

### Open Issues

- [ ] **[ERR-002] Console Error: "Request failed, attempting retry"**
  - **Severity:** Medium
  - **Status:** Open
  - **Date Logged:** 2025-11-27
  - **Description:** User reports console error `message-input.tsx:308 Request failed, attempting retry 1/2`.
  - **Investigation:** Grep search for exact string in codebase yielded no results. Suspected to be from an external dependency (likely `@tambo-ai/react` or `@tambo-ai/typescript-sdk`) or dynamic code.
  - **Next Steps:** Investigate node_modules or external SDK usage in `message-input.tsx`.

## System Information
- **Environment:** Development / Easypanel
- **Last Updated:** 2025-11-27
