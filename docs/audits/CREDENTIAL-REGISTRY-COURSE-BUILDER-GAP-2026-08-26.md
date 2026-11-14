# Credential Registry Course Builder Gap Review

**Date:** 2026-08-26  
**Scope:** Canonical Admin Course Builder compared with Credential Engine manual and bulk publishing needs.

## Side-by-side

| Registry capability | What Elevate already had | Enhancement added | Remaining operational step |
|---|---|---|---|
| Organization authorization | Credential Engine organization account approved for manual and bulk publishing | Organization CTID field and account-vs-record guidance | Publish/confirm Elevate's separate Organization record and retain its CTID |
| Credential identity | Course title, slug, description and internal credential records | Credential name, CTDL-aligned credential type, public status and language | Verify the official public name for each credential |
| Public reference | Program and marketing routes exist | Required credential-specific subject webpage with HTTPS warning | Confirm every URL is live and describes that exact credential |
| Duration and delivery | Course duration hours and delivery metadata | Registry duration and delivery validation | Reconcile generated lesson time with approved clock hours |
| Requirements | Curriculum, lessons, quizzes and compliance profiles | Entry, assessment and completion requirement fields | Authorized staff must verify requirements |
| Skills | Outcomes, exam domains, O*NET and competency-related infrastructure | Structured competency list required for readiness | Map each competency to evidence/assessment |
| Occupations | O*NET/SOC mapping infrastructure | Related occupation list required for readiness | Verify occupation titles/codes for each program |
| Cost and assistance | Program tracks and cost fields | Estimated cost, currency and assistance fields with warnings | Publish current tuition, fees and aid accurately |
| Approval claims | WIOA/DOL/ETPL flags and compliance profiles | Separate agency/identifier fields and paired-field warning | Enter only documented approvals; Registry listing is not accreditation |
| CTID lifecycle | No publishing CTID workflow in the canonical Course Builder | Credential CTID, Organization CTID, environment and last-published fields | Preserve CTIDs outside sandbox and reuse them for updates/deletion |
| Registry environment | No explicit sandbox/production distinction | Environment selector | Test non-final integration work in sandbox |
| Readiness | Internal publish validation focused on course completeness | Registry-specific minimum-data completion score and warnings | Admin review before Credential Engine approval |
| Export | Internal course/SCORM exports | Admin-protected, escaped CSV preparation export | Map to Credential Engine's latest generated bulk template |
| API publishing | Credential-aware API code existed, but approval is manual/bulk | No automatic submission added | Obtain separate approval before any Registry Assistant API integration |

## Architectural finding

The existing `lib/course-builder/credential-engine/` code is primarily a credential-aware **instruction and exam-preparation engine**. It should not be confused with Credential Engine's national Credential Registry. The new Registry workspace keeps those responsibilities separate:

- course generation produces curriculum, lessons, media and assessments;
- Registry preparation produces standardized public metadata;
- an authorized administrator verifies facts and approvals;
- Credential Engine performs final review and publication.

## Safeguards

- Registry publication is never represented as accreditation or state approval.
- API keys are not collected by the client or committed to the repository.
- Production and sandbox records are distinguished.
- Existing CTIDs are preserved for updates; a new CTID is for a genuinely new entity.
- CSV output is a validated preparation artifact, not a claim of direct schema parity with every future Credential Engine template revision.
