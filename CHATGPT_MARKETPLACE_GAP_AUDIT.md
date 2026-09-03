# ChatGPT marketplace side-by-side gap audit

Date: 2026-08-29

| Proposed capability | Repository before repair | Production-safe implementation | Status |
| --- | --- | --- | --- |
| One unified Elevate listing | Four internal agents existed, but no public ChatGPT MCP gateway or marketplace package existed. | One `elevate-ai-workforce-creator-suite` MCP server and plugin package. | Filled |
| PARIS Website Builder | Authenticated internal Website Builder endpoints existed. The proposed `/orchestrator/paris` endpoint did not. | `draft_website_blueprint` provides an anonymous, read-only preview without creating or publishing a site. | Filled for public preview |
| ELLIE Course Builder | Internal course-generation pipelines existed. The proposed `/orchestrator/ellie` endpoint did not. | `draft_course_blueprint` provides an anonymous, read-only curriculum preview without creating or selling a course. | Filled for public preview |
| LIZZY intake and funding | Internal admissions and funding workflows existed, but the proposed tool could imply that it determined eligibility. | `get_program_and_funding_guidance` always returns `not_determined` and requires agency authorization. | Filled safely |
| ZORA compliance | Internal compliance and apprenticeship tools existed. The proposed tool could be mistaken for approval or RAPIDS action. | `get_apprenticeship_compliance_checklist` returns a general checklist labeled as a non-approval. | Filled safely |
| Cross-agent routing | An internal intent router existed but was not exposed to ChatGPT. | `route_elevate_request` selects one agent and explains why. | Filled |
| Public MCP transport | No `/mcp` route existed. | Stateless JSON-response MCP endpoint at `/mcp`, with CORS and public rate limiting. | Filled for public tool calls |
| Tool safety metadata | No marketplace tool definitions existed. | All public tools declare accurate read-only, non-destructive, closed-world, idempotent annotations. | Filled |
| Digital-product monetization | Proposed prompt directly pushed subscriptions, course hosting, and checkout. | Removed. Current public-plugin rules prohibit digital-product sales and upgrade promotion inside the plugin. Neutral informational links only. | Corrected |
| Funding conversion | Proposed language implied state-backed funding slots could be captured. | Removed. The plugin cannot promise or determine funding and must require responsible-agency authorization. | Corrected |
| Existing-customer private actions | Internal account-bound builders exist, but MCP-compatible OAuth 2.1 discovery, token verification, scopes, and reviewer credentials do not. | Public tools remain anonymous and read-only. Account writes are not exposed until compliant OAuth is implemented and reviewed. | Intentionally gated |
| Public directory submission | No submission packet existed. | Listing copy, safety boundaries, starter prompts, five positive tests, and three negative tests are documented in `SUBMISSION.md`. | Code ready; portal steps remain |
| “Live today” launch claim | The supplied copy says the suite is already live in the marketplace. | Do not publish this claim until OpenAI review is approved and a working public listing URL exists. | Corrected |
| Social reply: funding screening | The supplied reply says LIZZY instantly screens eligibility. | Say LIZZY explains possible pathways and next steps; only the responsible agency can determine eligibility and authorization. | Corrected |
| Social reply: ZORA | The supplied reply promises compliance execution, RAPIDS tracking, revenue, and rebates. | Describe a general Host Shop/apprenticeship recordkeeping checklist; do not imply approval, reimbursement, or direct RAPIDS actions. | Corrected |
| In-chat subscription funnel | The supplied campaign says users will immediately purchase digital subscriptions through redirects. | Keep public tools informational. Do not promote or transact digital products inside the ChatGPT plugin. | Corrected |
| Marketplace engagement payout | The supplied campaign says usage automatically earns OpenAI credits. | Removed. No public launch copy should promise an engagement payout without a written program offer from OpenAI to Elevate. | Corrected |
| Analytics and conversion attribution | The supplied campaign assumes builder analytics, named internal webhooks, Stripe conversion, and OpenAI payout data are connected. | Track production MCP calls and separately configured first-party attribution only; do not claim unavailable dashboards or nonexistent endpoints. | Partially available |

## External completion items

These cannot be completed safely from repository code alone:

1. Verify the Elevate for Humanity business identity in the OpenAI Platform organization.
2. Confirm the submitting account has **Apps Management: Write**.
3. Enter the exact domain-verification token supplied by the submission portal.
4. Provide final logo/screenshots and confirm public privacy, terms, website, and support URLs.
5. Submit the plugin for review and publish it after OpenAI approval.
6. Replace the placeholder in `LAUNCH_COPY.md` with the approved public listing URL, then publish the announcement.

## Validation reached

- Level 0: repository and metadata contract review passed.
- Level 1: Marketing TypeScript and plugin-manifest validation passed.
- Level 2: MCP initialization, tool discovery, route CORS, and a LIZZY tool call passed locally.
- Level 3: ChatGPT Developer Mode and public submission review require the production deployment and external OpenAI Platform steps above.
