# AI Integration Audit: PARIS & Lizzy

## Current State

### PARIS - AI Student Success Agent
**Location:** `/components/paris/ParisChat.tsx`  
**API:** `/api/paris/route.ts`  
**Standalone Page:** `/paris/page.tsx` ✅

| Feature | Status | Implementation |
|---------|--------|----------------|
| Inquiry Handling | ✅ | Basic greeting, career guidance |
| Career Guidance | ✅ | Implemented via career_guidance_interview task |
| Session Management | ✅ | Persists conversations |

**MISSING from Student Lifecycle:**

| Phase | Integration | Notes |
|-------|-------------|-------|
| Inquiry | ⚠️ PARTIAL | Only on /paris page, not embedded on homepage |
| Application | ❌ MISSING | Not integrated into application flow |
| Admissions Interview | ⚠️ BASIC | Basic chat only, no structured interview |
| Enrollment | ❌ MISSING | Not in enrollment pages |
| Orientation | ❌ MISSING | Not in orientation pages |
| Student Dashboard | ❌ MISSING | Not on /learner/dashboard |
| Apprenticeship | ❌ MISSING | No OJT tracking integration |
| Testing Center | ❌ MISSING | Not in /testing pages |
| Career Services | ❌ MISSING | Not in career services |
| Alumni | ❌ MISSING | No post-graduation support |

### Lizzy - Admin AI Assistant
**Location:** `/components/admin/dashboard/LizzyWorkspace.tsx`  
**Status:** ✅ Integrated into Admin Dashboard

| Feature | Status |
|---------|--------|
| Command Execution | ✅ |
| File Management | ✅ |
| Deployment Commands | ✅ |
| Preview Tools | ✅ |

## Required Integrations

### P0 - Critical (Student Lifecycle)

1. **Embed Paris on Homepage**
   - Add to hero section or floating chat
   - Route: `/app/page.tsx`

2. **Embed Paris on Student Dashboard**
   - Route: `/app/learner/dashboard/page.tsx`
   - Show: assignments, documents, payments, apprenticeship hours

3. **Embed Paris on Application Pages**
   - Route: `/app/apply/**`
   - Show: document requirements, field validation help

4. **Embed Paris on Enrollment Pages**
   - Route: `/app/enrollment/**`
   - Show: tuition info, payment plans, checklist

5. **Embed Paris on Orientation Pages**
   - Route: `/app/orientation/**`
   - Show: policy explanations, module progress

### P1 - High Priority

6. **Embed Paris on Testing Center**
   - Route: `/app/testing/**`
   - Show: exam selection, scheduling, payment guidance

7. **Embed Paris on Career Services**
   - Route: `/app/career-services/**`
   - Show: resume building, job matching

8. **Add Digital Student Binder**
   - Create `/components/student/BinderSection.tsx`
   - Log all Paris conversations automatically

### P2 - Medium Priority

9. **Admissions Interview Mode**
   - Structured questionnaire
   - Generate interview summary
   - Store in student binder

10. **Apprenticeship Tracking**
    - OJT hours display
    - Competency tracking
    - Employer notifications

11. **Alumni Support**
    - Certification reminders
    - Continuing education recommendations

## Architecture Recommendations

### Component Structure
```
components/
├── paris/
│   ├── ParisChat.tsx          # Main chat interface
│   ├── ParisProvider.tsx      # Context provider
│   ├── ParisEmbed.tsx        # Embeddable component
│   ├── ParisFloatingButton.tsx # Floating chat button
│   └── student/
│       ├── ParisDashboard.tsx
│       ├── ParisApplication.tsx
│       ├── ParisEnrollment.tsx
│       ├── ParisOrientation.tsx
│       └── ParisCareer.tsx
└── lizzy/
    └── LizzyWorkspace.tsx     # Existing
```

### API Routes
```
app/api/paris/
├── route.ts                  # Existing - basic chat
├── interview/route.ts        # Admissions interview
├── recommend/route.ts        # Program recommendations
├── binder/route.ts           # Student binder operations
└── career/route.ts          # Career services
```

## Implementation Plan

### Phase 1: Core Integration
- [ ] Add Paris floating button to all public pages
- [ ] Embed Paris on student dashboard
- [ ] Create Paris context provider

### Phase 2: Application Flow
- [ ] Add Paris to application pages
- [ ] Add document checklist help
- [ ] Add field validation assistance

### Phase 3: Student Success
- [ ] Add Paris to enrollment
- [ ] Add Paris to orientation
- [ ] Add apprenticeship tracking

### Phase 4: Career & Alumni
- [ ] Add Paris to testing center
- [ ] Add resume builder
- [ ] Add alumni reminders
