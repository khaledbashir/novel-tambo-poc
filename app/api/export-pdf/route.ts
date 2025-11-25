import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * PDF Export API Route - Browser-based PDF Generation
 * 
 * POST /api/export-pdf
 * 
 * Returns HTML that can be printed to PDF by the browser
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
    const scopeRowsHtml = data.scopes.map((scope) => {
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

    // Add auto-print script
    htmlTemplate = htmlTemplate.replace(
      '</body>',
      `<script>
        // Auto-trigger print dialog when page loads
        window.onload = function() {
          window.print();
        };
      </script>
      </body>`
    );

    // Return HTML that will trigger browser print dialog
    return new NextResponse(htmlTemplate, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('PDF Export Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
