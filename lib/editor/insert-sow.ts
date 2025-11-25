import { EditorInstance } from "novel";

/**
 * Converts SOW data to HTML and inserts into editor
 */
export function insertSOWToEditor(
    editor: EditorInstance,
    sowData: {
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
    },
) {
    if (!editor) {
        console.error("Editor not available");
        return;
    }

    // Calculate totals
    const calculateScopeTotal = (scope: (typeof sowData.scopes)[0]) => {
        if (!scope.roles || scope.roles.length === 0) return 0;
        return scope.roles.reduce((sum, row) => sum + row.hours * row.rate, 0);
    };

    const subtotal = sowData.scopes.reduce(
        (sum, scope) => sum + calculateScopeTotal(scope),
        0,
    );
    const discountAmount = subtotal * ((sowData.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    // Insert HTML content directly
    let htmlContent = "";

    // Header
    htmlContent += `<h1>${sowData.projectTitle}</h1>`;
    htmlContent += `<p><strong>Client:</strong> ${sowData.clientName}</p>`;
    htmlContent += `<hr>`;

    // Each Scope
    sowData.scopes.forEach((scope, scopeIndex) => {
        // Scope Header
        htmlContent += `<h2>Scope ${scopeIndex + 1}: ${scope.title}</h2>`;

        // Scope Description
        htmlContent += `<p><em>${scope.description}</em></p>`;

        // Deliverables - Moved to Top per Compliance
        if (scope.deliverables && scope.deliverables.length > 0) {
            htmlContent += `<h3>Deliverables</h3>`;
            htmlContent += `<ul>`;
            scope.deliverables.forEach((item) => {
                htmlContent += `<li>${item}</li>`;
            });
            htmlContent += `</ul>`;
        }

        // Pricing Table
        htmlContent += `<h3>Pricing</h3>`;
        htmlContent += `<table class="border-collapse border border-border"><thead><tr><th class="font-medium text-left border border-border bg-muted">Task/Description</th><th class="font-medium text-left border border-border bg-muted">Role</th><th class="font-medium text-center border border-border bg-muted">Hours</th><th class="font-medium text-right border border-border bg-muted">Rate ($/hr)</th><th class="font-medium text-right border border-border bg-muted">Total (incl. GST)</th></tr></thead><tbody>`;

        // Add table rows
        scope.roles.forEach((row) => {
            const rowCost = row.hours * row.rate;
            const rowGST = rowCost * 0.1;
            const rowTotal = rowCost + rowGST;

            htmlContent += `<tr><td class="border border-border">${row.task}</td><td class="border border-border">${row.role}</td><td class="border border-border text-center">${row.hours}</td><td class="border border-border text-right">$${row.rate.toFixed(2)}</td><td class="border border-border text-right">$${rowTotal.toFixed(2)}</td></tr>`;
        });

        htmlContent += `</tbody></table>`;

        // Scope Total
        const scopeTotal = calculateScopeTotal(scope);
        const scopeGST = scopeTotal * 0.1;
        const scopeTotalWithGST = scopeTotal + scopeGST;

        htmlContent += `<p><strong>Scope Total: $${scopeTotalWithGST.toFixed(
            2,
        )} AUD (inc. GST)</strong></p>`;

        // Assumptions
        if (scope.assumptions && scope.assumptions.length > 0) {
            htmlContent += `<h3>Assumptions</h3>`;
            htmlContent += `<ul>`;
            scope.assumptions.forEach((item) => {
                htmlContent += `<li>${item}</li>`;
            });
            htmlContent += `</ul>`;
        }

        htmlContent += `<hr>`;
    });

    // Grand Total Summary
    htmlContent += `<h2>Financial Summary</h2>`;
    htmlContent += `<table class="border-collapse border border-border"><thead><tr><th class="font-medium text-left border border-border bg-muted">Item</th><th class="font-medium text-right border border-border bg-muted">Amount (AUD)</th></tr></thead><tbody>`;
    htmlContent += `<tr><td class="border border-border">Subtotal</td><td class="border border-border text-right">$${subtotal.toFixed(2)}</td></tr>`;

    if (sowData.discount && sowData.discount > 0) {
        htmlContent += `<tr><td class="border border-border">Discount (${sowData.discount}%)</td><td class="border border-border text-right">-$${discountAmount.toFixed(2)}</td></tr>`;
        htmlContent += `<tr><td class="border border-border">After Discount</td><td class="border border-border text-right">$${afterDiscount.toFixed(2)}</td></tr>`;
    }

    htmlContent += `<tr><td class="border border-border">GST (10%)</td><td class="border border-border text-right">+$${gst.toFixed(2)}</td></tr>`;
    htmlContent += `<tr><td class="border border-border font-bold">Grand Total</td><td class="border border-border text-right font-bold">$${total.toFixed(2)}</td></tr>`;
    htmlContent += `</tbody></table>`;

    // Project Overview
    if (sowData.projectOverview) {
        htmlContent += `<h2>Project Overview</h2>`;
        htmlContent += `<p>${sowData.projectOverview}</p>`;
    }

    // Budget Notes
    if (sowData.budgetNotes) {
        htmlContent += `<h2>Budget Notes</h2>`;
        htmlContent += `<p>${sowData.budgetNotes}</p>`;
    }

    // Closing Statement
    htmlContent += `<p style="text-align: center; color: #6b7280; font-style: italic; margin-top: 2rem;">*** This concludes the Scope of Work document. ***</p>`;

    // Insert HTML content into editor
    editor.commands.setContent(htmlContent);

    // Scroll to bottom
    editor.commands.focus("end");
}
