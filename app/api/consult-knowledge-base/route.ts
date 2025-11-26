import { NextRequest, NextResponse } from "next/server";
import { anythingLLM } from "@/lib/anything-llm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const requestId = Date.now().toString();
    console.log(`[Consult ${requestId}] Request received`);
    console.time(`[Consult ${requestId}] Duration`);

    try {
        const body = await req.json();
        const { query, history, workspaceSlug } = body; // Modified to include history and destructure directly from body
        console.log(`[Consult ${requestId}] Query:`, query.substring(0, 50) + "...");

        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 },
            );
        }

        const slug = workspaceSlug || process.env.ANYTHING_LLM_WORKSPACE_SLUG || "sow-generator";

        console.log(`[Consult] Querying workspace '${slug}': ${query}`);
        const result = await anythingLLM.chat(slug, query);

        if (!result.success) {
            throw new Error(result.error || "Failed to consult knowledge base");
        }

        console.log(`[Consult ${requestId}] AnythingLLM Response received`);
        console.timeEnd(`[Consult ${requestId}] Duration`);

        return NextResponse.json({
            text: result.data.textResponse,
            sources: result.data.sources || []
        });

    } catch (error: any) {
        console.error("Consult Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to consult knowledge base" },
            { status: 500 },
        );
    }
}
