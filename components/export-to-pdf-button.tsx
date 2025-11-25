"use client";

import React from "react";
import { toast } from "sonner";

interface SOWItem {
    description: string;
    role: string;
    hours: number;
    cost: number;
}

interface SOWScope {
    name: string;
    description: string;
    items: SOWItem[];
    deliverables: string[];
    assumptions?: string[];
}

interface ExportToPDFButtonProps {
    projectTitle: string;
    clientName: string;
    projectDescription: string;
    scopes: SOWScope[];
    grandTotal: number;
    budgetNotes: string;
    className?: string;
    children?: React.ReactNode;
}

/**
 * Export to PDF Button Component
 *
 * Usage:
 * ```tsx
 * <ExportToPDFButton
 *   projectTitle="HubSpot Integration"
 *   clientName="Acme Corp"
 *   projectDescription="Complete HubSpot setup..."
 *   scopes={scopesData}
 *   grandTotal={25608.00}
 *   budgetNotes="Payment terms..."
 * >
 *   Export to PDF
 * </ExportToPDFButton>
 * ```
 */
export function ExportToPDFButton({
    projectTitle,
    clientName,
    projectDescription,
    scopes,
    grandTotal,
    budgetNotes,
    className = "",
    children = "Export to PDF",
}: ExportToPDFButtonProps) {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generating PDF...");

        try {
            const response = await fetch("/api/export-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectTitle,
                    clientName,
                    projectDescription,
                    scopes,
                    grandTotal,
                    budgetNotes,
                    date: new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: "Failed to generate PDF" }));
                throw new Error(errorData.error || "Failed to generate PDF");
            }

            // Get the PDF blob from response
            const pdfBlob = await response.blob();

            // Create download link
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = pdfUrl;

            // Generate filename from project title and current date
            const filename = `${projectTitle.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);

            toast.success("PDF exported successfully!", { id: toastId });
        } catch (err) {
            console.error("Export error:", err);
            toast.error(
                err instanceof Error ? err.message : "Failed to export PDF",
                { id: toastId },
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={
                className ||
                `
          px-6 py-3
          bg-primary text-primary-foreground
          rounded-lg font-semibold
          hover:bg-primary/90
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        `
            }
        >
            {isExporting ? "Generating..." : children}
        </button>
    );
}

/**
 * Example usage component
 */
export function ExportToPDFExample() {
    const exampleData = {
        projectTitle: "HubSpot Integration & Marketing Automation Setup",
        clientName: "Acme Corporation",
        projectDescription:
            "This Statement of Work outlines the scope, deliverables, and pricing for the HubSpot integration and marketing automation setup project.",
        scopes: [
            {
                name: "Scope 1: Discovery & Planning",
                description:
                    "Initial consultation and requirements gathering to understand business objectives and technical requirements.",
                items: [
                    {
                        description:
                            "Stakeholder interviews and requirements documentation",
                        role: "Senior Consultant",
                        hours: 8,
                        cost: 1760.0,
                    },
                    {
                        description:
                            "Technical assessment and integration planning",
                        role: "Technical Lead",
                        hours: 12,
                        cost: 2640.0,
                    },
                    {
                        description: "Project roadmap and timeline development",
                        role: "Project Manager",
                        hours: 6,
                        cost: 1188.0,
                    },
                ],
                deliverables: [
                    "Requirements documentation",
                    "Technical architecture diagram",
                    "Project timeline and milestones",
                ],
                assumptions: [
                    "Client provides access to all necessary systems within 2 business days",
                    "Key stakeholders are available for scheduled meetings",
                ],
            },
            {
                name: "Scope 2: HubSpot Configuration & Integration",
                description:
                    "Complete setup and configuration of HubSpot platform including CRM, Marketing Hub, and third-party integrations.",
                items: [
                    {
                        description: "HubSpot account setup and configuration",
                        role: "HubSpot Specialist",
                        hours: 16,
                        cost: 3168.0,
                    },
                    {
                        description: "CRM data migration and cleanup",
                        role: "Data Analyst",
                        hours: 20,
                        cost: 3520.0,
                    },
                    {
                        description:
                            "Third-party integrations (Salesforce, Slack, etc.)",
                        role: "Integration Engineer",
                        hours: 24,
                        cost: 5280.0,
                    },
                ],
                deliverables: [
                    "Fully configured HubSpot account",
                    "Integrated CRM with clean, migrated data",
                    "Automated workflows for lead nurturing",
                ],
            },
        ],
        grandTotal: 17556.0,
        budgetNotes:
            "All pricing is inclusive of GST. Payment terms are Net 30 from invoice date.",
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">PDF Export Example</h2>
            <ExportToPDFButton {...exampleData} />
        </div>
    );
}
