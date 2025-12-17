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

        // Clear selection to avoid nesting issues (optional but safer)
        // editor.commands.focus('end'); 

        // 1. Header
        editor.chain().focus().insertContent(`<h1>${sowData.projectTitle}</h1>`).run();
        editor.chain().focus().insertContent(`<p><strong>Prepared For:</strong> ${sowData.clientName}</p>`).run();
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

            editor.chain().focus().insertContent({
                type: 'pricingTable',
                attrs: {
                    rows: pricingRows,
                    discount: sowData.discount || 0,
                    // We don't need budget notes/assumptions inside the table for hybrid mode
                    // unless we want them there. User prefers text blocks.
                    budgetNotes: '',
                    deliverables: [],
                    scopeOverview: '',
                    assumptions: []
                }
            }).run();

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
