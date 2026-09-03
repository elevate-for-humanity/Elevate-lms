# EXECUTIVE TOUR ARCHITECTURE
**Generated:** June 17, 2026

---

## PURPOSE

Design a guided executive demonstration experience that tells the complete Elevate workforce development story through an automated, narrated tour.

---

## TOUR PHILOSOPHY

### Three Modes

| Mode | Purpose | Narration | Navigation |
|------|---------|-----------|------------|
| **Auto-Pilot** | Full story walkthrough | On | Auto |
| **Guided** | Interactive exploration | On | User |
| **Self-Drive** | Free exploration | Off | User |

### Tour Principles

1. **Story-First:** Every click advances the narrative
2. **No Dead Ends:** Every path leads somewhere meaningful
3. **Contextual:** Each screen explains its purpose
4. **Transitional:** Scenes connect with narrative bridges
5. **Verifiable:** Show real data, real workflows

---

## THE ELEVATE STORY (11 Scenes)

```
Scene 1: THE PROBLEM
    ↓ "Meet Maria - trapped in a dead-end job"

Scene 2: THE REFERRAL
    ↓ "Sarah from VR identifies potential"

Scene 3: THE DIGITAL BINDER
    ↓ "One place for everything"

Scene 4: THE ASSESSMENT
    ↓ "Understanding strengths and goals"

Scene 5: THE CAREER PATH
    ↓ "AI-powered career navigation"

Scene 6: THE TRAINING
    ↓ "Classroom meets hands-on"

Scene 7: THE APPRENTICESHIP
    ↓ "Earn while you learn"

Scene 8: THE TESTING
    ↓ "Proving competency"

Scene 9: THE CREDENTIAL
    ↓ "Digital proof of accomplishment"

Scene 10: THE PLACEMENT
    ↓ "Connecting to opportunity"

Scene 11: THE OUTCOME
    ↓ "From referral to career"
```

---

## SCENE-BY-SCENE ARCHITECTURE

### SCENE 1: THE PROBLEM

**Narrator:** "Maria Santos worked retail for 10 years. No benefits, no advancement, no future. Then her VR counselor told her about Elevate."

**View:** `/` (Homepage)
**Highlight:** Hero section, tagline "Workforce Development & Career Training"
**Action:** Click "Get Started"

---

### SCENE 2: THE REFERRAL

**Narrator:** "Sarah Johnson, VR Counselor, identifies Maria as a candidate. She enters Maria's information into Elevate's referral system."

**View:** `/admin/staff-portal/referrals` (as VR)
**Highlight:** 
- Referral form
- Client intake
- Document upload

**View:** `/admin/referrals` (as Admin)
**Highlight:**
- Incoming referrals
- Assignment workflow

**Action:** Click referral → Opens Maria's binder

---

### SCENE 3: THE DIGITAL BINDER

**Narrator:** "Every document, every assessment, every record—in one secure digital binder that travels with the student."

**View:** `/student-portal/documents` (as Maria)
**Highlight:**
- Document categories
- Upload functionality
- Progress tracking

**Sections:**
```
Digital Binder/
├── Personal Documents
├── Application Materials
├── Assessment Results
├── Training Records
├── Credentials
└── Employment History
```

**Action:** Click "Assessment Results"

---

### SCENE 4: THE ASSESSMENT

**Narrator:** "Elevate's AI-powered assessment identifies Maria's strengths, interests, and career pathways. Her aptitude for healthcare shines through."

**View:** `/career-services/career-counseling` (as Maria)
**Highlight:**
- Career assessment
- Skills inventory
- Interest profile

**View:** `/admin/students/[id]/assessments` (as VR)
**Highlight:**
- Assessment results
- Career recommendations
- Goal setting

**Action:** Complete assessment → See career match

---

### SCENE 5: THE CAREER PATH

**Narrator:** "Based on Maria's profile, Elevate recommends the Certified Nursing Assistant pathway. She could earn $35,000-$45,000 annually—and she's just getting started."

