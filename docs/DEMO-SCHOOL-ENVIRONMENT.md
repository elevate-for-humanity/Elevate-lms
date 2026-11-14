# Demo School Environment

**© 2026 Elevate for Humanity**  
**All Rights Reserved**

---

## Purpose

The Demo School Environment allows prospective customers to experience Elevate curriculum before purchasing. It showcases:

- Working LMS interface
- Sample lessons with interactive content
- Instructor dashboard preview
- Student progress tracking
- Apprenticeship features (for apprenticeship programs)

---

## Demo URLs

```
demo.elevate.example/
├── /login
│   ├── /student        # Demo student account
│   └── /instructor     # Demo instructor account
├── /programs
│   ├── /barber-apprenticeship
│   │   ├── /overview           # Program info
│   │   ├── /curriculum         # Module/lesson structure
│   │   ├── /preview             # Sample lesson (unauthenticated)
│   │   └── /instructor-preview  # Instructor view (demo instructor)
│   ├── /building-services
│   │   └── ...
│   └── /hvac
│       └── ...
├── /curriculum-catalog
│   ├── /programs          # All available programs
│   ├── /barber            # Barber details
│   ├── /licensing         # Pricing and options
│   └── /contact           # Sales inquiry form
└── /about
    ├── /our-story
    └── /contact
```

---

## Demo Accounts

### Student Account
```
Email: demo-student@elevate.example
Password: Demo123!
Access: Full student experience
Content: Barber Apprenticeship program
Restrictions: 
  - Cannot enroll in other programs
  - Cannot modify account
  - Cannot download materials
```

### Instructor Account
```
Email: demo-instructor@elevate.example
Password: Demo123!
Access: Full instructor dashboard
Content: Barber Apprenticeship (cohort of 1)
Permissions:
  - View student progress
  - Grade assessments
  - Add announcements
  - Submit skill sign-offs
```

---

## Demo Content

### Sample Module: Infection Control & Safety

**Module 1, Lesson 1: Introduction to Barbering**

This sample lesson demonstrates:

| Feature | Demo Content |
|---------|-------------|
| Lesson Content | HTML content with objectives, procedures, safety notes |
| Knowledge Check | 3 practice questions |
| Flashcards | 5 key term flashcards |
| Scenario | Client consultation scenario |
| Quiz | 4-question checkpoint |

**Learning Objectives**:
```
After completing this lesson, students will be able to:
1. Describe the history and legal framework of barbering
2. Explain the DOL apprenticeship structure
3. Identify scope of practice for licensed barbers
4. List required tools and equipment
```

**Content Preview**:
```
[Full HTML content visible - approximately 800 words]
```

### Sample Competency: Sanitation Standards

**Competency**: sanitation_standards

| Touchpoint | Source | Score |
|-----------|--------|-------|
| Lesson 1 | barber-infection-control | 85% |
| Quiz | Module 1 Checkpoint | 90% |
| Lab | Sanitation Procedure Lab | 95% |
| Scenario | Client Consultation | 80% |

**Status**: 3/4 touchpoints complete

---

## Demo Scenarios

### Scenario 1: Client Consultation

```
CONTEXT: Barbershop environment, new client arrives

SITUATION: A new client sits in your chair and says, 
"I want it just like this photo." You look at the photo 
and it's an extremely short military-style cut.

QUESTION: What is your best approach?

OPTIONS:
A. Ask clarifying questions about the desired length
   → Correct feedback: Good consultation prevents misunderstandings
   
B. Give them the haircut in the photo
   → Incorrect: Could lead to unhappy client
   
C. Refuse to cut their hair
   → Incorrect: Overreaction, communicate concerns first
   
D. Ask if they want it shorter or longer
   → Partially correct but too vague
```

### Scenario 2: Contraindication

```
CONTEXT: Client presents for haircut service

SITUATION: During consultation, you notice the client 
has visible open sores on their scalp.

QUESTION: What should you do?

OPTIONS:
A. Proceed with the service using extra precautions
   → Incorrect: Never cut over infected areas
   
B. Decline service, document, recommend medical evaluation
   → Correct: Proper protocol for contraindications
   
C. Ask if the sores are contagious before deciding
   → Partially correct but still should decline
```

---

## Instructor Dashboard Preview

### Student Progress View

```
┌─────────────────────────────────────────────────────────┐
│ DEMO STUDENT PROGRESS                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Overall: 67% Complete                                   │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░              │
│                                                         │
│ Modules:                                                │
│ ✓ Module 1: Infection Control         100% ✓          │
│ ◐ Module 2: Tool Mastery             60%              │
│ ○ Module 3: Haircutting Fundamentals  0%              │
│ ○ Module 4: Advanced Haircutting        0%              │
│ ○ Module 5: Shaving & Facial Hair      0%              │
│ ○ Module 6: Color & Chemical           0%              │
│ ○ Module 7: Business & Client          0%              │
│ ○ Module 8: State Exam Prep           0%              │
│                                                         │
│ Quiz Average: 85%                                       │
│ Competency Mastery: 45%                                 │
│                                                         │
│ ⚠️ At Risk: No                                        │
│ 🔥 Current Streak: 5 days                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Competency Verification

```
┌─────────────────────────────────────────────────────────┐
│ COMPETENCY SIGN-OFF                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Skill: Sanitation Standards                             │
│ Status: Ready for Sign-off                              │
│                                                         │
│ Touchpoints:                                            │
│ ✓ Lesson Completion              100%                   │
│ ✓ Quiz Score                    85%                     │
│ ✓ Lab Completion                95%                     │
│ ✓ Scenario                      80%                     │
│                                                         │
│ Overall Competency Level: 88%                          │
│                                                         │
│ [Sign Off Skill]  [Request Re-assessment]              │
│                                                         │
│ Sign-off will certify this skill is demonstrated        │
│ in a working environment.                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Apprenticeship Features Demo

