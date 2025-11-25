import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * PDF Export API Route - HTML-based PDF Generation
 *
 * POST /api/export-pdf
 *
 * Returns an HTML file with print styling that the user can save as PDF
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

        // Add print-specific styling and instructions
        const printInstructions = `
      <div id="print-instructions" style="position: fixed; top: 10px; right: 10px; background: #f8f9fa; padding: 15px; border: 1px solid #ddd; border-radius: 5px; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; color: #333;">PDF Export Instructions</h3>
        <p style="margin-bottom: 10px;">To save this document as a PDF:</p>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Press <strong>Ctrl+P</strong> (Windows/Linux) or <strong>Cmd+P</strong> (Mac)</li>
          <li>Select "Save as PDF" as the destination</li>
          <li>Adjust settings if needed (margins, headers/footers)</li>
          <li>Click "Save" to download the PDF</li>
        </ol>
        <p style="margin-bottom: 0; font-size: 12px; color: #666;">This dialog will not appear in the printed PDF.</p>
        <style>
          @media print {
            #print-instructions { display: none !important; }
          }
        </style>
      </div>
    `;

        // Add the instructions before closing body tag
        htmlTemplate = htmlTemplate.replace(
            "</body>",
            printInstructions + "</body>",
        );

        // Return HTML with content-disposition to trigger download
        const filename = `${data.projectTitle.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.html`;

        return new NextResponse(htmlTemplate, {
            status: 200,
            headers: {
                "Content-Type": "text/html",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("PDF Export Error:", error);

        return NextResponse.json(
            {
                error: "Failed to generate PDF",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
