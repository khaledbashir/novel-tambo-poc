"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ScrollableMessageContainerProps =
  React.HTMLAttributes<HTMLDivElement> & {
    /** Any value that changes when messages change (e.g., messages array). */
    autoscrollDeps?: unknown;
  };

export const ScrollableMessageContainer = React.forwardRef<
  HTMLDivElement,
  ScrollableMessageContainerProps
>(({ className, children, autoscrollDeps, ...props }, ref) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoscroll, setShouldAutoscroll] = React.useState(true);
  const lastScrollTopRef = React.useRef(0);

  React.useImperativeHandle(ref, () => scrollContainerRef.current!, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8;

    if (scrollTop < lastScrollTopRef.current) setShouldAutoscroll(false);
    else if (isAtBottom) setShouldAutoscroll(true);

    lastScrollTopRef.current = scrollTop;
  };

  React.useEffect(() => {
    if (!scrollContainerRef.current || !shouldAutoscroll) return;
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [autoscrollDeps, shouldAutoscroll]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto scroll-smooth",
        "[&::-webkit-scrollbar]:w-[6px]",
        "[&::-webkit-scrollbar-thumb]:bg-[var(--resizable-handle-hex)]",
        "[&::-webkit-scrollbar:horizontal]:h-[4px]",
        className,
      )}
      data-slot="scrollable-message-container"
      {...props}
    >
      {children}
    </div>
  );
});
ScrollableMessageContainer.displayName = "ScrollableMessageContainer";
