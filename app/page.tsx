"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopActionBar } from "@/components/top-action-bar";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { MessageThreadPanel } from "@/components/tambo/message-thread-panel";
import { ThreadHistory, ThreadHistoryHeader, ThreadHistoryNewButton, ThreadHistorySearch, ThreadHistoryList } from "@/components/tambo/thread-history";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;

export default function Page() {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [chatPanelWidth, setChatPanelWidth] = useState(440);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatPanelCollapsed, setIsChatPanelCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved panel width and sidebar states from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('chatPanelWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_PANEL_WIDTH && width <= MAX_PANEL_WIDTH) {
        setChatPanelWidth(width);
      }
    }

    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      setIsSidebarCollapsed(savedSidebarState === 'true');
    }

    const savedChatPanelState = localStorage.getItem('chatPanelCollapsed');
    if (savedChatPanelState !== null) {
      setIsChatPanelCollapsed(savedChatPanelState === 'true');
    }
  }, []);

  // Save panel width and sidebar states to localStorage
  useEffect(() => {
    localStorage.setItem('chatPanelWidth', chatPanelWidth.toString());
  }, [chatPanelWidth]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('chatPanelCollapsed', isChatPanelCollapsed.toString());
  }, [isChatPanelCollapsed]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;

    // Clamp width between min and max, ensuring we don't exceed container bounds
    const maxAllowedWidth = containerRect.width - 64; // Account for sidebar
    const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(Math.min(MAX_PANEL_WIDTH, maxAllowedWidth), newWidth));
    setChatPanelWidth(clampedWidth);
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="fixed inset-0 flex" ref={containerRef}>
      {/* Navigation Sidebar with Toggle */}
      <div className={cn(
        "relative flex-shrink-0 h-full bg-card border-r border-border transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        <Sidebar
          selectedDocument={selectedDocument}
          selectedWorkspace={selectedWorkspace}
          onDocumentSelect={setSelectedDocument}
          onWorkspaceSelect={setSelectedWorkspace}
        />
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => {
          setIsSidebarCollapsed(!isSidebarCollapsed);
          localStorage.setItem('sidebarCollapsed', (!isSidebarCollapsed).toString());
        }}
        className={cn(
          "absolute top-4 z-50 p-2 rounded-md bg-card border border-border shadow-md",
          "hover:bg-accent transition-all duration-300 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "transform transition-transform duration-300",
          isSidebarCollapsed ? "left-2" : "left-[320px]"
        )}
        aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isSidebarCollapsed}
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
        )}
      </button>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopActionBar
          workspaceId={selectedWorkspace}
          documentId={selectedDocument}
        />
        <div className="flex-1 overflow-hidden">
          <TailwindAdvancedEditor
            documentId={selectedDocument}
            workspaceId={selectedWorkspace}
          />
        </div>
      </div>

      {/* Chat Panel with Thread History on the right */}
      {!isChatPanelCollapsed && (
        <div
          className={cn(
            "relative flex flex-shrink-0 transition-all duration-300 ease-in-out",
            isResizing && "transition-none"
          )}
          style={{ width: `${chatPanelWidth}px` }}
        >
          <div
            className={cn(
              "w-1.5 cursor-col-resize absolute top-0 left-0 h-full z-10",
              "bg-[var(--resizable-handle-hex)] hover:bg-[var(--resizable-handle-hover-hex)]",
              isResizing && "bg-[var(--resizable-handle-active-hex)] transition-none"
            )}
            onMouseDown={handleMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat panel"
            style={{ transition: isResizing ? 'none' : 'background-color 0.2s ease' }}
          />
          <div className="flex-1 flex flex-col bg-card border-l-2 border-border shadow-lg min-w-0">
            <MessageThreadPanel contextKey="editor-assistant" className="flex-1 min-h-0" />
          </div>
          <ThreadHistory contextKey="editor-assistant" position="right" defaultCollapsed={false}>
            <ThreadHistoryHeader />
            <ThreadHistoryNewButton />
            <ThreadHistorySearch />
            <ThreadHistoryList />
          </ThreadHistory>
        </div>
      )}

      {/* Chat Panel Toggle Button */}
      <button
        onClick={() => {
          setIsChatPanelCollapsed(!isChatPanelCollapsed);
          localStorage.setItem('chatPanelCollapsed', (!isChatPanelCollapsed).toString());
        }}
        className={cn(
          "absolute top-4 z-50 p-2 rounded-md bg-card border border-border shadow-md",
          "hover:bg-accent transition-all duration-300 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "transform transition-transform duration-300"
        )}
        style={isChatPanelCollapsed ? { right: '8px' } : { right: `${chatPanelWidth + 8}px` }}
        aria-label={isChatPanelCollapsed ? "Expand chat panel" : "Collapse chat panel"}
        aria-expanded={!isChatPanelCollapsed}
      >
        {isChatPanelCollapsed ? (
          <PanelRightOpen className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <PanelRightClose className="h-4 w-4 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
