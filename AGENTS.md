# OpenHands Agent Memory - Elevate LMS

**📋 MASTER DOCUMENTATION:** `ENTERPRISE-PRD.md` - This is the comprehensive source of truth for the entire Elevate for Humanity platform. All development must reference this document.

---

## 🚀 PRODUCTION STATUS

### System Status
| Component | Status | Notes |
|-----------|--------|-------|
| **PARIS AI Operating System** | ✅ Active | 18 AI agents |
| **Student LMS** | ✅ Active | /lms/dashboard |
| **Admin Dashboard** | ✅ Active | /admin/dashboard |
| **Testing Center** | ✅ Active | ACT WorkKeys, Certiport, PSI |
| **Apprenticeship (RAPIDS)** | ✅ Active | Barber, Cosmetology |
| **Stripe Payments** | ✅ Active | Webhooks configured |
| **Email (Resend/SendGrid)** | ✅ Active | Transactional emails |
| **Database (Supabase)** | ✅ Active | 200+ tables |
| **Northflank Deployment** | ✅ Active | Docker containers |

### Production URLs
- **Main Site**: https://work-1-xlhyjyadwhfndgof.prod-runtime.all-hands.dev/ (port 12000)
- **Admin**: https://work-2-xlhyjyadwhfndgof.prod-runtime.all-hands.dev/ (port 12001)

---

## 📚 MASTER DOCUMENT: ENTERPRISE-PRD.md

The comprehensive Enterprise Product Requirements Document covers **32 major chapters**:

### AI & Intelligence
1. **PARIS AI Operating System** - 18 AI agents (Phone, Receptionist, Admissions, Recruiter, Sales, Compliance, Grant Writer, Proposal Builder, Contract Builder, Policy Builder, SOP Builder, Forms Builder, Document Builder, Digital Binder, Accreditation Binder, Grant Manager, Nonprofit Manager, Government Contractor)
2. **Dev Studio** - Visual development environment
3. **AI Website Builder** - No-code website creation
4. **AI Business Builder** - Business plan/document generation
5. **AI Mobile App Builder** - Cross-platform mobile apps
6. **AI Workflow Builder** - Business automation
7. **AI Media Studio** - Video creation with HeyGen
8. **AI Clone Marketplace** - Buy/sell AI agents
9. **Course Factory** - AI-powered course generation
10. **Credential Intelligence** - Certification lifecycle

### Vertical Industry Engines
11. **HVAC Engine** - EPA 608, NATE certifications
12. **Medical Engine** - NHA certifications (CCMA, CPT, CET)
13. **Barber & Beauty Engine** - State licensing, RAPIDS apprenticeship
14. **CDL Engine** - Class A/B CDL training
15. **Peer Recovery Engine** - Peer support certifications

### Platforms & Portals
16. **Apprenticeship Platform** - RAPIDS/DOL integration, OJL, RTI
17. **Testing Center** - ACT WorkKeys, Certiport, PSI, NHA
18. **Student Platform** - LMS, progress, digital binder
19. **Instructor Platform** - Teaching, grading, attendance
20. **Employer Platform** - Hiring, job posting, candidate matching
21. **Recruiter Platform** - Sourcing, Adzuna integration
22. **Partner Platform** - WIOA, VR, workforce boards
23. **Workforce Platform** - Regional workforce development
24. **Government Platform** - ETPL, HSI compliance

### Business Systems
25. **CRM System** - Lead management, pipeline automation
26. **Digital Binder** - Student document collection
27. **Marketing Platform** - AI content, campaigns
28. **E-Commerce & Licensing** - Store, white-label licensing
29. **Marketplace** - Multi-vendor platform
30. **Analytics & BI** - Reporting, dashboards
31. **Security Architecture** - FERPA, HIPAA, PCI-DSS
32. **Infrastructure & DevOps** - Northflank, CI/CD

### Quality & Operations
33. **Performance Engineering** - Core Web Vitals
34. **Production Acceptance Criteria** - Deployment checklist

---

## 🎯 DEVELOPMENT PRIORITIES

### Current Sprint Focus
1. **PARIS AI Commands** - Natural language automation
2. **RAPIDS Sync** - Department of Labor integration
3. **Testing Center** - ACT WorkKeys full integration
4. **White-Label Licensing** - Multi-tenant platform

### Quick Reference by Feature

| Feature | Location in PRD | Implementation Status |
|---------|----------------|----------------------|
| AI Phone Agent | Chapter 3.2.1 | `/lib/ai/paris-phone-agent.ts` |
| AI Admissions | Chapter 3.2.3 | `/lib/ai/paris-admissions.ts` |
| RAPIDS Integration | Chapter 14.2 | `/lib/rapids/` |
| WIOA Reporting | Chapter 20.3 | `/lib/wioa/` |
| ACT WorkKeys | Chapter 15.4 | `/lib/testing/workkeys.ts` |
| Employer Matching | Chapter 18.4 | `/lib/matching/` |
| Digital Binder | Chapter 24 | `/lib/binder/` |
| White-Label | Chapter 26.3 | `/lib/tenant/` |

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
| Master PRD | `ENTERPRISE-PRD.md` | Complete specification |
| Architecture | `ARCHITECTURE_DOCUMENTATION.md` | System architecture |
| Dashboard Truth | `TRUE-DASHBOARD-ARCHITECTURE.md` | Portal routing |
| Database Audit | `DATABASE-AUDIT.md` | Table status |
| Automation Engine | `INTELLIGENT-AUTOMATION-ENGINE.md` | Lead-to-enrollment |
| Production Setup | `PRODUCTION-SETUP.md` | Deployment guide |
| Blueprint | `BLUEPRINT/INDEX.md` | Page specifications |

---

**Last Updated:** July 11, 2026  
**Document Owner:** Elevate for Humanity Engineering Team
