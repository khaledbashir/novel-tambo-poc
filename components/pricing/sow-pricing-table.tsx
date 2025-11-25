"use client";

import React, { useState, useEffect } from 'react';
import { withInteractable, useTamboComponentState } from '@tambo-ai/react';
import { Trash2, Plus } from 'lucide-react';
import { z } from 'zod';

interface PricingRow {
    id: string;
    role: string;
    description: string;
    hours: number;
    rate: number;
}

// Zod schema for the SOW Pricing Table component
export const sowPricingSchema = z.object({
    rows: z.array(
        z.object({
            id: z.string(),
            role: z.string(),
            description: z.string(),
            hours: z.number(),
            rate: z.number(),
        })
    ),
    discount: z.number().default(0),
    budgetTarget: z.number().optional(),
    budgetNotes: z.string().optional(),
    deliverables: z.array(z.string()).optional(),
    scopeOverview: z.string().optional(),
    assumptions: z.array(z.string()).optional(),
});

export type SOWPricingProps = z.infer<typeof sowPricingSchema>;

const SOWPricingTableBase: React.FC<SOWPricingProps> = ({
    rows: initialRows = [],
    discount: initialDiscount = 0,
    budgetTarget,
    budgetNotes: initialBudgetNotes = '',
    deliverables = [],
    scopeOverview = '',
    assumptions = [],
}) => {
    // Use Tambo's state management to prevent infinite loops
    const [rows, setRows] = useTamboComponentState('rows', initialRows.length > 0 ? initialRows : [
        { id: 'row-1', role: '', description: '', hours: 0, rate: 0 }
    ], initialRows);
    const [discount, setDiscount] = useTamboComponentState('discount', initialDiscount, initialDiscount);
    const [budgetNotes] = useState(initialBudgetNotes);
    const [draggedRow, setDraggedRow] = useState<string | null>(null);

    // Available roles from your rate card
    const availableRoles = [
        { name: "Account Management - (Senior Account Director)", baseRate: 365.00 },
        { name: "Account Management - (Account Director)", baseRate: 295.00 },
        { name: "Account Management - (Account Manager)", baseRate: 180.00 },
        { name: "Account Management (Off)", baseRate: 120.00 },
        { name: "Account Management - (Senior Account Manager)", baseRate: 210.00 },
        { name: "Project Management - (Account Director)", baseRate: 295.00 },
        { name: "Project Management - (Account Manager)", baseRate: 180.00 },
        { name: "Project Management - (Senior Account Manager)", baseRate: 210.00 },
        { name: "Tech - Delivery - Project Coordination", baseRate: 110.00 },
        { name: "Tech - Delivery - Project Management", baseRate: 150.00 },
        { name: "Tech - Head Of- Customer Experience Strategy", baseRate: 365.00 },
        { name: "Tech - Head Of- Program Strategy", baseRate: 365.00 },
        { name: "Tech - Head Of- Senior Project Management", baseRate: 365.00 },
        { name: "Tech - Head Of- System Setup", baseRate: 365.00 },
        { name: "Tech - Integrations", baseRate: 170.00 },
        { name: "Tech - Integrations (Sm MAP)", baseRate: 295.00 },
        { name: "Tech - Keyword Research", baseRate: 120.00 },
        { name: "Tech - Landing Page - (Offshore)", baseRate: 120.00 },
        { name: "Tech - Landing Page - (Onshore)", baseRate: 210.00 },
        { name: "Tech - Producer - Admin Configuration", baseRate: 120.00 },
        { name: "Tech - Producer - Campaign Build", baseRate: 120.00 },
        { name: "Tech - Producer - Chat Bot / Live Chat", baseRate: 120.00 },
        { name: "Tech - Producer - Copywriting", baseRate: 120.00 },
        { name: "Tech - Producer - Deployment", baseRate: 120.00 },
        { name: "Tech - Producer - Design", baseRate: 120.00 },
        { name: "Tech - Producer - Development", baseRate: 120.00 },
        { name: "Tech - Producer - Documentation Setup", baseRate: 120.00 },
        { name: "Tech - Producer - Email Production", baseRate: 120.00 },
        { name: "Tech - Producer - Field / Property Setup", baseRate: 120.00 },
        { name: "Tech - Producer - Integration Assistance", baseRate: 120.00 },
        { name: "Tech - Producer - Landing Page Production", baseRate: 120.00 },
        { name: "Tech - Producer - Lead Scoring Setup", baseRate: 120.00 },
        { name: "Tech - Producer - Reporting", baseRate: 120.00 },
        { name: "Tech - Producer - Services", baseRate: 120.00 },
        { name: "Tech - Producer - SMS Setup", baseRate: 120.00 },
        { name: "Tech - Producer - Support & Monitoring", baseRate: 120.00 },
        { name: "Tech - Producer - Testing", baseRate: 120.00 },
        { name: "Tech - Producer - Training", baseRate: 120.00 },
        { name: "Tech - Producer - Web Development", baseRate: 120.00 },
        { name: "Tech - Producer - Workflows", baseRate: 120.00 },
        { name: "Tech - SEO Producer", baseRate: 120.00 },
        { name: "Tech - SEO Strategy", baseRate: 180.00 },
        { name: "Tech - Specialist - Admin Configuration", baseRate: 180.00 },
        { name: "Tech - Specialist - Campaign Optimisation", baseRate: 180.00 },
        { name: "Tech - Specialist - Campaign Orchestration", baseRate: 180.00 },
        { name: "Tech - Specialist - Database Management", baseRate: 180.00 },
        { name: "Tech - Specialist - Email Production", baseRate: 180.00 },
        { name: "Tech - Specialist - Integration Configuration", baseRate: 180.00 },
        { name: "Tech - Specialist - Integration Services", baseRate: 190.00 },
        { name: "Tech - Specialist - Lead Scoring Setup", baseRate: 180.00 },
        { name: "Tech - Specialist - Program Management", baseRate: 180.00 },
        { name: "Tech - Specialist - Reporting", baseRate: 180.00 },
        { name: "Tech - Specialist - Services", baseRate: 180.00 },
        { name: "Tech - Specialist - Testing", baseRate: 180.00 },
        { name: "Tech - Specialist - Training", baseRate: 180.00 },
        { name: "Tech - Specialist - Workflows", baseRate: 180.00 },
        { name: "Tech - Sr. Architect - Approval & Testing", baseRate: 365.00 },
        { name: "Tech - Sr. Architect - Consultancy Services", baseRate: 365.00 },
        { name: "Tech - Sr. Architect - Data Strategy", baseRate: 365.00 },
        { name: "Tech - Sr. Architect - Integration Strategy", baseRate: 365.00 },
        { name: "Tech - Sr. Consultant - Admin Configuration", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Advisory & Consultation", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Approval & Testing", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Campaign Optimisation", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Campaign Strategy", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Database Management", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Reporting", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Services", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Strategy", baseRate: 295.00 },
        { name: "Tech - Sr. Consultant - Training", baseRate: 295.00 },
        { name: "Tech - Website Optimisation", baseRate: 120.00 },
        { name: "Content - Campaign Strategy (Onshore)", baseRate: 180.00 },
        { name: "Content - Keyword Research (Offshore)", baseRate: 120.00 },
        { name: "Content - Keyword Research (Onshore)", baseRate: 150.00 },
        { name: "Content - Optimisation (Onshore)", baseRate: 150.00 },
        { name: "Content - Reporting (Offshore)", baseRate: 120.00 },
        { name: "Content - Reporting (Onshore)", baseRate: 150.00 },
        { name: "Content - SEO Copywriting (Onshore)", baseRate: 150.00 },
        { name: "Content - SEO Strategy (Onshore)", baseRate: 210.00 },
        { name: "Content - Website Optimisations (Offshore)", baseRate: 120.00 },
        { name: "Copywriting (Offshore)", baseRate: 120.00 },
        { name: "Copywriting (Onshore)", baseRate: 180.00 },
        { name: "Design - Digital Asset (Offshore)", baseRate: 140.00 },
        { name: "Design - Digital Asset (Onshore)", baseRate: 190.00 },
        { name: "Design - Email (Offshore)", baseRate: 120.00 },
        { name: "Design - Email (Onshore)", baseRate: 295.00 },
        { name: "Design - Landing Page (Offshore)", baseRate: 120.00 },
        { name: "Design - Landing Page (Onshore)", baseRate: 190.00 },
        { name: "Dev (orTech) - Landing Page - (Offshore)", baseRate: 120.00 },
        { name: "Dev (orTech) - Landing Page - (Onshore)", baseRate: 210.00 }
    ];

    // Calculations
    const calculateSubtotal = () => {
        return rows.reduce((sum, row) => sum + (row.hours * row.rate), 0);
    };

    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1; // 10% GST
    const total = afterDiscount + gst;

    // Budget variance
    const budgetVariance = budgetTarget ? total - budgetTarget : 0;
    const isOverBudget = budgetVariance > 0;

    // Row operations
    const updateRow = (id: string, field: keyof PricingRow, value: any) => {
        setRows(prev =>
            prev.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const addRow = () => {
        const newRow: PricingRow = {
            id: `row-${Date.now()}`,
            role: '',
            description: '',
            hours: 0,
            rate: 0
        };
        setRows([...rows, newRow]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    // Drag and drop
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedRow(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedRow || draggedRow === targetId) return;

        const draggedIndex = rows.findIndex(r => r.id === draggedRow);
        const targetIndex = rows.findIndex(r => r.id === targetId);

        const newRows = [...rows];
        const [draggedItem] = newRows.splice(draggedIndex, 1);
        newRows.splice(targetIndex, 0, draggedItem);

        setRows(newRows);
        setDraggedRow(null);
    };

    const handleRoleSelect = (id: string, roleName: string) => {
        const role = availableRoles.find(r => r.name === roleName);
        updateRow(id, 'role', roleName);
        if (role) {
            updateRow(id, 'rate', role.baseRate);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-card rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">SOW Pricing Table</h2>
                <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition"
                >
                    <Plus size={18} /> Add Role
                </button>
            </div>

            {scopeOverview && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Scope Overview</h3>
                    <p className="text-muted-foreground">{scopeOverview}</p>
                </div>
            )}

            {deliverables && deliverables.length > 0 && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Deliverables</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {deliverables.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Pricing Table */}
            <div className="overflow-x-auto mb-6">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted border-b-2 border-border">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Description</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Hours</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Rate/Hr (AUD)</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Cost (AUD)</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, row.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, row.id)}
                                className={`border-b border-border hover:bg-muted/50 transition ${draggedRow === row.id ? 'bg-primary/10 opacity-50' : ''
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <select
                                        value={row.role}
                                        onChange={(e) => handleRoleSelect(row.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Select role...</option>
                                        {availableRoles.map((role) => (
                                            <option key={role.name} value={role.name}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={row.description}
                                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                        placeholder="e.g., Backend development"
                                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        value={row.hours}
                                        onChange={(e) => updateRow(row.id, 'hours', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.5"
                                        className="w-full px-3 py-2 border border-input rounded-md text-center bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        value={row.rate}
                                        onChange={(e) => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="w-full px-3 py-2 border border-input rounded-md text-center bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-foreground">
                                    ${(row.hours * row.rate).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length === 1}
                                        className="text-destructive hover:text-destructive/80 disabled:text-muted-foreground transition"
                                        title={rows.length === 1 ? 'Cannot remove last row' : 'Remove row'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary Section */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm">
                    <div className="bg-muted rounded-lg p-6 border border-border">
                        <div className="space-y-3">
                            {/* Discount Input */}
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                                <label className="text-sm font-medium text-foreground">Discount (%):</label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                    min="0"
                                    max="100"
                                    className="w-20 px-3 py-1 border border-input rounded-md text-right bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            {/* Subtotal */}
                            <div className="flex justify-between text-foreground">
                                <span className="text-sm">Subtotal:</span>
                                <span className="font-semibold">${subtotal.toFixed(2)}</span>
                            </div>

                            {/* Discount Amount */}
                            {discount > 0 && (
                                <>
                                    <div className="flex justify-between text-destructive text-sm">
                                        <span>Discount ({discount}%):</span>
                                        <span>-${discountAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-foreground">
                                        <span className="text-sm">After Discount:</span>
                                        <span className="font-semibold">${afterDiscount.toFixed(2)}</span>
                                    </div>
                                </>
                            )}

                            {/* GST */}
                            <div className="flex justify-between text-foreground">
                                <span className="text-sm">GST (10%):</span>
                                <span className="font-semibold">+${gst.toFixed(2)}</span>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-3 border-t-2 border-border">
                                <span className="font-bold text-foreground">Total (AUD):</span>
                                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                            </div>

                            {/* Budget Variance */}
                            {budgetTarget && (
                                <div className={`flex justify-between text-sm ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
                                    <span>Budget Variance:</span>
                                    <span>{isOverBudget ? '+' : ''}${Math.abs(budgetVariance).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {budgetNotes && (
                <div className="mt-4 p-3 bg-muted rounded">
                    <h4 className="font-semibold text-sm mb-1">Budget Notes:</h4>
                    <p className="text-sm text-muted-foreground">{budgetNotes}</p>
                </div>
            )}

            {assumptions && assumptions.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Assumptions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {assumptions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Wrap with Interactable to enable persistence and editing
export const SOWPricingTable = withInteractable(SOWPricingTableBase, {
    componentName: 'SOWPricingTable',
    description: 'Interactive SOW pricing table with drag-and-drop, manual editing, budget tracking, and GST calculations',
    propsSchema: sowPricingSchema,
});

export default SOWPricingTable;