**View:** `/student-portal/career-path` (as Maria)
**Highlight:**
- Career recommendation
- Wage projections
- Employer matches
- Mentor matches

**View:** `/career-services/job-placement` (as Maria)
**Highlight:**
- Matching jobs
- Employer connections
- Application tracking

**Action:** Click "Explore CNA Program"

---

### SCENE 6: THE TRAINING

**Narrator:** "Maria enrolls in the CNA program. She earns her CPR certification in two weeks, OSHA 10 in one week."

**View:** `/student-portal/dashboard` (as Maria)
**Highlight:**
- Course progress
- Completed certifications
- Upcoming assignments

**View:** `/student-portal/course/[id]` (as Maria)
**Highlight:**
- Video lessons
- Quizzes
- Lab simulations

**Completed:**
- ✅ CPR/First Aid - Feb 15, 2026
- ✅ OSHA 10-Hour Healthcare - Feb 20, 2026

**Action:** View certificate badges

---

### SCENE 7: THE APPRENTICESHIP

**Narrator:** "Maria is matched with Community Health Network as an apprentice. She earns $15/hour to start—and logs OJT hours directly from her phone."

**View:** `/apprentice` (as Maria)
**Highlight:**
- Apprenticeship overview
- Wage progression
- Competency tracking

**View:** `/apprentice/hours` (as Maria)
**Highlight:**
- Hour logging
- Verification status
- Employer approval

**Metrics:**
```
OJT Progress
├── Hours Logged: 280 / 480
├── Hours Verified: 280 / 280
├── Competencies: 12 / 20
└── Next Milestone: 320 hours
```

**Action:** Click competency tracker

---

### SCENE 8: THE TESTING

**Narrator:** "Maria is ready for her state board exam. Elevate's testing center tracks her preparation and schedules her exam."

**View:** `/student-portal/testing` (as Maria)
**Highlight:**
- Exam preparation
- Practice tests
- Scheduling

**View:** `/admin/testing-center` (as Admin)
**Highlight:**
- Exam authorization
- Schedule management
- Results tracking

**Status:**
```
CNA State Board Exam
├── Status: Scheduled
├── Date: June 10, 2026
├── Location: Ivy Tech Indianapolis
└── Prep Score: 87%
```

**Action:** Click exam prep materials

---

### SCENE 9: THE CREDENTIAL

**Narrator:** "Maria passes her exam. Within 24 hours, she has a digital certificate, a verifiable QR code, and a transcript—recognized by employers across Indiana."

**View:** `/student-portal/credentials` (as Maria)
**Highlight:**
- Digital credentials
- QR verification
- Download options

**View:** `/verify/[credential_id]` (public)
**Highlight:**
- Instant verification
- Credential details
- Employer trust badge

**Issued:**
```
CNA Certification
├── Credential ID: CNA-2026-0142
├── Issued: June 15, 2026
├── Status: Active
├── Issuer: Indiana State Board of Nursing
└── Verified by: 3 employers
```

**Action:** Show QR verification

---

### SCENE 10: THE PLACEMENT

**Narrator:** "With her credential, Maria is matched with openings at Community Health Network. Her apprenticeship supervisor vouches for her. She's hired."

**View:** `/employer/dashboard` (as James Thompson)
**Highlight:**
- Maria's profile
- OJT record
- Competency sign-off
- Hire button

**View:** `/employer/hires` (as James)
**Highlight:**
- New hire: Maria Santos
- Position: CNA
- Start date: June 20, 2026
- Wage: $16.50/hour

**Action:** Show placement record

---

### SCENE 11: THE OUTCOME

**Narrator:** "Six months ago, Maria was working retail. Today, she's a Certified Nursing Assistant at Community Health Network, earning $16.50/hour with full benefits—and she's on the RN pathway."

**View:** `/student-portal/career` (as Maria)
**Highlight:**
- Employment status
- Wage growth
- Career advancement
- Mentor connection

