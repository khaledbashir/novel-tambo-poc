"use client";

import React from 'react';
import { Table, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { notifications } from '@/lib/utils';

// Full Rate Card lookup for roles
const RATE_CARD: Record<string, number> = {
    "Account Management - (Senior Account Director)": 365.00,
    "Account Management - (Account Director)": 295.00,
    "Account Management - (Account Manager)": 180.00,
    "Account Management (Off)": 120.00,
    "Account Management - (Senior Account Manager)": 210.00,
    "Project Management - (Account Director)": 295.00,
    "Project Management - (Account Manager)": 180.00,
    "Project Management - (Senior Account Manager)": 210.00,
    "Tech - Delivery - Project Coordination": 110.00,
    "Tech - Delivery - Project Management": 150.00,
    "Tech - Head Of- Customer Experience Strategy": 365.00,
    "Tech - Head Of- Program Strategy": 365.00,
    "Tech - Head Of- Senior Project Management": 365.00,
    "Tech - Head Of- System Setup": 365.00,
    "Tech - Integrations": 170.00,
    "Tech - Integrations (Sm MAP)": 295.00,
    "Tech - Keyword Research": 120.00,
    "Tech - Landing Page - (Offshore)": 120.00,
    "Tech - Landing Page - (Onshore)": 210.00,
    "Tech - Producer - Admin Configuration": 120.00,
    "Tech - Producer - Campaign Build": 120.00,
    "Tech - Producer - Chat Bot / Live Chat": 120.00,
    "Tech - Producer - Copywriting": 120.00,
    "Tech - Producer - Deployment": 120.00,
    "Tech - Producer - Design": 120.00,
    "Tech - Producer - Development": 120.00,
    "Tech - Producer - Documentation Setup": 120.00,
    "Tech - Producer - Email Production": 120.00,
    "Tech - Producer - Field / Property Setup": 120.00,
    "Tech - Producer - Integration Assistance": 120.00,
    "Tech - Producer - Landing Page Production": 120.00,
    "Tech - Producer - Lead Scoring Setup": 120.00,
    "Tech - Producer - Reporting": 120.00,
    "Tech - Producer - Services": 120.00,
    "Tech - Producer - SMS Setup": 120.00,
    "Tech - Producer - Support & Monitoring": 120.00,
    "Tech - Producer - Testing": 120.00,
    "Tech - Producer - Training": 120.00,
    "Tech - Producer - Web Development": 120.00,
    "Tech - Producer - Workflows": 120.00,
    "Tech - SEO Producer": 120.00,
    "Tech - SEO Strategy": 180.00,
    "Tech - Specialist - Admin Configuration": 180.00,
    "Tech - Specialist - Campaign Optimisation": 180.00,
    "Tech - Specialist - Campaign Orchestration": 180.00,
    "Tech - Specialist - Database Management": 180.00,
    "Tech - Specialist - Email Production": 180.00,
    "Tech - Specialist - Integration Configuration": 180.00,
    "Tech - Specialist - Integration Services": 190.00,
    "Tech - Specialist - Lead Scoring Setup": 180.00,
    "Tech - Specialist - Program Management": 180.00,
    "Tech - Specialist - Reporting": 180.00,
    "Tech - Specialist - Services": 180.00,
    "Tech - Specialist - Testing": 180.00,
    "Tech - Specialist - Training": 180.00,
    "Tech - Specialist - Workflows": 180.00,
    "Tech - Sr. Architect - Approval & Testing": 365.00,
    "Tech - Sr. Architect - Consultancy Services": 365.00,
    "Tech - Sr. Architect - Data Strategy": 365.00,
    "Tech - Sr. Architect - Integration Strategy": 365.00,
    "Tech - Sr. Consultant - Admin Configuration": 295.00,
    "Tech - Sr. Consultant - Advisory & Consultation": 295.00,
    "Tech - Sr. Consultant - Approval & Testing": 295.00,
    "Tech - Sr. Consultant - Campaign Optimisation": 295.00,
    "Tech - Sr. Consultant - Campaign Strategy": 295.00,
    "Tech - Sr. Consultant - Database Management": 295.00,
    "Tech - Sr. Consultant - Reporting": 295.00,
    "Tech - Sr. Consultant - Services": 295.00,
    "Tech - Sr. Consultant - Strategy": 295.00,
    "Tech - Sr. Consultant - Training": 295.00,
    "Tech - Website Optimisation": 120.00,
    "Content - Campaign Strategy (Onshore)": 180.00,
    "Content - Keyword Research (Offshore)": 120.00,
    "Content - Keyword Research (Onshore)": 150.00,
    "Content - Optimisation (Onshore)": 150.00,
    "Content - Reporting (Offshore)": 120.00,
    "Content - Reporting (Onshore)": 150.00,
    "Content - SEO Copywriting (Onshore)": 150.00,
    "Content - SEO Strategy (Onshore)": 210.00,
    "Content - Website Optimisations (Offshore)": 120.00,
    "Copywriting (Offshore)": 120.00,
    "Copywriting (Onshore)": 180.00,
    "Design - Digital Asset (Offshore)": 140.00,
    "Design - Digital Asset (Onshore)": 190.00,
    "Design - Email (Offshore)": 120.00,
    "Design - Email (Onshore)": 295.00,
    "Design - Landing Page (Offshore)": 120.00,
    "Design - Landing Page (Onshore)": 190.00,
    "Dev (orTech) - Landing Page - (Offshore)": 120.00,
    "Dev (orTech) - Landing Page - (Onshore)": 210.00,
};

interface RoleData {
    role: string;
    hours: number;
    rate?: number;
    description?: string;
    task?: string;
}

interface SOWProposalBridgeProps {
    data: {
        // From AI - various possible formats
        suggestedRoles?: RoleData[];
        roles?: RoleData[];
        pricingTable?: RoleData[];
        // SOW metadata
        projectTitle?: string;
        clientName?: string;
        projectOverview?: string;
        deliverables?: string[];
        assumptions?: string[];
        budgetNotes?: string;
        discount?: number;
    };
}

export const SOWProposalBridge: React.FC<SOWProposalBridgeProps> = ({ data }) => {
    // Normalize roles from various possible keys
    const rawRoles = data.suggestedRoles || data.roles || data.pricingTable || [];

    // Enrich roles with rates from rate card if not provided
    const enrichedRoles = rawRoles.map(role => ({
        ...role,
        rate: role.rate || RATE_CARD[role.role] || 150, // Fallback to $150 if not found
    }));

    const {
        projectTitle = "Project Proposal",
        clientName = "Client",
        projectOverview = "Proposed investment based on our discussion.",
        deliverables = [],
        assumptions = [],
        budgetNotes = "Rates are based on standard rate card.",
        discount = 0,
    } = data;

    // Calculate totals for preview
    const subtotal = enrichedRoles.reduce((sum, r) => sum + (r.hours * (r.rate || 0)), 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;

    const handleInsert = () => {
        try {
            // Map the roles to the structure expected by insert-sow-content event
            const event = new CustomEvent("insert-sow-content", {
                detail: {
                    projectTitle,
                    clientName,
                    projectOverview,
                    scopes: [
                        {
                            title: "Phase 1: Delivery",
                            description: "Key deliverables and roles for this phase.",
                            roles: enrichedRoles.map((role, idx) => ({
                                id: `role-${Date.now()}-${idx}`,
                                role: role.role,
                                task: role.description || role.task || "Implementation",
                                hours: role.hours,
                                rate: role.rate,
                            })),
                            deliverables: deliverables.length > 0 ? deliverables : ["Project Implementation"],
                            assumptions: assumptions.length > 0 ? assumptions : ["Standard delivery terms apply"],
                        }
                    ],
                    budgetNotes,
                    discount,
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

    if (enrichedRoles.length === 0) return null;

    return (
        <Card className="my-4 border-sg-green/30 bg-sg-green/5 shadow-sm overflow-hidden border-2 flex flex-col">
            <CardHeader className="bg-sg-green/10 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Table className="w-4 h-4 text-sg-green" />
                    Investment Proposal Detected
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                    {enrichedRoles.length} role{enrichedRoles.length !== 1 ? 's' : ''}
                </span>
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <div className="space-y-3">
                    <div className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                        Pricing Summary
                    </div>
                    <div className="border rounded-md overflow-hidden bg-background">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted border-b">
                                    <th className="px-3 py-2 text-left font-semibold">Role</th>
                                    <th className="px-3 py-2 text-center font-semibold">Hours</th>
                                    <th className="px-3 py-2 text-right font-semibold">Rate</th>
                                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichedRoles.map((role, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2 text-foreground font-medium max-w-[200px] truncate">{role.role}</td>
                                        <td className="px-3 py-2 text-center text-muted-foreground">{role.hours}h</td>
                                        <td className="px-3 py-2 text-right text-muted-foreground">${role.rate?.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">${(role.hours * (role.rate || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/50">
                                <tr className="border-t">
                                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">Subtotal:</td>
                                    <td className="px-3 py-2 text-right font-semibold">${subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">GST (10%):</td>
                                    <td className="px-3 py-2 text-right text-muted-foreground">+${gst.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t-2 border-border">
                                    <td colSpan={3} className="px-3 py-2 text-right font-bold">Total (AUD):</td>
                                    <td className="px-3 py-2 text-right font-bold text-sg-green">${total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3 flex justify-end mt-auto">
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
