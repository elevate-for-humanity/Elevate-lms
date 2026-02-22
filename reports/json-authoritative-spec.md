# Authoritative JSON Specification

Generated: 2026-02-01 (Updated)

## Program Type Definitions (Locked)

The system supports three distinct program types. This is the spine of the architecture.

### 1. `internal_apprenticeship` (Barber)

| Attribute | Value |
|-----------|-------|
| Curriculum Owner | EFH |
| Hours Tracked | YES |
| Placements Required | YES |
| Completion Method | Hours + Documents |
| Example | Barber Apprenticeship |

### 2. `external_lms_wrapped` (HVAC via CareerSafe)

| Attribute | Value |
|-----------|-------|
| Curriculum Owner | External Partner (CareerSafe) |
| Hours Tracked | NO |
| Placements Required | NO |
| Has Price | YES |
| Funding Eligible | YES (WIOA/WorkOne covers price) |
| Completion Method | Credential Verification |
| Example | HVAC Technician |

### 3. `external_referral` (Future Only)

| Attribute | Value |
|-----------|-------|
| Curriculum Owner | None |
| Hours Tracked | NO |
| Placements Required | NO |
| Has Price | NO |
| Enrollment Created | NO |
| Completion Method | N/A (handoff only) |
| Example | Future partner referrals |

---

## Selected Authoritative File

**File**: `/lms-content/curricula/program-curriculum-map.json`

**Extended By**: Program type metadata (defined below)

---

## Canonical Program Schema

### Base Program Object
```json
{
  "program_id": "string (slug)",
  "name": "string",
  "program_type": "internal_apprenticeship | external_lms_wrapped | external_referral",
  "price_cents": "integer (0 for free, >0 for priced)",
  "funding_eligible": "boolean",
  "funding_sources": ["WIOA", "WorkOne", "WRG", "JRI"],
  "delivery_method": "internal | external_lms | referral",
  "internal_hours_tracked": "boolean",
  "placement_required": "boolean",
  "completion_method": "hours_and_documents | credential_verification | referral_handoff",
  "status_flow": ["string"],
  "required_documents": ["string"],
  "curriculum": {
    "course_provider": "string (EFH | CareerSafe | etc.)",
    "course_ids": ["string"],
    "total_hours": "integer"
  }
}
```

---

## Barber Apprenticeship (internal_apprenticeship)

```json
{
  "program_id": "barber-apprenticeship",
  "name": "Barber Apprenticeship",
  "program_type": "internal_apprenticeship",
  "price_cents": 0,
  "funding_eligible": true,
  "funding_sources": ["WIOA", "WorkOne", "WRG", "Apprenticeship"],
  "delivery_method": "internal",
  "internal_hours_tracked": true,
  "placement_required": true,
  "completion_method": "hours_and_documents",
  "credential_partner": null,
  "status_flow": [
    "applied",
    "eligibility_verified",
    "enrolled",
    "site_assigned",
    "hours_in_progress",
    "hours_complete",
    "documents_verified",
    "completed"
  ],
  "required_documents": [
    "government_id",
    "high_school_diploma_or_ged",
    "background_check_clearance",
    "workone_eligibility"
  ],
  "curriculum": {
    "course_provider": "EFH",
    "certifications": [
      {"name": "JRI Badges (6)", "provider": "EmployIndy", "delivery": "SCORM in LMS", "hours": 8},
      {"name": "Milady RISE Safety", "provider": "Milady/Cengage", "delivery": "External", "hours": 10},
      {"name": "OSHA 10-Hour General Industry", "provider": "CareerSafe", "delivery": "careersafeonline.com", "hours": 10},
      {"name": "CPR/AED", "provider": "HSI", "delivery": "In-person or RSV", "hours": 4},
      {"name": "Bloodborne Pathogens", "provider": "HSI", "delivery": "Online", "hours": 2},
      {"name": "Barber Theory & Practice", "provider": "Milady", "delivery": "External", "hours": 1500}
    ],
    "total_hours": 1534,
    "required_hours": 1500
  },
  "state_compliance": {
    "state": "IN",
    "licensing_board": "Indiana Professional Licensing Agency",
    "supervision_ratio": "1:3",
    "age_requirement": 16
  }
}
```

---

## HVAC Technician (external_lms_wrapped)

