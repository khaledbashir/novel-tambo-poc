// Standalone script
import fs from 'fs';
import path from 'path';

// Hardcode for script execution
const CONFIG = {
    url: 'https://ahmad-anything-llm.840tjq.easypanel.host/api',
    key: '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA',
};

async function testUpload() {
    console.log('Testing upload to:', CONFIG.url);

    // Create a dummy text file
    const dummyPath = path.resolve('test.txt');
    fs.writeFileSync(dummyPath, 'This is a test document for AnythingLLM upload.');

    // Create Blob-like object for node-fetch (since we are in node environment)
    const fileContent = fs.readFileSync(dummyPath);
    const blob = new Blob([fileContent as any], { type: 'text/plain' });

    // We need to construct FormData manually or use a library, but let's try raw fetch first
    // Actually, anything-llm.ts uses FormData which is available in Node 18+
    // But we need to make sure we are sending it correctly.

    try {
        const formData = new FormData();
        formData.append("file", blob, "test.txt");

        const response = await fetch(`${CONFIG.url}/v1/document/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.key}`,
            },
            body: formData,
        });

        console.log('Response Status:', response.status);
        const text = await response.text();
        console.log('Response Body:', text.substring(0, 500)); // Print first 500 chars

        if (!response.ok) {
            console.error('❌ Upload failed');
        } else {
            console.log('✅ Upload success');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

testUpload();
