import { Editor } from '@tiptap/react';

/**
 * SOW Data Structure
 */
interface SOWData {
    clientName: string;
    projectTitle: string;
    scopes: Array<{
        id: string;
        title: string;
        description: string;
        roles: Array<{
            id: string;
            task: string;
            role: string;
            hours: number;
            rate: number;
        }>;
        deliverables: string[];
        assumptions: string[];
    }>;
    projectOverview?: string;
    budgetNotes?: string;
    discount?: number;
}

/**
 * Utility: Convert unknown value to number
 */
const toNumber = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const cleaned = v.replace(/[^0-9.\-]/g, "");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
};

/**
 * Utility: Format number as AUD currency
 */
const formatAUD = (n: number): string =>
    new Intl.NumberFormat("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);

/**
 * Calculate scope total (before GST)
 */
const calculateScopeTotal = (scope: SOWData['scopes'][0]): number => {
    if (!scope.roles || scope.roles.length === 0) return 0;
    return scope.roles.reduce((sum, row) => {
        const hours = toNumber(row.hours);
        const rate = toNumber(row.rate);
        return sum + hours * rate;
    }, 0);
};

/**
 * Generate HTML string for entire SOW document
 * TipTap can parse HTML directly, so we generate clean HTML instead of JSON nodes
 */
function generateSOWHTML(sowData: SOWData): string {
    const html: string[] = [];

    // Calculate financial totals
    const subtotal = sowData.scopes.reduce((sum, scope) => sum + calculateScopeTotal(scope), 0);
    const discountAmount = subtotal * ((sowData.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    // Document Title
    html.push(`<h1>${sowData.projectTitle}</h1>`);
    html.push(`<p><strong>Client:</strong> ${sowData.clientName}</p>`);
    html.push(`<hr />`);

    // Each Scope
    sowData.scopes.forEach((scope, scopeIndex) => {
        // Scope heading
        html.push(`<h2>Scope ${scopeIndex + 1}: ${scope.title}</h2>`);
        html.push(`<p><em>${scope.description}</em></p>`);

        // Deliverables
        if (scope.deliverables && scope.deliverables.length > 0) {
            html.push(`<h3>Deliverables</h3>`);
            html.push(`<ul>`);
            scope.deliverables.forEach(item => {
                html.push(`<li>${item}</li>`);
            });
            html.push(`</ul>`);
        }

        // Pricing Table
        html.push(`<h3>Pricing</h3>`);

        if (scope.roles && scope.roles.length > 0) {
            html.push(`<table>`);

            // Table header
            html.push(`<thead>`);
            html.push(`<tr>`);
            html.push(`<th>TASK/DESCRIPTION</th>`);
            html.push(`<th>ROLE</th>`);
            html.push(`<th>HOURS</th>`);
            html.push(`<th>RATE</th>`);
            html.push(`<th>TOTAL COST + GST</th>`);
            html.push(`</tr>`);
            html.push(`</thead>`);

            // Table body
            html.push(`<tbody>`);
            scope.roles.forEach(row => {
                const hours = toNumber(row.hours);
                const rate = toNumber(row.rate);
                const cost = hours * rate * 1.1; // Include GST

                html.push(`<tr>`);
                html.push(`<td>${row.task}</td>`);
                html.push(`<td>${row.role}</td>`);
                html.push(`<td>${hours}</td>`);
                html.push(`<td>AUD $${formatAUD(rate)}</td>`);
                html.push(`<td>AUD $${formatAUD(cost)}</td>`);
                html.push(`</tr>`);
            });
            html.push(`</tbody>`);
            html.push(`</table>`);

            // Scope total
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            html.push(`<p><strong>Scope Total:</strong> AUD $${formatAUD(scopeTotalWithGST)} (inc. GST)</p>`);
        }

        // Assumptions
        if (scope.assumptions && scope.assumptions.length > 0) {
            html.push(`<h3>Assumptions</h3>`);
            html.push(`<ul>`);
            scope.assumptions.forEach(item => {
                html.push(`<li>${item}</li>`);
            });
            html.push(`</ul>`);
        }

        // Separator between scopes
        if (scopeIndex < sowData.scopes.length - 1) {
            html.push(`<hr />`);
        }
    });

    // Financial Summary
    html.push(`<hr />`);
    html.push(`<h2>Financial Summary</h2>`);
    html.push(`<p>Subtotal: AUD $${formatAUD(subtotal)}</p>`);

    if (sowData.discount && sowData.discount > 0) {
        html.push(`<p>Discount (${sowData.discount}%): AUD -$${formatAUD(discountAmount)}</p>`);
        html.push(`<p>After Discount: AUD $${formatAUD(afterDiscount)}</p>`);
    }

    html.push(`<p>GST (10%): AUD +$${formatAUD(gst)}</p>`);
    html.push(`<p><strong>Grand Total:</strong> AUD $${formatAUD(total)}</p>`);

    // Project Overview
    if (sowData.projectOverview) {
        html.push(`<hr />`);
        html.push(`<h2>Project Overview</h2>`);
        html.push(`<p>${sowData.projectOverview}</p>`);
    }

    // Budget Notes
    if (sowData.budgetNotes) {
        html.push(`<h2>Budget Notes</h2>`);
        html.push(`<p>${sowData.budgetNotes}</p>`);
    }

    return html.join('');
}

/**
 * Inserts SOW data into editor using HTML (Plan B - Revised)
 * 
 * This approach generates a clean HTML string and lets TipTap's native
 * HTML parser convert it into proper nodes automatically, avoiding
 * the fragile JSON node construction approach.
 * 
 * TipTap supports HTML insertion natively via insertContent(), which is
 * simpler and more reliable than markdown parsing.
 */
export function insertSOWToEditor(editor: Editor, sowData: SOWData) {
    if (!editor) {
        console.error('Editor not available');
        return;
    }

    try {
        // Generate the complete HTML document
        const htmlContent = generateSOWHTML(sowData);

        console.log('Generated HTML for insertion');

        // Insert the HTML at the end of the document
        // TipTap will automatically parse and convert it to nodes
        editor.chain()
            .focus('end')
            .insertContent(htmlContent)
            .run();

        // Scroll to the newly inserted content
        editor.commands.focus('end');

        console.log('✅ SOW content inserted successfully via HTML');
    } catch (error) {
        console.error('❌ Failed to insert SOW content:', error);
        throw error;
    }
}
