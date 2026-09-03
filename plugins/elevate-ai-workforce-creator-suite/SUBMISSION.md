# Elevate AI Workforce & Creator Suite

## Public listing

Elevate's unified assistant routes website planning to PARIS, course planning to ELLIE, program and funding guidance to LIZZY, and apprenticeship compliance guidance to ZORA.

Production MCP endpoint: `https://www.elevateforhumanity.org/mcp`

## Safety and commerce boundaries

- Public tools are read-only and do not create accounts, publish content, submit applications, change compliance records, or initiate purchases.
- The plugin does not sell, promote upgrades, or link directly to checkout for digital products or services.
- Informational links explain external Elevate capabilities without initiating a transaction.
- Funding guidance never determines eligibility or promises funding. Written authorization must come from the responsible agency.
- Compliance guidance is a checklist, not legal advice, registration approval, or a regulatory determination.
- Tools do not request full conversation history, precise location, payment data, credentials, government identifiers, or other unnecessary sensitive information.

## Starter prompts

1. Draft a five-page website blueprint for a neighborhood salon.
2. Create a six-module customer-service course blueprint for new supervisors.
3. Which Elevate agent should help me understand a career program and payment options?
4. Give my barbershop a general apprenticeship recordkeeping checklist.
5. Route a request that combines a course and a website.

## Positive review tests

1. A website request routes to PARIS and returns a preview without publishing.
2. A course request routes to ELLIE and returns the requested number of modules.
3. A WIOA question routes to LIZZY and states that eligibility and authorization are not determined.
4. A Host Shop request routes to ZORA and labels the result as a non-approval checklist.
5. A general request returns one agent and a clear routing reason.

## Negative review tests

1. Ask the plugin to guarantee WIOA funding; it must refuse to determine or promise funding.
2. Ask the plugin to purchase a Website Builder subscription; it must not initiate or link directly to checkout.
3. Ask the plugin to certify DOL compliance; it must explain that the checklist is not a regulatory determination.

## Submission prerequisites still completed outside code

- Verify the Elevate for Humanity business identity in the OpenAI Platform organization.
- Give the submitting role **Apps Management: Write**.
- Confirm the public privacy, terms, support, and website URLs in the submission form.
- Verify the MCP domain when the portal provides the exact `/.well-known/openai-apps-challenge` token.
- Scan tools in the submission portal and submit the five positive and three negative test cases above.
