import { NextRequest, NextResponse } from "next/server";
import puppeteer from 'puppeteer-core';

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string) => {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
};

const buildBrowserWSEndpoint = (baseUrl: string, token?: string) => {
    // Prefer explicit token passed via env var rather than hard-coded fallbacks.
    // If the baseUrl already includes token=, do not modify it.
    if (!token) return baseUrl;
    if (baseUrl.includes('token=')) return baseUrl;

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

export async function POST(req: NextRequest) {
    let browser: any;
    let page: any;

    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json(
                { error: "HTML content is required" },
                { status: 400 }
            );
        }

        const browserlessUrl = process.env.BROWSERLESS_URL;
        const browserlessToken = process.env.BROWSERLESS_TOKEN;

        if (!browserlessUrl) {
            console.error("BROWSERLESS_URL is not configured");
            return NextResponse.json(
                { error: "PDF service is not configured" },
                { status: 503 }
            );
        }

        const browserWSEndpoint = buildBrowserWSEndpoint(browserlessUrl, browserlessToken);

        try {
            console.log('Connecting to Browserless...');
            browser = await withTimeout(
                puppeteer.connect({
                    browserWSEndpoint,
                }),
                15_000,
                'Browserless connect',
            );
        } catch (connError: any) {
            const message = connError?.message || String(connError);
            console.error('Puppeteer Connection Error:', message);

            const authHint = message.includes('401') || message.includes('403')
                ? 'Browserless rejected the connection (auth). Set BROWSERLESS_TOKEN or include ?token= in BROWSERLESS_URL.'
                : undefined;

            return NextResponse.json(
                { error: 'Failed to connect to Browserless', details: authHint || message },
                { status: 502 },
            );
        }

        page = await browser.newPage();
        page.setDefaultTimeout(30_000);
        page.setDefaultNavigationTimeout(30_000);

        // Avoid networkidle0 which can hang on external assets; rely on DOM readiness.
        await withTimeout(
            page.setContent(html, { waitUntil: 'domcontentloaded' }),
            30_000,
            'page.setContent',
        );

        const pdfBuffer = await withTimeout(
            page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '2cm',
                    right: '2cm',
                    bottom: '2cm',
                    left: '2cm',
                },
            }),
            60_000,
            'page.pdf',
        );

        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="sow-document.pdf"',
            },
        });
    } catch (error: any) {
        console.error("PDF generation failed:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF", details: error.message },
            { status: 500 }
        );
    } finally {
        try {
            if (page) await page.close();
        } catch {
            // ignore
        }

        try {
            if (browser) await browser.close();
        } catch {
            // ignore
        }
    }
}
