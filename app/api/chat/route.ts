import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { anythingLLM } from "@/lib/anything-llm";
import {
  addChatMessage,
  getOrCreateChatThread,
  listChatMessages,
} from "@/lib/chat-db";
import { SOW_SYSTEM_PROMPT } from "@/lib/agent/sow-system-prompt";

export const runtime = "nodejs";

const bodySchema = z.object({
  contextKey: z.string().min(1).default("simple-chat"),
  documentId: z.string().nullable().optional(),
  message: z.string().min(1),
  workspaceSlug: z.string().min(1).optional(),
});

type ChatProviderKind = "zai" | "anythingllm";

function getChatProvider() {
  const kind = (process.env.CHAT_PROVIDER || "zai") as ChatProviderKind;

  if (kind === "anythingllm") {
    const base = process.env.ANYTHING_LLM_URL;
    const key = process.env.ANYTHING_LLM_API_KEY;
    if (!base || !key) {
      throw new Error(
        "CHAT_PROVIDER=anythingllm requires ANYTHING_LLM_URL and ANYTHING_LLM_API_KEY",
      );
    }
    const normalized = base.replace(/\/$/, "");
    // Accept either host root or /api base.
    const apiBase = normalized.endsWith("/api") ? normalized : `${normalized}/api`;
    // AnythingLLM exposes OpenAI-compatible endpoints under /v1/openai
    const openaiBaseURL = `${apiBase}/v1/openai`;
    return {
      kind,
      provider: createOpenAI({ apiKey: key, baseURL: openaiBaseURL }),
    } as const;
  }

  const zaiKey = process.env.ZAI_API_KEY;
  if (!zaiKey) {
    throw new Error("Missing ZAI_API_KEY");
  }

  return {
    kind,
    provider: createOpenAI({
      apiKey: zaiKey,
      baseURL: process.env.ZAI_API_URL || "https://api.z.ai/api/coding/paas/v4",
    }),
  } as const;
}

function formatRagContext(vectorData: any): string {
  const items = Array.isArray(vectorData) ? vectorData : vectorData?.results ?? [];
  if (!Array.isArray(items) || items.length === 0) return "";

  const top = items.slice(0, 6);
  const blocks = top
    .map((it: any, idx: number) => {
      const text =
        it?.text ||
        it?.content ||
        it?.chunk ||
        it?.metadata?.text ||
        "";
      const source = it?.metadata?.source || it?.source || it?.document || "source";
      const safeText = String(text).slice(0, 2000);
      return `[#${idx + 1}] ${source}\n${safeText}`;
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";
  return `\n\nRelevant brief context (RAG excerpts):\n${blocks.join("\n\n")}`;
}

export async function POST(req: Request): Promise<Response> {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", issues: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { contextKey, documentId, message, workspaceSlug } = parsed.data;

  let provider;
  let providerKind: ChatProviderKind = "zai";
  try {
    const selected = getChatProvider();
    provider = selected.provider;
    providerKind = selected.kind;
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Chat provider misconfigured" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const thread = await getOrCreateChatThread({
    contextKey,
    documentId: documentId ?? null,
  });

  await addChatMessage({
    id: crypto.randomUUID(),
    threadId: thread.id,
    role: "user",
    contentText: message,
  });

  const history = await listChatMessages({ threadId: thread.id, limit: 40 });

  const defaultWorkspace = process.env.ANYTHING_LLM_DEFAULT_WORKSPACE;
  const ragWorkspace = workspaceSlug || defaultWorkspace;

  if (providerKind === "anythingllm" && !ragWorkspace) {
    return new Response(
      JSON.stringify({
        error:
          "ANYTHING_LLM_DEFAULT_WORKSPACE is required when CHAT_PROVIDER=anythingllm (or pass workspaceSlug)",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  let ragContext = "";
  if (ragWorkspace) {
    const rag = await anythingLLM.vectorSearch(ragWorkspace, message, 6);
    if (rag.success) {
      ragContext = formatRagContext(rag.data);
    }
  }

  const result = await streamText({
    // @ts-ignore - provider type mismatch across ai-sdk versions
    model:
      providerKind === "anythingllm"
        ? // AnythingLLM OpenAI-compatible endpoint uses `model` as the workspace slug.
          provider(ragWorkspace || "default")
        : provider("glm-4.6"),
    messages: [
      { role: "system", content: `${SOW_SYSTEM_PROMPT}${ragContext}` },
      ...history.map((m) => ({ role: m.role, content: m.content_text })),
    ],
    temperature: 0.4,
    topP: 1,
    maxTokens: 8192,
    onFinish: async ({ text }) => {
      try {
        await addChatMessage({
          id: crypto.randomUUID(),
          threadId: thread.id,
          role: "assistant",
          contentText: text || "",
        });
      } catch (e) {
        console.error("Failed to persist assistant message", e);
      }
    },
  });

  // Client reads raw UTF-8 chunks; avoid protocol framing artifacts.
  // @ts-ignore - older ai versions may not type this method.
  return result.toTextStreamResponse();
}
