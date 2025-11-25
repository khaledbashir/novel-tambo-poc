"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/tailwind/ui/theme-toggle";
import { ChevronRight, Home, FileDown } from "lucide-react";
import { toast } from "sonner";

interface TopActionBarProps {
  className?: string;
  workspaceId: string | null;
  documentId: string | null;
}

export function TopActionBar({ className, workspaceId, documentId }: TopActionBarProps) {
  const [workspaceName, setWorkspaceName] = React.useState<string>("");
  const [documentName, setDocumentName] = React.useState<string>("");

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (workspaceId) {
        try {
          // In a real app, we'd have a specific endpoint or cache this
          const res = await fetch('/api/workspaces');
          const data = await res.json();
          const ws = data.find((w: any) => w.id === workspaceId);
          if (ws) setWorkspaceName(ws.name);
        } catch (e) {
          console.error(e);
        }
      } else {
        setWorkspaceName("");
      }

      if (documentId && workspaceId) {
        try {
          const res = await fetch(`/api/documents?workspaceId=${workspaceId}`);
          const data = await res.json();
          const doc = data.find((d: any) => d.id === documentId);
          if (doc) setDocumentName(doc.name);
        } catch (e) {
          console.error(e);
        }
      } else {
        setDocumentName("");
      }
    };

    fetchDetails();
  }, [workspaceId, documentId]);

  return (
    <div className={cn("p-4 border-b border-border flex items-center justify-between bg-card", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default">
          <Home size={14} />
        </div>

        <ChevronRight size={14} className="text-muted-foreground/50" />

        <div className={cn(
          "font-medium transition-colors",
          workspaceId ? "text-foreground" : "text-muted-foreground/50 italic"
        )}>
          {workspaceName || "Select Client"}
        </div>

        <ChevronRight size={14} className="text-muted-foreground/50" />

        <div className={cn(
          "font-medium transition-colors",
          documentId ? "text-primary" : "text-muted-foreground/50 italic"
        )}>
          {documentName || "Select Project"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div >
    </div >
  );
}