**Metrics:**
```
Maria's Journey
├── Referral: January 15, 2026
├── Enrollment: February 1, 2026
├── Credential: June 15, 2026
├── Placement: June 20, 2026
├── Starting Wage: $16.50/hour
├── 1-Year Goal: $19.50/hour (RN)
└── Ultimate Goal: Registered Nurse
```

**View:** VR Dashboard (as Sarah)
**Highlight:**
- Maria's completion
- Outcome metrics
- Compliance status

---

## TOUR TECHNICAL ARCHITECTURE

### Tour Engine

Based on existing `OnboardingTour` component:

```typescript
// components/onboarding/ExecutiveTour.tsx

type TourMode = 'auto' | 'guided' | 'self';

interface ExecutiveTour {
  id: string;
  name: string;
  mode: TourMode;
  currentScene: number;
  narration: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
}

interface TourScene {
  id: string;
  title: string;
  narrator: string;
  view: string;
  highlight: string[];  // CSS selectors
  action?: {
    type: 'click' | 'navigate' | 'form';
    target: string;
  };
  transition?: {
    type: 'fade' | 'slide' | 'zoom';
    duration: number;
  };
}
```

### Tour Configuration

```typescript
const executiveTour: ExecutiveTour = {
  id: 'elevate-executive-demo',
  name: 'Elevate Executive Demo',
  mode: 'auto',
  currentScene: 0,
  narration: true,
  autoAdvance: true,
  autoAdvanceDelay: 8000, // 8 seconds per scene
};
```

### Scene Definitions

```typescript
const scenes: TourScene[] = [
  {
    id: 'problem',
    title: 'The Problem',
    narrator: 'Maria Santos worked retail for 10 years...',
    view: '/',
    highlight: ['[data-tour="hero"]', '[data-tour="cta"]'],
    action: { type: 'click', target: '[data-tour="get-started"]' }
  },
  {
    id: 'referral',
    title: 'The Referral',
    narrator: 'Sarah Johnson, VR Counselor, identifies Maria...',
    view: '/admin/staff-portal/referrals',
    highlight: ['[data-tour="referral-form"]', '[data-tour="client-list"]']
  },
  // ... remaining scenes
];
```

### Narration Component

```tsx
// components/onboarding/Narration.tsx

interface NarrationProps {
  text: string;
  speaker: 'narrator' | 'persona';
  persona?: 'maria' | 'sarah' | 'james';
}

const Narration = ({ text, speaker, persona }: NarrationProps) => (
  <div className="narration-overlay">
    <div className={`narration-card ${speaker}`}>
      {speaker === 'persona' && persona && (
        <Avatar name={persona} />
      )}
      <p className="narration-text">{text}</p>
    </div>
  </div>
);
```

### Navigation Overlay

```tsx
// components/onboarding/NavigationOverlay.tsx

const NavigationOverlay = ({ 
  currentScene, 
  totalScenes, 
  onNext, 
  onPrevious,
  onPause 
}) => (
  <div className="tour-navigation">
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${(currentScene / totalScenes) * 100}%` }}
      />
    </div>
    <div className="scene-indicators">
      {Array.from({ length: totalScenes }).map((_, i) => (
        <button 
          key={i}
          className={`scene-dot ${i === currentScene ? 'active' : ''}`}
          onClick={() => navigateToScene(i)}
        />
      ))}
    </div>
    <div className="controls">
      <button onClick={onPrevious}>←</button>
      <button onClick={onPause}>⏸</button>
      <button onClick={onNext}>→</button>
    </div>
  </div>
);
```

### Highlight System

```tsx
// components/onboarding/HighlightOverlay.tsx

const HighlightOverlay = ({ targets }: { targets: string[] }) => (
  <div className="highlight-overlay">
    {targets.map((selector) => (
      <HighlightSpot key={selector} selector={selector} />
    ))}
    <div className="overlay-mask" />
  </div>
);
```

### Demo Mode Provider

```tsx
// providers/DemoModeProvider.tsx

