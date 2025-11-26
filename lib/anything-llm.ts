import { z } from "zod";

const ANYTHING_LLM_URL = process.env.ANYTHING_LLM_URL;
const ANYTHING_LLM_API_KEY = process.env.ANYTHING_LLM_API_KEY;

if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
    console.warn("AnythingLLM credentials missing. RAG features will be disabled.");
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
    async uploadDocument(file: File | Blob, fileName: string): Promise<AnythingLLMResponse> {
        try {
            const formData = new FormData();
            formData.append("file", file, fileName);

            const response = await fetch(`${ANYTHING_LLM_URL}/v1/document/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Upload failed");
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Upload Error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update embeddings for a workspace (pin/unpin documents)
     */
    async updateEmbeddings(
        workspaceSlug: string,
        adds: string[] = [],
        removes: string[] = []
    ): Promise<AnythingLLMResponse> {
        try {
            const response = await fetch(
                `${ANYTHING_LLM_URL}/v1/workspace/${workspaceSlug}/update-embeddings`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ adds, removes }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Update embeddings failed");
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Embedding Error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Perform a vector search or chat query
     */
    async chat(workspaceSlug: string, message: string): Promise<AnythingLLMResponse> {
        try {
            const response = await fetch(
                `${ANYTHING_LLM_URL}/v1/workspace/${workspaceSlug}/chat`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message,
                        mode: "query", // 'query' uses RAG context
                    }),
                    signal: AbortSignal.timeout(60000), // 60s timeout
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Chat failed");
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            console.error("AnythingLLM Chat Error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get workspace details (to verify it exists)
     */
    async getWorkspace(slug: string): Promise<AnythingLLMResponse> {
        try {
            const response = await fetch(`${ANYTHING_LLM_URL}/v1/workspace/${slug}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error("Workspace not found");
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
