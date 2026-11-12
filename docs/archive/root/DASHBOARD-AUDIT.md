# DASHBOARD & PORTAL AUDIT - SIDE BY SIDE COMPARISON

**Generated:** July 7, 2026  
**Objective:** Compare all dashboards for onboarding/orientation consistency

---

## DASHBOARD COMPARISON MATRIX

| Feature | Student (LMS) | Employer | Case Manager | Partner | Host Shop | Admin |
|---------|---------------|----------|--------------|---------|-----------|-------|
| **Welcome Message** | ✅ "Welcome Back, {name}" | ✅ "Your Dashboard" | ✅ "Case Manager Dashboard" | ✅ "Partner Dashboard" | ❌ STUB | ✅ |
| **Quick Stats** | ✅ Programs, Progress, AI | ✅ Jobs, Apps, Programs | ✅ Participants, Enrollments | ✅ All zeros | ❌ STUB | ✅ |
| **Navigation** | ❌ No sidebar | ✅ Sidebar | ✅ Full nav | ❌ None | ❌ STUB | ✅ |
| **Onboarding Tour** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Orientation Video** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Quick Start Checklist** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Contextual Help** | ❌ None | ✅ "Need Help?" card | ❌ None | ❌ None | ❌ None | ⚠️ |
| **AI Assistant** | ⚠️ AI Tutor link | ❌ None | ❌ None | ❌ None | ❌ None | ⚠️ |
| **Learning Center** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **SOP Guidance** | ❌ None | ⚠️ "Need Help?" | ❌ None | ❌ None | ❌ None | ⚠️ |
| **FAQ Section** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Progress Tracking** | ✅ Progress % shown | ✅ State machine | ✅ Stats grid | ❌ All zeros | ❌ STUB | ✅ |
| **Role-specific Content** | ⚠️ Basic | ✅ State-aware | ✅ Assigned participants | ❌ Generic | ❌ STUB | ✅ |

---

## CRITICAL FINDINGS

### 🔴 HOST SHOP DASHBOARD - STUB PAGE

**Location:** `/host-shop/dashboard/page.tsx`

**Current State:**
```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-blue-200">Workforce development resources.</p>
      </section>
      <Link href="/" className="bg-brand-blue-600...">Back to Home</Link>
    </div>
  );
}
```

**Issues:**
- No authentication check
- No data loading
- No navigation sidebar
- Generic placeholder text
- No functionality
- STUB PAGE - NOT IMPLEMENTED

### 🔴 HOST SHOP NAVIGATION - MISSING

**Required Navigation for Host Shop:**
```
/host-shop/dashboard
├── /host-shop/dashboard/apprentices
├── /host-shop/dashboard/hours
├── /host-shop/dashboard/competencies
├── /host-shop/dashboard/schedule
├── /host-shop/dashboard/documents
├── /host-shop/dashboard/reports
├── /host-shop/dashboard/messages
├── /host-shop/dashboard/profile
└── /host-shop/dashboard/store
```

**Current State:**
- Routes exist (as individual pages)
- No shared layout/navigation
- No authentication wrapper
- Each page is standalone

---

## ONBOARDING FEATURE GAP ANALYSIS

### PHASE 1: Welcome Experience

| Dashboard | Welcome Message | Role Explanation | First Login CTA |
|-----------|----------------|------------------|-----------------|
| Student | ✅ | ❌ | ❌ |
| Employer | ✅ | ✅ | ❌ |
| Case Manager | ✅ | ✅ | ❌ |
| Partner | ✅ | ❌ | ❌ |
| Host Shop | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ❌ |

### PHASE 2: Orientation Video

| Dashboard | Video | Duration | Replay Button |
|-----------|-------|----------|---------------|
| Student | ❌ | - | - |
| Employer | ❌ | - | - |
| Case Manager | ❌ | - | - |
| Partner | ❌ | - | - |
| Host Shop | ❌ | - | - |
| Admin | ❌ | - | - |

### PHASE 3: Guided Tour

| Dashboard | Interactive Tour | Highlight Elements | Skip/Replay |
|-----------|-----------------|-------------------|-------------|
| Student | ❌ | - | - |
| Employer | ❌ | - | - |
| Case Manager | ❌ | - | - |
| Partner | ❌ | - | - |
| Host Shop | ❌ | - | - |
| Admin | ❌ | - | - |

### PHASE 4: Quick Start Checklist

| Dashboard | Auto-generated | Saves Progress | Role-specific |
|-----------|---------------|----------------|--------------|
| Student | ❌ | - | - |
| Employer | ❌ | - | - |
| Case Manager | ❌ | - | - |
| Partner | ❌ | - | - |
| Host Shop | ❌ | - | - |
| Admin | ❌ | - | - |

### PHASE 5: Contextual Help

