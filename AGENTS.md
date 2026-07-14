# OpenHands Agent Memory - Elevate LMS

**📋 MASTER DOCUMENTATION:** `ENTERPRISE-PRD.md` (4,079 lines) - This is the comprehensive source of truth for the entire Elevate for Humanity platform. All development must reference this document.

---

## 🚀 PRODUCTION STATUS

### System Status
| Component | Status | Notes |
|-----------|--------|-------|
| **PARIS AI Operating System** | ✅ Code Ready | 18 AI agents |
| **Student LMS** | ✅ Code Ready | /lms/dashboard |
| **Admin Dashboard** | ✅ Code Ready | /admin/dashboard |
| **Testing Center** | ✅ Code Ready | ACT WorkKeys, Certiport, PSI |
| **Apprenticeship (RAPIDS)** | ✅ Code Ready | Barber, Cosmetology |
| **Stripe Payments** | ✅ Code Ready | Webhooks configured |
| **Email (Resend/SendGrid)** | ✅ Code Ready | Transactional emails |
| **Database (Supabase)** | ✅ Code Ready | 200+ tables |
| **Northflank Deployment** | ⚠️ Pending | Needs secrets + build |

### Production URLs (Pending Deployment)
- **Main Site**: `work-1-{project}.prod-runtime.all-hands.dev`
- **Admin**: `work-2-{project}.prod-runtime.all-hands.dev`

**⚠️ NOT DEPLOYED YET** - Code committed to GitHub, need to:
1. Set NORTHFLANK_API_TOKEN environment variable
2. Configure secrets in Northflank dashboard
3. Trigger build from new commit

---

## 🏗️ PARIS Operations Kernel (NEW)

### Components Implemented (July 14, 2026)

| Component | Location | Status |
|-----------|----------|--------|
| **Authoritative Data Layer** | `lib/operations/` | ✅ Implemented |
| **Program Registry** | `lib/registry/`, `data/programs/` | ✅ Implemented |
| **Workflow Engine** | `lib/workflows/engine.ts` | ✅ Implemented |
| **State Machine** | `lib/orchestration/state-machine.ts` | ✅ Implemented |
| **Notification System** | `lib/notifications/` | ✅ Implemented |
| **Claims Verification** | `lib/automation/evidence-processor.ts` | ✅ Implemented |
| **Dashboard Completion** | `lib/dashboard/completion-tracker.ts` | ✅ Implemented |
| **Production Gate** | `scripts/production-readiness-gate.sh` | ✅ Enhanced |

### Authoritative Data Layer Tables
Created in `supabase/migrations/pending/20260714000001_authoritative_data_layer.sql`:

- `organizations` - Single organization record
- `program_registry` - Canonical program definitions
- `funding_rules` - Verified funding sources
- `verified_claims` - Evidence-backed public claims
- `workflow_instances` - State machine tracking
- `workflow_events` - Audit trail
- `notification_outbox` - Reliable delivery queue

### Key Services
- `lib/operations/service.ts` - OperationsService with all CRUD operations
- `lib/operations/types.ts` - TypeScript types for authoritative data
- `lib/dashboard/completion-tracker.ts` - Role-based completion tracking

---

## 📚 MASTER DOCUMENT: ENTERPRISE-PRD.md

The comprehensive Enterprise PRD covers **32 chapters** with full implementation specs:

| Chapter | System |
|---------|--------|
| 1 | Executive Vision |
| 2 | Enterprise Architecture |
| 3 | PARIS AI Operating System (18 agents) |
| 4 | Dev Studio |
| 5-10 | AI Builders (Website, Business, Mobile, Workflow, Media, Clone) |
| 11-12 | Course Factory, Credential Intelligence |
| 13 | Vertical Engines (HVAC, Medical, Barber, CDL, Peer Recovery) |
| 14-15 | Apprenticeship Platform, Testing Center |
| 16-24 | All Platforms & Portals |
| 25-32 | Business Systems, Security, Infrastructure |

**Full reference:** See `ENTERPRISE-PRD.md` for complete specifications

---

## 🏗️ Program Page Architecture

### Unified ProgramLanding System

All apprenticeship programs use a **configuration-driven architecture**:

```
components/programs/
├── ProgramLanding.tsx          # Master page renderer
├── config/
│   ├── barber-config.ts        # Barber Apprenticeship
│   ├── cosmetology-config.ts   # Cosmetology Apprenticeship
│   ├── esthetics-config.ts     # Esthetician Apprenticeship
│   └── nail-config.ts          # Nail Technician Apprenticeship
└── sections/                   # Reusable section components
    ├── HeroSection.tsx
    ├── ImagineSection.tsx
    ├── ComparisonSection.tsx
    ├── JourneySection.tsx
    ├── SkillsSection.tsx
    ├── CareerOutcomesSection.tsx  # Salary + Calculator + Jobs (UNIFIED)
    ├── BusinessSection.tsx
    ├── MentorsSection.tsx
    ├── TestimonialsSection.tsx
    ├── FundingSection.tsx
    ├── FAQSection.tsx
    └── CTASection.tsx
```