export const DemoModeProvider = ({ children, demoUser }) => {
  return (
    <DemoContext.Provider value={{ demoUser, isDemo: true }}>
      {children}
    </DemoContext.Provider>
  );
};
```

---

## TOUR FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTIVE TOUR START                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODE SELECTION                               │
│              ┌─────────┬─────────┬─────────┐                   │
│              │ AUTO    │ GUIDED  │  SELF   │                   │
│              │ PILOT   │         │  DRIVE  │                   │
│              └─────────┴─────────┴─────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    AUTO       │   │    GUIDED     │   │    SELF       │
│    MODE       │   │    MODE       │   │    MODE       │
│               │   │               │   │               │
│ 8s per scene  │   │ User controls │   │ Free explore  │
│ Auto narrate  │   │ Narration on  │   │ No narration  │
│ Click through │   │ Click to      │   │ Any path      │
│               │   │ advance       │   │               │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCENE PLAYBACK                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Narration Bar                                           │   │
│  │ "Maria Santos worked retail for 10 years..."            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                    [PAGE CONTENT]                        │   │
│  │                                                          │   │
│  │    ┌──────────────────────────────────────┐             │   │
│  │    │        HIGHLIGHT SPOT                │             │   │
│  │    │      "Click here to continue"        │             │   │
│  │    └──────────────────────────────────────┘             │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ◀ ● ● ● ● ○ ○ ○ ○ ○ ○ ▶    Scene 4 of 11   ⏸  🔊      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## PERSONA SWITCHING

### During Tour

| Key | Action |
|-----|--------|
| `M` | Switch to Maria's view |
| `S` | Switch to Sarah's view (VR) |
| `J` | Switch to James's view (Employer) |
| `Esc` | Open scene selector |
| `Space` | Pause/Resume |
| `→` | Next scene |
| `←` | Previous scene |

### Persona Indicator

```tsx
// components/onboarding/PersonaIndicator.tsx

const PersonaIndicator = ({ current }) => (
  <div className="persona-indicator">
    <Avatar name={current} size="sm" />
    <span>{current}</span>
    <button onClick={() => openPersonaSwitcher()}>Switch ▼</button>
  </div>
);
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Tour Engine

- [ ] Extend OnboardingTour component
- [ ] Add scene configuration system
- [ ] Add narration overlay
- [ ] Add highlight system
- [ ] Add navigation controls
- [ ] Add progress indicator

### Phase 2: Tour Content

- [ ] Define all 11 scenes
- [ ] Write all narration scripts
- [ ] Configure all highlights
- [ ] Set all transitions
- [ ] Add persona switching

### Phase 3: Demo Integration

- [ ] Create demo mode provider
- [ ] Create demo user context
- [ ] Add data-tour attributes
- [ ] Configure persona access
- [ ] Test all scenes

### Phase 4: Polish

- [ ] Add audio narration (optional)
- [ ] Add scene transitions
- [ ] Add keyboard shortcuts
- [ ] Add scene bookmarks
- [ ] Add share functionality

---

## COMPONENTS TO BUILD

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `ExecutiveTour.tsx` | Main tour orchestrator | Medium |
| `TourScene.tsx` | Individual scene display | Low |
| `Narration.tsx` | Narration overlay | Low |
| `HighlightOverlay.tsx` | Feature highlighting | Medium |
| `NavigationOverlay.tsx` | Progress + controls | Low |
| `PersonaSwitcher.tsx` | Switch between views | Medium |
| `TourSceneSelector.tsx` | Jump to any scene | Low |
| `TourProgress.tsx` | Visual progress | Low |
| `DemoModeProvider.tsx` | Demo context | Medium |

---

## ESTIMATED EFFORT

| Phase | Days | Deliverable |
|-------|------|-------------|
| Core Tour Engine | 3 days | Working tour framework |
| Tour Content | 2 days | All scenes + narration |
| Demo Integration | 3 days | Demo personas + data |
| Polish | 2 days | Transitions + shortcuts |
| **Total** | **10 days** | **Full executive tour** |

---

**Tour Architecture By:** OpenHands Agent  
**Date:** June 17, 2026
