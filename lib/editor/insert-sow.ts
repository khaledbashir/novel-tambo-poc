import { Editor } from '@tiptap/react';

/**
 * Inserts SOW data into editor using TipTap commands to create real table nodes
 */
export function insertSOWToEditor(editor: Editor, sowData: {
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
}) {
    if (!editor) {
        console.error('Editor not available');
        return;
    }

    // Calculate totals
    const calculateScopeTotal = (scope: typeof sowData.scopes[0]) => {
        if (!scope.roles || scope.roles.length === 0) return 0;
        return scope.roles.reduce((sum, row) => sum + (row.hours * row.rate), 0);
    };

    const subtotal = sowData.scopes.reduce((sum, scope) => sum + calculateScopeTotal(scope), 0);
    const discountAmount = subtotal * ((sowData.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    // Start building content using TipTap commands
    // We use a single chain to ensure atomicity and prevent race conditions

    // CRITICAL FIX: Ensure we are not inside a table by inserting a paragraph at the very end of the document
    // editor.state.doc.content.size gives the position at the end of the document
    const endPos = editor.state.doc.content.size;
    editor.chain().insertContentAt(endPos, { type: 'paragraph' }).run();

    // Now focus the end, which should be the new paragraph we just added
    const chain = editor.chain().focus('end');

    // Add a spacer paragraph to ensure separation from previous content
    chain.insertContent({ type: 'horizontalRule' });
    chain.insertContent({ type: 'paragraph' });

    // Title
    chain.insertContent({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: sowData.projectTitle }] });
    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Client: ' }, { type: 'text', text: sowData.clientName }] });
    chain.insertContent({ type: 'horizontalRule' });

    // Each Scope
    sowData.scopes.forEach((scope, scopeIndex) => {
        // Scope heading
        chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Scope ${scopeIndex + 1}: ${scope.title}` }] });
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: scope.description }] });

        // Deliverables
        if (scope.deliverables && scope.deliverables.length > 0) {
            chain.insertContent({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Deliverables' }] });

            // Create bullet list
            const listItems = scope.deliverables.map(item => ({
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
            }));
            chain.insertContent({ type: 'bulletList', content: listItems });
        }

        // Pricing Table
        chain.insertContent({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Pricing' }] });

        if (scope.roles && scope.roles.length > 0) {
            // Build complete scope content array: table + everything after it
            const scopeContent = [];

            // Create table
            const tableRows = [
                // Header row - MUST match chat preview exactly
                {
                    type: 'tableRow',
                    content: [
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TASK/DESCRIPTION' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ROLE' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'HOURS' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'RATE' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TOTAL COST + GST' }] }] },
                    ]
                },
                // Data rows
                ...scope.roles.map(row => {
                    const cost = (row.hours * row.rate * 1.1).toFixed(2);
                    return {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: row.task }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: row.role }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: String(row.hours) }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: `$${row.rate.toFixed(2)}` }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: `$${cost}` }] }] },
                        ]
                    };
                })
            ];

            const tableNode = {
                type: 'table',
                content: tableRows
            };

            // Add table to scope content
            scopeContent.push(tableNode);

            // Add paragraph after table to ensure cursor is out
            scopeContent.push({ type: 'paragraph' });

            // Add scope total
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            scopeContent.push({
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Scope Total: ' },
                    { type: 'text', text: `$${scopeTotalWithGST.toFixed(2)} AUD (inc. GST)` }
                ]
            });

            // Add assumptions if present
            if (scope.assumptions && scope.assumptions.length > 0) {
                scopeContent.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Assumptions' }] });

                const assumptionItems = scope.assumptions.map(item => ({
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
                }));
                scopeContent.push({ type: 'bulletList', content: assumptionItems });
            }

            // Insert all scope content as array
            chain.insertContent(scopeContent);
        } else {
            // No table, just add scope total
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            chain.insertContent({
                type: 'paragraph',
                content: [
                    { type: 'text', marks: [{ type: 'bold' }], text: 'Scope Total: ' },
                    { type: 'text', text: `$${scopeTotalWithGST.toFixed(2)} AUD (inc. GST)` }
                ]
            });

            if (scope.assumptions && scope.assumptions.length > 0) {
                chain.insertContent({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Assumptions' }] });

                const assumptionItems = scope.assumptions.map(item => ({
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
                }));
                chain.insertContent({ type: 'bulletList', content: assumptionItems });
            }
        }

        if (scopeIndex < sowData.scopes.length - 1) {
            chain.insertContent({ type: 'horizontalRule' });
            chain.insertContent({ type: 'paragraph' });
        }
    });

    // Financial Summary
    chain.insertContent({ type: 'horizontalRule' });
    chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Financial Summary' }] });
    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `Subtotal: $${subtotal.toFixed(2)} AUD` }] });

    if (sowData.discount && sowData.discount > 0) {
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `Discount (${sowData.discount}%): -$${discountAmount.toFixed(2)} AUD` }] });
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `After Discount: $${afterDiscount.toFixed(2)} AUD` }] });
    }

    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `GST (10%): +$${gst.toFixed(2)} AUD` }] });
    chain.insertContent({
        type: 'paragraph',
        content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Grand Total: ' },
            { type: 'text', text: `$${total.toFixed(2)} AUD` }
        ]
    });

    // Project Overview
    if (sowData.projectOverview) {
        chain.insertContent({ type: 'horizontalRule' });
        chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Project Overview' }] });
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: sowData.projectOverview }] });
    }

    // Budget Notes
    if (sowData.budgetNotes) {
        chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Budget Notes' }] });
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: sowData.budgetNotes }] });
    }

    // Execute all commands
    chain.run();

    // Scroll to bottom
    editor.commands.focus('end');
}
