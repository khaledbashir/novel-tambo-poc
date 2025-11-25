import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * PDF Export API Route - WeasyPrint API Integration
 *
 * POST /api/export-pdf
 *
 * Converts HTML to PDF using external WeasyPrint API
 */

interface SOWItem {
    description: string;
    role: string;
    hours: number;
    cost: number;
}

interface SOWScope {
    name: string;
    description: string;
    items: SOWItem[];
    deliverables: string[];
    assumptions?: string[];
}

interface SOWData {
    projectTitle: string;
    clientName: string;
    projectDescription: string;
    scopes: SOWScope[];
    grandTotal: number;
    budgetNotes: string;
    date?: string;
}

export async function POST(request: NextRequest) {
    try {
        const data: SOWData = await request.json();

        // Read the HTML template
        const templatePath = path.join(
            process.cwd(),
            "templates",
            "pdf-export-template.html",
        );
        let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

        // Generate the current date if not provided
        const currentDate =
            data.date ||
            new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

        // Read and embed logo
        let logoBase64 = "";
        try {
            const logoPath = path.join(process.cwd(), "public", "logo.png");
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
            }
        } catch (e) {
            console.error("Error reading logo:", e);
        }

        // Replace header information
        htmlTemplate = htmlTemplate
            .replace("{{LOGO_BASE64}}", logoBase64)
            .replace(
                "Statement of Work",
                data.projectTitle || "Statement of Work",
            )
            .replace(
                "Client Name | Advisory | Services",
                `${data.clientName} | Advisory | Services`,
            )
            .replace(
                "HubSpot Integration & Marketing Automation Setup",
                data.projectDescription,
            )
            .replace("Acme Corporation", data.clientName)
            .replace(/November 25, 2025/g, currentDate);

        // Generate scope table rows HTML
        const scopeRowsHtml = data.scopes
            .map((scope) => {
                const itemsHtml = scope.items
                    .map(
                        (item) => `
        <tr>
          <td>${item.description}</td>
          <td>${item.role}</td>
          <td>${item.hours}</td>
          <td>$${item.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `,
                    )
                    .join("");

                const deliverablesHtml =
                    scope.deliverables.length > 0
                        ? `
        <tr>
          <td colspan="4" class="deliverables-block">
            <h4>Deliverables:</h4>
            <ul>
              ${scope.deliverables.map((d) => `<li>${d}</li>`).join("")}
            </ul>
          </td>
        </tr>
      `
                        : "";

                const assumptionsHtml =
                    scope.assumptions && scope.assumptions.length > 0
                        ? `
        <tr>
          <td colspan="4" class="deliverables-block">
            <h4>Assumptions:</h4>
            <ul>
              ${scope.assumptions.map((a) => `<li>${a}</li>`).join("")}
            </ul>
          </td>
        </tr>
      `
                        : "";

                return `
        <tr>
          <td colspan="4" class="scope-section-header">
            ${scope.name}
          </td>
        </tr>
        <tr>
          <td colspan="4" class="description-row">
            ${scope.description}
          </td>
        </tr>
        ${deliverablesHtml}
        ${itemsHtml}
        ${assumptionsHtml}
      `;
            })
            .join("");

        // Calculate summary data
        const summaryRows = data.scopes.map((scope) => {
            const totalHours = scope.items.reduce(
                (sum, item) => sum + item.hours,
                0,
            );
            const totalCost = scope.items.reduce(
                (sum, item) => sum + item.cost,
                0,
            );
            return {
                name: scope.name,
                hours: totalHours,
                cost: totalCost,
            };
        });

        const summaryRowsHtml = summaryRows
            .map(
                (row) => `
      <tr>
        <td>${row.name}</td>
        <td>${row.hours}</td>
        <td>$${row.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `,
            )
            .join("");

        // Replace project overview
        htmlTemplate = htmlTemplate.replace(
            /This Statement of Work outlines.*?customer engagement\./s,
            data.projectDescription,
        );

        // Replace budget notes
        if (data.budgetNotes) {
            htmlTemplate = htmlTemplate.replace(
                /All pricing is inclusive of GST.*?before proceeding\./s,
                data.budgetNotes,
            );
        }

        // Replace grand total
        htmlTemplate = htmlTemplate.replace(
            /<span class="amount">\$[\d,]+\.00<\/span>/,
            `<span class="amount">$${data.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`,
        );

        // Replace scope rows
        htmlTemplate = htmlTemplate.replace(
            "<!-- SCOPE_ROWS_PLACEHOLDER -->",
            scopeRowsHtml,
        );

        // Replace summary rows
        htmlTemplate = htmlTemplate.replace(
            "<!-- SUMMARY_ROWS_PLACEHOLDER -->",
            summaryRowsHtml,
        );

        // Call WeasyPrint API with timeout and retry logic
        const WEASYPRINT_URL = process.env.WEASYPRINT_URL || "http://168.231.115.219:5000/generate-pdf";
        const MAX_RETRIES = 3;
        const TIMEOUT_MS = 30000; // 30 seconds

        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < MAX_RETRIES) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                const response = await fetch(WEASYPRINT_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/html",
                    },
                    body: htmlTemplate,
                    signal: controller.signal,
                });

                // Clear timeout on successful response
                clearTimeout(timeoutId);

                if (!response.ok) {
                    // Try to get error details for better debugging
                    let errorDetails = "";
                    try {
                        const errorData = await response.json().catch(() => null);
                        errorDetails = errorData ? JSON.stringify(errorData) : "No error details available";
                    } catch (e) {
                        errorDetails = `Failed to parse error response: ${e}`;
                    }

                    lastError = new Error(`WeasyPrint API error: ${response.statusText} - Details: ${errorDetails}`);
                } else {
                    const result = await response.json();
                    if (!result || !result.downloadUrl) {
                        lastError = new Error("WeasyPrint API returned invalid response");
                    } else {
                        const pdfUrl = result.downloadUrl;

                        // Generate filename from project title and current date
                        const filename = `${data.projectTitle.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;

                        // Fetch the PDF and return it
                        const pdfResponse = await fetch(pdfUrl);
                        if (!pdfResponse.ok) {
                            lastError = new Error(`Failed to fetch PDF from WeasyPrint: ${pdfResponse.statusText}`);
                        } else {
                            const pdfBuffer = await pdfResponse.arrayBuffer();
                            return new NextResponse(pdfBuffer, {
                                status: 200,
                                headers: {
                                    "Content-Type": "application/pdf",
                                    "Content-Disposition": `attachment; filename="${filename}"`,
                                },
                            });
                        }
                    }
                }

                // If we got here, it was successful
                break;

            } catch (error) {
                retryCount++;
                lastError = error instanceof Error ? error : new Error(`Failed to connect to WeasyPrint: ${error}`);

                if (retryCount < MAX_RETRIES) {
                    console.log(`WeasyPrint attempt ${retryCount + 1} failed, retrying in ${retryCount * 2} seconds...`);
                    // Wait before retrying with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
                }
            }
        }

        // If all retries failed, throw the last error
        if (lastError) {
            throw lastError;
        }

        // This should never be reached, but just in case
        throw new Error("Failed to generate PDF after retries");

    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate PDF",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
