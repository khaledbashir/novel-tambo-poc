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
 * Inserts SOW data into editor as STANDARD HTML BLOCKS
 * This ensures the content is fully editable and not locked in a single component.
 */
export function insertSOWToEditor(editor: Editor, sowData: SOWData) {
    if (!editor) {
        console.error('Editor not available');
        return;
    }

    try {
        console.log('Inserting SOW Content as HTML Blocks');

        let html = '';

        // 1. Project Title & Client
        html += `<h1>${sowData.projectTitle}</h1>`;
        html += `<p><strong>Prepared For:</strong> ${sowData.clientName}</p>`;
        html += `<hr>`;

        // 2. Project Overview
        if (sowData.projectOverview) {
            html += `<h2>Project Overview</h2>`;
            html += `<p>${sowData.projectOverview}</p>`;
        }

        // 3. Scopes
        sowData.scopes.forEach((scope, index) => {
            html += `<h3>Scope ${index + 1}: ${scope.title}</h3>`;
            html += `<p><em>${scope.description}</em></p>`;

            // Deliverables
            if (scope.deliverables && scope.deliverables.length > 0) {
                html += `<h4>Deliverables</h4>`;
                html += `<ul>`;
                scope.deliverables.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += `</ul>`;
            }

            // Pricing Table
            html += `<h4>Investment</h4>`;
            html += `<table>`;
            html += `<thead><tr><th>Task</th><th>Role</th><th>Hours</th><th>Rate</th><th>Total + GST</th></tr></thead>`;
            html += `<tbody>`;

            let scopeTotal = 0;
            scope.roles.forEach(role => {
                const total = (role.hours || 0) * (role.rate || 0);
                const totalWithGst = total * 1.1; // +10% GST
                scopeTotal += totalWithGst;

                html += `<tr>`;
                html += `<td>${role.task}</td>`;
                html += `<td>${role.role}</td>`;
                html += `<td>${role.hours}</td>`;
                html += `<td>$${role.rate}</td>`;
                html += `<td>$${totalWithGst.toFixed(2)}</td>`;
                html += `</tr>`;
            });

            // Scope Total Row
            html += `<tr>`;
            html += `<td colspan="4" style="text-align: right;"><strong>Scope Total:</strong></td>`;
            html += `<td><strong>$${scopeTotal.toFixed(2)}</strong></td>`;
            html += `</tr>`;

            html += `</tbody>`;
            html += `</table>`;

            // Assumptions
            if (scope.assumptions && scope.assumptions.length > 0) {
                html += `<h4>Assumptions</h4>`;
                html += `<ul>`;
                scope.assumptions.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += `</ul>`;
            }

            html += `<br>`;
        });

        // 4. Budget Notes
        if (sowData.budgetNotes) {
            html += `<h2>Budget Notes</h2>`;
            html += `<p>${sowData.budgetNotes}</p>`;
        }

        // 5. Final Footer
        html += `<p style="text-align: center; color: #666; font-size: 0.8em;">*** This concludes the Scope of Work document. ***</p>`;

        // Insert the HTML content
        editor.chain()
            .focus('end')
            .insertContent(html)
            .run();

        // Scroll to the newly inserted content
        editor.commands.focus('end');

        console.log('✅ SOW HTML content inserted successfully');
    } catch (error) {
        console.error('❌ Failed to insert SOW content:', error);
        throw error;
    }
}
