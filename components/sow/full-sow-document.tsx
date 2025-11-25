"use client";

import React, { useState, useRef } from "react";
import { withInteractable } from "@tambo-ai/react";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import {
    Trash2,
    Plus,
    GripVertical,
    FileDown,
    ArrowDownToLine,
} from "lucide-react";
import { z } from "zod";

// Types
interface RoleRow {
    id: string;
    task: string;
    role: string;
    hours: number;
    rate: number;
}

interface Scope {
    id: string;
    title: string;
    description: string;
    roles: RoleRow[];
    deliverables: string[];
    assumptions: string[];
}

// Zod schema
export const fullSOWSchema = z.object({
    clientName: z.string(),
    projectTitle: z.string(),
    scopes: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            roles: z.array(
                z.object({
                    id: z.string(),
                    task: z.string(),
                    role: z.string(),
                    hours: z.number(),
                    rate: z.number(),
                }),
            ),
            deliverables: z.array(z.string()),
            assumptions: z.array(z.string()),
        }),
    ),
    projectOverview: z.string().optional(),
    budgetNotes: z.string().optional(),
    discount: z.number().default(0),
});

export type FullSOWProps = z.infer<typeof fullSOWSchema>;

const FullSOWDocumentBase: React.FC<FullSOWProps> = ({
    clientName,
    projectTitle,
    scopes: initialScopes = [],
    projectOverview = "",
    budgetNotes = "",
    discount: initialDiscount = 0,
}) => {
    const [scopes, setScopes] = useState<Scope[]>(initialScopes || []);
    const [discount, setDiscount] = useState(initialDiscount);
    const printRef = useRef<HTMLDivElement>(null);

    // Sync state with props when they change (critical for streaming/updates)
    React.useEffect(() => {
        if (initialScopes) {
            setScopes((prev) => {
                // Deep compare to prevent infinite loops from new array references
                if (JSON.stringify(prev) !== JSON.stringify(initialScopes)) {
                    return initialScopes;
                }
                return prev;
            });
        }
    }, [initialScopes]);

    React.useEffect(() => {
        setDiscount(initialDiscount);
    }, [initialDiscount]);
    const [draggedRow, setDraggedRow] = useState<{
        scopeId: string;
        rowId: string;
    } | null>(null);

    // Available roles from rate card
    const availableRoles = [
        {
            name: "Account Management - (Senior Account Director)",
            baseRate: 365.0,
        },
        { name: "Account Management - (Account Director)", baseRate: 295.0 },
        { name: "Account Management - (Account Manager)", baseRate: 180.0 },
        { name: "Account Management (Off)", baseRate: 120.0 },
        {
            name: "Account Management - (Senior Account Manager)",
            baseRate: 210.0,
        },
        { name: "Project Management - (Account Director)", baseRate: 295.0 },
        { name: "Project Management - (Account Manager)", baseRate: 180.0 },
        {
            name: "Project Management - (Senior Account Manager)",
            baseRate: 210.0,
        },
        { name: "Tech - Delivery - Project Coordination", baseRate: 110.0 },
        { name: "Tech - Delivery - Project Management", baseRate: 150.0 },
        {
            name: "Tech - Head Of- Customer Experience Strategy",
            baseRate: 365.0,
        },
        { name: "Tech - Head Of- Program Strategy", baseRate: 365.0 },
        { name: "Tech - Head Of- Senior Project Management", baseRate: 365.0 },
        { name: "Tech - Head Of- System Setup", baseRate: 365.0 },
        { name: "Tech - Integrations", baseRate: 170.0 },
        { name: "Tech - Integrations (Sm MAP)", baseRate: 295.0 },
        { name: "Tech - Keyword Research", baseRate: 120.0 },
        { name: "Tech - Landing Page - (Offshore)", baseRate: 120.0 },
        { name: "Tech - Landing Page - (Onshore)", baseRate: 210.0 },
        { name: "Tech - Producer - Admin Configuration", baseRate: 120.0 },
        { name: "Tech - Producer - Campaign Build", baseRate: 120.0 },
        { name: "Tech - Producer - Chat Bot / Live Chat", baseRate: 120.0 },
        { name: "Tech - Producer - Copywriting", baseRate: 120.0 },
        { name: "Tech - Producer - Deployment", baseRate: 120.0 },
        { name: "Tech - Producer - Design", baseRate: 120.0 },
        { name: "Tech - Producer - Development", baseRate: 120.0 },
        { name: "Tech - Producer - Documentation Setup", baseRate: 120.0 },
        { name: "Tech - Producer - Email Production", baseRate: 120.0 },
        { name: "Tech - Producer - Field / Property Setup", baseRate: 120.0 },
        { name: "Tech - Producer - Integration Assistance", baseRate: 120.0 },
        { name: "Tech - Producer - Landing Page Production", baseRate: 120.0 },
        { name: "Tech - Producer - Lead Scoring Setup", baseRate: 120.0 },
        { name: "Tech - Producer - Reporting", baseRate: 120.0 },
        { name: "Tech - Producer - Services", baseRate: 120.0 },
        { name: "Tech - Producer - SMS Setup", baseRate: 120.0 },
        { name: "Tech - Producer - Support & Monitoring", baseRate: 120.0 },
        { name: "Tech - Producer - Testing", baseRate: 120.0 },
        { name: "Tech - Producer - Training", baseRate: 120.0 },
        { name: "Tech - Producer - Web Development", baseRate: 120.0 },
        { name: "Tech - Producer - Workflows", baseRate: 120.0 },
        { name: "Tech - SEO Producer", baseRate: 120.0 },
        { name: "Tech - SEO Strategy", baseRate: 180.0 },
        { name: "Tech - Specialist - Admin Configuration", baseRate: 180.0 },
        { name: "Tech - Specialist - Campaign Optimisation", baseRate: 180.0 },
        { name: "Tech - Specialist - Campaign Orchestration", baseRate: 180.0 },
        { name: "Tech - Specialist - Database Management", baseRate: 180.0 },
        { name: "Tech - Specialist - Email Production", baseRate: 180.0 },
        {
            name: "Tech - Specialist - Integration Configuration",
            baseRate: 180.0,
        },
        { name: "Tech - Specialist - Integration Services", baseRate: 190.0 },
        { name: "Tech - Specialist - Lead Scoring Setup", baseRate: 180.0 },
        { name: "Tech - Specialist - Program Management", baseRate: 180.0 },
        { name: "Tech - Specialist - Reporting", baseRate: 180.0 },
        { name: "Tech - Specialist - Services", baseRate: 180.0 },
        { name: "Tech - Specialist - Testing", baseRate: 180.0 },
        { name: "Tech - Specialist - Training", baseRate: 180.0 },
        { name: "Tech - Specialist - Workflows", baseRate: 180.0 },
        { name: "Tech - Sr. Architect - Approval & Testing", baseRate: 365.0 },
        {
            name: "Tech - Sr. Architect - Consultancy Services",
            baseRate: 365.0,
        },
        { name: "Tech - Sr. Architect - Data Strategy", baseRate: 365.0 },
        {
            name: "Tech - Sr. Architect - Integration Strategy",
            baseRate: 365.0,
        },
        {
            name: "Tech - Sr. Consultant - Admin Configuration",
            baseRate: 295.0,
        },
        {
            name: "Tech - Sr. Consultant - Advisory & Consultation",
            baseRate: 295.0,
        },
        { name: "Tech - Sr. Consultant - Approval & Testing", baseRate: 295.0 },
        {
            name: "Tech - Sr. Consultant - Campaign Optimisation",
            baseRate: 295.0,
        },
        { name: "Tech - Sr. Consultant - Campaign Strategy", baseRate: 295.0 },
        {
            name: "Tech - Sr. Consultant - Database Management",
            baseRate: 295.0,
        },
        { name: "Tech - Sr. Consultant - Reporting", baseRate: 295.0 },
        { name: "Tech - Sr. Consultant - Services", baseRate: 295.0 },
        { name: "Tech - Sr. Consultant - Strategy", baseRate: 295.0 },
        { name: "Tech - Sr. Consultant - Training", baseRate: 295.0 },
        { name: "Tech - Website Optimisation", baseRate: 120.0 },
        { name: "Content - Campaign Strategy (Onshore)", baseRate: 180.0 },
        { name: "Content - Keyword Research (Offshore)", baseRate: 120.0 },
        { name: "Content - Keyword Research (Onshore)", baseRate: 150.0 },
        { name: "Content - Optimisation (Onshore)", baseRate: 150.0 },
        { name: "Content - Reporting (Offshore)", baseRate: 120.0 },
        { name: "Content - Reporting (Onshore)", baseRate: 150.0 },
        { name: "Content - SEO Copywriting (Onshore)", baseRate: 150.0 },
        { name: "Content - SEO Strategy (Onshore)", baseRate: 210.0 },
        { name: "Content - Website Optimisations (Offshore)", baseRate: 120.0 },
        { name: "Copywriting (Offshore)", baseRate: 120.0 },
        { name: "Copywriting (Onshore)", baseRate: 180.0 },
        { name: "Design - Digital Asset (Offshore)", baseRate: 140.0 },
        { name: "Design - Digital Asset (Onshore)", baseRate: 190.0 },
        { name: "Design - Email (Offshore)", baseRate: 120.0 },
        { name: "Design - Email (Onshore)", baseRate: 295.0 },
        { name: "Design - Landing Page (Offshore)", baseRate: 120.0 },
        { name: "Design - Landing Page (Onshore)", baseRate: 190.0 },
        { name: "Dev (orTech) - Landing Page - (Offshore)", baseRate: 120.0 },
        { name: "Dev (orTech) - Landing Page - (Onshore)", baseRate: 210.0 },
    ];

    // Helper function to ensure values are numbers
    const safeNumber = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    // Calculations
    const calculateScopeTotal = (scope: Scope) => {
        if (!scope.roles || scope.roles.length === 0) return 0;
        return scope.roles.reduce(
            (sum, row) => sum + safeNumber(row.hours) * safeNumber(row.rate),
            0,
        );
    };

    const calculateGrandTotal = () => {
        if (!scopes || scopes.length === 0) {
            return {
                subtotal: 0,
                discountAmount: 0,
                afterDiscount: 0,
                gst: 0,
                total: 0,
            };
        }

        const subtotal = scopes.reduce(
            (sum, scope) => sum + calculateScopeTotal(scope),
            0,
        );
        const discountAmount = subtotal * (safeNumber(discount) / 100);
        const afterDiscount = subtotal - discountAmount;
        const gst = afterDiscount * 0.1;
        return {
            subtotal,
            discountAmount,
            afterDiscount,
            gst,
            total: afterDiscount + gst,
        };
    };

    const totals = calculateGrandTotal();

    // Row operations
    const updateRow = (
        scopeId: string,
        rowId: string,
        field: keyof RoleRow,
        value: any,
    ) => {
        setScopes((prev) =>
            prev.map((scope) =>
                scope.id === scopeId
                    ? {
                        ...scope,
                        roles: scope.roles.map((row) =>
                            row.id === rowId
                                ? { ...row, [field]: value }
                                : row,
                        ),
                    }
                    : scope,
            ),
        );
    };

    const addRow = (scopeId: string) => {
        setScopes((prev) =>
            prev.map((scope) =>
                scope.id === scopeId
                    ? {
                        ...scope,
                        roles: [
                            ...scope.roles,
                            {
                                id: `row-${Date.now()}`,
                                task: "",
                                role: "",
                                hours: 0,
                                rate: 0,
                            },
                        ],
                    }
                    : scope,
            ),
        );
    };

    const removeRow = (scopeId: string, rowId: string) => {
        setScopes((prev) =>
            prev.map((scope) =>
                scope.id === scopeId
                    ? {
                        ...scope,
                        roles: scope.roles.filter((row) => row.id !== rowId),
                    }
                    : scope,
            ),
        );
    };

    const handleRoleSelect = (
        scopeId: string,
        rowId: string,
        roleName: string,
    ) => {
        const role = availableRoles.find((r) => r.name === roleName);
        updateRow(scopeId, rowId, "role", roleName);
        if (role) {
            updateRow(scopeId, rowId, "rate", role.baseRate);
        }
    };

    // Drag and drop
    const handleDragStart = (
        e: React.DragEvent,
        scopeId: string,
        rowId: string,
    ) => {
        setDraggedRow({ scopeId, rowId });
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (
        e: React.DragEvent,
        targetScopeId: string,
        targetRowId: string,
    ) => {
        e.preventDefault();
        if (!draggedRow || draggedRow.scopeId !== targetScopeId) return;

        setScopes((prev) =>
            prev.map((scope) => {
                if (scope.id !== targetScopeId) return scope;

                const draggedIndex = scope.roles.findIndex(
                    (r) => r.id === draggedRow.rowId,
                );
                const targetIndex = scope.roles.findIndex(
                    (r) => r.id === targetRowId,
                );

                const newRoles = [...scope.roles];
                const [draggedItem] = newRoles.splice(draggedIndex, 1);
                newRoles.splice(targetIndex, 0, draggedItem);

                return { ...scope, roles: newRoles };
            }),
        );
        setDraggedRow(null);
    };

    // Insert SOW content directly into editor
    const insertToEditor = () => {
        if (!scopes || scopes.length === 0) {
            toast.error("No SOW content to insert yet!");
            return;
        }

        // Dispatch custom event to insert content into editor
        const event = new CustomEvent("insert-sow-content", {
            detail: {
                scopes,
                projectTitle,
                clientName,
                projectOverview,
                budgetNotes,
                totals,
                discount,
            },
        });
        window.dispatchEvent(event);
    };

    // PDF Export using react-to-print
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `SOW-${(projectTitle || "document").replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`,
    });

    return (
        <>
            {/* Print CSS */}
            <style jsx global>{`
            @media print {
                /* Hide everything except print content */
                body * {
                    visibility: hidden;
                }
                #sow-print-content,
                #sow-print-content * {
                    visibility: visible;
                }
                #sow-print-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }

                /* Page setup */
                @page {
                    size: A4;
                    margin: 20mm;
                }

                /* Hide interactive elements */
                button, input, select, .no-print {
                    display: none !important;
                }

                /* Professional styling */
                body {
                    font-family: 'Plus Jakarta Sans', 'Open Sans', Arial, sans-serif;
                    color: #333;
                    background: white;
                }

                /* Logo and header */
                .print-header {
                    display: block !important;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #00D084;
                }

                .print-logo {
                    height: 40px;
                    margin-bottom: 20px;
                }

                /* Headings */
                h1 {
                    color: #00D084 !important;
                    font-size: 28px !important;
                    margin-bottom: 10px !important;
                }

                h2 {
                    color: #00D084 !important;
                    font-size: 20px !important;
                    margin-top: 20px !important;
                    margin-bottom: 10px !important;
                    page-break-after: avoid;
                }

                h3 {
                    font-size: 16px !important;
                    margin-top: 15px !important;
                    margin-bottom: 8px !important;
                }

                /* Tables */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    page-break-inside: avoid;
                    margin: 15px 0;
                }

                thead {
                    background: #00D084 !important;
                    color: white !important;
                }

                th {
                    padding: 12px 8px !important;
                    text-align: left !important;
                    font-weight: 700 !important;
                    font-size: 12px !important;
                    border: 1px solid #ddd !important;
                }

                td {
                    padding: 10px 8px !important;
                    border: 1px solid #ddd !important;
                    font-size: 13px !important;
                }

                tbody tr {
                    page-break-inside: avoid;
                }

                tbody tr:nth-child(even) {
                    background: #f9f9f9 !important;
                }

                /* Deliverables and Assumptions */
                .bg-muted {
                    background: #f5f5f5 !important;
                    padding: 15px !important;
                    margin: 10px 0 !important;
                    border-left: 4px solid #00D084 !important;
                    page-break-inside: avoid;
                }

                /* Financial summary */
                .financial-summary {
                    page-break-inside: avoid;
                }

                /* Footer */
                .print-footer {
                    display: block !important;
                    text-align: center;
                    font-size: 11px;
                    color: #999;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                }
            }
        `}</style>

            <div className="w-full max-w-7xl mx-auto p-6 bg-card rounded-lg border border-border shadow-sm space-y-8" ref={printRef} id="sow-print-content">
                {/* Print-only header with logo */}
                <div className="print-header hidden print:block">
                    <img src="/logo.png" alt="Social Garden" className="print-logo" />
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        Statement of Work - Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                {/* Header */}
                <div className="border-b border-border pb-4">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {projectTitle}
                    </h1>
                    <p className="text-muted-foreground">Client: {clientName}</p>
                </div>

                {/* Scopes */}
                {scopes && scopes.length > 0 ? (
                    scopes.map((scope, scopeIndex) => (
                        <div key={scope.id} className="space-y-4">
                            {/* Scope Header */}
                            <div className="bg-muted p-4 rounded-lg">
                                <h2 className="text-xl font-bold text-foreground mb-2">
                                    Scope {scopeIndex + 1}: {scope.title}
                                </h2>
                                <p className="text-muted-foreground italic">
                                    {scope.description}
                                </p>
                            </div>

                            {/* Deliverables - Moved to Top per Compliance */}
                            {scope.deliverables &&
                                scope.deliverables.length > 0 && (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <h3 className="font-bold text-foreground mb-2">
                                            Deliverables:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {scope.deliverables.map((item, idx) => (
                                                <li
                                                    key={`deliverable-${scope.id}-${idx}`}
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            {/* Pricing Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted border-b-2 border-border">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-8"></th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                TASK/DESCRIPTION
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                ROLE
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-24">
                                                HOURS
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-24">
                                                RATE
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground w-32">
                                                TOTAL COST + GST
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-16">
                                                ACTIONS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(scope.roles || []).map((row, rowIdx) => {
                                            const rowCost =
                                                safeNumber(row.hours) *
                                                safeNumber(row.rate);
                                            const rowGST = rowCost * 0.1;
                                            const rowTotal = rowCost + rowGST;

                                            return (
                                                <tr
                                                    key={row.id || `row-${scope.id}-${rowIdx}`}
                                                    draggable
                                                    onDragStart={(e) =>
                                                        handleDragStart(
                                                            e,
                                                            scope.id,
                                                            row.id,
                                                        )
                                                    }
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) =>
                                                        handleDrop(
                                                            e,
                                                            scope.id,
                                                            row.id,
                                                        )
                                                    }
                                                    className={`border-b border-border hover:bg-muted/50 transition ${draggedRow?.rowId === row.id
                                                        ? "bg-primary/10 opacity-50"
                                                        : ""
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <GripVertical
                                                            size={16}
                                                            className="text-muted-foreground cursor-move"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={row.task || ""}
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "task",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="e.g., Handle HubSpot setup..."
                                                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={row.role || ""}
                                                            onChange={(e) =>
                                                                handleRoleSelect(
                                                                    scope.id,
                                                                    row.id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                        >
                                                            <option value="">
                                                                Select role...
                                                            </option>
                                                            {availableRoles.map(
                                                                (role, idx) => (
                                                                    <option
                                                                        key={`${role.name}-${idx}`}
                                                                        value={
                                                                            role.name
                                                                        }
                                                                    >
                                                                        {role.name}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={
                                                                isNaN(row.hours)
                                                                    ? 0
                                                                    : row.hours || 0
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "hours",
                                                                    safeNumber(
                                                                        parseFloat(
                                                                            e.target
                                                                                .value,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                            min="0"
                                                            step="0.5"
                                                            className="w-full px-3 py-2 border border-input rounded-md text-center bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={
                                                                isNaN(row.rate)
                                                                    ? 0
                                                                    : row.rate || 0
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "rate",
                                                                    safeNumber(
                                                                        parseFloat(
                                                                            e.target
                                                                                .value,
                                                                        ),
                                                                    ),
                                                                )
                                                            }
                                                            min="0"
                                                            className="w-full px-3 py-2 border border-input rounded-md text-center bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                                                        ${rowTotal.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() =>
                                                                removeRow(
                                                                    scope.id,
                                                                    row.id,
                                                                )
                                                            }
                                                            className="text-destructive hover:text-destructive/80 transition"
                                                            title="Remove row"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add Row Button */}
                            < button
                                onClick={() => addRow(scope.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition text-sm"
                            >
                                <Plus size={16} /> Add Role
                            </button>

                            {/* Assumptions */}
                            {
                                scope.assumptions && scope.assumptions.length > 0 && (
                                    <div className="bg-muted p-4 rounded-lg">
                                        <h3 className="font-bold text-foreground mb-2">
                                            Assumptions:
                                        </h3>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {scope.assumptions.map((item, idx) => (
                                                <li
                                                    key={`assumption-${scope.id}-${idx}`}
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            }
                        </div >
                    ))
                ) : (
                    <div className="text-center p-8 bg-muted rounded-lg">
                        <p className="text-muted-foreground">
                            No scopes defined yet. Tambo will generate SOW scopes
                            here.
                        </p>
                    </div>
                )}

                {/* Scope & Price Overview */}
                <div className="border-t border-border pt-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
                        Scope & Price Overview
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted border-b-2 border-border">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                        SCOPE
                                    </th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                                        ESTIMATED TOTAL HOURS
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                                        TOTAL COST
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {scopes && scopes.length > 0 &&
                                    scopes.map((scope, idx) => {
                                        const scopeTotal =
                                            calculateScopeTotal(scope);
                                        const scopeHours = (
                                            scope.roles || []
                                        ).reduce(
                                            (sum, row) =>
                                                sum + safeNumber(row.hours),
                                            0,
                                        );
                                        const scopeGST = scopeTotal * 0.1;
                                        const scopeTotalWithGST =
                                            scopeTotal + scopeGST;

                                        return (
                                            <tr
                                                key={scope.id}
                                                className="border-b border-border"
                                            >
                                                <td className="px-4 py-3 font-bold">
                                                    Scope {idx + 1}: {scope.title}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold">
                                                    {scopeHours.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">
                                                    $
                                                    {isNaN(scopeTotalWithGST)
                                                        ? "0.00"
                                                        : scopeTotalWithGST.toFixed(
                                                            2,
                                                        )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                                <tr key="total-project-row" className="bg-muted border-t-2 border-border">
                                    <td className="px-4 py-3 font-bold text-lg">
                                        TOTAL PROJECT
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-lg">
                                        {scopes && scopes.length > 0
                                            ? scopes
                                                .reduce(
                                                    (sum, scope) =>
                                                        sum +
                                                        (
                                                            scope.roles || []
                                                        ).reduce(
                                                            (s, r) =>
                                                                s +
                                                                safeNumber(
                                                                    r.hours,
                                                                ),
                                                            0,
                                                        ),
                                                    0,
                                                )
                                                .toFixed(1)
                                            : 0}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-lg">
                                        $
                                        {isNaN(totals.total)
                                            ? "0.00"
                                            : totals.total.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end">
                    <div className="w-full max-w-sm bg-muted rounded-lg p-6 border border-border">
                        <div className="space-y-3">
                            {/* Discount Input */}
                            <div className="flex justify-between items-center pb-3 border-b border-border">
                                <label className="text-sm font-medium text-foreground">
                                    Discount (%):
                                </label>
                                <input
                                    type="number"
                                    value={isNaN(discount) ? 0 : discount}
                                    onChange={(e) =>
                                        setDiscount(
                                            Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    safeNumber(
                                                        parseFloat(e.target.value),
                                                    ),
                                                ),
                                            ),
                                        )
                                    }
                                    min="0"
                                    max="100"
                                    className="w-20 px-3 py-1 border border-input rounded-md text-right bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="flex justify-between text-foreground">
                                <span className="text-sm">Subtotal:</span>
                                <span className="font-semibold">
                                    $
                                    {isNaN(totals.subtotal)
                                        ? "0.00"
                                        : totals.subtotal.toFixed(2)}
                                </span>
                            </div>

                            {discount > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-destructive text-sm">
                                        <span>Discount ({discount}%):</span>
                                        <span>
                                            -$
                                            {isNaN(totals.discountAmount)
                                                ? "0.00"
                                                : totals.discountAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-foreground">
                                        <span className="text-sm">
                                            After Discount:
                                        </span>
                                        <span className="font-semibold">
                                            $
                                            {isNaN(totals.afterDiscount)
                                                ? "0.00"
                                                : totals.afterDiscount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between text-foreground">
                                <span className="text-sm">GST (10%):</span>
                                <span className="font-semibold">
                                    +$
                                    {isNaN(totals.gst)
                                        ? "0.00"
                                        : totals.gst.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t-2 border-border">
                                <span className="font-bold text-foreground">
                                    Total (AUD):
                                </span>
                                <span className="text-2xl font-bold text-primary">
                                    $
                                    {isNaN(totals.total)
                                        ? "0.00"
                                        : totals.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Overview */}
                {
                    projectOverview && (
                        <div className="border-t border-border pt-6">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Project Overview:
                            </h3>
                            <p className="text-muted-foreground">{projectOverview}</p>
                        </div>
                    )
                }

                {/* Budget Notes */}
                {
                    budgetNotes && (
                        <div className="border-t border-border pt-6">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Budget Notes:
                            </h3>
                            <p className="text-muted-foreground">{budgetNotes}</p>
                        </div>
                    )
                }

                {/* Actions - Prominent at Bottom */}
                <div className="border-t border-border pt-6 flex flex-col sm:flex-row gap-4 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-all hover:shadow-lg text-lg font-semibold"
                    >
                        <FileDown size={22} />
                        Export PDF
                    </button>

                    <button
                        onClick={insertToEditor}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-lg transition-all hover:shadow-lg text-lg font-semibold"
                        title="Insert SOW content directly into editor"
                    >
                        <ArrowDownToLine size={22} />
                        Insert to Editor
                    </button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2 no-print">
                    Export as PDF or insert directly into the Novel editor
                </p>

                {/* Closing Statement - Mandatory Compliance */}
                <div className="w-full text-center py-8 text-gray-500 italic font-medium">
                    *** This concludes the Scope of Work document. ***
                </div>

                {/* Print-only footer */}
                <div className="print-footer hidden print:block">
                    Social Garden • Statement of Work • {clientName}
                </div>
            </div>
        </>
    );
};

// Wrap with Interactable
export const FullSOWDocument = withInteractable(FullSOWDocumentBase, {
    componentName: "FullSOWDocument",
    description:
        "Complete multi-scope SOW document with interactive pricing tables, deliverables, assumptions, and budget tracking",
    propsSchema: fullSOWSchema,
});

export default FullSOWDocument;
