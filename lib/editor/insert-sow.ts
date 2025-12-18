import { Editor } from '@tiptap/react';
import { sanitizeClientName } from '@/lib/sow-validation';

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
 * Inserts SOW data using a HYBRID approach:
 * 1. Standard HTML blocks for text (Overview, Deliverables, etc.) - Fully editable.
 * 2. Interactive 'pricingTable' node for the pricing section - Calculates totals, allows drag-drop.
 */
export function insertSOWToEditor(editor: Editor, sowData: SOWData) {
    if (!editor) {
        console.error('Editor not available');
        return;
    }

    try {
        console.log('Inserting SOW Content (Hybrid Mode)');

        // Sanitize client name (auto-replace "Acme" etc with "Client")
        const clientName = sanitizeClientName(sowData.clientName);

        // 1. Header
        editor.chain().focus().insertContent(`<h1>${sowData.projectTitle}</h1>`).run();
        editor.chain().focus().insertContent(`<p><strong>Prepared For:</strong> ${clientName}</p>`).run();
        editor.chain().focus().insertContent(`<hr>`).run();

        // 2. Project Overview
        if (sowData.projectOverview) {
            editor.chain().focus().insertContent(`<h2>Project Overview</h2>`).run();
            // Use split to handle paragraphs if they contain double newlines
            const overviewParagraphs = sowData.projectOverview.split('\n\n');
            overviewParagraphs.forEach(p => {
                if (p.trim()) editor.chain().focus().insertContent(`<p>${p}</p>`).run();
            });
        }

        // 3. Scopes
        sowData.scopes.forEach((scope, index) => {
            // Scope Title
            editor.chain().focus().insertContent(`<h3>Scope ${index + 1}: ${scope.title}</h3>`).run();
            editor.chain().focus().insertContent(`<p><em>${scope.description}</em></p>`).run();

            // Deliverables (Standard HTML List)
            if (scope.deliverables && scope.deliverables.length > 0) {
                editor.chain().focus().insertContent(`<h4>Deliverables</h4>`).run();
                let listHtml = '<ul>';
                scope.deliverables.forEach(item => {
                    listHtml += `<li>${item.replace(/^[\+\-\*]\s*/, '')}</li>`; // Remove existing bullets if any
                });
                listHtml += '</ul>';
                editor.chain().focus().insertContent(listHtml).run();
            }

            // Investment (Interactive Node)
            editor.chain().focus().insertContent(`<h4>Investment</h4>`).run();

            // map scope.roles to pricing rows
            const pricingRows = scope.roles.map((role, idx) => ({
                id: role.id || `role-${Date.now()}-${idx}`,
                role: role.role,
                description: role.task,
                hours: role.hours,
                rate: role.rate
            }));

            // Calculate totals for static fallback
            const subtotal = pricingRows.reduce((sum, row) => sum + (row.hours * row.rate), 0);
            const discountPct = sowData.discount || 0;
            const discountAmount = subtotal * (discountPct / 100);
            const afterDiscount = subtotal - discountAmount;
            const gst = afterDiscount * 0.1;
            const total = afterDiscount + gst;

            // Use static HTML table (React NodeView has Portal integration issues with Novel)
            // TODO: Investigate Novel/Tiptap React Portal issue in future
            let tableHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 1em 0; border: 1px solid #e5e7eb;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Role</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; min-width: 200px;">Description</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">Hours</th>
                            <th style="padding: 12px; text-align: center; font-weight: 600;">Rate/Hr</th>
                            <th style="padding: 12px; text-align: right; font-weight: 600;">Cost (AUD)</th>
                        </tr>
                    </thead>
                    <tbody>`;

            pricingRows.forEach(row => {
                const cost = row.hours * row.rate;
                tableHtml += `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 12px;">${row.role || '-'}</td>
                            <td style="padding: 12px;">${row.description || '-'}</td>
                            <td style="padding: 12px; text-align: center;">${row.hours}</td>
                            <td style="padding: 12px; text-align: center;">$${row.rate.toFixed(2)}</td>
                            <td style="padding: 12px; text-align: right; font-weight: 500;">$${cost.toLocaleString('en-AU', { minimumFractionDigits: 2 })} +GST</td>
                        </tr>`;
            });

            // Summary rows
            tableHtml += `
                        <tr>
                            <td colspan="4" style="padding: 12px; text-align: right; font-weight: 600;">Subtotal (ex. GST):</td>
                            <td style="padding: 12px; text-align: right; font-weight: 600;">$${subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })} +GST</td>
                        </tr>`;

            if (discountPct > 0) {
                tableHtml += `
                        <tr style="color: #dc2626;">
                            <td colspan="4" style="padding: 12px; text-align: right;">Discount (${discountPct}%):</td>
                            <td style="padding: 12px; text-align: right;">-$${discountAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                        </tr>`;
            }

            tableHtml += `
                        <tr>
                            <td colspan="4" style="padding: 12px; text-align: right; font-weight: 600;">GST (10%):</td>
                            <td style="padding: 12px; text-align: right; font-weight: 600;">+$${gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr style="background-color: #f3f4f6; border-top: 2px solid #e5e7eb;">
                            <td colspan="4" style="padding: 12px; text-align: right; font-weight: 700; font-size: 1.1em;">Total (AUD inc. GST):</td>
                            <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 1.1em; color: #059669;">$${total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
            `;

            editor.chain().focus().insertContent(tableHtml).run();

            // Assumptions (Standard HTML List)
            if (scope.assumptions && scope.assumptions.length > 0) {
                editor.chain().focus().insertContent(`<h4>Assumptions</h4>`).run();
                let asmHtml = '<ul>';
                scope.assumptions.forEach(item => {
                    asmHtml += `<li>${item.replace(/^[\+\-\*]\s*/, '')}</li>`;
                });
                asmHtml += '</ul>';
                editor.chain().focus().insertContent(asmHtml).run();
            }

            editor.chain().focus().insertContent(`<br>`).run();
        });

        // 4. Budget Notes (Outside table)
        if (sowData.budgetNotes) {
            editor.chain().focus().insertContent(`<h2>Budget Notes</h2>`).run();
            editor.chain().focus().insertContent(`<p>${sowData.budgetNotes}</p>`).run();
        }

        // 5. Final Footer
        editor.chain().focus().insertContent(`<p style="text-align: center; color: #666; font-size: 0.8em;">*** This concludes the Scope of Work document. ***</p>`).run();

        // Scroll to end
        editor.commands.focus('end');

        console.log('✅ SOW Hybrid content inserted successfully');
    } catch (error) {
        console.error('❌ Failed to insert SOW content:', error);
        throw error;
    }
}
