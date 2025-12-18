"use client";

import { useState, useCallback, useRef, useEffect, useContext } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopActionBar } from "@/components/top-action-bar";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { MessageThreadPanel } from "@/components/tambo/message-thread-panel";
import { ThreadHistory, ThreadHistoryHeader, ThreadHistoryNewButton, ThreadHistorySearch, ThreadHistoryList } from "@/components/tambo/thread-history";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { TamboEnabledContext } from "./providers";

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 800;

export default function Page() {
  const tamboEnabled = useContext(TamboEnabledContext);
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
    // For LEFT panel: New width is simply the mouse X position relative to container left
    const newWidth = e.clientX - containerRect.left;

    // Clamp width between min and max, ensuring we don't exceed container bounds
    const maxAllowedWidth = containerRect.width - 64; // Account for sidebar (now on right)
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Row: Logo (Fixed) | Chat Toggle | Top Bar */}
        <div className="flex-none h-16 flex border-b border-border bg-card">
          {/* Logo Area - Fixed Width matching desired sidebar look */}
          <div className="w-[280px] flex-none border-r border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between px-4">
            <div className="flex items-center">
              <img
                src="/images/footer-logo.svg"
                alt="Logo"
                className="h-8 w-auto invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
              />
            </div>

            {/* Chat Toggle Button - Inside Logo Area (Right Side) */}
            <button
              onClick={() => {
                setIsChatPanelCollapsed(!isChatPanelCollapsed);
                localStorage.setItem('chatPanelCollapsed', (!isChatPanelCollapsed).toString());
              }}
              className={cn(
                "p-1.5 rounded-md hover:bg-accent/50 transition-all duration-200 focus:outline-none",
                "text-muted-foreground hover:text-foreground"
              )}
              aria-label={isChatPanelCollapsed ? "Expand chat panel" : "Collapse chat panel"}
            >
              {isChatPanelCollapsed ? (
                <PanelRightOpen className="h-4 w-4 rotate-180" />
              ) : (
                <PanelRightClose className="h-4 w-4 rotate-180" />
              )}
            </button>
          </div>

          {/* Top Action Bar */}
          <div className="flex-1 min-w-0">
            <TopActionBar
              className="h-full border-b-0"
              workspaceId={selectedWorkspace}
              documentId={selectedDocument}
            />
          </div>
        </div>

        {/* Body Row: Chat (Resizable) | Editor */}
        <div className="flex-1 flex min-h-0 relative">

          {/* Chat Panel */}
          {!isChatPanelCollapsed && (
            <div
              className={cn(
                "relative flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r-2 border-border bg-card shadow-lg",
                isResizing && "transition-none"
              )}
              style={{ width: `${chatPanelWidth}px` }}
            >
              {/* Chat Content: Thread List (Left) + Message Area (Right) */}
              <div className="flex-1 flex flex-row min-h-0 relative">
                {tamboEnabled ? (
                  <>
                    <ThreadHistory contextKey="editor-assistant" position="left" defaultCollapsed={false}>
                      <ThreadHistoryHeader />
                      <ThreadHistoryNewButton />
                      <ThreadHistorySearch />
                      <ThreadHistoryList />
                    </ThreadHistory>
                    <div className="flex-1 flex flex-col bg-card border-l-2 border-border min-w-0">
                      <MessageThreadPanel contextKey="editor-assistant" className="flex-1 min-h-0" />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground">
                    AI panel unavailable (missing Tambo env).
                  </div>
                )}
              </div>

              {/* Resize Handle */}
              <div
                className={cn(
                  "w-1.5 cursor-col-resize absolute top-0 right-0 h-full z-10",
                  "bg-[var(--resizable-handle-hex)] hover:bg-[var(--resizable-handle-hover-hex)]",
                  isResizing && "bg-[var(--resizable-handle-active-hex)] transition-none"
                )}
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize chat panel"
                style={{ transition: isResizing ? 'none' : 'background-color 0.2s ease' }}
              />
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
            <TailwindAdvancedEditor
              documentId={selectedDocument}
              workspaceId={selectedWorkspace}
            />

            {/* Sidebar Toggle Button (Inside Editor Area, Top Right) */}
            <button
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                localStorage.setItem('sidebarCollapsed', (!isSidebarCollapsed).toString());
              }}
              className={cn(
                "absolute top-4 right-4 z-50 p-2 rounded-md bg-card border border-border shadow-md",
                "hover:bg-accent transition-all duration-300 ease-in-out",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "transform transition-transform duration-300"
              )}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isSidebarCollapsed}
            >
              {isSidebarCollapsed ? (
                <ChevronLeft className="h-4 w-4 transition-transform duration-300" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sidebar (Right) */}
      <div className={cn(
        "relative flex-shrink-0 h-full bg-card border-l border-border transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        <Sidebar
          selectedDocument={selectedDocument}
          selectedWorkspace={selectedWorkspace}
          onDocumentSelect={setSelectedDocument}
          onWorkspaceSelect={setSelectedWorkspace}
        />
      </div>
    </div>
  );
}
