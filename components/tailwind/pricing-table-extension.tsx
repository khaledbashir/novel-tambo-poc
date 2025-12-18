import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { SOWPricingTableBase, SOWPricingProps } from '@/components/pricing/sow-pricing-table-simple';
import React from 'react';

const PricingTableNodeView = (props: NodeViewProps) => {
    // Extract attributes from the node
    const { rows, discount, budgetTarget, budgetNotes, deliverables, scopeOverview, assumptions } = props.node.attrs;

    // Ensure rows is always an array
    const rowsArray = Array.isArray(rows) ? rows : [];

    // Debug logging - expanded
    console.log('[PricingTableNodeView] Rendering:', {
        rowCount: rowsArray.length,
        discount,
        rowsType: typeof rows,
        isArray: Array.isArray(rows),
        firstRow: rowsArray[0],
    });

    // Handler to sync data changes back to the Tiptap node
    const handleDataChange = (data: SOWPricingProps) => {
        props.updateAttributes(data);
    };

    return (
        <NodeViewWrapper
            as="section"
            className="sow-pricing-wrapper not-prose my-4"
            contentEditable={false}
            data-pricing-table="true"
            data-row-count={rowsArray.length}
            style={{
                display: 'block',
                minHeight: '200px',
                border: '3px solid #20e28f',
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(32, 226, 143, 0.1)',
                position: 'relative',
            }}
        >
            <div style={{ padding: '8px', background: '#ecfdf5', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>🔧 DEBUG: Pricing Table Node</strong>
                <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                    Rows: {rowsArray.length} | Node Type: {props.node.type.name}
                </span>
            </div>
            {rowsArray.length === 0 ? (
                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '4px' }}>
                    <p style={{ fontWeight: 'bold', color: '#92400e' }}>⚠️ Pricing Table - No Rows Data</p>
                    <p style={{ fontSize: '12px', color: '#78350f' }}>Raw rows value: {JSON.stringify(rows)}</p>
                </div>
            ) : (
                <SOWPricingTableBase
                    rows={rowsArray}
                    discount={discount || 0}
                    budgetTarget={budgetTarget}
                    budgetNotes={budgetNotes || ''}
                    deliverables={Array.isArray(deliverables) ? deliverables : []}
                    scopeOverview={scopeOverview || ''}
                    assumptions={Array.isArray(assumptions) ? assumptions : []}
                    onDataChange={handleDataChange}
                    isInEditor={true}
                />
            )}
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
                // Parse JSON string when loading from HTML
                parseHTML: element => {
                    const data = element.getAttribute('data-rows');
                    if (data) {
                        try {
                            return JSON.parse(data);
                        } catch (e) {
                            console.warn('[PricingTable] Failed to parse rows:', e);
                            return [];
                        }
                    }
                    return [];
                },
                // Render as JSON string in HTML
                renderHTML: attributes => {
                    if (!attributes.rows || !Array.isArray(attributes.rows)) {
                        return { 'data-rows': '[]' };
                    }
                    return { 'data-rows': JSON.stringify(attributes.rows) };
                },
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
                parseHTML: element => {
                    const data = element.getAttribute('data-deliverables');
                    if (data) {
                        try { return JSON.parse(data); } catch { return []; }
                    }
                    return [];
                },
                renderHTML: attributes => {
                    return { 'data-deliverables': JSON.stringify(attributes.deliverables || []) };
                },
            },
            scopeOverview: {
                default: '',
            },
            assumptions: {
                default: [],
                parseHTML: element => {
                    const data = element.getAttribute('data-assumptions');
                    if (data) {
                        try { return JSON.parse(data); } catch { return []; }
                    }
                    return [];
                },
                renderHTML: attributes => {
                    return { 'data-assumptions': JSON.stringify(attributes.assumptions || []) };
                },
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
