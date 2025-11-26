import {
  TamboComponent,
  TamboTool,
  currentTimeContextHelper,
  currentPageContextHelper,
} from "@tambo-ai/react";
import { z } from "zod";
import { SOWPricingTable, sowPricingSchema } from "@/components/pricing/sow-pricing-table";
import { FullSOWDocument, fullSOWSchema } from "@/components/sow/full-sow-document";
import { BriefUpload, briefUploadSchema } from "@/components/sow/brief-upload";

/**
 * Tambo Components Registration
 * Register components that Tambo AI can generate
 */
export const tamboComponents: TamboComponent[] = [
  {
    name: "FullSOWDocument",
    description:
      "Complete multi-scope Statement of Work document with interactive pricing tables. Use this for generating COMPLETE SOWs from client requirements. Each scope includes: title, description, interactive pricing table with role dropdowns (92 roles from rate card), hours, rates, deliverables (bullet list), and assumptions (bullet list). Supports drag-and-drop row reordering, real-time GST calculations (10%), discount application, and budget tracking. Account Management roles MUST be placed at the bottom of each scope. Use when client requests a full SOW with multiple scopes (e.g., 'HubSpot integration and 2 landing pages').",
    component: FullSOWDocument,
    propsSchema: fullSOWSchema,
  },
  {
    name: "SOWPricingTable",
    description:
      "Single-scope interactive SOW pricing table with roles, hours, rates, discounts, GST calculations, budget tracking, and drag-and-drop reordering. Use for simple, single-scope pricing. For multi-scope SOWs, use FullSOWDocument instead. MUST include deliverables, scope overview, and assumptions. Account Management roles MUST be placed at the bottom.",
    component: SOWPricingTable,
    propsSchema: sowPricingSchema,
  },
  {
    name: "BriefUpload",
    description:
      "Displays metadata and preview for an uploaded and parsed client brief PDF. Use after successfully ingesting a PDF brief with the ingest_client_brief tool. Shows file name, page count, word count, and brief preview.",
    component: BriefUpload,
    propsSchema: briefUploadSchema,
  },
];

/**
 * Tambo Tools Registration
 * Register tools that Tambo AI can call
 */
export const tamboTools: TamboTool[] = [
  {
    name: "getCurrentTime",
    description: "A tool to get the current time and date",
    tool: () => {
      return new Date().toISOString();
    },
    toolSchema: z.function().returns(z.string()),
  },
  {
    name: "ingest_client_brief",
    description: "Upload a client brief PDF to the AnythingLLM Knowledge Base. Use this when the user uploads a PDF brief. Returns metadata and confirms availability for RAG queries. DOES NOT return full text. You MUST use the 'consult_knowledge_base' tool to read specific parts of the brief.",
    tool: async (params: { fileData: string; fileName: string }) => {
      try {
        // Convert base64 to blob
        const response = await fetch(params.fileData);
        const blob = await response.blob();

        // Create FormData
        const formData = new FormData();
        formData.append('file', blob, params.fileName);

        // Call server-side API
        const apiResponse = await fetch('/api/ingest-brief', {
          method: 'POST',
          body: formData,
        });

        if (!apiResponse.ok) {
          const error = await apiResponse.json();
          throw new Error(error.error || 'Failed to upload brief');
        }

        const result = await apiResponse.json();
        return {
          success: true,
          message: "Brief uploaded to Knowledge Base. Use 'consult_knowledge_base' to query it.",
          fileName: result.metadata.fileName,
          uploadedAt: result.metadata.uploadedAt,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to upload brief',
        };
      }
    },
    toolSchema: z.function()
      .args(
        z.object({
          fileData: z.string().describe('Base64-encoded PDF file data (data URL)'),
          fileName: z.string().describe('Name of the PDF file'),
        })
      )
      .returns(
        z.object({
          success: z.boolean(),
          message: z.string().optional(),
          fileName: z.string().optional(),
          uploadedAt: z.string().optional(),
          error: z.string().optional(),
        })
      ),
  },
  {
    name: "consult_knowledge_base",
    description: "Query the AnythingLLM Knowledge Base for information from the uploaded brief. Use this to extract specific requirements, deliverables, timelines, or budget details from the brief to populate the SOW.",
    tool: async (params: { query: string }) => {
      try {
        const response = await fetch('/api/consult-knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: params.query }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to query knowledge base');
        }

        const result = await response.json();
        return {
          success: true,
          answer: result.text,
          sources: result.sources,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to query knowledge base',
        };
      }
    },
    toolSchema: z.function()
      .args(
        z.object({
          query: z.string().describe('The question or query to ask the knowledge base (e.g., "What are the deliverables?", "What is the budget?")'),
        })
      )
      .returns(
        z.object({
          success: z.boolean(),
          answer: z.string().optional(),
          sources: z.array(z.any()).optional(),
          error: z.string().optional(),
        })
      ),
  },
];

/**
 * Context Helpers Configuration
 * Prebuilt helpers for time and page context
 * Custom helpers can be added here for app-specific context
 */
export const tamboContextHelpers = {
  userTime: currentTimeContextHelper,
  userPage: currentPageContextHelper,

  // CRITICAL: Rate Card Context for SOW Generation
  // This injects the Social Garden Rate Card into every AI request
  rateCard: async () => {
    try {
      // Import rate card directly to avoid API/filesystem issues in Docker
      const rateCardData = await import("./ratecard.json");
      // Handle both default export (if JSON module) and direct array
      const rateCard = rateCardData.default || rateCardData;

      return {
        socialGardenRateCard: rateCard,
        totalRoles: Array.isArray(rateCard) ? rateCard.length : 0,
        currency: 'AUD', // Display currency (base rates are USD)
        message: `Social Garden Rate Card loaded with ${Array.isArray(rateCard) ? rateCard.length : 0} roles. MUST use exact roles and rates from this card.`,
      };
    } catch (error) {
      console.error('Failed to load rate card:', error);
      return {
        error: 'Rate card not available',
        message: 'WARNING: Rate card could not be loaded. SOW generation may be inaccurate.',
      };
    }
  },

  // Budget Compliance Rules
  budgetRules: () => {
    return {
      mandatoryRoles: [
        'Tech - Head Of- Senior Project Management',
        'Tech - Delivery - Project Coordination',
        'Account Management - (Account Manager)',
      ],
      accountManagementPosition: 'bottom',
      gstRate: 0.10,
      currency: 'AUD',
      roundingTargets: [100, 1000, 5000],
    };
  },

  // Force English Language
  languageRule: () => {
    return {
      instruction: "You MUST always respond in English. Do not use Spanish or any other language unless explicitly requested by the user.",
    };
  },
};

/**
 * Tambo Configuration
 * Get configuration from environment variables
 */
export function getTamboConfig() {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const tamboUrl = process.env.NEXT_PUBLIC_TAMBO_URL || "https://api.tambo.co";
  const projectId = process.env.NEXT_PUBLIC_TAMBO_PROJECT_ID;

  if (!apiKey) {
    console.warn(
      "Tambo API key not found. Please set NEXT_PUBLIC_TAMBO_API_KEY in your .env.local file."
    );
  }

  return {
    apiKey: apiKey || "",
    tamboUrl,
    projectId,
    components: tamboComponents,
    tools: tamboTools,
    contextHelpers: tamboContextHelpers,
  };
}
