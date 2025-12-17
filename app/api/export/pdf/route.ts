import { NextRequest, NextResponse } from "next/server";
import puppeteer from 'puppeteer-core';

export async function POST(req: NextRequest) {
    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json(
                { error: "HTML content is required" },
                { status: 400 }
            );
        }

        const browserlessUrl = process.env.BROWSERLESS_URL;

        if (!browserlessUrl) {
            console.error("BROWSERLESS_URL is not configured");
            return NextResponse.json(
                { error: "PDF service is not configured" },
                { status: 503 }
            );
        }

        console.log(`Connecting to Browserless at ${browserlessUrl}...`);

        const browser = await puppeteer.connect({
            browserWSEndpoint: browserlessUrl,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "2cm",
                right: "2cm",
                bottom: "2cm",
                left: "2cm",
            },
        });

        await browser.close();

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
    }
}
