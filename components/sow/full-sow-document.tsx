"use client";

import React, { useState } from "react";
import {
    Trash2,
    Plus,
    GripVertical,
    FileDown,
    ArrowDownToLine,
    FileSpreadsheet,
} from "lucide-react";
import { z } from "zod";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notifications } from "@/lib/utils";

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
    const [hideGrandTotal, setHideGrandTotal] = useState(false);

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

    // Calculations
    const calculateScopeTotal = (scope: Scope) => {
        if (!scope.roles || scope.roles.length === 0) return 0;
        return scope.roles.reduce(
            (sum, row) => sum + (row.hours || 0) * (row.rate || 0),
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
        const discountAmount = subtotal * (discount / 100);
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

    // Drag and drop state
    const [draggedRow, setDraggedRow] = useState<{
        scopeId: string;
        rowId: string;
        index: number;
    } | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (scopeId: string, rowId: string, index: number) => {
        setDraggedRow({ scopeId, rowId, index });
    };

    const handleDragOver = (index: number) => {
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        if (!draggedRow || dragOverIndex === null) {
            setDraggedRow(null);
            setDragOverIndex(null);
            return;
        }

        const { scopeId, index: fromIndex } = draggedRow;
        const toIndex = dragOverIndex;

        if (fromIndex === toIndex) {
            setDraggedRow(null);
            setDragOverIndex(null);
            return;
        }

        // Reorder the rows
        setScopes((prev) =>
            prev.map((scope) =>
                scope.id === scopeId
                    ? {
                        ...scope,
                        roles: (() => {
                            const newRoles = [...scope.roles];
                            const [removed] = newRoles.splice(fromIndex, 1);
                            newRoles.splice(toIndex, 0, removed);
                            return newRoles;
                        })(),
                    }
                    : scope,
            ),
        );

        setDraggedRow(null);
        setDragOverIndex(null);
    };

    // Export SOW to PDF using jsPDF - NIDA Design Overhaul
    const handleExportPDF = async () => {
        if (!scopes || scopes.length === 0) {
            notifications.error(
                "No content to export",
                "Please add SOW sections before exporting to PDF",
            );
            return;
        }

        const doc = new jsPDF();
        const brandGreen: [number, number, number] = [0, 208, 132]; // #00D084
        const lightGray: [number, number, number] = [249, 250, 251]; // #F9FAFB
        const gray: [number, number, number] = [229, 231, 235]; // #E5E7EB
        const logoUrl = "/images/logogreendark.png";

        // Load Plus Jakarta Sans font
        try {
            // Note: For production, consider embedding font as Base64
            // For now, using default font with custom styling
            doc.setFont("helvetica");
        } catch (error) {
            console.warn("Font loading issue, using default:", error);
        }

        // CENTERED LOGO - Clean white background
        try {
            const loadImage = (url: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                });
            };

            try {
                const img = await loadImage(logoUrl);
                const imgWidth = 40; // Larger logo
                const imgHeight = (img.height * imgWidth) / img.width;
                const imgX = (210 - imgWidth) / 2; // Center horizontally
                doc.addImage(img, "PNG", imgX, 15, imgWidth, imgHeight);
            } catch (e) {
                console.warn("Logo not found, skipping");
            }
        } catch (error) {
            console.error("Error loading logo:", error);
        }

        let yPosition = 45; // Start after logo with whitespace

        // Process each scope with NIDA UNIFIED TABLE structure
        scopes.forEach((scope, scopeIndex) => {
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            // Build unified table body array
            const tableBody: any[] = [];

            // Row A: Scope Header (Green #00D084, Bold, Colspan 5)
            tableBody.push([
                {
                    content: `Scope ${scopeIndex + 1}: ${scope.title}`,
                    colSpan: 5,
                    styles: {
                        fillColor: brandGreen,
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 14,
                        cellPadding: 4,
                    },
                },
            ]);

            // Row B: Description (Italic, Colspan 5, Padding 5)
            tableBody.push([
                {
                    content: scope.description,
                    colSpan: 5,
                    styles: {
                        fontStyle: "italic",
                        fontSize: 10,
                        cellPadding: 5,
                    },
                },
            ]);

            // Row C: Deliverables Header (Light Gray #F9FAFB, Bold, Colspan 5)
            if (scope.deliverables && scope.deliverables.length > 0) {
                tableBody.push([
                    {
                        content: "Deliverables:",
                        colSpan: 5,
                        styles: {
                            fontStyle: "bold",
                            fontSize: 10,
                            fillColor: lightGray,
                            cellPadding: 2,
                        },
                    },
                ]);

                // Row D: Deliverables List (Colspan 5)
                const deliverablesText = scope.deliverables
                    .map((item) => `• ${item}`)
                    .join("\n");
                tableBody.push([
                    {
                        content: deliverablesText,
                        colSpan: 5,
                        styles: {
                            fontSize: 9,
                            cellPadding: 3,
                        },
                    },
                ]);
            }

            // Row E: Roles (Standard columns: ITEMS, ROLE, HOURS, RATE, TOTAL COST + GST)
            (scope.roles || []).forEach((row) => {
                const rowCost = (row.hours || 0) * (row.rate || 0);
                const rowGST = rowCost * 0.1;
                const rowTotal = rowCost + rowGST;

                tableBody.push([
                    row.task || "",
                    row.role || "",
                    (row.hours || 0).toString(),
                    `$${(row.rate || 0).toFixed(2)}`,
                    `$${rowTotal.toFixed(2)}`,
                ]);
            });

            // Row F: Assumptions Header (Light Gray #F9FAFB, Bold, Colspan 5)
            if (scope.assumptions && scope.assumptions.length > 0) {
                tableBody.push([
                    {
                        content: "Assumptions:",
                        colSpan: 5,
                        styles: {
                            fontStyle: "bold",
                            fontSize: 10,
                            fillColor: lightGray,
                            cellPadding: 2,
                        },
                    },
                ]);

                // Row G: Assumptions List (Colspan 5)
                const assumptionsText = scope.assumptions
                    .map((item) => `• ${item}`)
                    .join("\n");
                tableBody.push([
                    {
                        content: assumptionsText,
                        colSpan: 5,
                        styles: {
                            fontSize: 9,
                            cellPadding: 3,
                        },
                    },
                ]);
            }

            // Row H: Scope Total (Gray #E5E7EB, Bold, Right Align, Colspan 5)
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;

            tableBody.push([
                {
                    content: `Scope Total: $${scopeTotalWithGST.toFixed(2)}`,
                    colSpan: 5,
                    styles: {
                        fontStyle: "bold",
                        halign: "right",
                        fillColor: gray,
                        fontSize: 11,
                        cellPadding: 3,
                    },
                },
            ]);

            // Render unified table
            autoTable(doc, {
                startY: yPosition,
                head: [["ITEMS", "ROLE", "HOURS", "RATE", "TOTAL COST + GST"]],
                body: tableBody,
                theme: "grid",
                styles: { fontSize: 9, font: "helvetica" },
                headStyles: {
                    fillColor: brandGreen,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 10,
                },
                margin: { left: 14, right: 14 },
                columnStyles: {
                    2: { halign: "center" },
                    3: { halign: "center" },
                    4: { halign: "right" },
                },
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        });

        // SCOPE & PRICE OVERVIEW TABLE
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Scope & Price Overview", 105, 20, { align: "center" });

        const overviewData = scopes.map((scope, idx) => {
            const scopeTotal = calculateScopeTotal(scope);
            const scopeHours = (scope.roles || []).reduce(
                (sum, row) => sum + (row.hours || 0),
                0,
            );
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;

            return [
                `Scope ${idx + 1}: ${scope.title}`,
                scopeHours.toString(),
                `$${scopeTotalWithGST.toFixed(2)}`,
            ];
        });

        // Add total row
        const totalHours = scopes.reduce(
            (sum, scope) =>
                sum +
                (scope.roles || []).reduce((s, r) => s + (r.hours || 0), 0),
            0,
        );
        overviewData.push([
            "TOTAL PROJECT",
            totalHours.toString(),
            `$${totals.total.toFixed(2)}`,
        ]);

        autoTable(doc, {
            startY: 30,
            head: [["SCOPE", "ESTIMATED TOTAL HOURS", "TOTAL COST"]],
            body: overviewData,
            theme: "grid",
            styles: { fontSize: 10 },
            headStyles: {
                fillColor: brandGreen,
                textColor: [255, 255, 255],
                fontStyle: "bold",
            },
            columnStyles: {
                1: { halign: "center" },
                2: { halign: "right" },
            },
            // Make last row (total) bold
            didParseCell: function (data) {
                if (data.row.index === overviewData.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fontSize = 11;
                }
            },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 20;

        // PROJECT OVERVIEW & BUDGET NOTES with Green Bar Style (Rectangles)
        if (projectOverview) {
            // Green bar rectangle
            doc.setFillColor(brandGreen[0], brandGreen[1], brandGreen[2]);
            // Calculate height based on text
            const overviewLines = doc.splitTextToSize(projectOverview, 170);
            const textHeight = overviewLines.length * 5 + 15; // Approx height
            doc.rect(14, yPosition, 2, textHeight, "F"); // 2mm wide green bar

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Project Overview", 20, yPosition + 5);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(overviewLines, 20, yPosition + 12);
            yPosition += textHeight + 10;
        }

        if (budgetNotes) {
            // Green bar rectangle
            doc.setFillColor(brandGreen[0], brandGreen[1], brandGreen[2]);
            // Calculate height based on text
            const notesLines = doc.splitTextToSize(budgetNotes, 170);
            const textHeight = notesLines.length * 5 + 15; // Approx height
            doc.rect(14, yPosition, 2, textHeight, "F"); // 2mm wide green bar

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Budget Notes", 20, yPosition + 5);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(notesLines, 20, yPosition + 12);
            yPosition += textHeight + 10;
        }

        // FINANCIAL SUMMARY (Bottom Right)
        // Check if we need a new page for summary
        if (yPosition > 220) {
            doc.addPage();
            yPosition = 20;
        } else {
            yPosition += 10;
        }

        const summaryX = 120;
        const summaryWidth = 80;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Subtotal:", summaryX, yPosition);
        doc.text(`$${totals.subtotal.toFixed(2)}`, 200, yPosition, {
            align: "right",
        });
        yPosition += 7;

        if (discount > 0) {
            doc.setFont("helvetica", "normal");
            doc.text(`Discount (${discount}%):`, summaryX, yPosition);
            doc.text(`-$${totals.discountAmount.toFixed(2)}`, 200, yPosition, {
                align: "right",
            });
            yPosition += 7;

            doc.text("After Discount:", summaryX, yPosition);
            doc.text(`$${totals.afterDiscount.toFixed(2)}`, 200, yPosition, {
                align: "right",
            });
            yPosition += 7;
        }

        doc.setFont("helvetica", "normal");
        doc.text("GST (10%):", summaryX, yPosition);
        doc.text(`$${totals.gst.toFixed(2)}`, 200, yPosition, {
            align: "right",
        });
        yPosition += 8;

        // Total Line
        doc.setDrawColor(200, 200, 200);
        doc.line(summaryX, yPosition - 4, 200, yPosition - 4);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(brandGreen[0], brandGreen[1], brandGreen[2]);
        doc.text("TOTAL (AUD):", summaryX, yPosition);
        doc.text(`$${totals.total.toFixed(2)}`, 200, yPosition, {
            align: "right",
        });
        doc.setTextColor(0, 0, 0);

        // GREEN FOOTER BAR on every page
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFillColor(brandGreen[0], brandGreen[1], brandGreen[2]);
            doc.rect(0, 287, 210, 10, "F"); // Green bar at bottom

            // Optional legal text above the bar
            if (i === pageCount) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 100, 100);
                doc.text(
                    "*** This concludes the Scope of Work document. ***",
                    105,
                    283,
                    { align: "center" },
                );
                doc.setTextColor(0, 0, 0);
            }
        }

        // Save
        doc.save(`${projectTitle.replace(/[^a-z0-9]/gi, "_")}_SOW.pdf`);
    };

    // Insert SOW content directly into editor
    const insertToEditor = () => {
        if (!scopes || scopes.length === 0) {
            notifications.error(
                "No content to insert",
                "Please add SOW sections before inserting to editor",
            );
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

    // Export SOW data to Excel (.xlsx) with multiple worksheets
    const handleExportExcel = () => {
        if (!scopes || scopes.length === 0) {
            notifications.error(
                "No content to export",
                "Please add SOW sections before exporting to Excel",
            );
            return;
        }

        const workbook = XLSX.utils.book_new();

        // Worksheet 1: Financial Summary
        const summaryData = [
            ["Project", projectTitle],
            ["Client", clientName],
            [""],
            ["Financial Summary", ""],
            ["Subtotal", totals.subtotal.toFixed(2)],
        ];

        if (discount > 0) {
            summaryData.push([
                "Discount (" + discount + "%)",
                "-" + totals.discountAmount.toFixed(2),
            ]);
            summaryData.push([
                "After Discount",
                totals.afterDiscount.toFixed(2),
            ]);
        }

        summaryData.push(["GST (10%)", totals.gst.toFixed(2)]);
        summaryData.push(["TOTAL (AUD)", totals.total.toFixed(2)]);
        summaryData.push([""]);
        summaryData.push(["Scope Breakdown", ""]);

        scopes.forEach((scope, idx) => {
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            const scopeHours = (scope.roles || []).reduce(
                (sum, row) => sum + (row.hours || 0),
                0,
            );
            summaryData.push([
                `Scope ${idx + 1}: ${scope.title}`,
                scopeHours + " hrs",
                "$" + scopeTotalWithGST.toFixed(2),
            ]);
        });

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Worksheet 2+: Each Scope Detail
        scopes.forEach((scope, scopeIndex) => {
            const scopeData = [
                [`Scope ${scopeIndex + 1}: ${scope.title}`],
                [scope.description],
                [""],
            ];

            // Deliverables
            if (scope.deliverables && scope.deliverables.length > 0) {
                scopeData.push(["Deliverables:"]);
                scope.deliverables.forEach((item) =>
                    scopeData.push(["  • " + item]),
                );
                scopeData.push([""]);
            }

            // Pricing Table Header
            scopeData.push([
                "Task/Description",
                "Role",
                "Hours",
                "Rate (AUD)",
                "Cost (AUD)",
                "GST (AUD)",
                "Total + GST (AUD)",
            ]);

            // Pricing Rows
            (scope.roles || []).forEach((row) => {
                const rowCost = (row.hours || 0) * (row.rate || 0);
                const rowGST = rowCost * 0.1;
                const rowTotal = rowCost + rowGST;
                scopeData.push([
                    row.task || "",
                    row.role || "",
                    String(row.hours || 0),
                    String(row.rate || 0),
                    rowCost.toFixed(2),
                    rowGST.toFixed(2),
                    rowTotal.toFixed(2),
                ]);
            });

            // Scope Total
            const scopeTotal = calculateScopeTotal(scope);
            const scopeGST = scopeTotal * 0.1;
            const scopeTotalWithGST = scopeTotal + scopeGST;
            scopeData.push([
                "",
                "",
                "",
                "Scope Total:",
                scopeTotal.toFixed(2),
                scopeGST.toFixed(2),
                scopeTotalWithGST.toFixed(2),
            ]);
            scopeData.push([""]);

            // Assumptions
            if (scope.assumptions && scope.assumptions.length > 0) {
                scopeData.push(["Assumptions:"]);
                scope.assumptions.forEach((item) =>
                    scopeData.push(["  • " + item]),
                );
            }

            const scopeSheet = XLSX.utils.aoa_to_sheet(scopeData);
            XLSX.utils.book_append_sheet(
                workbook,
                scopeSheet,
                `Scope ${scopeIndex + 1}`,
            );
        });

        // Write file
        XLSX.writeFile(
            workbook,
            `${projectTitle.replace(/[^a-z0-9]/gi, "_")}_SOW.xlsx`,
        );
    };

    return (
        <div className="sow-print-container w-full max-w-7xl mx-auto p-8 bg-card rounded-lg border border-border shadow-lg space-y-8">
            {/* Header - Centered Logo */}
            <div className="flex flex-col items-center border-b border-border pb-8 mb-8">
                <img
                    src="/images/logogreendark.png"
                    alt="Social Garden"
                    className="h-16 mb-6"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            </div>

            {/* Scopes */}
            {scopes && scopes.length > 0 ? (
                <>
                    {scopes.map((scope, scopeIndex) => (
                        <div key={scope.id} className="space-y-8">
                            {/* Single Continuous Table - Gold Standard Format */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-border">
                                    <thead>
                                        <tr className="bg-emerald-600 border-b-2 border-emerald-700">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-white w-8"></th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-white min-w-[400px]">
                                                ITEMS
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap">
                                                ROLE
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-white w-24 whitespace-nowrap">
                                                HOURS
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-white w-24 whitespace-nowrap">
                                                RATE
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-white w-32 whitespace-nowrap">
                                                TOTAL COST + GST
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-white w-16">
                                                ACTIONS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Scope Title Row - Full Width */}
                                        <tr className="bg-emerald-600 border-b border-emerald-700">
                                            <td
                                                colSpan={7}
                                                className="px-4 py-3 text-xl font-bold text-white"
                                            >
                                                Scope {scopeIndex + 1}:{" "}
                                                {scope.title}
                                            </td>
                                        </tr>

                                        {/* Scope Description Row - Full Width */}
                                        <tr className="border-b border-border bg-card">
                                            <td
                                                colSpan={7}
                                                className="px-4 py-3 text-muted-foreground italic"
                                            >
                                                {scope.description}
                                            </td>
                                        </tr>

                                        {/* Deliverables Section - Full Width */}
                                        {scope.deliverables &&
                                            scope.deliverables.length > 0 && (
                                                <React.Fragment
                                                    key={`${scope.id}-deliverables-section`}
                                                >
                                                    <tr className="bg-muted/50 border-b border-border">
                                                        <td
                                                            colSpan={7}
                                                            className="px-4 py-2 font-bold text-foreground"
                                                        >
                                                            Deliverables:
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b-2 border-border">
                                                        <td
                                                            colSpan={7}
                                                            className="px-4 py-3"
                                                        >
                                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                                {scope.deliverables.map(
                                                                    (
                                                                        item,
                                                                        idx,
                                                                    ) => (
                                                                        <li
                                                                            key={`${scope.id}-deliverable-${idx}`}
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            )}

                                        {/* Role/Task Rows */}
                                        {(scope.roles || []).map((row) => {
                                            const rowCost =
                                                (row.hours || 0) *
                                                (row.rate || 0);
                                            const rowGST = rowCost * 0.1;
                                            const rowTotal = rowCost + rowGST;

                                            const rowIndex =
                                                scope.roles?.indexOf(row) ?? 0;
                                            const isDragging =
                                                draggedRow?.rowId === row.id &&
                                                draggedRow?.scopeId ===
                                                scope.id;

                                            return (
                                                <tr
                                                    key={`${scope.id}-${row.id}`}
                                                    draggable
                                                    onDragStart={() =>
                                                        handleDragStart(
                                                            scope.id,
                                                            row.id,
                                                            rowIndex,
                                                        )
                                                    }
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        if (
                                                            draggedRow?.scopeId ===
                                                            scope.id
                                                        ) {
                                                            handleDragOver(
                                                                rowIndex,
                                                            );
                                                        }
                                                    }}
                                                    onDragEnd={handleDragEnd}
                                                    className={`border-b border-border transition-colors hover:bg-muted/50 ${isDragging
                                                            ? "opacity-50"
                                                            : ""
                                                        } ${dragOverIndex ===
                                                            rowIndex &&
                                                            draggedRow?.scopeId ===
                                                            scope.id
                                                            ? "border-t-2 border-t-primary"
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
                                                            value={
                                                                row.task || ""
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "task",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="e.g., Handle HubSpot setup..."
                                                            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={
                                                                row.role || ""
                                                            }
                                                            onChange={(e) =>
                                                                handleRoleSelect(
                                                                    scope.id,
                                                                    row.id,
                                                                    e.target
                                                                        .value,
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
                                                                        key={`${row.id}-${role.name}-${idx}`}
                                                                        value={
                                                                            role.name
                                                                        }
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={
                                                                row.hours || 0
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "hours",
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
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
                                                                row.rate || 0
                                                            }
                                                            onChange={(e) =>
                                                                updateRow(
                                                                    scope.id,
                                                                    row.id,
                                                                    "rate",
                                                                    parseFloat(
                                                                        e.target
                                                                            .value,
                                                                    ) || 0,
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

                                        {/* Assumptions Section - Full Width */}
                                        {scope.assumptions &&
                                            scope.assumptions.length > 0 && (
                                                <React.Fragment
                                                    key={`${scope.id}-assumptions-section`}
                                                >
                                                    <tr className="bg-muted/50 border-t-2 border-border">
                                                        <td
                                                            colSpan={7}
                                                            className="px-4 py-2 font-bold text-foreground"
                                                        >
                                                            Assumptions:
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b-2 border-border">
                                                        <td
                                                            colSpan={7}
                                                            className="px-4 py-3"
                                                        >
                                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                                {scope.assumptions.map(
                                                                    (
                                                                        item,
                                                                        idx,
                                                                    ) => (
                                                                        <li
                                                                            key={`${scope.id}-assumption-${idx}`}
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Add Role Button */}
                            <button
                                onClick={() => addRow(scope.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition text-sm"
                            >
                                <Plus size={16} /> Add Role
                            </button>
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-center p-8 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                        No scopes defined yet. Tambo will generate SOW scopes
                        here.
                    </p>
                </div>
            )}

            {/* Scope & Price Overview */}
            <div className="border-t border-border pt-8">
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
                            {scopes &&
                                scopes.length > 0 &&
                                scopes.map((scope, idx) => {
                                    const scopeTotal =
                                        calculateScopeTotal(scope);
                                    const scopeHours = (
                                        scope.roles || []
                                    ).reduce(
                                        (sum, row) => sum + (row.hours || 0),
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
                                                {scopeHours}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                ${scopeTotalWithGST.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            <tr className="bg-muted border-t-2 border-border">
                                <td className="px-4 py-3 font-bold text-lg">
                                    TOTAL PROJECT
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-lg">
                                    {scopes && scopes.length > 0
                                        ? scopes.reduce(
                                            (sum, scope) =>
                                                sum +
                                                (scope.roles || []).reduce(
                                                    (s, r) =>
                                                        s + (r.hours || 0),
                                                    0,
                                                ),
                                            0,
                                        )
                                        : 0}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                                    ${totals.total.toFixed(2)}
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
                        {/* Hide Total Toggle */}
                        <div className="flex justify-between items-center pb-3 border-b border-border">
                            <label className="text-sm font-medium text-foreground">
                                Hide Grand Total:
                            </label>
                            <button
                                onClick={() =>
                                    setHideGrandTotal(!hideGrandTotal)
                                }
                                className={`px-3 py-1 rounded-md transition text-sm font-medium ${hideGrandTotal
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted-foreground/20 text-foreground"
                                    }`}
                            >
                                {hideGrandTotal ? "Hidden" : "Visible"}
                            </button>
                        </div>

                        {/* Discount Input */}
                        <div className="flex justify-between items-center pb-3 border-b border-border">
                            <label className="text-sm font-medium text-foreground">
                                Discount (%):
                            </label>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) =>
                                    setDiscount(
                                        Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                parseFloat(e.target.value) || 0,
                                            ),
                                        ),
                                    )
                                }
                                min="0"
                                max="100"
                                className="w-20 px-3 py-1 border border-input rounded-md text-right bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {!hideGrandTotal && (
                            <>
                                <div className="flex justify-between text-foreground">
                                    <span className="text-sm">Subtotal:</span>
                                    <span className="font-semibold">
                                        ${totals.subtotal.toFixed(2)}
                                    </span>
                                </div>

                                {discount > 0 && (
                                    <>
                                        <div className="flex justify-between text-destructive text-sm">
                                            <span>Discount ({discount}%):</span>
                                            <span>
                                                -$
                                                {totals.discountAmount.toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-foreground">
                                            <span className="text-sm">
                                                After Discount:
                                            </span>
                                            <span className="font-semibold">
                                                $
                                                {totals.afterDiscount.toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between text-foreground">
                                    <span className="text-sm">GST (10%):</span>
                                    <span className="font-semibold">
                                        +${totals.gst.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t-2 border-border">
                                    <span className="font-bold text-foreground">
                                        Total (AUD):
                                    </span>
                                    <span className="text-2xl font-bold text-primary">
                                        ${totals.total.toFixed(2)}
                                    </span>
                                </div>
                            </>
                        )}

                        {hideGrandTotal && (
                            <div className="text-center py-4 text-muted-foreground text-sm italic">
                                Grand total hidden for multi-option presentation
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Project Overview */}
            {projectOverview && (
                <div className="border-t border-border pt-8">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        Project Overview:
                    </h3>
                    <p className="text-muted-foreground">{projectOverview}</p>
                </div>
            )}

            {/* Budget Notes */}
            {budgetNotes && (
                <div className="border-t border-border pt-8">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        Budget Notes:
                    </h3>
                    <p className="text-muted-foreground">{budgetNotes}</p>
                </div>
            )}

            {/* Legal Concluding Statement */}
            <div className="border-t border-border pt-8 text-center">
                <p className="text-sm font-medium text-foreground">
                    *** This concludes the Scope of Work document. ***
                </p>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-border pt-8 space-y-4">
                {/* Insert Button - Minimal & Clean */}
                <div className="flex flex-col gap-1">
                    <button
                        onClick={insertToEditor}
                        className="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-xs font-medium uppercase tracking-wide shadow-sm"
                        title="Insert SOW content directly into editor"
                    >
                        <ArrowDownToLine size={14} />
                        Insert to Editor
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center opacity-70">
                        Insert directly into the editor
                    </p>
                </div>

                {/* Export Buttons - Subtle Outline Style */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent("export-editor-pdf"),
                            )
                        }
                        className="flex items-center justify-center gap-2 h-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground rounded-md transition-colors text-xs font-medium"
                        title="Export to PDF"
                    >
                        <FileDown size={13} className="text-blue-500" />
                        PDF
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center gap-2 h-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground rounded-md transition-colors text-xs font-medium"
                        title="Export to Excel"
                    >
                        <FileSpreadsheet size={13} className="text-green-500" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Print-specific CSS */}
            <style jsx global>{`
                /* Import Plus Jakarta Sans font for PDFs */
                @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap");

                @media print {
                    /* Hide everything except the SOW content */
                    body * {
                        visibility: hidden;
                    }

                    /* Show only the SOW document and its children */
                    .sow-print-container,
                    .sow-print-container * {
                        visibility: visible;
                    }

                    /* Position at top of page */
                    .sow-print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Hide interactive elements */
                    button,
                    input,
                    select,
                    .no-print {
                        display: none !important;
                    }

                    /* Page setup */
                    @page {
                        margin: 2cm;
                        size: A4;
                    }

                    /* Typography - Use Plus Jakarta Sans */
                    body {
                        font-family:
                            "Plus Jakarta Sans",
                            -apple-system,
                            BlinkMacSystemFont,
                            "Segoe UI",
                            sans-serif;
                        font-size: 11pt;
                        line-height: 1.5;
                        color: #000;
                        background: white;
                    }

                    /* Headings */
                    h1 {
                        font-family: "Plus Jakarta Sans", sans-serif;
                        font-size: 24pt;
                        margin-bottom: 0.5cm;
                        page-break-after: avoid;
                    }

                    h2 {
                        font-family: "Plus Jakarta Sans", sans-serif;
                        font-size: 16pt;
                        margin-top: 0.5cm;
                        margin-bottom: 0.3cm;
                        page-break-after: avoid;
                    }

                    h3 {
                        font-family: "Plus Jakarta Sans", sans-serif;
                        font-size: 13pt;
                        margin-top: 0.4cm;
                        margin-bottom: 0.2cm;
                        page-break-after: avoid;
                    }

                    /* Tables */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        page-break-inside: avoid;
                        margin: 0.5cm 0;
                        font-family: "Plus Jakarta Sans", sans-serif;
                    }

                    th,
                    td {
                        border: 1px solid #333;
                        padding: 8px;
                        text-align: left;
                    }

                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold;
                    }

                    /* Avoid breaking inside important sections */
                    .space-y-4 > div,
                    .space-y-8 > div {
                        page-break-inside: avoid;
                    }

                    /* Lists */
                    ul,
                    ol {
                        margin: 0.3cm 0;
                        padding-left: 1cm;
                    }

                    li {
                        margin: 0.1cm 0;
                    }

                    /* Remove shadows and borders that don't print well */
                    * {
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    /* Ensure proper spacing */
                    .border-t {
                        border-top: 1px solid #333 !important;
                        margin-top: 0.5cm;
                        padding-top: 0.5cm;
                    }
                }
            `}</style>
        </div>
    );
};

// Export directly without Interactable wrapper to prevent infinite loops
export const FullSOWDocument = FullSOWDocumentBase;

export default FullSOWDocument;