| Dashboard | What is This? | Tooltips | FAQ |
|-----------|---------------|----------|-----|
| Student | ❌ | ❌ | ❌ |
| Employer | ✅ Card | ❌ | ❌ |
| Case Manager | ❌ | ❌ | ❌ |
| Partner | ❌ | ❌ | ❌ |
| Host Shop | ❌ | ❌ | ❌ |
| Admin | ⚠️ | ❌ | ❌ |

### PHASE 6: AI Help Assistant

| Dashboard | AI Chat | Role-aware | Context-aware |
|-----------|---------|------------|---------------|
| Student | ⚠️ Link | ❌ | ❌ |
| Employer | ❌ | - | - |
| Case Manager | ❌ | - | - |
| Partner | ❌ | - | - |
| Host Shop | ❌ | - | - |
| Admin | ⚠️ | ❌ | ❌ |

---

## PORTAL/LAYOUT AUDIT

### Has Own Layout

| Portal | Layout File | Navigation | Auth Check |
|--------|-------------|------------|------------|
| /employer | ✅ employer/layout.tsx | ✅ | ✅ |
| /case-manager | ✅ case-manager/layout.tsx | ✅ | ✅ |
| /partner | ✅ partner/layout.tsx | ⚠️ | ✅ |
| /host-shop | ❌ No layout | ❌ | ❌ |
| /student | ❌ No layout | ❌ | ❌ |
| /lms | ❌ No layout | ❌ | ❌ |
| /admin | ✅ | ✅ | ✅ |

---

## ACTION ITEMS

### HIGH PRIORITY

1. **Host Shop Dashboard** - Implement full dashboard with:
   - [ ] Authentication check
   - [ ] Apprentice management
   - [ ] Hour tracking
   - [ ] Competency management
   - [ ] Schedule view
   - [ ] Document management
   - [ ] Reports
   - [ ] Messages
   - [ ] Profile/Settings

2. **Host Shop Navigation** - Create shared layout:
   - [ ] Sidebar navigation
   - [ ] Header with user info
   - [ ] Breadcrumbs
   - [ ] Mobile responsive menu
   - [ ] Auth protection

3. **Welcome Experience** - Add to ALL dashboards:
   - [ ] Personalized welcome message
   - [ ] Role explanation
   - [ ] First login tour trigger
   - [ ] Quick start checklist

### MEDIUM PRIORITY

4. **Orientation Videos** - Create for each dashboard:
   - [ ] Student LMS video
   - [ ] Employer portal video
   - [ ] Case Manager video
   - [ ] Host Shop video
   - [ ] Partner portal video

5. **Guided Tours** - Implement using Shepherd.js or similar:
   - [ ] Student dashboard tour
   - [ ] Employer dashboard tour
   - [ ] Case Manager tour
   - [ ] Host Shop tour

6. **Quick Start Checklists** - Add role-specific checklists:
   - [ ] Student checklist (PARiS, docs, courses)
   - [ ] Employer checklist (verification, posting)
   - [ ] Case Manager checklist (participants, reports)
   - [ ] Host Shop checklist (apprentices, hours)

### LOW PRIORITY

7. **Contextual Help System** - Build reusable component:
   - [ ] "What is this?" tooltips
   - [ ] FAQ accordions per page
   - [ ] Video tutorial embeds
   - [ ] Documentation links

8. **AI Help Assistant** - Enhance across platform:
   - [ ] Role-aware responses
   - [ ] Page context awareness
   - [ ] Action recording
   - [ ] Handoff to human

9. **Learning Center** - Add to all dashboards:
   - [ ] Video library
   - [ ] User guides
   - [ ] SOP library
   - [ ] Feature announcements

---

## ESTIMATED EFFORT

| Task | Hours | Priority |
|------|-------|----------|
| Host Shop Dashboard | 32 | HIGH |
| Host Shop Navigation | 16 | HIGH |
| Welcome Experience (all) | 24 | HIGH |
| Orientation Videos (5x) | 20 | MEDIUM |
| Guided Tours (5x) | 24 | MEDIUM |
| Quick Start Checklists (5x) | 16 | MEDIUM |
| Contextual Help System | 20 | MEDIUM |
| AI Help Enhancement | 16 | MEDIUM |
| Learning Center | 24 | LOW |
| **Total** | **192 hours** | |

---

## RECOMMENDED IMPLEMENTATION ORDER

1. **Host Shop Dashboard** - Fill critical gap
2. **Host Shop Navigation** - Consistent UX
3. **Welcome Experience** - All dashboards
4. **Quick Start Checklists** - Role-specific onboarding
5. **Guided Tours** - Interactive help
6. **Orientation Videos** - Visual learning
7. **Contextual Help** - Self-service support
8. **AI Help** - Advanced assistance
9. **Learning Center** - Complete documentation

---

**Report Version:** 1.0  
**Last Updated:** July 7, 2026
