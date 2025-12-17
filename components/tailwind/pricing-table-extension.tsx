import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import SOWPricingTable, { SOWPricingProps } from '@/components/pricing/sow-pricing-table';

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
            <SOWPricingTable
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
                tag: 'sow-pricing-table',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['sow-pricing-table', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PricingTableNodeView);
    },
});
