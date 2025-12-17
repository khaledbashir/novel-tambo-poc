"use client";

/**
 * SOW Validation Utility
 * 
 * Validates SOW pricing data against Sam's mandatory requirements:
 * - Head Of role (2-4h minimum)
 * - Project Coordination role (6-12h)
 * - Account Management role (6-10h, must be LAST row)
 * - Senior roles cannot exceed 30% of execution hours
 */

export interface PricingRow {
    id?: string;
    role: string;
    hours: number;
    rate: number;
    description?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    field?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    suggestion?: string;
}

// Role pattern matchers
const HEAD_OF_PATTERN = /Head\s*Of/i;
const PROJECT_COORD_PATTERN = /Project\s*(Coordination|Coordinator|Management)/i;
const ACCOUNT_MGT_PATTERN = /Account\s*Management/i;
const SENIOR_PATTERN = /(Senior|Sr\.|Head\s*Of|Architect)/i;
const QA_PATTERN = /(QA|Testing|Quality)/i;

/**
 * Main validation function
 */
export function validateSOW(rows: PricingRow[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!rows || rows.length === 0) {
        errors.push({
            code: 'EMPTY_PRICING',
            message: 'Pricing table is empty. Add at least one role.',
        });
        return { isValid: false, errors, warnings };
    }

    // 1. Check for Head Of role (2-4h minimum)
    const headOfRole = rows.find(r => HEAD_OF_PATTERN.test(r.role));
    if (!headOfRole) {
        errors.push({
            code: 'MISSING_HEAD_OF',
            message: 'Missing mandatory "Tech - Head Of- Senior Project Management" role.',
            field: 'roles',
        });
    } else if (headOfRole.hours < 2) {
        errors.push({
            code: 'HEAD_OF_HOURS_LOW',
            message: `"Head Of" role has ${headOfRole.hours}h but requires minimum 2 hours.`,
            field: 'roles',
        });
    } else if (headOfRole.hours > 4) {
        warnings.push({
            code: 'HEAD_OF_HOURS_HIGH',
            message: `"Head Of" role has ${headOfRole.hours}h (recommended: 2-4 hours).`,
            suggestion: 'Consider reducing Head Of hours to 2-4.',
        });
    }

    // 2. Check for Project Coordination (6-12h)
    const projectCoord = rows.find(r => PROJECT_COORD_PATTERN.test(r.role));
    if (!projectCoord) {
        errors.push({
            code: 'MISSING_PROJECT_COORD',
            message: 'Missing mandatory Project Coordination/Management role.',
            field: 'roles',
        });
    } else if (projectCoord.hours < 6) {
        errors.push({
            code: 'PROJECT_COORD_HOURS_LOW',
            message: `Project Coordination has ${projectCoord.hours}h but requires minimum 6 hours.`,
            field: 'roles',
        });
    } else if (projectCoord.hours > 12) {
        warnings.push({
            code: 'PROJECT_COORD_HOURS_HIGH',
            message: `Project Coordination has ${projectCoord.hours}h (recommended: 6-12 hours).`,
            suggestion: 'Consider reducing Project Coordination hours.',
        });
    }

    // 3. Check for Account Management (6-10h, must be LAST)
    const accountMgtIndex = rows.findIndex(r => ACCOUNT_MGT_PATTERN.test(r.role));
    const accountMgtRole = accountMgtIndex >= 0 ? rows[accountMgtIndex] : null;

    if (!accountMgtRole) {
        errors.push({
            code: 'MISSING_ACCOUNT_MGT',
            message: 'Missing mandatory Account Management role.',
            field: 'roles',
        });
    } else {
        if (accountMgtRole.hours < 6) {
            errors.push({
                code: 'ACCOUNT_MGT_HOURS_LOW',
                message: `Account Management has ${accountMgtRole.hours}h but requires minimum 6 hours.`,
                field: 'roles',
            });
        } else if (accountMgtRole.hours > 10) {
            warnings.push({
                code: 'ACCOUNT_MGT_HOURS_HIGH',
                message: `Account Management has ${accountMgtRole.hours}h (recommended: 6-10 hours).`,
            });
        }

        // Check if Account Management is LAST
        if (accountMgtIndex !== rows.length - 1) {
            errors.push({
                code: 'ACCOUNT_MGT_NOT_LAST',
                message: 'Account Management must be the LAST row in the pricing table.',
                field: 'roles',
            });
        }
    }

    // 4. Check seniority cap (≤30% of execution hours)
    const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
    const seniorHours = rows
        .filter(r => SENIOR_PATTERN.test(r.role))
        .reduce((sum, r) => sum + r.hours, 0);

    if (totalHours > 0) {
        const seniorPercentage = (seniorHours / totalHours) * 100;
        if (seniorPercentage > 30) {
            warnings.push({
                code: 'SENIOR_HOURS_HIGH',
                message: `Senior roles are ${seniorPercentage.toFixed(0)}% of total hours (max: 30%).`,
                suggestion: 'Shift execution tasks to Producer/Specialist roles.',
            });
        }
    }

    // 5. Check QA hours (≥5% of total)
    const qaHours = rows
        .filter(r => QA_PATTERN.test(r.role))
        .reduce((sum, r) => sum + r.hours, 0);

    if (totalHours > 0) {
        const qaPercentage = (qaHours / totalHours) * 100;
        if (qaPercentage < 5 && totalHours >= 20) {
            warnings.push({
                code: 'QA_HOURS_LOW',
                message: `QA/Testing is only ${qaPercentage.toFixed(0)}% (recommended: ≥5%).`,
                suggestion: 'Consider adding QA/Testing hours.',
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Rounds a total to a commercial-friendly number (nearest $500)
 */
export function roundToCommercial(amount: number): number {
    return Math.round(amount / 500) * 500;
}

/**
 * Formats an amount with +GST suffix
 */
export function formatWithGST(amount: number): string {
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} +GST`;
}

/**
 * Sanitizes placeholder client names
 */
export function sanitizeClientName(name: string): string {
    const placeholders = ['acme', 'client name', '[client]', 'xyz corp', 'abc company'];
    if (placeholders.some(p => name.toLowerCase().includes(p))) {
        return 'Client';
    }
    return name;
}