### Adding a New Program

1. Create a config file in `components/programs/config/{program}-config.ts`
2. Export a `ProgramConfig` object with all content
3. Add to registry in `app/programs/[program]/page.tsx`:

```ts
const APPRENTICESHIP_CONFIGS: Record<string, ProgramConfig> = {
  'barber-apprenticeship': barberConfig,
  'cosmetology-apprenticeship': cosmetologyConfig,
  // Add new program here
};
```

### Page Flow (Single Narrative)

```
Hero → Imagine → Comparison → Journey → Skills → Career Outcomes → Business → Mentors → Testimonials → Funding → FAQ → CTA
```

### Legacy Components (Pending Cleanup)

- `BeautyApprenticeship.tsx` - Old 1500-line monolith, can be deleted after migration
- `BarberApprenticeshipClient.tsx` - Legacy component, superseded by ProgramLanding
- `sections/` in `app/programs/barber-apprenticeship/` - Orphaned, can be deleted

---

## 🔧 Critical Integrations (Wired July 13, 2026)

### Digital Binder Flow
```typescript
// completeEnrollment() now creates binder automatically
const { binderId, created } = await ensureDigitalBinder({
  db: supabase,
  userId: data.userId,
  enrollmentId: enrollment.id,
});
```

### Paris AI Chat API
- **Endpoint:** `/api/zora/route.ts`
- **Uses:** Groq (Llama) with fallback
- **Session:** Stores in `ai_conversations` table
- **System:** PARIS career guidance prompts

### Enrollment Notifications
```typescript
// Send notification on status change
import { onEnrollmentStatusChange } from '@/lib/notifications/enrollment-notifications';
await onEnrollmentStatusChange({ email, status: 'active', ... });
```

### Tidio/Lizzy Config
- **File:** `lib/chatbot/tidio-config.ts`
- **Setup:** Set `NEXT_PUBLIC_TIDIO_KEY` env var

---

## 📋 Required Secrets (Northflank)

| Secret | Purpose | Status |
|-------|---------|--------|
| NEXT_PUBLIC_SUPABASE_URL | Database | ⚠️ Configure |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client auth | ⚠️ Configure |
| SUPABASE_SERVICE_ROLE_KEY | Server auth | ⚠️ Configure |
| ANTHROPIC_API_KEY | Paris AI (optional) | Optional |
| NEXT_PUBLIC_TIDIO_KEY | Lizzy chatbot | ⚠️ Configure |
| GROQ_API_KEY | Zora chat | Optional |

---

## 🗄️ Database Migrations

**Pending migration:** `supabase/migrations/pending/20260713000001_critical_tables.sql`

Tables created:
- ai_conversations
- digital_binders
- binder_documents
- certifications
- credentials
- licenses
- grades
- communications
- leads
- conversations
- announcements
- blog_posts
- campaigns
- events
- coupons
- cohort_sessions
- notification_outbox
- enrollment_status_history

Run in Supabase Dashboard SQL Editor before deploying.

---

## 🎯 DEVELOPMENT PRIORITIES

### Current Sprint Focus
1. **PARIS AI Commands** - Natural language automation
2. **RAPIDS Sync** - Department of Labor integration
3. **Testing Center** - ACT WorkKeys full integration
4. **White-Label Licensing** - Multi-tenant platform

### Quick Reference by Feature

| Feature | Implementation Path |
|---------|-------------------|
| AI Phone Agent | `/lib/ai/paris-phone-agent.ts` |
| AI Admissions | `/lib/ai/paris-admissions.ts` |
| RAPIDS Integration | `/lib/rapids/` |
| WIOA Reporting | `/lib/wioa/` |
| ACT WorkKeys | `/lib/testing/workkeys.ts` |
| Employer Matching | `/lib/matching/` |
| Digital Binder | `/lib/binder/` |
| White-Label | `/lib/tenant/` |

---

## 🔧 DEVELOPMENT WORKFLOW

### Before Starting Any Task
1. Read the relevant chapter in `ENTERPRISE-PRD.md`
2. Check existing implementations in `/lib/`
3. Verify database migrations in `/supabase/migrations/`
4. Review API routes in `/app/api/`

### Code Standards
- TypeScript strict mode
- Server actions for mutations
- RLS policies for data access
- Audit logging for compliance
- Error boundaries for resilience

