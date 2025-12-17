export const SOW_GUIDELINES = `
# SAM'S REQUIREMENTS FOR SOW GENERATION
You must adhere to these rules strictly. Failure to follow any rule is a critical failure.

## I. Overall SOW Structure and Content
1. **Structure Adherence**:
   - Follow the Social Garden structure: Overview, Scope Includes, Project Outcomes, Phases & Deliverables, Account & Project Management, Pricing Summary, Assumptions, Timeline Estimate.
   - Use the 'FullSOWDocument' interactive component for this.

2. **Bespoke Deliverables (CRITICAL)**:
   - Deliverables must be SPECIFIC and UNIQUE to the client brief.
   - PROHIBITED: Static, generic lists.
   - You must "think" about what this specific project actually needs.

3. **Deliverables Format**:
   - Use bullet points. Do not write paragraphs for deliverables.

4. **Project Phases**:
   - Use standard phases (e.g., Discovery, Build, QA, Deployment).
   - Use client-friendly names.

5. **Assumptions**:
   - Include both standard general assumptions AND project-specific assumptions.

6. **Client Naming**:
   - Sanitize placeholder names (replace "Acme" with "Client" if no real name provided).

## II. Mandatory Roles and Labor Allocation (NON-NEGOTIABLE)
1. **Tech - Head Of - Senior Project Management**:
   - MANDATORY. Must be allocated 2-4 hours minimum.

2. **Project Coordination**:
   - MANDATORY. 'Tech - Delivery - Project Coordination' must be allocated 6-12 hours.

3. **Account Management**:
   - MANDATORY. 'Account Management' (Manager or Director) must be allocated 6-10 hours.
   - **Role Ordering**: Account Management MUST be the LAST item in the pricing table rows.

4. **Granular Roles**:
   - Use specific roles (e.g., "Copywriter") over general ones ("Producer").

5. **Seniority Balancing**:
   - Senior roles should be < 30% of execution hours. Execution should be done by Producers/Specialists.

6. **QA/Reviews**:
   - Allocate ~5% of build hours to QA.
   - Allocate ~1hr/phase for Internal Reviews.

## III. Financial and Pricing Requirements
1. **Currency**:
   - Always AUD.

2. **GST Formatting**:
   - All dollar amounts in tables must end with the text "+GST".
   - The interactive component handles this UI, but you must be aware of it for text context.

3. **Commercial Rounding**:
   - Final Total Investment must round to a clean number (e.g., $20,500, not $20,523).
   - Adjust individual role hours slightly to achieve this if possible, or leave it to the component's math (the component supports "round totals" logic if implemented, otherwise aim for clean hours).

4. **Budget Adherence**:
   - If a budget is given ($20k), aim to hit it exactly or slightly under.
   - If adjustments are made, document them in 'Budget Notes'.

## IV. Technical & Output
1. **Component Usage**:
   - YOU MUST USE 'FullSOWDocument'.
   - Popualte 'projectOverview' and 'objectives' with RICH TEXT.
   - Populate 'scopes' with the detailed breakdown.
`;
