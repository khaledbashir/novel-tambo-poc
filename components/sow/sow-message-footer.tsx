"use client";

import React from 'react';
import { FileText, PlusCircle, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { notifications } from '@/lib/utils';
import { parseSOWFromMarkdown, isSOWContent, ParsedSOW } from '@/lib/sow-parser';

interface SOWMessageFooterProps {
    messageContent: string;
}

/**
 * SOW Message Footer
 * 
 * Renders at the end of AI messages that contain SOW content.
 * Parses the markdown to extract pricing data and offers "Insert to Editor" functionality.
 */
export const SOWMessageFooter: React.FC<SOWMessageFooterProps> = ({ messageContent }) => {
    const [parsedSOW, setParsedSOW] = React.useState<ParsedSOW | null>(null);
    const [showDetails, setShowDetails] = React.useState(false);

    React.useEffect(() => {
        // Only parse if it looks like SOW content
        if (isSOWContent(messageContent)) {
            const parsed = parseSOWFromMarkdown(messageContent);
            setParsedSOW(parsed);
        } else {
            setParsedSOW(null);
        }
    }, [messageContent]);

    const handleInsert = () => {
        if (!parsedSOW) return;

        try {
            const event = new CustomEvent("insert-sow-content", {
                detail: {
                    projectTitle: parsedSOW.projectTitle,
                    clientName: parsedSOW.clientName,
                    projectOverview: parsedSOW.projectOverview,
                    scopes: [
                        {
                            title: "Phase 1: Delivery",
                            description: "Key deliverables and roles for this phase.",
                            roles: parsedSOW.roles.map((role, idx) => ({
                                id: `role-${Date.now()}-${idx}`,
                                role: role.role,
                                task: role.description || "Implementation",
                                hours: role.hours,
                                rate: role.rate,
                            })),
                            deliverables: parsedSOW.deliverables.length > 0
                                ? parsedSOW.deliverables
                                : ["Project Implementation"],
                            assumptions: parsedSOW.assumptions.length > 0
                                ? parsedSOW.assumptions
                                : ["Standard delivery terms apply"],
                        }
                    ],
                    budgetNotes: parsedSOW.budgetNotes,
                    discount: parsedSOW.discount,
                },
            });

            window.dispatchEvent(event);
            notifications.success(
                "SOW Inserted",
                "Successfully added the proposal to the editor."
            );
        } catch (error) {
            console.error("Failed to insert SOW:", error);
            notifications.error("Error", "Could not insert SOW into the editor.");
        }
    };

    if (!parsedSOW || parsedSOW.roles.length === 0) {
        return null;
    }

    // Calculate totals
    const subtotal = parsedSOW.roles.reduce((sum, r) => sum + (r.hours * r.rate), 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;

    return (
        <Card className="mt-4 border-sg-green/30 bg-sg-green/5 shadow-sm overflow-hidden border-2 flex flex-col">
            <CardHeader className="bg-sg-green/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sg-green" />
                    SOW Ready for Editor
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                    {parsedSOW.roles.length} role{parsedSOW.roles.length !== 1 ? 's' : ''} • ${total.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD +GST
                </span>
            </CardHeader>

            {showDetails && (
                <CardContent className="p-4 flex-1">
                    <div className="space-y-3">
                        <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                            Parsed Pricing Summary
                        </div>
                        <div className="border rounded-md overflow-hidden bg-background max-h-64 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0">
                                    <tr className="bg-muted border-b">
                                        <th className="px-3 py-2 text-left font-semibold">Role</th>
                                        <th className="px-3 py-2 text-center font-semibold">Hours</th>
                                        <th className="px-3 py-2 text-right font-semibold">Rate</th>
                                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedSOW.roles.map((role, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-3 py-2 text-foreground font-medium max-w-[180px] truncate">{role.role}</td>
                                            <td className="px-3 py-2 text-center text-muted-foreground">{role.hours}h</td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">${role.rate.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right font-semibold">${(role.hours * role.rate).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            )}

            <CardFooter className="bg-muted/50 p-3 flex justify-between items-center mt-auto">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showDetails ? 'Hide details' : 'Show parsed data'}
                </button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInsert}
                    className="gap-2 border-sg-green text-sg-green hover:bg-sg-green hover:text-white transition-all duration-300 shadow-sm"
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Insert to Editor
                </Button>
            </CardFooter>
        </Card>
    );
};
