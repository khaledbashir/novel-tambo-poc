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
 * Inserts SOW data into editor using the custom interactive Node View
 * This ensures the table remains interactive (calculations, drag-drop).
 */
export function insertSOWToEditor(editor: Editor, sowData: SOWData) {
    if (!editor) {
        console.error('Editor not available');
        return;
    }

    try {
        console.log('Inserting SOW Content using custom interactive node');

        editor.chain()
            .focus('end')
            .insertContent({
                type: 'fullSOWDocument',
                attrs: {
                    clientName: sowData.clientName,
                    projectTitle: sowData.projectTitle,
                    scopes: sowData.scopes || [],
                    projectOverview: sowData.projectOverview || '',
                    objectives: [], // Default empty array as it's not always in SOWData but required by schema
                    budgetNotes: sowData.budgetNotes || '',
                    discount: sowData.discount || 0,
                }
            })
            .run();

        // Scroll to the newly inserted content
        editor.commands.focus('end');

        console.log('✅ SOW custom component inserted successfully');
    } catch (error) {
        console.error('❌ Failed to insert SOW content:', error);
        throw error;
    }
}
