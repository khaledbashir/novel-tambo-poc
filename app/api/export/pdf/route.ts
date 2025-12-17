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

        let browser;
        try {
            console.log(`Connecting to Browserless at ${browserlessUrl}...`);
            browser = await puppeteer.connect({
                browserWSEndpoint: browserlessUrl,
            });
        } catch (connError: any) {
            console.error("Puppeteer Connection Error (Attempt 1):", connError);

            // Retry with default token if 401 and no token specified
            if (connError.message.includes("401") && !browserlessUrl.includes("token=")) {
                try {
                    console.log("Retrying with default Browserless token...");
                    const retryUrl = `${browserlessUrl}?token=6R0W53R1355`;
                    browser = await puppeteer.connect({
                        browserWSEndpoint: retryUrl,
                    });
                    console.log("Connected successfully with default token!");
                } catch (retryError: any) {
                    console.error("Retry failed:", retryError);
                    return NextResponse.json(
                        {
                            error: "Failed to connect to Browserless (Auth Error)",
                            details: "Service returned 401 Forbidden. Please check if your BROWSERLESS_URL needs a valid '?token=' parameter."
                        },
                        { status: 502 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: "Failed to connect to Browserless", details: connError.message },
                    { status: 502 }
                );
            }
        }

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