### Issue Resolution Outcomes

| Outcome | Definition |
|---------|------------|
| **Fixed** | Code change implemented in repository |
| **Verified** | Confirmed working in production |
| **Blocked** | Cannot proceed (external dependency) |
| **Failed** | Engineering work still required |

**Important**: Changes are **Fixed** (in GitHub) until they're **Verified** (in production). Always distinguish between repository state and production state.

### Testing Requirements
- Unit tests: 80% coverage minimum
- Integration tests: All API routes
- E2E tests: Critical user flows
- Accessibility: WCAG 2.1 AA

---

## 📊 AUDIT CHECKLIST

### Line-by-Line Audit Rules
```
AUDIT LINE BY LINE - Side by side comparison of [FILE_A] and [FILE_B]

RULES:
1. Use `diff -y` or `paste` to show BOTH files side by side
2. For EVERY line that differs, report:
   - Exact line numbers in each file
   - Exact content of both lines  
   - Flag as ⚠️ ISSUE if different
   - Flag as ✅ EXPECTED if intentionally different
3. Do NOT skip ANY differences
4. Provide a FIXED summary table
5. Ask before making any fixes
6. RE-AUDIT after each fix
```

### Build Verification
```bash
# 1. Lockfile version vs pnpm version
grep "lockfileVersion" pnpm-lock.yaml
grep "pnpm@" Dockerfile.*

# 2. Environment variable consistency
grep "ENV" Dockerfile.* | sort

# 3. Dependency installation
grep "pnpm install" Dockerfile.*

# 4. Port conflicts
grep -E "PORT|EXPOSE|8080|3000" Dockerfile.*

# 5. Memory settings
grep "max-old-space-size" Dockerfile.*
```

### Version Matching
| Lockfile | pnpm Version |
|----------|--------------|
| lockfileVersion: '6.0' | pnpm@9.x |
| lockfileVersion: '9.0' | pnpm@10.x |

**NEVER use pnpm@10.x with lockfileVersion '6.0'**

---

## 🎓 KEY TRAINEE JOURNEYS

### Student Journey
```
Website → Lead → Application → PARiS Interview → Funding → Enrollment → LMS → Certificate → Placement
```

### Barber Apprentice Journey
```
Website → Apply → OJL Agreement → Host Shop → RTI Classes → Clock In/Out → Competency Sign-off → State Board → License → RAPIDS Certificate
```

### WIOA Participant Journey
```
WorkOne Referral → Intake → ACT WorkKeys → Program Enrollment → Training → Credential → Job Placement → 6-Month Follow-up
```

---

## 🔗 INTEGRATION POINTS

| Service | Integration Type | API/SDK |
|---------|----------------|---------|
| **Stripe** | Payments, Subscriptions | stripe-node |
| **Twilio** | SMS, Voice | twilio-node |
| **Resend** | Transactional Email | @resend/node-resend |
| **SendGrid** | Email (backup) | @sendgrid/mail |
| **Anthropic** | AI (Claude) | @anthropic-ai/sdk |
| **Adzuna** | Job Search | REST API |
| **HeyGen** | Video Generation | REST API |
| **Pexels** | Stock Photos | REST API |
| **Supabase** | Database, Auth, Storage | @supabase/supabase-js |
| **Northflank** | Hosting, Containers | northflank-api |

---

## ⚠️ CRITICAL REMINDERS

**You are too fast. Slow down and audit line by line.**

Every character matters. A misplaced `#` or wrong version number can cause hours of debugging.

**Always check:**
1. Database migrations before adding columns
2. Existing code before creating new files
3. PRD for requirements before implementing
4. Build errors before deploying

**Files to always check for sync:**
- Dockerfile.northflank-lms
- Dockerfile.northflank-admin
- package.json (workspace structure)
- pnpm-lock.yaml

---

## 📁 KEY FILE LOCATIONS

| Document | Path | Purpose |
|----------|------|---------|
| **ENTERPRISE-PRD.md** | Root | Complete 4,079-line master specification (32 chapters) |
| Architecture | `ARCHITECTURE_DOCUMENTATION.md` | System architecture |
| Dashboard Truth | `TRUE-DASHBOARD-ARCHITECTURE.md` | Portal routing |
| Database Audit | `DATABASE-AUDIT.md` | Table status |
| Automation Engine | `INTELLIGENT-AUTOMATION-ENGINE.md` | Lead-to-enrollment |
| Production Setup | `PRODUCTION-SETUP.md` | Deployment guide |
| Blueprint | `BLUEPRINT/INDEX.md` | Page specifications |

---

**Last Updated:** July 11, 2026  
**Document Owner:** Elevate for Humanity Engineering Team
