"use client";

/**
 * SOW Markdown Parser
 * 
 * Parses the AI's raw markdown SOW output and extracts structured data
 * that can be passed to the insertSOWToEditor function.
 */

// Rate card for looking up rates when parsing markdown tables
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

export interface ParsedRole {
    role: string;
    hours: number;
    rate: number;
    description?: string;
}

export interface ParsedSOW {
    projectTitle: string;
    clientName: string;
    projectOverview: string;
    roles: ParsedRole[];
    deliverables: string[];
    assumptions: string[];
    budgetNotes: string;
    discount: number;
}

/**
 * Parses a markdown pricing table and extracts role data
 */
function parsePricingTable(markdown: string): ParsedRole[] {
    const roles: ParsedRole[] = [];

    // Find markdown tables (lines starting with |)
    const tableRegex = /\|[^\n]+\|/g;
    const tableLines = markdown.match(tableRegex) || [];

    // Skip header and separator rows
    const dataRows = tableLines.filter(line =>
        !line.includes('---') &&
        !line.toLowerCase().includes('role') &&
        !line.toLowerCase().includes('hours') &&
        !line.toLowerCase().includes('rate') &&
        !line.toLowerCase().includes('total') &&
        !line.toLowerCase().includes('sub-total') &&
        !line.toLowerCase().includes('subtotal') &&
        !line.toLowerCase().includes('grand total') &&
        !line.toLowerCase().includes('gst') &&
        !line.toLowerCase().includes('discount')
    );

    for (const row of dataRows) {
        // Split by | and clean up
        const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);

        if (cells.length >= 2) {
            const roleName = cells[0].replace(/\*\*/g, '').trim();

            // Try to find hours (look for a number)
            let hours = 0;
            let rate = 0;

            for (let i = 1; i < cells.length; i++) {
                const cellValue = cells[i].replace(/[$,AUD+GST\s]/gi, '').trim();
                const numValue = parseFloat(cellValue);

                if (!isNaN(numValue)) {
                    if (hours === 0 && numValue < 1000) {
                        // First small number is likely hours
                        hours = numValue;
                    } else if (rate === 0 && numValue >= 100 && numValue < 500) {
                        // Number in rate range
                        rate = numValue;
                    }
                }
            }

            // Look up rate from rate card if not found
            if (rate === 0) {
                rate = RATE_CARD[roleName] || 150;
            }

            if (roleName && hours > 0) {
                roles.push({
                    role: roleName,
                    hours,
                    rate,
                    description: '',
                });
            }
        }
    }

    return roles;
}

/**
 * Extracts the project title from markdown (usually the first # heading)
 */
function extractProjectTitle(markdown: string): string {
    const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m);
    if (titleMatch) {
        return titleMatch[1].replace(/\*\*/g, '').trim();
    }

    // Try to find "Project Title:" pattern
    const altMatch = markdown.match(/project\s*title[:\s]+(.+?)(?:\n|$)/i);
    if (altMatch) {
        return altMatch[1].replace(/\*\*/g, '').trim();
    }

    return 'Project Proposal';
}

/**
 * Extracts the client name from markdown
 */
function extractClientName(markdown: string): string {
    const patterns = [
        /prepared\s+for[:\s]+(.+?)(?:\n|$)/i,
        /client[:\s]+(.+?)(?:\n|$)/i,
        /\[client\s*name\]/i,
    ];

    for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match) {
            const name = match[1]?.replace(/\*\*/g, '').trim();
            if (name && !name.includes('[')) {
                return name;
            }
        }
    }

    return 'Client';
}

/**
 * Extracts the project overview from markdown
 */
function extractProjectOverview(markdown: string): string {
    // Look for ## Project Overview or ## 1. Project Overview
    const overviewMatch = markdown.match(/##\s*\d*\.?\s*project\s*overview\s*\n+([\s\S]+?)(?=##|$)/i);
    if (overviewMatch) {
        return overviewMatch[1].trim().split('\n').slice(0, 3).join('\n');
    }

    return '';
}

/**
 * Extracts deliverables from markdown (lines starting with +, -, *)
 */
function extractDeliverables(markdown: string): string[] {
    const deliverables: string[] = [];

    // Look for deliverables section
    const deliverablesMatch = markdown.match(/deliverables?\s*\n+([\s\S]+?)(?=##|assumptions|pricing|investment|$)/i);
    if (deliverablesMatch) {
        const section = deliverablesMatch[1];
        const lines = section.split('\n');

        for (const line of lines) {
            const cleaned = line.replace(/^[\s+\-*]+/, '').trim();
            if (cleaned.length > 5 && !cleaned.startsWith('#') && !cleaned.includes('|')) {
                deliverables.push(cleaned);
            }
        }
    }

    return deliverables.slice(0, 10); // Limit to 10 items
}

/**
 * Extracts assumptions from markdown
 */
function extractAssumptions(markdown: string): string[] {
    const assumptions: string[] = [];

    const assumptionsMatch = markdown.match(/assumptions?\s*\n+([\s\S]+?)(?=##|timeline|approval|$)/i);
    if (assumptionsMatch) {
        const section = assumptionsMatch[1];
        const lines = section.split('\n');

        for (const line of lines) {
            const cleaned = line.replace(/^[\s+\-*]+/, '').trim();
            if (cleaned.length > 5 && !cleaned.startsWith('#') && !cleaned.includes('|')) {
                assumptions.push(cleaned);
            }
        }
    }

    return assumptions.slice(0, 10);
}

/**
 * Extracts discount percentage from markdown
 */
function extractDiscount(markdown: string): number {
    const discountMatch = markdown.match(/discount[:\s]+(\d+)%?/i);
    if (discountMatch) {
        return parseFloat(discountMatch[1]) || 0;
    }
    return 0;
}

/**
 * Main function to parse a complete SOW from markdown
 */
export function parseSOWFromMarkdown(markdown: string): ParsedSOW | null {
    if (!markdown || markdown.length < 100) {
        return null;
    }

    const roles = parsePricingTable(markdown);

    // If we couldn't find any roles in a table, this might not be a valid SOW
    if (roles.length === 0) {
        console.log('[SOW Parser] No pricing table found in markdown');
        return null;
    }

    return {
        projectTitle: extractProjectTitle(markdown),
        clientName: extractClientName(markdown),
        projectOverview: extractProjectOverview(markdown),
        roles,
        deliverables: extractDeliverables(markdown),
        assumptions: extractAssumptions(markdown),
        budgetNotes: 'Rates are based on standard rate card. All amounts in AUD +GST.',
        discount: extractDiscount(markdown),
    };
}

/**
 * Checks if markdown content appears to be an SOW
 */
export function isSOWContent(markdown: string): boolean {
    const sowIndicators = [
        /scope\s*of\s*work/i,
        /project\s*overview/i,
        /deliverables?/i,
        /pricing\s*summary/i,
        /investment/i,
        /assumptions?/i,
    ];

    let matchCount = 0;
    for (const indicator of sowIndicators) {
        if (indicator.test(markdown)) {
            matchCount++;
        }
    }

    // Also check for a pricing table
    const hasTable = /\|.+\|.+\|/.test(markdown);

    return matchCount >= 3 || (matchCount >= 2 && hasTable);
}
