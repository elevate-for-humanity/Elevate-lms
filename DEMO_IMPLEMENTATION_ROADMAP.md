# DEMO IMPLEMENTATION ROADMAP
**Generated:** June 17, 2026

---

## PURPOSE

Comprehensive implementation plan to achieve 100% Executive Demo Readiness for Elevate LMS.

---

## EXECUTIVE SUMMARY

| Current State | Target State | Timeline |
|--------------|--------------|----------|
| **75% Demo Ready** | **100% Demo Ready** | **15 working days** |

### Quick Wins (Week 1)
1. Create demo student persona
2. Test certificate workflow
3. Create sample documents

### Medium Effort (Week 2)
4. Create demo employer persona
5. Build VR demo view
6. Add bot verification bypass

### Full Polish (Week 3)
7. Create executive tour
8. Add persona switching
9. Test full journey

---

## PHASE 1: DEMO ENVIRONMENT (Days 1-3)

### Objective
Create isolated demo environment with no production data.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Clone production database | Demo DB snapshot |
| 1 | Anonymize PII | Sanitized data |
| 1 | Create demo tenant | `demo.elevateforhumanity.org` |
| 2 | Set up demo API keys | Stripe/SendGrid test mode |
| 2 | Create demo storage bucket | Isolated file storage |
| 3 | Test isolation | Verify no production access |

### Technical Details

```bash
# 1. Clone database
pg_dump production > demo_backup.sql

# 2. Anonymize PII
psql demo < scripts/anonymize_data.sql

# 3. Create demo tenant
INSERT INTO organizations (id, name, slug, type) 
VALUES ('demo-org', 'Demo Organization', 'demo', 'demo');
```

### Acceptance Criteria
- [ ] Demo database isolated
- [ ] All PII anonymized
- [ ] Demo tenant created
- [ ] API keys isolated
- [ ] Storage isolated

---

## PHASE 2: DEMO PERSONAS (Days 4-6)

### Objective
Create realistic demo personas for all user types.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 4 | Create Maria Santos (student) | Full student journey |
| 4 | Add Maria's documents | 10+ sample docs |
| 5 | Create James Thompson (employer) | Employer portal |
| 5 | Create Maria's apprenticeship | OJT + competencies |
| 6 | Create Sarah Johnson (VR) | VR counselor view |
| 6 | Create Robert Chen (Workforce) | Board dashboard |

### Maria Santos Persona

```typescript
// Create demo student
const demoStudent = {
  email: "maria.santos.demo@elevate.example",
  password: "DemoPassword123!",
  profile: {
    first_name: "Maria",
    last_name: "Santos",
    role: "student",
    demo: true
  }
};
```

### Demo Document Set

```
MariaSantos_Binder/
├── 01_government_id.pdf
├── 02_social_security.pdf
├── 03_high_school_diploma.pdf
├── 04_wioa_referral.pdf
├── 05_intake_assessment.pdf
├── 06_career_assessment.pdf
├── 07_cpr_certificate.pdf
├── 08_osha10_certificate.pdf
├── 09_ojt_log_sample.pdf
├── 10_competency_eval_sample.pdf
└── 11_transcript.pdf
```

### Acceptance Criteria
- [ ] Maria can log in
- [ ] Digital binder shows 10+ docs
- [ ] Training shows 75% progress
- [ ] OJT shows 280 hours
- [ ] Credentials show 2 completed

---

## PHASE 3: CERTIFICATE TESTING (Days 7-8)

### Objective
Test and validate certificate generation workflow.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 7 | E2E test certificate flow | Working certificate |
| 7 | Test PDF generation | Valid PDF output |
| 8 | Test QR code generation | Scannable QR |
| 8 | Test verification page | `/verify/[id]` works |

### Test Checklist

```typescript
// Certificate Generation Test
const testCertificate = async () => {
  // 1. Complete course
  await completeCourse('cna-program', 'maria-santos');
  
  // 2. Generate certificate
  const cert = await generateCertificate({
    studentId: 'maria-santos',
    programId: 'cna-program',
    issueDate: new Date()
  });
  
  // 3. Verify PDF
  const pdf = await generateCertificatePDF(cert.id);
  expect(pdf).toBeValidPDF();
  
  // 4. Verify QR
  const qr = generateVerificationQR(cert.id);
  expect(qr).toBeScannable();
  
  // 5. Test verification
  const verified = await verifyCertificate(cert.id);
  expect(verified).toBeValid();
};
```