```json
{
  "program_id": "hvac-technician",
  "name": "HVAC Technician Training",
  "program_type": "external_lms_wrapped",
  "price_cents": 550000,
  "funding_eligible": true,
  "funding_sources": ["WIOA", "WorkOne", "WRG", "Workforce Grants", "Employer Sponsors"],
  "delivery_method": "external_lms",
  "internal_hours_tracked": false,
  "placement_required": false,
  "completion_method": "credential_verification",
  "credential_partner": "CareerSafe",
  "status_flow": [
    "applied",
    "funding_verified",
    "enrolled",
    "lms_access_granted",
    "lms_active",
    "credential_uploaded",
    "credential_verified",
    "completed"
  ],
  "required_documents": [
    "government_id",
    "workone_eligibility",
    "credential_certificate"
  ],
  "curriculum": {
    "course_provider": "CareerSafe",
    "course_ids": ["hvac_core", "osha_10_construction", "epa_608_prep"],
    "certifications": [
      {"name": "OSHA 10-Hour Construction", "provider": "CareerSafe", "delivery": "careersafeonline.com", "hours": 10},
      {"name": "EPA 608 Certification Prep", "provider": "CareerSafe", "delivery": "careersafeonline.com", "hours": 8},
      {"name": "HVAC Fundamentals", "provider": "CareerSafe", "delivery": "careersafeonline.com", "hours": 40}
    ],
    "total_hours": 58
  },
  "lms_integration": {
    "provider": "CareerSafe",
    "access_method": "sso",
    "uses_career_courses_table": true,
    "uses_career_course_purchases_table": true
  }
}
```

---

## Mapping to Existing Repo Tables

### For `internal_apprenticeship` (Barber)

| Table | Used | Purpose |
|-------|------|---------|
| `programs` | YES | Program definition |
| `applications` | YES | Student applications |
| `enrollments` | YES | Active enrollments |
| `cohorts` | YES | Cohort assignment |
| `partner_sites` | YES | Placement sites |
| `apprentice_assignments` | YES | Student-site assignments |
| `attendance_hours` | YES | Hour logging |
| `documents` | YES | Document uploads |
| `audit_logs` | YES | All actions |

### For `external_lms_wrapped` (HVAC)

| Table | Used | Purpose |
|-------|------|---------|
| `programs` | YES | Program definition |
| `applications` | YES | Student applications |
| `enrollments` | YES | Active enrollments |
| `career_courses` | YES | CareerSafe course definitions |
| `career_course_purchases` | YES | Funding-based "purchase" (no Stripe charge) |
| `documents` | YES | Credential verification uploads |
| `audit_logs` | YES | All actions |
| `cohorts` | NO | Not used for external LMS |
| `partner_sites` | NO | Not used |
| `apprentice_assignments` | NO | Not used |
| `attendance_hours` | NO | **FORBIDDEN** |

---

## Funding Model Clarification

### HVAC is FREE for Eligible Participants

```
Program Cost:      $5,500 (ETPL-approved, covered by funding)
Funding Source:    WIOA / WorkOne / WRG / Workforce Grants
Student Payment:   $0 (FREE for eligible participants)
Self-Pay Option:   NO - HVAC is funding-only, not self-pay
```

**Key Distinction from Barber:**
- HVAC = FREE (100% funded, no self-pay option)
- Barber = Has self-pay option ($4,980) OR funding covers it

This is NOT the same as "free" or "no price":
- Price is required for funding eligibility reporting
- Price is required for audit compliance
- Price is required for refund calculations
- Price appears in store/checkout (with funding badge)

### Database Representation

```sql
-- programs table
INSERT INTO programs (slug, name, price_cents, funding_eligible) VALUES
('hvac-technician', 'HVAC Technician Training', 550000, true);

-- career_course_purchases table (funding-based purchase)
INSERT INTO career_course_purchases (
  user_id, 
  course_id, 
  payment_method,  -- 'funding' not 'stripe'
  funding_source,  -- 'WIOA'
  amount_cents,    -- 550000 (for reporting)
  student_paid     -- 0 (actual out-of-pocket)
) VALUES (...);
```

### Price Source (from repo)

HVAC price is defined in `app/api/enroll/payment/route.ts`:
```typescript
const PROGRAM_DETAILS = {
  hvac: { name: 'HVAC Technician', totalPrice: 5500 },
  // ...
};
```

This is the ETPL-approved price for the 4-9 month hybrid program (320-720 hours).

---

## Status Flow Comparison

### Barber (internal_apprenticeship)
```
applied → eligibility_verified → enrolled → site_assigned → 
hours_in_progress → hours_complete → documents_verified → completed
```

### HVAC (external_lms_wrapped)
```
applied → funding_verified → enrolled → lms_access_granted → 
lms_active → credential_uploaded → credential_verified → completed
```

Key differences:
- Barber has `site_assigned` and `hours_*` states
- HVAC has `lms_*` and `credential_*` states
- Both end at `completed` with audit log

---

## Action Items

1. **Add `program_type` column to `programs` table**
   ```sql
   ALTER TABLE programs ADD COLUMN program_type TEXT 
   CHECK (program_type IN ('internal_apprenticeship', 'external_lms_wrapped', 'external_referral'));
   ```

2. **Seed HVAC program with correct type**
   ```sql
   UPDATE programs SET program_type = 'external_lms_wrapped' WHERE slug = 'hvac-technician';
   UPDATE programs SET program_type = 'internal_apprenticeship' WHERE slug = 'barber-apprenticeship';
   ```

3. **Add RLS constraint preventing HVAC from using hours tables**
   (See rls-plan.md)

4. **Align HVAC routes with `career_courses` pattern**
   (See refactor-plan.md)
