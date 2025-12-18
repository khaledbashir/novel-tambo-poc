'use client';

import React from 'react';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';

import { SOWPricingTableBase } from '@/components/pricing/sow-pricing-table';

type PricingTableAttrs = {
    rows: Array<{ id: string; role: string; description: string; hours: number; rate: number }>;
    discount: number;
    budgetTarget: number | null;
    budgetNotes: string;
    deliverables: string[];
    scopeOverview: string;
    assumptions: string[];
};

const PricingTableNodeView = (props: NodeViewProps) => {
    const attrs = props.node.attrs as PricingTableAttrs;
    const rows = Array.isArray(attrs.rows) ? attrs.rows : [];
    const discount = Number(attrs.discount) || 0;

    const currentSnapshot = React.useMemo(
        () =>
            JSON.stringify({
                rows,
                discount,
                budgetTarget: attrs.budgetTarget ?? null,
                budgetNotes: attrs.budgetNotes ?? '',
                deliverables: Array.isArray(attrs.deliverables) ? attrs.deliverables : [],
                scopeOverview: attrs.scopeOverview ?? '',
                assumptions: Array.isArray(attrs.assumptions) ? attrs.assumptions : [],
            }),
        [
            rows,
            discount,
            attrs.budgetTarget,
            attrs.budgetNotes,
            attrs.deliverables,
            attrs.scopeOverview,
            attrs.assumptions,
        ],
    );

    const lastAppliedSnapshotRef = React.useRef<string>(currentSnapshot);

    React.useEffect(() => {
        lastAppliedSnapshotRef.current = currentSnapshot;
    }, [currentSnapshot]);

    const handleDataChange = React.useCallback(
        (data: any) => {
            const nextAttrs: PricingTableAttrs = {
                rows: Array.isArray(data.rows) ? data.rows : [],
                discount: Number(data.discount) || 0,
                budgetTarget: data.budgetTarget ?? null,
                budgetNotes: data.budgetNotes ?? '',
                deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
                scopeOverview: data.scopeOverview ?? '',
                assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
            };

            const nextSnapshot = JSON.stringify(nextAttrs);
            if (nextSnapshot === lastAppliedSnapshotRef.current) return;

            lastAppliedSnapshotRef.current = nextSnapshot;
            props.updateAttributes(nextAttrs);
        },
        [props],
    );

    return (
        <NodeViewWrapper className="not-prose my-4 w-full">
            <SOWPricingTableBase
                rows={rows}
                discount={discount}
                budgetTarget={attrs.budgetTarget ?? undefined}
                budgetNotes={attrs.budgetNotes ?? ''}
                deliverables={Array.isArray(attrs.deliverables) ? attrs.deliverables : []}
                scopeOverview={attrs.scopeOverview ?? ''}
                assumptions={Array.isArray(attrs.assumptions) ? attrs.assumptions : []}
                isInEditor={true}
                onDataChange={handleDataChange}
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