### RTI/OJL Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ APPRENTICE PROGRESS: Demo Student                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Total Hours: 450 / 2,000 (22.5%)                      │
│ █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                                         │
│ ┌─────────────────┐  ┌─────────────────┐               │
│ │ RTI Hours      │  │ OJL Hours       │               │
│ │ 200 / 500     │  │ 250 / 1,500    │               │
│ │ 40%           │  │ 17%             │               │
│ └─────────────────┘  └─────────────────┘               │
│                                                         │
│ Employer: Demo Barbershop                             │
│ Supervisor: John Smith                                  │
│                                                         │
│ Next Evaluation: Due in 14 days                       │
│                                                         │
│ [View All Evaluations]  [Add Hours]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## LMS Interface Preview

### Student Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ Welcome back, Demo Student!                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Currently Enrolled: Barber Apprenticeship               │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Module 2: Tool Mastery                           │   │
│ │ Lesson 3 of 8  •  60% Complete                  │   │
│ │                                                 │   │
│ │ [Continue Learning]                               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Your Progress                                           │
│ ├─ 67% of course complete                             │
│ ├─ 85% average quiz score                             │
│ ├─ 3 competencies verified                             │
│ └─ 5 day streak 🔥                                   │
│                                                         │
│ Next Up                                                │
│ └─ Lesson 4: Scissor Techniques                       │
│                                                         │
│ [View All Lessons]  [Flashcards]  [Practice Quiz]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Lesson Player

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Module                    Lesson 4 of 8       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SCISSOR TECHNIQUES                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │                                                 │   │
│ │ Learning Objective:                              │   │
│ │ After this lesson, you will be able to:         │   │
│ │                                                 │   │
│ │ • Perform scissor-over-comb technique            │   │
│ │ • Execute point-cutting methods                 │   │
│ │ • Apply blending methods                        │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │                                                 │   │
│ │ [Lesson Content - Scrollable]                   │   │
│ │                                                 │   │
│ │ Section 1: Scissor Fundamentals               │   │
│ │ ...                                            │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 📋 KNOWLEDGE CHECK #1                           │   │
│ │                                                 │   │
│ │ What is the primary purpose of point-cutting?  │   │
│ │                                                 │   │
│ │ ○ To make hair shorter                          │   │
│ │ ○ To remove bulk from the interior             │   │
│ │ ○ To create texture and movement               │   │
│ │ ○ To blend different lengths                    │   │
│ │                                                 │   │
│ │ [Submit Answer]                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Previous]                              [Next →]        │
│                                                         │
│ ─────────────────────────────────────────────────────  │
│ 🔥 Streak: 5 days  |  XP: 450  |  ⏱️ 15 min left    │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Setup

### Environment Configuration

```typescript
// apps/app/config/demo.ts
export const DEMO_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_DEMO_ENABLED === 'true',
  environment: 'demo',
  
  demoAccounts: {
    student: {
      email: 'demo-student@elevate.example',
      programSlug: 'barber-apprenticeship',
    },
    instructor: {
      email: 'demo-instructor@elevate.example',
      cohortSize: 1,
    },
  },
  
  features: {
    showFullCurriculum: true,
    enableDownload: false,
    enableEnrollment: false,
    showPricing: true,
  },
  
  content: {
    previewLessons: ['barber-infection-control', 'barber-tool-mastery'],
    sampleModule: 'barber-module-1',
  },
};
```

### Database Seeding

```bash
# scripts/setup-demo-environment.ts
pnpm tsx scripts/setup-demo-environment.ts \
  --clean \
  --seed-data \
  --create-demo-accounts \
  --load-blueprint barber-apprenticeship \
  --generate-sample-progress
```

---

## Implementation Checklist

### Pre-Launch
- [ ] Set up demo domain (demo.elevate.example)
- [ ] Create demo database
- [ ] Load Barber Apprenticeship blueprint
- [ ] Create demo student account
- [ ] Create demo instructor account
- [ ] Generate sample progress data
- [ ] Test all lesson types
- [ ] Test all interactions
- [ ] Test instructor dashboard
- [ ] Test apprenticeship features
- [ ] Verify mobile responsiveness
- [ ] Add demo watermark to screenshots

### Launch
- [ ] Set up inquiry form
- [ ] Configure analytics (Mixpanel/Amplitude)
- [ ] Set up demo request notifications
- [ ] Train sales team on demo flow
- [ ] Add demo to main website navigation
- [ ] Create demo tutorial video

### Post-Launch
- [ ] Monitor demo usage analytics
- [ ] Collect feedback from sales team
- [ ] Optimize conversion funnel
- [ ] Add more programs to demo

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Demo page visits | 500/month |
| Demo account creations | 50/month |
| Demo → Sales inquiry | 20% |
| Sales inquiry → License | 15% |
| Demo conversion rate | 3% |

---

## Support

For demo-related issues:
- Email: demo-support@elevate.example
- Slack: #demo-environment

---

*© 2026 Elevate for Humanity. All Rights Reserved.*
