/**
 * Diagnostic script to check AnythingLLM workspace status
 * Run with: npx tsx check-anythingllm-status.ts
 */

const ANYTHING_LLM_URL = process.env.ANYTHING_LLM_URL;
const ANYTHING_LLM_API_KEY = process.env.ANYTHING_LLM_API_KEY;
const WORKSPACE_SLUG = "novel";

async function checkWorkspaceStatus() {
    if (!ANYTHING_LLM_URL || !ANYTHING_LLM_API_KEY) {
        console.error("❌ Missing ANYTHING_LLM_URL or ANYTHING_LLM_API_KEY env vars");
        process.exit(1);
    }
    console.log("🔍 Checking AnythingLLM Workspace Status...\n");

    try {
        // 1. Get workspace details
        console.log(`📁 Fetching workspace: ${WORKSPACE_SLUG}`);
        const workspaceResponse = await fetch(`${ANYTHING_LLM_URL}/v1/workspace/${WORKSPACE_SLUG}`, {
            headers: {
                "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
            },
        });

        if (!workspaceResponse.ok) {
            throw new Error(`Workspace fetch failed: ${workspaceResponse.status} ${workspaceResponse.statusText}`);
        }

        const workspace = await workspaceResponse.json();
        console.log("✅ Workspace found:", workspace.workspace?.name || WORKSPACE_SLUG);
        console.log("📊 Documents in workspace:", workspace.workspace?.documents?.length || 0);

        if (workspace.workspace?.documents) {
            console.log("\n📄 Documents:");
            workspace.workspace.documents.forEach((doc: any, idx: number) => {
                console.log(`  ${idx + 1}. ${doc.docpath || doc.location || doc.name}`);
                console.log(`     - ID: ${doc.id}`);
                console.log(`     - Pinned: ${doc.pinned ? "✅" : "❌"}`);
                console.log(`     - Watched: ${doc.watched ? "✅" : "❌"}`);
            });
        }

        // 2. Test a simple query
        console.log("\n🧪 Testing RAG query...");
        const chatResponse = await fetch(`${ANYTHING_LLM_URL}/v1/workspace/${WORKSPACE_SLUG}/chat`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${ANYTHING_LLM_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "What is this document about? Summarize the main topic.",
                mode: "query",
            }),
        });

        if (!chatResponse.ok) {
            throw new Error(`Chat query failed: ${chatResponse.status} ${chatResponse.statusText}`);
        }

        const chatResult = await chatResponse.json();
        console.log("✅ RAG Response:");
        console.log("   Text:", chatResult.textResponse?.substring(0, 200) + "...");
        console.log("   Sources:", chatResult.sources?.length || 0, "sources found");

        if (chatResult.sources && chatResult.sources.length > 0) {
            console.log("\n📚 Sources:");
            chatResult.sources.forEach((source: any, idx: number) => {
                console.log(`  ${idx + 1}. ${source.title || source.source || "Unknown"}`);
            });
        }

    } catch (error: any) {
        console.error("❌ Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

checkWorkspaceStatus();
