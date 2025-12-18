import { z } from "zod";

function normalizeAnythingLLMBaseUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    const trimmed = raw.replace(/\/$/, "");
    // AnythingLLM developer API is typically mounted under /api.
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const ANYTHING_LLM_URL = normalizeAnythingLLMBaseUrl(process.env.ANYTHING_LLM_URL);
const ANYTHING_LLM_API_KEY = process.env.ANYTHING_LLM_API_KEY;

if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
    console.warn(
        "AnythingLLM credentials missing. RAG features will be disabled.",
    );
    console.log("AnythingLLM_URL:", ANYTHING_LLM_URL || "NOT SET");
    console.log(
        "ANYTHING_LLM_API_KEY:",
        ANYTHING_LLM_API_KEY ? "SET" : "NOT SET",
    );
}

export interface AnythingLLMResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export const anythingLLM = {
    /**
     * Upload a document to AnythingLLM
     */
    async uploadDocument(
        file: File | Blob,
        fileName: string,
    ): Promise<AnythingLLMResponse> {
        try {
            if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
                throw new Error("AnythingLLM URL or API key not configured");
            }

            const formData = new FormData();
            formData.append("file", file, fileName);

            const uploadUrl = `${ANYTHING_LLM_URL}/v1/document/upload`;
            console.log("AnythingLLM Upload URL:", uploadUrl);

            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ANYTHING_LLM_API_KEY}`,
                },
                body: formData,
            });

            console.log("AnythingLLM Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `Upload failed with status ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                    console.error("AnythingLLM error response:", error);
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("AnythingLLM upload success:", data);
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Upload Error:", error);

            // Check for network errors
            if (
                error.message.includes("fetch") ||
                error.message.includes("network") ||
                error.message.includes("ECONNREFUSED")
            ) {
                return {
                    success: false,
                    error: `Network error: Could not connect to AnythingLLM at ${ANYTHING_LLM_URL}. Please check the server is running and accessible.`,
                };
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Update embeddings for a workspace (pin/unpin documents)
     */
    async updateEmbeddings(
        workspaceSlug: string,
        adds: string[] = [],
        removes: string[] = [],
    ): Promise<AnythingLLMResponse> {
        try {
            if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
                throw new Error("AnythingLLM URL or API key not configured");
            }

            const embeddingUrl = `${ANYTHING_LLM_URL}/v1/workspace/${workspaceSlug}/update-embeddings`;
            console.log("AnythingLLM Embedding URL:", embeddingUrl);

            const response = await fetch(embeddingUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ANYTHING_LLM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adds, removes }),
            });

            if (!response.ok) {
                let errorMessage = `Update embeddings failed with status ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                    console.error(
                        "AnythingLLM embedding error response:",
                        error,
                    );
                } catch (e) {
                    console.error(
                        "Failed to parse embedding error response:",
                        e,
                    );
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Embedding Error:", error);

            // Check for network errors
            if (
                error.message.includes("fetch") ||
                error.message.includes("network") ||
                error.message.includes("ECONNREFUSED")
            ) {
                return {
                    success: false,
                    error: `Network error: Could not connect to AnythingLLM at ${ANYTHING_LLM_URL}. Please check the server is running and accessible.`,
                };
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Perform a vector search or chat query
     */
    async chat(
        workspaceSlug: string,
        message: string,
    ): Promise<AnythingLLMResponse> {
        try {
            if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
                throw new Error("AnythingLLM URL or API key not configured");
            }

            const chatUrl = `${ANYTHING_LLM_URL}/v1/workspace/${workspaceSlug}/chat`;
            console.log("AnythingLLM Chat URL:", chatUrl);

            const response = await fetch(chatUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ANYTHING_LLM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    mode: "query", // 'query' uses RAG context
                }),
                signal: AbortSignal.timeout(60000), // 60s timeout
            });

            if (!response.ok) {
                let errorMessage = `Chat failed with status ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                    console.error("AnythingLLM chat error response:", error);
                } catch (e) {
                    console.error("Failed to parse chat error response:", e);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Chat Error:", error);

            // Check for network errors
            if (
                error.message.includes("fetch") ||
                error.message.includes("network") ||
                error.message.includes("ECONNREFUSED")
            ) {
                return {
                    success: false,
                    error: `Network error: Could not connect to AnythingLLM at ${ANYTHING_LLM_URL}. Please check the server is running and accessible.`,
                };
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Get workspace details (to verify it exists)
     */
    async getWorkspace(slug: string): Promise<AnythingLLMResponse> {
        try {
            if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
                throw new Error("AnythingLLM URL or API key not configured");
            }

            const workspaceUrl = `${ANYTHING_LLM_URL}/v1/workspace/${slug}`;
            console.log("AnythingLLM Workspace URL:", workspaceUrl);

            const response = await fetch(workspaceUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${ANYTHING_LLM_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Workspace not found (status: ${response.status})`,
                );
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Get Workspace Error:", error);

            // Check for network errors
            if (
                error.message.includes("fetch") ||
                error.message.includes("network") ||
                error.message.includes("ECONNREFUSED")
            ) {
                return {
                    success: false,
                    error: `Network error: Could not connect to AnythingLLM at ${ANYTHING_LLM_URL}. Please check the server is running and accessible.`,
                };
            }

            return { success: false, error: error.message };
        }
    },

    /**
     * Perform a raw vector search (lower-level RAG access).
     */
    async vectorSearch(
        workspaceSlug: string,
        queryText: string,
        topK: number = 6,
    ): Promise<AnythingLLMResponse> {
        try {
            if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
                throw new Error("AnythingLLM URL or API key not configured");
            }

            const url = `${ANYTHING_LLM_URL}/v1/workspace/${workspaceSlug}/vector-search`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ANYTHING_LLM_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: queryText, topK }),
                signal: AbortSignal.timeout(60000),
            });

            if (!response.ok) {
                let errorMessage = `Vector search failed with status ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch {}
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Vector Search Error:", error);
            return { success: false, error: error.message };
        }
    },
};

