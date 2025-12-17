import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { FullSOWDocument } from '@/components/sow/full-sow-document';
import { FullSOWProps } from '@/components/sow/full-sow-document';

const SOWNodeView = (props: NodeViewProps) => {
    // Extract attributes from the node
    const { clientName, projectTitle, scopes, projectOverview, budgetNotes, discount } = props.node.attrs;

    // Handler to sync data changes back to the Tiptap node
    const handleDataChange = (data: FullSOWProps) => {
        // Remove the onDataChange function itself from the attributes we save
        const { onDataChange, ...attributesToUpdate } = data;

        // Update the node attributes
        // Tiptap merges these with existing attributes
        props.updateAttributes(attributesToUpdate);
    };

    return (
        <NodeViewWrapper className="sow-component-wrapper my-4 border rounded-md overflow-hidden bg-card text-card-foreground shadow-sm">
            <FullSOWDocument
                clientName={clientName}
                projectTitle={projectTitle}
                scopes={scopes}
                projectOverview={projectOverview}
                budgetNotes={budgetNotes}
                discount={discount}
                onDataChange={handleDataChange}
            />
        </NodeViewWrapper>
    );
};

export const SOWExtension = Node.create({
    name: 'fullSOWDocument',

    group: 'block',

    atom: true,

    draggable: true,

    addAttributes() {
        return {
            clientName: {
                default: 'Client Name',
            },
            projectTitle: {
                default: 'Statement of Work',
            },
            scopes: {
                default: [],
            },
            projectOverview: {
                default: '',
            },
            budgetNotes: {
                default: '',
            },
            discount: {
                default: 0,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'full-sow-document',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['full-sow-document', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(SOWNodeView);
    },
});