### Acceptance Criteria
- [ ] Certificate generates correctly
- [ ] PDF downloads properly
- [ ] QR code scannable
- [ ] Verification page works
- [ ] Email delivery works

---

## PHASE 4: CREDENTIAL TESTING (Days 9-10)

### Objective
Test and validate credential issuance workflow.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 9 | E2E test credential flow | Working credential |
| 9 | Test digital transcript | Valid transcript |
| 10 | Test badge generation | Digital badge |
| 10 | Test credential verification | Trust badge |

### Test Checklist

```typescript
// Credential Issuance Test
const testCredential = async () => {
  // 1. Issue credential
  const credential = await issueCredential({
    studentId: 'maria-santos',
    type: 'CNA',
    issuer: 'Indiana State Board of Nursing',
    issueDate: new Date()
  });
  
  // 2. Generate transcript
  const transcript = await generateTranscript('maria-santos');
  expect(transcript).toInclude('CNA');
  
  // 3. Generate badge
  const badge = await generateBadge(credential.id);
  expect(badge).toBeValidImage();
  
  // 4. Verify credential
  const verified = await verifyCredential(credential.id);
  expect(verified).toShowEmployerTrustBadge();
};
```

### Acceptance Criteria
- [ ] Credential issues correctly
- [ ] Transcript generates properly
- [ ] Badge displays correctly
- [ ] Verification works for employers

---

## PHASE 5: VR DEMO VIEW (Days 11-12)

### Objective
Create VR counselor demo view with realistic caseload.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 11 | Create VR dashboard | `/admin/staff-portal/vr` |
| 11 | Add Maria to VR caseload | VR can view student |
| 12 | Add progress tracking | VR sees progress |
| 12 | Add referral history | VR sees referrals |

### VR Dashboard Components

```typescript
// components/vr/VRCaseloadDashboard.tsx

const VRCaseloadDashboard = ({ counselor }) => {
  return (
    <div className="vr-dashboard">
      <CaseloadOverview 
        activeClients={25}
        inTraining={12}
        employed={8}
      />
      <CaseloadList clients={caseload} />
      <QuickActions>
        <AddReferral />
        <GenerateReport />
        <ViewMetrics />
      </QuickActions>
    </div>
  );
};
```

### Acceptance Criteria
- [ ] VR can log in
- [ ] VR sees Maria in caseload
- [ ] VR can view progress
- [ ] VR can generate reports

---

## PHASE 6: BOT BYPASS (Day 13)

### Objective
Add test mode for application form to enable demo enrollment.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 13 | Add test mode flag | `TEST_MODE=true` bypass |
| 13 | Create test Turnstile token | Valid test token |
| 13 | Document testing workflow | Test documentation |

### Implementation

```typescript
// lib/api/verify-turnstile.ts

export async function verifyTurnstile(
  token: string, 
  ip: string
): Promise<boolean> {
  // Bypass for test mode
  if (process.env.TEST_MODE === 'true') {
    console.log('[TEST MODE] Bypassing Turnstile verification');
    return true;
  }
  
  // Normal verification
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    }
  );
  
  const data = await response.json();
  return data.success;
}
```

### Acceptance Criteria
- [ ] Test mode bypasses bot check
- [ ] Demo enrollment works
- [ ] Production remains protected

---

## PHASE 7: EXECUTIVE TOUR (Days 14-15)

### Objective
Build the guided executive tour with all 11 scenes.

### Tasks

| Day | Task | Deliverable |
|-----|------|-------------|
| 14 | Build tour engine | OnboardingTour enhanced |
| 14 | Create 11 scenes | Scene configurations |
| 14 | Add narration | Narration overlay |
| 15 | Add persona switching | Switch between views |
| 15 | Add highlights | Feature highlighting |
| 15 | Test full tour | All scenes working |

### Tour Scenes

