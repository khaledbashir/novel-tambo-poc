import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { SOWPricingTableBase, SOWPricingProps } from '@/components/pricing/sow-pricing-table-simple';

const PricingTableNodeView = (props: NodeViewProps) => {
    // Extract attributes from the node
    const { rows, discount, budgetTarget, budgetNotes, deliverables, scopeOverview, assumptions } = props.node.attrs;

    // Handler to sync data changes back to the Tiptap node
    const handleDataChange = (data: SOWPricingProps) => {
        // Update the node attributes
        props.updateAttributes(data);
    };

    return (
        <NodeViewWrapper className="sow-pricing-wrapper my-4">
            <SOWPricingTableBase
                // Pass props individually or spread them
                rows={rows}
                discount={discount}
                budgetTarget={budgetTarget}
                budgetNotes={budgetNotes}
                deliverables={deliverables}
                scopeOverview={scopeOverview}
                assumptions={assumptions}
                // Important: handle data changes
                onDataChange={handleDataChange}
                // Flag to adjust UI for editor context (e.g. hide duplicated fields)
                isInEditor={true}
            />
        </NodeViewWrapper>
    );
};

export const PricingTableExtension = Node.create({
    name: 'pricingTable',

    group: 'block',

    atom: true,

    draggable: true,

    addAttributes() {
        return {
            rows: {
                default: [],
            },
            discount: {
                default: 0,
            },
            budgetTarget: {
                default: null,
            },
            budgetNotes: {
                default: '',
            },
            deliverables: {
                default: [],
            },
            scopeOverview: {
                default: '',
            },
            assumptions: {
                default: [],
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="pricing-table"]',
            },
            {
                tag: 'sow-pricing-table', // Keep for backward compatibility
            }
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const rows = node.attrs.rows || [];
        const discount = node.attrs.discount || 0;

        // Calculate totals for static render
        const subtotal = rows.reduce((sum: number, row: any) => sum + ((row.hours || 0) * (row.rate || 0)), 0);
        const discountAmount = subtotal * (discount / 100);
        const afterDiscount = subtotal - discountAmount;
        const gst = afterDiscount * 0.1;
        const total = afterDiscount + gst;

        // Create table header
        const thead = [
            'thead',
            ['tr', { style: 'background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;' },
                ['th', { style: 'padding: 12px; text-align: left; font-weight: 600;' }, 'Role'],
                ['th', { style: 'padding: 12px; text-align: left; font-weight: 600; min-width: 200px;' }, 'Description'],
                ['th', { style: 'padding: 12px; text-align: center; font-weight: 600;' }, 'Hours'],
                ['th', { style: 'padding: 12px; text-align: center; font-weight: 600;' }, 'Rate'],
                ['th', { style: 'padding: 12px; text-align: right; font-weight: 600;' }, 'Cost']
            ]
        ];

        // Create table body rows
        const bodyRows = rows.map((row: any) => [
            'tr', { style: 'border-bottom: 1px solid #e5e7eb;' },
            ['td', { style: 'padding: 12px;' }, row.role || '-'],
            ['td', { style: 'padding: 12px;' }, row.description || '-'],
            ['td', { style: 'padding: 12px; text-align: center;' }, String(row.hours || 0)],
            ['td', { style: 'padding: 12px; text-align: center;' }, `$${(row.rate || 0).toFixed(2)}`],
            ['td', { style: 'padding: 12px; text-align: right; font-weight: 500;' }, `$${((row.hours || 0) * (row.rate || 0)).toFixed(2)}`]
        ]);

        // Add summary rows to body (simpler than tfoot for some PDF renderers)
        const summaryRows: any[] = [
            // Subtotal
            ['tr',
                ['td', { colspan: '4', style: 'padding: 12px; text-align: right; font-weight: 600;' }, 'Subtotal:'],
                ['td', { style: 'padding: 12px; text-align: right; font-weight: 600;' }, `$${subtotal.toFixed(2)}`]
            ]
        ];

        if (discount > 0) {
            summaryRows.push([
                'tr',
                ['td', { colspan: '4', style: 'padding: 12px; text-align: right; color: #ef4444;' }, `Discount (${discount}%):`],
                ['td', { style: 'padding: 12px; text-align: right; color: #ef4444;' }, `-$${discountAmount.toFixed(2)}`]
            ]);
        }

        summaryRows.push(
            // GST
            ['tr',
                ['td', { colspan: '4', style: 'padding: 12px; text-align: right; font-weight: 600;' }, 'GST (10%):'],
                ['td', { style: 'padding: 12px; text-align: right; font-weight: 600;' }, `+$${gst.toFixed(2)}`]
            ],
            // Total
            ['tr', { style: 'background-color: #f3f4f6; border-top: 2px solid #e5e7eb;' },
                ['td', { colspan: '4', style: 'padding: 12px; text-align: right; font-weight: 700; font-size: 1.1em;' }, 'Total (AUD):'],
                ['td', { style: 'padding: 12px; text-align: right; font-weight: 700; font-size: 1.1em; color: #000;' }, `$${total.toFixed(2)}`]
            ]
        );

        const tbody = ['tbody', ...bodyRows, ...summaryRows];

        // Return standard HTML table structure
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'pricing-table',
                'class': 'sow-pricing-export'
            }),
            [
                'table',
                {
                    style: 'width: 100%; border-collapse: collapse; margin: 1.5em 0; border: 1px solid #e5e7eb; font-size: 0.9em;'
                },
                thead,
                tbody
            ]
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PricingTableNodeView);
    },
});
