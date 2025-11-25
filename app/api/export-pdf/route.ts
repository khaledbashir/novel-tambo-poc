import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

/**
 * PDF Export API Route - Server-side PDF Generation
 * 
 * POST /api/export-pdf
 * 
 * Request body should contain SOW data:
 * {
 *   projectTitle: string;
 *   clientName: string;
 *   projectDescription: string;
 *   scopes: Array<{
 *     name: string;
 *     description: string;
 *     items: Array<{
 *       description: string;
 *       role: string;
 *       hours: number;
 *       cost: number;
 *     }>;
 *     deliverables: string[];
 *     assumptions: string[];
 *   }>;
 *   grandTotal: number;
 *   budgetNotes: string;
 * }
 * 
 * Returns: PDF file as downloadable blob
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
  let browser;

  try {
    const data: SOWData = await request.json();

    // Read the HTML template
    const templatePath = path.join(process.cwd(), 'templates', 'pdf-export-template.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    // Generate the current date if not provided
    const currentDate = data.date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Read and embed logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.error('Error reading logo:', e);
    }

    // Replace header information
    htmlTemplate = htmlTemplate
      .replace('{{LOGO_BASE64}}', logoBase64)
      .replace('Statement of Work', data.projectTitle || 'Statement of Work')
      .replace('Client Name | Advisory | Services', `${data.clientName} | Advisory | Services`)
      .replace('HubSpot Integration & Marketing Automation Setup', data.projectDescription)
      .replace('Acme Corporation', data.clientName)
      .replace(/November 25, 2025/g, currentDate);

    // Generate scope table rows HTML
    const scopeRowsHtml = data.scopes.map((scope, scopeIndex) => {
      const itemsHtml = scope.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.role}</td>
          <td>${item.hours}</td>
          <td>$${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const deliverablesHtml = scope.deliverables.length > 0 ? `
        <tr>
          <td colspan="4" class="deliverables-block">
            <h4>Deliverables:</h4>
            <ul>
              ${scope.deliverables.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </td>
        </tr>
      ` : '';

      const assumptionsHtml = scope.assumptions && scope.assumptions.length > 0 ? `
        <tr>
          <td colspan="4" class="deliverables-block">
            <h4>Assumptions:</h4>
            <ul>
              ${scope.assumptions.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </td>
        </tr>
      ` : '';

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
    }).join('');

    // Calculate summary data
    const summaryRows = data.scopes.map(scope => {
      const totalHours = scope.items.reduce((sum, item) => sum + item.hours, 0);
      const totalCost = scope.items.reduce((sum, item) => sum + item.cost, 0);
      return {
        name: scope.name,
        hours: totalHours,
        cost: totalCost
      };
    });

    const totalHours = summaryRows.reduce((sum, row) => sum + row.hours, 0);

    const summaryRowsHtml = summaryRows.map(row => `
      <tr>
        <td>${row.name}</td>
        <td>${row.hours}</td>
        <td>$${row.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    // Replace project overview
    htmlTemplate = htmlTemplate.replace(
      /This Statement of Work outlines.*?customer engagement\./s,
      data.projectDescription
    );

    // Replace budget notes
    if (data.budgetNotes) {
      htmlTemplate = htmlTemplate.replace(
        /All pricing is inclusive of GST.*?before proceeding\./s,
        data.budgetNotes
      );
    }

    // Replace grand total
    htmlTemplate = htmlTemplate.replace(
      /<span class="amount">\$[\d,]+\.00<\/span>/,
      `<span class="amount">$${data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
    );

    // Replace scope rows
    htmlTemplate = htmlTemplate.replace(
      '<!-- SCOPE_ROWS_PLACEHOLDER -->',
      scopeRowsHtml
    );

    // Replace summary rows
    htmlTemplate = htmlTemplate.replace(
      '<!-- SUMMARY_ROWS_PLACEHOLDER -->',
      summaryRowsHtml
    );

    // Launch Puppeteer and generate PDF
    console.log('Launching Puppeteer for PDF generation...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlTemplate, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with professional settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    // Return the PDF as a downloadable file
    const filename = `${data.projectTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(new Blob([pdfBuffer as any]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('PDF Export Error:', error);

    // Clean up browser if it's still running
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
