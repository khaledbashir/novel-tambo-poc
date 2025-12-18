import { z } from "zod";
import { getChatThreadByContextKey, listChatMessages } from "@/lib/chat-db";

export const runtime = "nodejs";

const querySchema = z.object({
  contextKey: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    contextKey: url.searchParams.get("contextKey"),
    limit: url.searchParams.get("limit"),
  });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid query", issues: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const thread = await getChatThreadByContextKey(parsed.data.contextKey);
  if (!thread) {
    return new Response(JSON.stringify({ threadId: null, messages: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = await listChatMessages({
    threadId: thread.id,
    limit: parsed.data.limit ?? 80,
  });

  return new Response(
    JSON.stringify({ threadId: thread.id, messages }),
    { headers: { "Content-Type": "application/json" } },
  );
}
