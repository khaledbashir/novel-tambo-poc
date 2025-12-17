"use client";

import React from 'react';
import { Table, PlusCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { notifications } from '@/lib/utils';

interface SuggestedRole {
    role: string;
    hours: number;
    description?: string;
    rate?: number;
}

interface SOWProposalBridgeProps {
    data: {
        suggestedRoles?: SuggestedRole[];
        projectTitle?: string;
        clientName?: string;
        projectOverview?: string;
    };
}

export const SOWProposalBridge: React.FC<SOWProposalBridgeProps> = ({ data }) => {
    const {
        suggestedRoles = [],
        projectTitle = "Project Proposal",
        clientName = "Client",
        projectOverview = "Proposed investment based on our discussion."
    } = data;

    const handleInsert = () => {
        try {
            // Map the suggested roles to the structure expected by insert-sow-content event
            const event = new CustomEvent("insert-sow-content", {
                detail: {
                    projectTitle,
                    clientName,
                    projectOverview,
                    scopes: [
                        {
                            title: "Phase 1: Delivery",
                            description: "Key deliverables and roles for this phase.",
                            roles: suggestedRoles.map(role => ({
                                role: role.role,
                                task: role.description || "Implementation",
                                hours: role.hours,
                                rate: role.rate || 0, // Editor will use default rates if not specified
                            })),
                            deliverables: ["Project Implementation"],
                            assumptions: ["Standard delivery terms apply"]
                        }
                    ],
                    budgetNotes: "Rates are based on standard rate card.",
                    discount: 0,
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

    if (suggestedRoles.length === 0) return null;

    return (
        <Card className="my-4 border-sg-green/30 bg-sg-green/5 shadow-sm overflow-hidden border-2">
            <CardHeader className="bg-sg-green/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Table className="w-4 h-4 text-sg-green" />
                    Investment Proposal Detected
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                        Suggested Roles & Hours
                    </div>
                    <div className="border rounded-md overflow-hidden bg-background">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted border-b">
                                    <th className="px-3 py-2 text-left font-semibold">Role</th>
                                    <th className="px-3 py-2 text-right font-semibold">Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suggestedRoles.map((role, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 text-foreground font-medium">{role.role}</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">{role.hours}h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3 flex justify-end">
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
