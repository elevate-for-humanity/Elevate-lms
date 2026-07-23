# PARIS–ZORA Implementation: Side-by-Side Comparison

## Current State vs Required Implementation

| Component | Current (What Exists) | Required (What's Needed) | Status |
|-----------|----------------------|-------------------------|--------|
| **Database Schema** | | | |
| Applications table | Basic 53-column `applications` table | Enhanced with full workflow states, documents, funding cases, tasks, events | ❌ INCOMPLETE |
| Application intake | `application_intake` buffer table | Keep + enhance with workflow | ✅ EXISTS |
| State events | `application_state_events` exists | Connect to workflow | ⚠️ PARTIAL |
| Workflow tasks | Missing | `paris_workflow_tasks` table | ❌ MISSING |
| Application documents | `provider_application_documents` | `paris_application_documents` | ❌ MISSING |
| Funding cases | Missing | `paris_funding_cases` table | ❌ MISSING |
| Workflow events | Basic exists | Enhanced with actor, payload | ⚠️ PARTIAL |
| Application notes | Missing | `paris_application_notes` | ❌ MISSING |
| Application decisions | Missing | `paris_application_decisions` | ❌ MISSING |
| Application enrollment | Missing | `paris_application_enrollments` | ❌ MISSING |
| **Library Code** | | | |
| Types |分散在各处 | `lib/paris/admissions/types.ts` | ❌ MISSING |
| State machine | Not exists | `lib/paris/admissions/state-machine.ts` | ❌ MISSING |
| Application service | Basic `/api/apply` | `lib/paris/admissions/application-service.ts` | ❌ MISSING |
| Document requirements | Generic upload | `lib/paris/admissions/document-requirements.ts` | ❌ MISSING |
| Funding engine | Basic screening | `lib/paris/admissions/funding-engine.ts` | ❌ MISSING |
| Enrollment service | Manual | `lib/paris/admissions/enrollment-service.ts` | ❌ MISSING |
| Validation | Basic | `lib/paris/admissions/validation.ts` | ❌ MISSING |
| ZORA rules | Not exists | `lib/zora/admissions/rules.ts` | ❌ MISSING |
| ZORA orchestration | Not exists | `lib/zora/admissions/orchestration-service.ts` | ❌ MISSING |
| Domain events | `lib/events/emit.ts` | `lib/events/application-events.ts` | ⚠️ PARTIAL |
| Event bus | Not exists | `lib/events/event-bus.ts` | ❌ MISSING |
| Notifications | `lib/integrations/stripe.ts` etc | `lib/integrations/notifications.ts` | ❌ MISSING |
| LMS adapter | Not exists | `lib/integrations/lms.ts` | ❌ MISSING |
| **API Routes** | | | |
| Apply submission | `/api/apply/route.ts` | Enhance + `/api/paris/applications` | ⚠️ PARTIAL |
| Application submit | Not exists | `/api/paris/applications/[id]/submit` | ❌ MISSING |
| Admissions decision | Not exists | `/api/paris/applications/[id]/decision` | ❌ MISSING |
| Enrollment | Not exists | `/api/paris/applications/[id]/enroll` | ❌ MISSING |
| Document upload | `/api/documents/upload` | Enhance for workflow | ⚠️ PARTIAL |
| **UI Components** | | | |
| Apply page | `apps/marketing/app/apply/page.tsx` | Enhance with wizard | ⚠️ PARTIAL |
| Application wizard | Not exists | `app/apply/ApplicationWizard.tsx` | ❌ MISSING |
| Applicant portal | Not exists | `app/applicant/application/[id]/page.tsx` | ❌ MISSING |
| Digital binder | Basic upload | Full workflow binder | ❌ MISSING |

---

## Implementation Plan

### Phase 1: Database Migration
1. Create `paris_workflow_tasks` table
2. Create `paris_application_documents` table
3. Create `paris_funding_cases` table
4. Create `paris_application_notes` table
5. Create `paris_application_decisions` table
6. Create `paris_application_enrollments` table
7. Add enums for workflow states

### Phase 2: Library Code
1. Create types
2. Create state machine
3. Create application service
4. Create document requirements engine
5. Create funding engine
6. Create enrollment service
7. Create validation schemas

### Phase 3: ZORA Operations
1. Create ZORA rules
2. Create ZORA orchestration service

### Phase 4: Events & Integrations
1. Create domain events
2. Create event bus
3. Create notification adapter
4. Create LMS adapter

### Phase 5: API Routes
1. Create applications API
2. Create submit API
3. Create decision API
4. Create enrollment API

### Phase 6: UI Components
1. Enhance apply page with wizard
2. Create applicant portal
3. Create digital binder workflow

---

## File Structure to Create

```
supabase/migrations/
├── YYYYMMDDHHMMSS_paris_zora_workflow.sql     # New tables

lib/
├── paris/
│   └── admissions/
│       ├── types.ts                          # Shared types
│       ├── state-machine.ts                   # State machine
│       ├── application-service.ts             # CRUD operations
│       ├── document-requirements.ts          # Document engine
│       ├── funding-engine.ts                  # Funding logic
│       ├── enrollment-service.ts              # LMS enrollment
│       └── validation.ts                      # Zod schemas
├── zora/
│   └── admissions/
│       ├── rules.ts                          # Completeness & risk
│       └── orchestration-service.ts           # ZORA brain
├── events/
│   ├── application-events.ts                  # Domain events
│   └── event-bus.ts                          # Event dispatcher
└── integrations/
    ├── notifications.ts                      # Email/SMS
    └── lms.ts                               # LMS adapter

apps/
├── marketing/app/api/paris/
│   └── applications/
│       ├── route.ts                          # Create application
│       └── [applicationId]/
│           ├── route.ts                      # Get application
│           ├── submit/route.ts               # Submit
│           ├── decision/route.ts             # Admissions decision
│           └── enroll/route.ts              # Enroll
├── marketing/app/apply/
│   └── ApplicationWizard.tsx                 # New wizard component
└── marketing/app/applicant/
    └── application/
        └── [applicationId]/
            └── page.tsx                      # Applicant portal
```

---

## Status Transition Diagram

```
DRAFT → ELIGIBILITY_REVIEW → DOCUMENTS_REQUIRED
              ↓                    ↓
         FUNDING_REVIEW ←──────────┘
              ↓
       ADMISSIONS_REVIEW
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
CONDITIONAL ACCEPTED   WAITLISTED   REFERRED   REJECTED
    ↓
 ACCEPTED
    ↓
┌───────┴───────┐
↓               ↓
PAYMENT_REQUIRED  READY_TO_ENROLL
    ↓               ↓
    └───────┬───────┘
            ↓
       ENROLLED
            ↓
        (complete)
```
