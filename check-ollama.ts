/**
 * Check if Ollama is reachable
 */

const OLLAMA_URL = "https://ahmad-ollama.840tjq.easypanel.host";

async function checkOllama() {
    console.log(`🔍 Checking Ollama at ${OLLAMA_URL}...\n`);

    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);

        if (!response.ok) {
            console.error(`❌ Ollama returned status: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log("✅ Ollama is reachable!");
        console.log("📦 Available models:", data.models?.map((m: any) => m.name).join(", ") || "None");

        // Check if embeddinggemma:latest exists
        const hasEmbeddingModel = data.models?.some((m: any) => m.name === "embeddinggemma:latest");
        if (hasEmbeddingModel) {
            console.log("✅ embeddinggemma:latest is available");
        } else {
            console.log("⚠️  embeddinggemma:latest NOT found. AnythingLLM needs this model!");
        }

    } catch (error: any) {
        console.error("❌ Cannot reach Ollama:", error.message);
        console.log("\n💡 Solutions:");
        console.log("   1. Start your Ollama service on Easypanel");
        console.log("   2. OR switch AnythingLLM to use OpenAI embeddings instead");
    }
}

checkOllama();