| Scene | View | Duration |
|-------|------|----------|
| 1. The Problem | `/` | 30s |
| 2. The Referral | `/admin/staff-portal/referrals` | 45s |
| 3. The Binder | `/student-portal/documents` | 45s |
| 4. The Assessment | `/career-services/career-counseling` | 45s |
| 5. The Career Path | `/student-portal/career-path` | 45s |
| 6. The Training | `/student-portal/dashboard` | 45s |
| 7. The Apprenticeship | `/apprentice` | 45s |
| 8. The Testing | `/student-portal/testing` | 45s |
| 9. The Credential | `/student-portal/credentials` | 45s |
| 10. The Placement | `/employer/dashboard` | 45s |
| 11. The Outcome | `/student-portal/career` | 60s |

### Acceptance Criteria
- [ ] Tour launches from landing page
- [ ] All 11 scenes accessible
- [ ] Narration plays correctly
- [ ] Persona switching works
- [ ] Auto-advance functions

---

## EXECUTION TIMELINE

```
Week 1: Environment + Personas
├── Day 1: Demo environment setup
├── Day 2: Database isolation
├── Day 3: API key setup
├── Day 4: Maria Santos persona
├── Day 5: James Thompson persona
└── Day 6: VR + Workforce personas

Week 2: Testing + VR View
├── Day 7: Certificate testing
├── Day 8: Credential testing
├── Day 9: Certificate fixes
├── Day 10: Credential fixes
├── Day 11: VR dashboard
├── Day 12: VR dashboard polish
└── Day 13: Bot bypass

Week 3: Tour + Polish
├── Day 14: Tour engine + scenes
├── Day 15: Tour polish + testing
└── Day 16-18: Buffer + final testing
```

---

## BUDGET ESTIMATE

| Resource | Days | Notes |
|----------|-------|-------|
| Backend Developer | 8 days | Env, personas, testing |
| Frontend Developer | 5 days | VR view, tour |
| DevOps | 2 days | Environment setup |
| QA | 3 days | Testing, validation |
| **Total** | **18 days** | |

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Certificate PDF fails | Medium | High | Early testing, multiple attempts |
| Demo data exposure | Low | High | Strict isolation, audit |
| Tour navigation breaks | Medium | Medium | Robust error handling |
| Bot bypass exploited | Low | Medium | Production flag only |

---

## SUCCESS METRICS

### Week 1 Complete
- [ ] Demo environment isolated
- [ ] 6 personas created
- [ ] No production data access

### Week 2 Complete
- [ ] Certificate workflow E2E tested
- [ ] Credential workflow E2E tested
- [ ] VR demo view functional
- [ ] Bot bypass working

### Week 3 Complete
- [ ] Executive tour functional
- [ ] All personas switchable
- [ ] Narration complete
- [ ] Full story walkable

### Final Demo Ready
- [ ] VR can run demo self-sufficiently
- [ ] Employer demo works
- [ ] Funder compliance view works
- [ ] 11-scene story complete
- [ ] Zero production data exposure

---

## POST-LAUNCH

### Demo Maintenance
| Task | Frequency | Owner |
|------|-----------|-------|
| Reset demo data | Weekly | Admin |
| Update personas | Monthly | Content |
| Test tour flow | Weekly | QA |
| Rotate demo credentials | Monthly | DevOps |

### Demo Enhancement Backlog
| Enhancement | Priority | Estimate |
|-------------|----------|----------|
| Audio narration | Low | 3 days |
| Multi-language | Low | 5 days |
| Custom branding | Medium | 2 days |
| ROI calculator | Medium | 3 days |

---

## APPENDIX: QUICK START GUIDE

### Starting a Demo

1. **Navigate to demo site:** `demo.elevateforhumanity.org`
2. **Select persona:** Maria, James, Sarah, Robert, or Patricia
3. **Launch tour:** Click "Start Demo Tour"
4. **Walk through:** Let auto-pilot guide, or explore freely

### Demo Credentials

| Persona | Email | Password |
|---------|-------|----------|
| Maria Santos | `maria.demo@demo` | `Demo123!` |
| James Thompson | `james.demo@demo` | `Demo123!` |
| Sarah Johnson | `sarah.demo@demo` | `Demo123!` |
| Robert Chen | `robert.demo@demo` | `Demo123!` |
| Patricia Williams | `patricia.demo@demo` | `Demo123!` |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Check demo credentials |
| Data missing | Reset demo from admin |
| Tour stuck | Refresh page, restart tour |
| Forms won't submit | Enable test mode |

---

**Implementation Roadmap By:** OpenHands Agent  
**Date:** June 17, 2026
