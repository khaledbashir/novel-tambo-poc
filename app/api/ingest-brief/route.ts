import { NextRequest, NextResponse } from "next/server";
import { anythingLLM } from "@/lib/anything-llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    console.log("[Ingest] Request received");

    // Log environment variables (but mask the API key)
    console.log(
        "[Ingest] Env Check - URL:",
        process.env.ANYTHING_LLM_URL
            ? process.env.ANYTHING_LLM_URL.substring(0, 20) + "..."
            : "Missing",
    );
    console.log(
        "[Ingest] Env Check - Key:",
        process.env.ANYTHING_LLM_API_KEY
            ? "Set (" +
                  process.env.ANYTHING_LLM_API_KEY.substring(0, 5) +
                  "...)"
            : "Missing",
    );

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("[Ingest] No file provided in form data");
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        console.log("[Ingest] File received:", {
            name: file.name,
            size: file.size,
            type: file.type,
        });

        // 1. Upload to AnythingLLM
        console.log(`[Ingest] Uploading ${file.name} to AnythingLLM...`);
        console.log("[Ingest] AnythingLLM URL:", process.env.ANYTHING_LLM_URL);

        let uploadResult;
        try {
            uploadResult = await anythingLLM.uploadDocument(file, file.name);

            console.log("[Ingest] Upload result:", {
                success: uploadResult.success,
                hasData: !!uploadResult.data,
                error: uploadResult.error,
            });

            if (!uploadResult.success || !uploadResult.data) {
                throw new Error(
                    uploadResult.error || "Failed to upload to AnythingLLM",
                );
            }
        } catch (uploadError) {
            console.error("[Ingest] Upload error:", uploadError);
            throw new Error(
                `Upload to AnythingLLM failed: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`,
            );
        }

        const docLocation = uploadResult.data.documents?.[0]?.location;
        if (!docLocation) {
            console.warn(
                "[Ingest] Upload successful but no document location returned",
                uploadResult.data,
            );
        }

        // 2. Pin to Workspace (RAG)
        const workspaceSlug =
            process.env.ANYTHING_LLM_WORKSPACE_SLUG || "sow-generator";
        console.log(`[Ingest] Pinning to workspace: ${workspaceSlug}`);

        // We need the full path/location to pin it.
        // AnythingLLM upload response usually looks like: { documents: [ { location: 'custom-documents/file.pdf', ... } ] }
        if (docLocation) {
            const pinResult = await anythingLLM.updateEmbeddings(
                workspaceSlug,
                [docLocation],
                [],
            );
            if (!pinResult.success) {
                console.warn(
                    `[Ingest] Failed to pin document: ${pinResult.error}`,
                );
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
                location: docLocation,
            },
        });
    } catch (error: any) {
        console.error("[Ingest] Error:", error);
        console.error("[Ingest] Stack:", error.stack);

        // Provide more specific error messages
        let errorMessage = error.message || "Failed to ingest document";
        let errorDetails = error.toString();

        // Check for common issues
        if (error.message.includes("fetch")) {
            errorMessage =
                "Network error. Could not connect to AnythingLLM server.";
            errorDetails =
                "Please check your ANYTHING_LLM_URL and ensure the server is running.";
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: errorDetails,
            },
            { status: 500 },
        );
    }
}
