'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';

// Simplified inline render - not using external component
const PricingTableNodeView = (props: NodeViewProps) => {
    const { rows, discount } = props.node.attrs;
    const rowsArray = Array.isArray(rows) ? rows : [];

    // Calculate totals
    const subtotal = rowsArray.reduce((sum, row: any) => sum + ((row.hours || 0) * (row.rate || 0)), 0);
    const discountAmount = subtotal * ((discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    return (
        <NodeViewWrapper className="not-prose my-4 w-full">
            <div className="w-full overflow-hidden rounded-lg border-2 border-sg-green/30 bg-sg-green/5">
                <div className="flex items-center justify-between bg-sg-green/10 px-4 py-3 border-b border-border">
                    <div className="text-sm font-semibold text-foreground">
                        Pricing Table
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {rowsArray.length} role{rowsArray.length !== 1 ? "s" : ""}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-muted border-b">
                                <th className="px-3 py-2 text-left font-semibold">Role</th>
                                <th className="px-3 py-2 text-left font-semibold">Description</th>
                                <th className="px-3 py-2 text-center font-semibold">Hours</th>
                                <th className="px-3 py-2 text-center font-semibold">Rate</th>
                                <th className="px-3 py-2 text-right font-semibold">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsArray.map((row: any, idx: number) => (
                                <tr key={row.id || idx} className="border-b last:border-0">
                                    <td className="px-3 py-2 text-foreground font-medium max-w-[240px] truncate">
                                        {row.role || "-"}
                                    </td>
                                    <td className="px-3 py-2 text-muted-foreground max-w-[360px] truncate">
                                        {row.description || "-"}
                                    </td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">
                                        {row.hours ?? 0}
                                    </td>
                                    <td className="px-3 py-2 text-center text-muted-foreground">
                                        ${(row.rate || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-foreground">
                                        ${((row.hours || 0) * (row.rate || 0)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-muted/50">
                            {discount > 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">
                                        Discount ({discount}%):
                                    </td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">
                                        -${discountAmount.toFixed(2)}
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t">
                                <td colSpan={4} className="px-3 py-2 text-right font-semibold">Subtotal:</td>
                                <td className="px-3 py-2 text-right font-semibold">${afterDiscount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-3 py-2 text-right text-muted-foreground">GST (10%):</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">+${gst.toFixed(2)}</td>
                            </tr>
                            <tr className="border-t-2 border-border">
                                <td colSpan={4} className="px-3 py-2 text-right font-bold">Total (AUD):</td>
                                <td className="px-3 py-2 text-right font-bold text-sg-green">${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
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
