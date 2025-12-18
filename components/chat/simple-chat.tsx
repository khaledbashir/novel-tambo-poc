"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollableMessageContainer } from "@/components/chat/scrollable-message-container";
import { Streamdown } from "streamdown";
import { markdownComponents } from "@/components/tambo/markdown-components";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

async function loadHistory(contextKey: string): Promise<ChatMessage[]> {
  const resp = await fetch(
    `/api/chat/history?contextKey=${encodeURIComponent(contextKey)}`,
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  const rows = Array.isArray(data?.messages) ? data.messages : [];
  return rows
    .filter((m: any) => m?.role === "user" || m?.role === "assistant")
    .map((m: any) => ({
      id: String(m.id),
      role: m.role,
      text: String(m.content_text ?? ""),
    }));
}

async function streamFromGenerate(prompt: string, onDelta: (delta: string) => void) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contextKey: "simple-chat", message: prompt }),
  });
  if (!resp.body) {
    const txt = await resp.text();
    onDelta(txt);
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value));
  }
}

export function SimpleChat({ className }: { className?: string }) {
  const contextKey = "simple-chat";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const assistRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;
    loadHistory(contextKey)
      .then((m) => {
        if (mounted) setMessages(m);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const canSend = input.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) return;
    const id = crypto.randomUUID();
    const userMsg: ChatMessage = { id, role: "user", text: input };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsSending(true);
    assistRef.current = "";
    try {
      await streamFromGenerate(userMsg.text, (delta) => {
        assistRef.current += delta;
        setMessages((prev) => {
          const next = [...prev];
          const idx = next.findIndex((m) => m.id === assistantMsg.id);
          if (idx >= 0) next[idx] = { ...next[idx], text: assistRef.current };
          return next;
        });
      });
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === assistantMsg.id);
        if (idx >= 0)
          next[idx] = {
            ...next[idx],
            text: "There was an error generating a response.",
          };
        return next;
      });
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const rendered = useMemo(
    () =>
      messages.map((m) => (
        <div key={m.id} className={cn("flex", m.role === "assistant" ? "justify-start" : "justify-end")}>
          <div
            className={cn(
              "relative block rounded-3xl px-4 py-2 text-[15px] leading-relaxed transition-all duration-200 font-medium max-w-full",
              m.role === "assistant"
                ? "bg-transparent text-foreground"
                : "bg-container hover:bg-backdrop text-foreground",
            )}
          >
            {m.text ? (
              <Streamdown components={markdownComponents}>{m.text}</Streamdown>
            ) : (
              <span className="text-muted-foreground italic">Thinking…</span>
            )}
          </div>
        </div>
      )),
    [messages],
  );

  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      <div className="flex-1 min-h-0">
        <ScrollableMessageContainer className="p-4 bg-background/50" autoscrollDeps={messages}>
          <div className="flex flex-col gap-2">{rendered}</div>
        </ScrollableMessageContainer>
      </div>
      <div className="flex-shrink-0 p-4 bg-background/80 border-t border-border/50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 p-4 rounded-lg border border-border bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            placeholder="Type a message…"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium transition-colors",
              canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground",
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
