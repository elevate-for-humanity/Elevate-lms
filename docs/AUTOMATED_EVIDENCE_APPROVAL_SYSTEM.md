# Automated Evidence & Approval System — Design and Compliance Overview

## Executive Summary

This document describes the automated evidence processing and approval system used in the Elevate for Humanity LMS platform. The system automates routine verification tasks while preserving human authority for discretionary decisions.

**Key principle:** The system evaluates submitted evidence against predefined, versioned rulesets and automatically advances records only when objective criteria are satisfied.

---

## Part 1: What Is Automated

### Document Processing
- **Transcript verification**: OCR extraction of school name, hours completed, completion date
- **License validation**: Expiration date checking, license number format validation
- **MOU verification**: Signature presence, effective date validation
- **Insurance verification**: Policy number extraction, coverage validation

### Partner Onboarding
- **Checklist tracking**: Automatic tracking of required document uploads
- **MOU signature detection**: Automatic detection when MOU is signed
- **Auto-approval trigger**: When all requirements met, partner is auto-approved

### Apprentice Routing
- **Shop scoring**: Distance, capacity, program compatibility, reputation
- **Recommendation generation**: Top 5 eligible shops ranked by score
- **Auto-assignment**: When confidence threshold (85%) exceeded

---

## Part 2: What Is Never Automated

### Discretionary Decisions
- Out-of-state transcript evaluation (no ruleset = human review)
- License validity disputes
- Capacity exceptions
- Policy overrides

### Low-Confidence Scenarios
- OCR confidence below threshold (85% for transcripts, 80% for licenses)
- Missing required fields
- Conflicting data detected
- Unknown document types

### Explicit Human Gates
- Final enrollment approval for edge cases
- Partner suspension decisions
- Apprentice termination
- Policy changes

---

## Part 3: Why This Is Safe

### Fail-Closed Design
- Unknown tiers are DENIED
- Missing rulesets route to review
- Low confidence routes to review
- Errors route to review

### Audit Trail
Every automated decision records:
- What document/entity was processed
- What data was extracted
- What ruleset version was applied
- Why the decision was made
- Whether it was automated or human-approved
- Processing time in milliseconds

### Reconstructability
Every decision can be reconstructed later using:
- `automated_decisions` table with full input snapshots
- `audit_logs` table with action history
- `review_queue` table with resolution history

---

## Part 4: Regulator Explanation

> "The system evaluates evidence against versioned rulesets. Discretionary decisions are never fully automated. Every decision is auditable and reconstructable."

### How Approvals Actually Happen

1. Documents are classified and read via OCR
2. Required facts are extracted
3. Facts are evaluated against published rules
4. If all rules pass → system approves
5. If any rule fails or confidence is low → human review is required

### What the System Will Never Do

- Approve out-of-state transcripts without explicit ruleset
- Approve missing or unclear documents
- Bypass MOU requirements
- Silently change hours or statuses
- Make discretionary eligibility decisions

### Audit Protection

Every automated decision records:
- `entity_type` and `entity_id` - what was decided
- `decision_type` - what kind of decision
- `outcome` - approved, routed_to_review, rejected
- `actor` - 'system' or user_id
- `ruleset_version` - which rules were applied
- `confidence_score` - OCR/matching confidence
- `reason_codes` - why this decision was made
- `input_snapshot` - complete input data at decision time
- `processing_time_ms` - how long it took

---

## Part 5: License Buyer Explanation

> "This platform removes 80–90% of administrative labor while increasing consistency and audit readiness."

### What Becomes Automatic

- Transcript review and transfer hours (when safe)
- Partner/shop onboarding approvals
- MOU validation
- Apprentice-to-shop placement recommendations
- Compliance gating before enrollment

### What Staff No Longer Do

- Manually read every document
- Manually check expiration dates
- Manually compare hours
- Manually route apprentices
- Manually chase missing requirements

### What Staff Still Control

- Exceptions
- Overrides
- Policy changes
- Final authority in edge cases

### Business Value

- Fewer staff required for routine tasks
- Faster onboarding (minutes vs. days)
- Fewer errors (consistent rule application)
- Stronger compliance posture (complete audit trail)

---

## Part 6: Where Automation Stops

### Automation Stops When:

| Condition | Action |
|-----------|--------|
| OCR confidence below threshold | Route to review |
| Required fields missing | Route to review |
| Ruleset does not exist for state/program | Route to review |
| Transcript is out-of-state | Route to review |
| Shop capacity unclear | Route to review |
| Data conflicts detected | Route to review |

### When Automation Stops:

1. Item goes into single review queue
2. Reviewer sees:
   - Document preview
   - Extracted data
   - Failed rules
   - System recommendation
3. Reviewer approves, rejects, or requests reupload
4. Decision is logged with reason

**The system never "guesses."**

---

## Part 7: End-to-End Flow

### Transcript Processing Flow

```
1. Apprentice uploads transcript
2. System reads it via OCR, extracts hours
3. System checks state + rules
4. If clean → transfer hours applied automatically
5. If unclear → routed to review with explanation
```

### Partner Onboarding Flow

```
1. Shop uploads documents + signs MOU
2. System validates completeness + dates
3. If complete → shop approved automatically
4. If incomplete → checklist shows remaining items
```

### Apprentice Placement Flow

```
1. Apprentice submits application
2. System scores eligible shops by distance + capacity
3. System recommends or assigns
4. Enrollment proceeds only when all gates satisfied
```

---

## Part 8: Technical Implementation

### Database Tables

| Table | Purpose |
|-------|---------|
| `automated_decisions` | Immutable record of all automated decisions |
| `review_queue` | Items requiring human review |
| `shop_recommendations` | Persisted routing recommendations |
| `audit_logs` | Complete action history |

### Ruleset Versioning

All rulesets are versioned (e.g., `1.0.0`). When rules change:
1. New version is deployed
2. Old decisions retain their original ruleset version
3. Audit trail shows which rules were in effect

### Confidence Thresholds

| Document Type | Min Confidence |
|---------------|----------------|
| Transcript | 85% |
| License | 80% |
| ID | 80% |
| MOU | 75% |
| Insurance | 80% |

### State Coverage

States with explicit transcript rulesets (auto-approval allowed):
- Indiana (IN)
- Illinois (IL)
- Ohio (OH)
- Michigan (MI)
- Kentucky (KY)

All other states route to human review.

---

## Part 9: What You Can Truthfully Say

### You Can Say:

- "Most approvals are automated."
- "Every automated decision is auditable."
- "Human review is preserved where required."
- "The system enforces policy consistently."
- "We reduce administrative burden without sacrificing compliance."

### You Should Not Say:

- "AI decides eligibility"
- "Fully automated approvals with no review"
- "Hands-off compliance"

---

## Part 10: One-Line Summary

> "Our platform automates evidence verification and routing while preserving human authority — reducing workload, increasing consistency, and remaining fully auditable."

This sentence is defensible in:
- Audits
- Sales calls
- Procurement reviews
- Legal scrutiny

---

## Appendix: File Locations

| Component | Location |
|-----------|----------|
| Evidence Processor | `lib/automation/evidence-processor.ts` |
| Partner Approval | `lib/automation/partner-approval.ts` |
| Shop Routing | `lib/automation/shop-routing.ts` |
| Review Queue UI | `app/admin/review-queue/` |
| QA Dashboard | `app/admin/automation-qa/` |
| Database Migration | `supabase/migrations/20260205_automation_infrastructure.sql` |
| Test Endpoints | `app/api/automation/test/` |

---

*Document Version: 1.0.0*
*Last Updated: February 2026*
