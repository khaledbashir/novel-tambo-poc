'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';

// Simplified inline render - not using external component
const PricingTableNodeView = (props: NodeViewProps) => {
    const { rows, discount } = props.node.attrs;
    const rowsArray = Array.isArray(rows) ? rows : [];

    console.log('[PricingTableNodeView] Rendering inline:', { rowCount: rowsArray.length });

    // Calculate totals
    const subtotal = rowsArray.reduce((sum, row: any) => sum + ((row.hours || 0) * (row.rate || 0)), 0);
    const discountAmount = subtotal * ((discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    return (
        <NodeViewWrapper className="react-component not-prose my-4">
            <div
                style={{
                    border: '2px solid #20e28f',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f0fdf4',
                }}
            >
                <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>
                    💰 Interactive Pricing Table ({rowsArray.length} roles)
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#dcfce7', borderBottom: '2px solid #22c55e' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Hours</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Rate</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowsArray.map((row: any, idx: number) => (
                            <tr key={row.id || idx} style={{ borderBottom: '1px solid #bbf7d0' }}>
                                <td style={{ padding: '8px' }}>{row.role || '-'}</td>
                                <td style={{ padding: '8px' }}>{row.description || '-'}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{row.hours}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>${(row.rate || 0).toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 500 }}>
                                    ${((row.hours || 0) * (row.rate || 0)).toFixed(2)} +GST
                                </td>
                            </tr>
                        ))}
                        <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <td colSpan={4} style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>Subtotal:</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>${subtotal.toFixed(2)} +GST</td>
                        </tr>
                        <tr>
                            <td colSpan={4} style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>GST (10%):</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>+${gst.toFixed(2)}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#22c55e', color: 'white' }}>
                            <td colSpan={4} style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '1.1em' }}>Total (AUD inc. GST):</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '1.1em' }}>${total.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
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

    // Simplified renderHTML - ReactNodeViewRenderer takes over for live editing
    // This is only used for serialization/export
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'pricing-table' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PricingTableNodeView);
    },
});
