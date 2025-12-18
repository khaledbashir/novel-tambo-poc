"use client";

import React from "react";
import { z } from "zod";

/**
 * Props schema for the demo SOW preview component
 */
export const sowPreviewSchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  deliverables: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      hours: z.number().optional(),
    })
  ),
  totalHours: z.number().optional(),
  totalCost: z.number().optional(),
});

export type SOWPreviewProps = z.infer<typeof sowPreviewSchema> & {
  onInsert?: (content: string) => void;
};

/**
 * Demo SOW Preview Component
 * Displays a visual preview of a Statement of Work with actions to insert into editor,
 * copy JSON, or download as PDF/JSON.
 */
export const POCSOWPreview: React.FC<SOWPreviewProps> = ({
  title,
  summary,
  deliverables,
  totalHours,
  totalCost,
  onInsert,
}) => {
  const handleInsert = () => {
    if (!onInsert) return;

    // Generate markdown table format for the editor
    const markdown = generateMarkdownTable({
      title,
      summary,
      deliverables,
      totalHours,
      totalCost,
    });

    onInsert(markdown);
  };

  const handleCopyJSON = async () => {
    const jsonData = {
      title,
      summary,
      deliverables,
      totalHours,
      totalCost,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
      // You could add a toast notification here
      console.log("JSON copied to clipboard");
    } catch (err) {
      console.error("Failed to copy JSON:", err);
    }
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF download functionality
    // This would typically call a PDF generation service
    console.log("PDF download not yet implemented");
  };

  const handleDownloadJSON = () => {
    const jsonData = {
      title,
      summary,
      deliverables,
      totalHours,
      totalCost,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-sow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {summary && (
          <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
        )}
      </div>

      {/* Deliverables Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Deliverables
        </h3>
        <div className="space-y-3">
          {deliverables.map((deliverable, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-md border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {deliverable.name}
                  </h4>
                  {deliverable.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {deliverable.description}
                    </p>
                  )}
                </div>
                {deliverable.hours && (
                  <div className="ml-4 text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {deliverable.hours}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      {(totalHours || totalCost) && (
        <div className="mb-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {totalHours && (
              <div>
                <span className="text-sm text-gray-600">Total Hours:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {totalHours}h
                </span>
              </div>
            )}
            {totalCost && (
              <div>
                <span className="text-sm text-gray-600">Total Cost:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 mt-auto">
        {onInsert && (
          <button
            onClick={handleInsert}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Insert to Editor
          </button>
        )}
        <button
          onClick={handleCopyJSON}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Copy JSON
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Download PDF
        </button>
        <button
          onClick={handleDownloadJSON}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Download JSON
        </button>
      </div>
    </div>
  );
};

/**
 * Generate markdown table format for editor insertion
 */
function generateMarkdownTable(data: {
  title: string;
  summary?: string;
  deliverables: Array<{ name: string; description?: string; hours?: number }>;
  totalHours?: number;
  totalCost?: number;
}): string {
  let markdown = `# ${data.title}\n\n`;

  if (data.summary) {
    markdown += `${data.summary}\n\n`;
  }

  markdown += `## Deliverables\n\n`;
  markdown += `| Name | Description | Hours |\n`;
  markdown += `|------|-------------|-------|\n`;

  for (const deliverable of data.deliverables) {
    const name = deliverable.name || "";
    const description = deliverable.description || "";
    const hours = deliverable.hours?.toString() || "";
    markdown += `| ${name} | ${description} | ${hours} |\n`;
  }

  markdown += `\n`;

  if (data.totalHours || data.totalCost) {
    markdown += `## Summary\n\n`;
    if (data.totalHours) {
      markdown += `**Total Hours:** ${data.totalHours}h\n\n`;
    }
    if (data.totalCost) {
      markdown += `**Total Cost:** $${data.totalCost.toLocaleString()}\n\n`;
    }
  }

  return markdown;
}

/**
 * Create the component registration object
 */
export function createDemoSOWComponent() {
  return {
    name: "poc-sow-preview",
    description: "Demo SOW preview component with insert, copy, and download actions",
    component: POCSOWPreview,
    propsSchema: sowPreviewSchema,
  };
}

