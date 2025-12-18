import { query, queryOne } from "./database";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatThread {
  id: string;
  context_key: string;
  document_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: ChatRole;
  content_text: string;
  created_at: Date;
}

export async function getChatThreadByContextKey(
  contextKey: string,
): Promise<ChatThread | null> {
  return await queryOne<ChatThread>(
    "SELECT * FROM chat_threads WHERE context_key = ?",
    [contextKey],
  );
}

export async function createChatThread(params: {
  id: string;
  contextKey: string;
  documentId?: string | null;
}): Promise<ChatThread> {
  await query(
    "INSERT INTO chat_threads (id, context_key, document_id) VALUES (?, ?, ?)",
    [params.id, params.contextKey, params.documentId ?? null],
  );
  const thread = await queryOne<ChatThread>(
    "SELECT * FROM chat_threads WHERE id = ?",
    [params.id],
  );
  if (!thread) throw new Error("Failed to create chat thread");
  return thread;
}

export async function getOrCreateChatThread(params: {
  contextKey: string;
  documentId?: string | null;
}): Promise<ChatThread> {
  const existing = await getChatThreadByContextKey(params.contextKey);
  if (existing) return existing;
  return await createChatThread({
    id: crypto.randomUUID(),
    contextKey: params.contextKey,
    documentId: params.documentId ?? null,
  });
}

export async function listChatMessages(params: {
  threadId: string;
  limit?: number;
}): Promise<ChatMessage[]> {
  const limit = params.limit ?? 50;
  return await query<ChatMessage[]>(
    "SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?",
    [params.threadId, limit],
  );
}

export async function addChatMessage(params: {
  id: string;
  threadId: string;
  role: ChatRole;
  contentText: string;
}): Promise<void> {
  await query(
    "INSERT INTO chat_messages (id, thread_id, role, content_text) VALUES (?, ?, ?, ?)",
    [params.id, params.threadId, params.role, params.contentText],
  );
}
