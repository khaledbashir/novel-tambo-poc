"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
  MessageInputFileButton,
  MessageInputMcpPromptButton,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "@/components/tambo/message-suggestions";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import type { messageVariants } from "@/components/tambo/message";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import type { Suggestion } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";

export interface MessageThreadPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

export const MessageThreadPanel = React.forwardRef<
  HTMLDivElement,
  MessageThreadPanelProps
>(({ className, contextKey, variant, ...props }, ref) => {
  const { thread, isIdle } = useTambo();

  // 🔍 DEBUG: Log thread state and reasoning data from Tambo
  React.useEffect(() => {
    console.log('[MessageThreadPanel] Tambo thread state:', {
      threadId: thread?.id,
      messageCount: thread?.messages?.length || 0,
      isIdle,
      messagesWithReasoning: thread?.messages?.filter((m: any) => m.reasoning?.length).map((m: any) => ({
        id: m.id,
        role: m.role,
        reasoningSteps: m.reasoning?.length,
        reasoning: m.reasoning,
      })) || [],
    });
  }, [thread, isIdle]);

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Get started",
      detailedSuggestion: "What can you help me with?",
      messageId: "welcome-query",
    },
    {
      id: "suggestion-2",
      title: "Learn more",
      detailedSuggestion: "Tell me about your capabilities.",
      messageId: "capabilities-query",
    },
    {
      id: "suggestion-3",
      title: "Examples",
      detailedSuggestion: "Show me some example queries I can try.",
      messageId: "examples-query",
    },
  ];

  return (
    <div
      ref={ref}
      className={cn("flex flex-col h-full bg-card", className)}
      {...props}
    >
      {/* Messages Area */}
      <ScrollableMessageContainer className="flex-1 min-h-0 p-4">
        <ThreadContent variant={variant}>
          <ThreadContentMessages />
        </ThreadContent>
      </ScrollableMessageContainer>

      {/* Suggestions */}
      <div className="px-4">
        <MessageSuggestions initialSuggestions={defaultSuggestions}>
          <MessageSuggestionsStatus />
          <MessageSuggestionsList />
        </MessageSuggestions>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background/50">
        <MessageInput contextKey={contextKey}>
          <div className="relative flex flex-col w-full overflow-hidden rounded-lg border bg-background shadow-sm">
            <MessageInputTextarea placeholder="Type your message or paste images..." className="min-h-[60px] w-full resize-none border-0 bg-transparent p-4 pr-20 focus:ring-0 sm:text-sm" />
            <MessageInputToolbar className="absolute bottom-2 right-2 flex items-center">
              <MessageInputFileButton />
              <MessageInputMcpPromptButton />
              <MessageInputSubmitButton />
            </MessageInputToolbar>
          </div>
          <MessageInputError />
        </MessageInput>
      </div>
    </div>
  );
});
MessageThreadPanel.displayName = "MessageThreadPanel";

