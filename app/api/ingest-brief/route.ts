import { NextRequest, NextResponse } from "next/server";
import { anythingLLM } from "@/lib/anything-llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    console.log("[Ingest] Request received");
    console.log("[Ingest] Env Check - URL:", process.env.ANYTHING_LLM_URL ? "Set" : "Missing");
    console.log("[Ingest] Env Check - Key:", process.env.ANYTHING_LLM_API_KEY ? "Set" : "Missing");

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        // 1. Upload to AnythingLLM
        console.log(`[Ingest] Uploading ${file.name} to AnythingLLM...`);
        const uploadResult = await anythingLLM.uploadDocument(file, file.name);

        if (!uploadResult.success || !uploadResult.data) {
            throw new Error(uploadResult.error || "Failed to upload to AnythingLLM");
        }

        const docLocation = uploadResult.data.documents?.[0]?.location;
        if (!docLocation) {
            console.warn("[Ingest] Upload successful but no document location returned", uploadResult.data);
        }

        // 2. Pin to Workspace (RAG)
        const workspaceSlug = process.env.ANYTHING_LLM_WORKSPACE_SLUG || "sow-generator";
        console.log(`[Ingest] Pinning to workspace: ${workspaceSlug}`);

        // We need the full path/location to pin it. 
        // AnythingLLM upload response usually looks like: { documents: [ { location: 'custom-documents/file.pdf', ... } ] }
        if (docLocation) {
            const pinResult = await anythingLLM.updateEmbeddings(workspaceSlug, [docLocation], []);
            if (!pinResult.success) {
                console.warn(`[Ingest] Failed to pin document: ${pinResult.error}`);
                // We don't fail the whole request if pinning fails, but RAG won't work for this doc immediately
            }
        }

        // 3. Return Success
        return NextResponse.json({
            success: true,
            text: "Document uploaded to Knowledge Base. Use consult_knowledge_base tool to query it.", // No full text returned
            pages: 0, // We don't get page count easily from AnythingLLM upload
            metadata: {
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
                location: docLocation
            },
        });

    } catch (error: any) {
        console.error("Ingest Error:", error);
        console.error("Stack:", error.stack);
        return NextResponse.json(
            {
                error: error.message || "Failed to ingest document",
                details: error.toString()
            },
            { status: 500 },
        );
    }
}
