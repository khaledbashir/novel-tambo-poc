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

    const toNumber = (v: unknown) => {
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string") {
            const cleaned = v.replace(/[^0-9.\-]/g, "");
            const n = parseFloat(cleaned);
            return Number.isFinite(n) ? n : 0;
        }
        return 0;
    };

    // Calculate totals
    const calculateScopeTotal = (scope: typeof sowData.scopes[0]) => {
        if (!scope.roles || scope.roles.length === 0) return 0;
        return scope.roles.reduce((sum, row) => {
            const hours = toNumber(row.hours);
            const rate = toNumber(row.rate);
            return sum + hours * rate;
        }, 0);
    };

    const subtotal = sowData.scopes.reduce((sum, scope) => sum + calculateScopeTotal(scope), 0);
    const discountAmount = subtotal * ((sowData.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    const formatAUD = (n: number) =>
        new Intl.NumberFormat("en-AU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);

    // Start building content using TipTap commands
    // We use a single chain to ensure atomicity and prevent race conditions

    // CRITICAL FIX: Ensure we are not inside a table by inserting a paragraph at the very end of the document
    // editor.state.doc.content.size gives the position at the end of the document
    const endPos = editor.state.doc.content.size;
    editor.chain().insertContentAt(endPos, { type: 'paragraph' }).run();

    // Now focus the end, which should be the new paragraph we just added
    editor.commands.focus('end');

    // Start a new chain for the rest of the content
    const chain = editor.chain().focus('end');

    // Title
    chain.insertContent({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: sowData.projectTitle }] });
    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Client: ' }, { type: 'text', text: sowData.clientName }] });

    // Each Scope
    sowData.scopes.forEach((scope, scopeIndex) => {
        // Scope heading
        chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Scope ' + (scopeIndex + 1) + ': ' + scope.title }] });
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
            // Create table
            const tableRows = [
                // Header row
                {
                    type: 'tableRow',
                    content: [
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TASK/DESCRIPTION' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ROLE' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'HOURS' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'RATE' }] }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TOTAL COST + GST' }] }] }
                    ]
                },
                // Data rows
                ...scope.roles.map(row => {
                    const hours = toNumber(row.hours);
                    const rate = toNumber(row.rate);
                    const cost = hours * rate * 1.1;
                    return {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: row.task }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: row.role }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: String(hours) }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: `AUD $${formatAUD(rate)} ` }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: `AUD $${formatAUD(cost)} ` }] }] }
                        ]
                    };
                })
            ];

            chain.insertContent({ type: 'table', content: tableRows });
            chain.insertContent({ type: 'paragraph' }); // Empty paragraph after table

            // Scope total
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            chain.insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Scope Total: ' }, { type: 'text', text: `AUD $${formatAUD(scopeTotalWithGST)} (inc. GST)` }] });
        }

        // Assumptions
        if (scope.assumptions && scope.assumptions.length > 0) {
            chain.insertContent({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Assumptions' }] });

            const assumptionItems = scope.assumptions.map(item => ({
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
            }));
            chain.insertContent({ type: 'bulletList', content: assumptionItems });
        }

        if (scopeIndex < sowData.scopes.length - 1) {
            chain.insertContent({ type: 'horizontalRule' });
            chain.insertContent({ type: 'paragraph' }); // Empty paragraph after separator
        }
    });

    // Financial Summary
    chain.insertContent({ type: 'horizontalRule' });
    chain.insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Financial Summary' }] });
    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `Subtotal: AUD $${formatAUD(subtotal)}` }] });

    if (sowData.discount && sowData.discount > 0) {
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `Discount (${sowData.discount}%): AUD -$${formatAUD(discountAmount)}` }] });
        chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `After Discount: AUD $${formatAUD(afterDiscount)}` }] });
    }

    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', text: `GST (10%): AUD +$${formatAUD(gst)}` }] });
    chain.insertContent({ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Grand Total: ' }, { type: 'text', text: `AUD $${formatAUD(total)}` }] });

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
    console.log('Executing chain.run()...');
    const result = chain.run();
    console.log('Chain execution result:', result);

    // Scroll to bottom
    editor.commands.focus('end');
}
