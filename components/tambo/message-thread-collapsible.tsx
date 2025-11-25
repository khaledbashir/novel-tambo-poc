"use client";
import "./tambo-theme.css";

import type { messageVariants } from "@/components/tambo/message";
import { Message, MessageContent } from "@/components/tambo/message";
import {
    MessageInput,
    MessageInputError,
    MessageInputSubmitButton,
    MessageInputTextarea,
    MessageInputToolbar,
    MessageInputFileButton,
} from "@/components/tambo/message-input";
import {
    MessageSuggestions,
    MessageSuggestionsList,
    MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
    ThreadContent,
    ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { cn } from "@/lib/utils";
import {
    useTambo,
    type Suggestion,
    type TamboThreadMessage,
} from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as React from "react";

export interface MessageThreadCollapsibleProps
    extends React.HTMLAttributes<HTMLDivElement> {
    contextKey?: string;
    defaultOpen?: boolean;
    initialQuery?: string;
    variant?: VariantProps<typeof messageVariants>["variant"];
}

const CollapsibleContainer = React.forwardRef<
    HTMLDivElement,
    {
        isOpen: boolean;
        onOpenChange: (open: boolean) => void;
        children: React.ReactNode;
    } & React.HTMLAttributes<HTMLDivElement>
>(({ className, isOpen, onOpenChange, children, ...props }, ref) => (
    <Collapsible.Root
        ref={ref}
        open={isOpen}
        onOpenChange={onOpenChange}
        className={cn(
            "fixed shadow-lg bg-background border border-gray-200 z-50",
            "transition-[width,height] duration-300 ease-in-out",
            isOpen
                ? cn(
                      "top-14 left-0 right-0 bottom-0 w-full rounded-none",
                      "sm:inset-auto sm:bottom-4 sm:right-4 sm:rounded-lg",
                      "sm:w-[448px] md:w-[512px] lg:w-[640px] xl:w-[768px] 2xl:w-[896px]",
                      "sm:h-auto sm:max-w-[90vw]",
                  )
                : "bottom-4 right-4 rounded-full w-16 h-16 p-0 flex items-center justify-center",
            className,
        )}
        {...props}
    >
        {children}
    </Collapsible.Root>
));
CollapsibleContainer.displayName = "CollapsibleContainer";

const CollapsibleTrigger = ({ isOpen, onClose, config }: any) => {
    if (!isOpen) {
        return (
            <div className="relative flex items-center justify-center w-full h-full">
                <Collapsible.Trigger asChild>
                    <button
                        className="w-full h-full flex items-center justify-center rounded-full focus:outline-none cursor-pointer"
                        aria-expanded={isOpen}
                        aria-controls="message-thread-content"
                        tabIndex={0}
                    >
                        <Image
                            src="/logo/icon/Octo-Icon.svg"
                            width={32}
                            height={32}
                            alt="Octo Icon"
                            className="w-8 h-8"
                        />
                    </button>
                </Collapsible.Trigger>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between w-full p-4 border-b border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                    <Image
                        src="/logo/icon/Octo-Icon.svg"
                        width={24}
                        height={24}
                        alt="Octo Icon"
                        className="w-4 h-4"
                    />
                    <span>{config.labels.openState}</span>
                </div>
                <div
                    role="button"
                    className="p-1 rounded-full hover:bg-muted/70 transition-colors cursor-pointer"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <XIcon className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
};
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const MessageThreadCollapsible = React.forwardRef<
    HTMLDivElement,
    MessageThreadCollapsibleProps
>(
    (
        {
            className,
            contextKey,
            defaultOpen = false,
            initialQuery,
            variant,
            ...props
        },
        ref,
    ) => {
        const searchParams = useSearchParams();
        const queryFromUrl = searchParams.get("q") || undefined;
        const finalInitialQuery = initialQuery || queryFromUrl;

        const [isOpen, setIsOpen] = React.useState(
            defaultOpen || !!finalInitialQuery,
        );

        React.useEffect(() => {
            if (finalInitialQuery) setIsOpen(true);
        }, [finalInitialQuery]);

        const handleThreadChange = React.useCallback(() => {
            setIsOpen(true);
        }, [setIsOpen]);

        const THREAD_CONFIG = { labels: { openState: "ask tambo" } };

        const { thread } = useTambo();

        const starterMessage: TamboThreadMessage = {
            id: "starter-login-prompt",
            threadId: thread?.id || "default",
            role: "assistant",
            content: [
                { type: "text", text: "Ask me anything about the SOW editor." },
            ],
            createdAt: new Date().toISOString(),
            actionType: undefined,
            componentState: {},
        };

        return (
            <CollapsibleContainer
                ref={ref}
                className={className}
                isOpen={isOpen}
                onOpenChange={setIsOpen}
            >
                <CollapsibleTrigger
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onThreadChange={handleThreadChange}
                    config={THREAD_CONFIG}
                />
                {/* Full panel content */}
                <div
                    id="message-thread-content"
                    className="flex flex-col h-full"
                >
                    <ScrollableMessageContainer className="p-4">
                        <ThreadContent variant={variant}>
                            <ThreadContentMessages />
                        </ThreadContent>
                    </ScrollableMessageContainer>

                    <MessageSuggestions>
                        <MessageSuggestionsStatus />
                    </MessageSuggestions>

                    <div className="p-4">
                        <MessageInput contextKey={contextKey}>
                            <MessageInputTextarea placeholder="Type your message or paste images..." />
                            <MessageInputToolbar>
                                <MessageInputFileButton />
                                <MessageInputSubmitButton />
                            </MessageInputToolbar>
                            <MessageInputError />
                        </MessageInput>
                    </div>

                    <MessageSuggestions initialSuggestions={[]}>
                        <MessageSuggestionsList />
                    </MessageSuggestions>
                </div>
            </CollapsibleContainer>
        );
    },
);
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";

export default MessageThreadCollapsible;
