# Final PARIS Architecture: Integrate, Orchestrate, Productionize

## Mission Change

**From:** Build new AI features  
**To:** Integrate, orchestrate, and productionize the existing AI platform

---

## Approved Architecture

```
User: "Build OSHA 30 course"
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         PARIS AI                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │           INSTRUCTIONAL DESIGNER AI                                │ │
│  │  • Ensures educational soundness                                │ │
│  │  • Validates learning objectives                                 │ │
│  │  • Maps competencies                                           │ │
│  │  • Checks accessibility                                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │           MEDIA DESIGNER AI                                       │ │
│  │  • Decides what media each lesson needs                        │ │
│  │  • Creates AI instructor avatar                                │ │
│  │  • Generates voice narration                                    │ │
│  │  • Creates diagrams/animations                                 │ │
│  │  • Generates PowerPoint slides                                │ │
│  │  • Generates student workbook                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │           ASSESSMENT DESIGNER AI                                 │ │
│  │  • Designs quiz questions                                     │ │
│  │  • Creates practice exam                                      │ │
│  │  • Builds competency checklists                                │ │
│  │  • Validates question quality                                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              ↓                                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │           QA DESIGNER AI                                          │ │
│  │  • Blueprint coverage check                                    │ │
│  │  • Competency alignment check                                  │ │
│  │  • Accessibility check                                        │ │
│  │  • Media completeness check                                   │ │
│  │  • Generates Curriculum Readiness Report                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    EXISTING AI SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│  ✅ Course Generator    ✅ Lesson Compiler    ✅ Quiz Generator      │
│  ✅ Image Generator     ✅ Video Generator    ✅ O*NET Integration    │
│  ✅ Standards Loader   ✅ Gap Detection     ✅ Course Seeder        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  GENERATION OUTPUT                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Modules          ✓ Lessons         ✓ Quiz Questions                │
│  ✓ Practice Exam    ✓ Flashcards     ✓ Video Scripts               │
│  ✓ AI Avatar        ✓ Voice          ✓ Captions                      │
│  ✓ Diagrams         ✓ Slides          ✓ Workbook                      │
│  ✓ Instructor Guide ✓ Competency Map  ✓ Rubrics                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  COURSE FACTORY DASHBOARD                             │
├─────────────────────────────────────────────────────────────────────┤
│  Blueprint    [████████████] 100%                                    │
│  Modules     [████████░░░]  80% (Building...)                        │
│  Lessons     [██████████░░]  90%                                     │
│  Instructor  [████████████] 100%                                     │
│  Voice       [██████░░░░░]  60% (Generating...)                     │
│  Video       [██░░░░░░░░░]  20% (Rendering...)                    │
│  Slides      [████████████] 100%                                     │
│  Workbook    [████████░░░]  80%                                     │
│  Exam        [██████████░░]  90%                                     │
│  QA          [░░░░░░░░░░░]   0% (Pending)                          │
│                                                                   │
│  [+ Expand Details]                                                │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  CURRICULUM READINESS REPORT                          │
├─────────────────────────────────────────────────────────────────────┤
│  Credential Alignment      ████████████ 100%  ✅                     │
│  Blueprint Coverage        ████████████ 100%  ✅                     │
│  Competency Coverage      ██████████░░  98%  ✅                     │
│  Assessment Quality       ██████████░░  97%  ✅                     │
│  Hands-on Skills         ████████████ 100%  ✅                     │
│  Media Complete          ██████████░░  96%  ⚠️ Review             │
│  Accessibility          ████████████ 100%  ✅                     │
│  Licensing Metadata      ████████████ 100%  ✅                     │
│                                                                   │
│  PRODUCTION READY: YES (with media review)                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  LICENSING PLATFORM                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Curriculum ID:    OSHA-30-2026.07.11                               │
│  Version:          v1.0.0                                            │
│  Copyright:        © 2026 Elevate for Humanity                     │
│  License Type:     Annual Subscription                               │
│  Update Channel:   Standard                                         │
│  Maintenance:      Included                                         │
│  Schools:          Licensed to: [School List]                       │
│  Renewal:          Due: 2027.07.11                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI Roles

### 1. PARIS (Orchestrator)
- Owns the workflow
- Single entry point for users
- Delegates to specialized AIs

### 2. Instructional Designer AI
- Ensures educational soundness
- Validates learning objectives follow Bloom's taxonomy
- Maps competencies to lessons
- Checks prerequisite chains
- Validates accessibility (WCAG)

### 3. Media Designer AI
- Decides media requirements per lesson
- Creates AI instructor avatar
- Generates voice narration
- Creates diagrams and animations
- Generates PowerPoint slides
- Creates student workbook PDF

### 4. Assessment Designer AI
- Designs quiz questions per domain
- Creates 100-question practice exam
- Builds competency checklists
- Validates question quality
- Ensures difficulty distribution

### 5. QA Designer AI
- Blueprint coverage check
- Competency alignment check
- Media completeness check
- Generates Curriculum Readiness Report

---

## Config-Based Credentials

### Adding a New Credential

```
lib/course-builder/credentials/
├── epa-608.yaml           # Already exists
├── nha-ccma.yaml         # Add this
├── nha-cpt.yaml          # Add this
├── osha-30.yaml          # Add this
├── nccer-core.yaml       # Add this
└── indiana-barber.yaml   # Already exists
```

### Example: osha-30.yaml

```yaml
name: OSHA 30-Hour General Industry
slug: osha-30
provider: OSHA Training Institute
category: safety
type: certification
description: 30-hour general industry safety certification

examFormat: "No written exam - attendance required"
passingScore: 100

educationRequirement: "No prerequisites"

sosCodes:
  - 47-2061.00  # Construction Laborers
  - 49-9021.00  # HVAC Mechanics

blueprint:
  topics:
    - id: intro
      section: Mandatory
      title: Introduction to OSHA
      content: |
        Overview of OSHA standards and regulations...
      keyFacts:
        - "OSHA covers most private sector employers"
        - "OSHA standards are found in 29 CFR 1910"
      examWeight: high
    
    - id: hazard-comm
      section: Elective
      title: Hazard Communication
      content: |
        Understanding chemical hazards and GHS...
      keyFacts:
        - "GHS = Globally Harmonized System"
        - "SDS = Safety Data Sheets"
        - "Must have SDS for all chemicals"
      examWeight: high

states:
  - IN
  - OH
  - KY

wioaEligible: true

availableOnElevate: true
courseSlug: osha-30
```

---

## Blueprint Monitoring

### Providers Monitored

| Provider | What to Monitor |
|---------|----------------|
| OSHA | 29 CFR changes, new standards |
| NHA | Exam format, passing scores, topics |
| NCCER | Module updates, new levels |
| EPA | Section 608 changes, new refrigerants |
| State Boards | Hour requirements, exam content |
| ESCO | Exam format changes |
| Certiport | Exam objectives |
| CareerSafe | OSHA 10/30 updates |
| HSI | CPR guidelines changes |
| AHA | Guidelines updates |

### Monitoring Flow

```
┌──────────────────────────────────────────────────────────────┐
│                 BLUEPRINT MONITOR SERVICE                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Weekly Cron Job                                              │
│       ↓                                                      │
│  Check All Providers                                         │
│       ↓                                                      │
│  Compare Versions                                            │
│       ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Changes Detected?                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↓                          ↓                         │
│     NO                           YES                        │
│     ↓                            ↓                         │
│  Log "Current"              Identify Changes               │
│                                  ↓                         │
│                           ┌──────────────────────────┐    │
│                           │ Severity Assessment      │    │
│                           │ • Critical             │    │
│                           │ • High                │    │
│                           │ • Medium              │    │
│                           │ • Low                 │    │
│                           └──────────────────────────┘    │
│                                  ↓                        │
│                           ┌──────────────────────────┐    │
│                           │ Notify Admins           │    │
│                           │ • Email                │    │
│                           │ • Dashboard            │    │
│                           │ • Slack               │    │
│                           └──────────────────────────┘    │
│                                  ↓                        │
│                           ┌──────────────────────────┐    │
│                           │ Recommend Action         │    │
│                           │ • Regenerate           │    │
│                           │ • Review               │    │
│                           │ • Monitor              │    │
│                           └──────────────────────────┘    │
│                                  ↓                        │
│                           Auto-regenerate if Critical      │
│                                  ↓                        │
│                           Version Bump                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Course Factory Dashboard

### Visual Progress

```
┌─────────────────────────────────────────────────────────────────────┐
│                 BUILDING: OSHA 30 Course                              │
│                 Started: 2 minutes ago                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PREPARATION                                                         │
│  ├─ Credential: OSHA 30-Hour General Industry  ✅                     │
│  ├─ Industry Standards: Loaded  ✅                                    │
│  └─ RAG Context: Built  ✅                                           │
│                                                                      │
│  CONTENT GENERATION                                                  │
│  ├─ Modules (8)           ████████████████ 100%  ✅                 │
│  ├─ Lessons (24)          █████████████░░░  85%  Building...        │
│  └─ Key Takeaways        ████████████████ 100%  ✅                 │
│                                                                      │
│  AI INSTRUCTOR                                                       │
│  ├─ Avatar: Created  ✅                                              │
│  ├─ Voice: Professional  ✅                                           │
│  └─ Bio: Generated  ✅                                               │
│                                                                      │
│  MEDIA                                                               │
│  ├─ Voice Narration (24)    ████████░░░░░░░  40%  Recording...   │
│  ├─ Diagrams (12)           ██████████████░░  80%                   │
│  ├─ Slides (8)             ████████████████ 100%  ✅               │
│  └─ Video (24)              ████░░░░░░░░░░░░  15%  Rendering...   │
│                                                                      │
│  ASSESSMENTS                                                        │
│  ├─ Quiz Questions (160)     ████████████████ 100%  ✅               │
│  ├─ Practice Exam           ████████████████ 100%  ✅               │
│  └─ Competency Checklist    ████████████░░░░  70%                    │
│                                                                      │
│  PUBLICATIONS                                                        │
│  ├─ Student Workbook       ████████████░░░░  80%                     │
│  └─ Instructor Guide      ██████░░░░░░░░░░  40%                    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ESTIMATED TIME REMAINING: ~8 minutes                                │
│  [Pause] [Cancel] [View Details]                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Curriculum Readiness Report

### Generated Before Publishing

```
┌─────────────────────────────────────────────────────────────────────┐
│           CURRICULUM READINESS REPORT                                │
│           OSHA 30-Hour General Industry                               │
│           Generated: 2026-07-11 14:32:15                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EXECUTIVE SUMMARY                                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │   PRODUCTION READY: ✅ YES                                   │    │
│  │                                                              │    │
│  │   Overall Score: 97.3%                                        │    │
│  │   Threshold: 95%                                             │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  DETAILED SCORES                                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Credential Alignment     ████████████ 100%  ✅ PASS          │    │
│  │ Blueprint Coverage      ████████████ 100%  ✅ PASS          │    │
│  │ Competency Coverage     ██████████░░  98%  ✅ PASS          │    │
│  │ Assessment Quality      ██████████░░  97%  ✅ PASS          │    │
│  │ Hands-on Skills         ████████████ 100%  ✅ PASS          │    │
│  │ Media Complete          ██████████░░  96%  ⚠️ REVIEW       │    │
│  │ Accessibility          ████████████ 100%  ✅ PASS          │    │
│  │ Licensing Metadata      ████████████ 100%  ✅ PASS          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ITEMS REQUIRING REVIEW (1)                                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ⚠️ Media Complete: 96%                                     │    │
│  │    • Video 3 of 24: Still rendering                         │    │
│  │    • [View Details] [Regenerate] [Approve Anyway]           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  BLUEPRINT COVERAGE                                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Introduction to OSHA        ████████████ 100%  ✅             │    │
│  │ Managing Safety & Health    ████████████ 100%  ✅             │    │
│  │ Hazard Communication        ████████████ 100%  ✅             │    │
│  │ Electrical                ████████████ 100%  ✅             │    │
│  │ Personal Protective Equip  ████████████ 100%  ✅             │    │
│  │ Fall Protection          ████████████ 100%  ✅             │    │
│  │ Exit Routes              ████████████ 100%  ✅             │    │
│  │ Fire Protection          ████████████ 100%  ✅             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  COMPETENCY MAPPING                                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ OSHA Competency 1.1      Covered in Lesson 1-3  ✅          │    │
│  │ OSHA Competency 1.2      Covered in Lesson 1-3  ✅          │    │
│  │ OSHA Competency 2.1      Covered in Lesson 4-6  ✅          │    │
│  │ OSHA Competency 2.2      Covered in Lesson 4-6  ⚠️ Partial  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  [Export PDF] [Approve & Publish] [Request Revisions]                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Licensing Platform

### Every Course Gets

```json
{
  "curriculum": {
    "id": "osha-30-2026.07.11",
    "version": "v1.0.0",
    "title": "OSHA 30-Hour General Industry",
    "provider": "OSHA Training Institute"
  },
  "intellectualProperty": {
    "copyright": "© 2026 Elevate for Humanity",
    "allRightsReserved": true,
    "licenseRequired": true
  },
  "licensing": {
    "type": "annual-subscription",
    "price": {
      "perStudent": 25,
      "minimumStudents": 10,
      "annualMaintenance": 500
    },
    "entitlements": {
      "studentSeats": "unlimited",
      "instructorAccounts": 5,
      "adminAccounts": 2,
      "apiAccess": false
    },
    "restrictions": {
      "modifyContent": false,
      "resell": false,
      "sublicense": false
    }
  },
  "maintenance": {
    "included": true,
    "updateFrequency": "quarterly",
    "includesRegulatoryChanges": true,
    "includesNewContent": true,
    "supportLevel": "standard"
  },
  "schools": [],
  "renewal": {
    "dueDate": "2027-07-11",
    "autoRenew": true,
    "discount": 0.1
  },
  "changeLog": [
    {
      "version": "v1.0.0",
      "date": "2026-07-11",
      "changes": ["Initial release"],
      "author": "PARIS AI"
    }
  ],
  "compliance": {
    "wioaEligible": true,
    "dolRegistered": false,
    "accreditation": null
  }
}
```

---

## Integration Checklist

### Phase 1: Connect What Exists

- [ ] Wire `course-orchestrator.ts` → existing AI services
- [ ] Add Instructional Designer AI role
- [ ] Add Media Designer AI role
- [ ] Add Assessment Designer AI role
- [ ] Add QA Designer AI role
- [ ] Build Course Factory Dashboard
- [ ] Generate Curriculum Readiness Report
- [ ] Add licensing metadata to all courses

### Phase 2: Complete Media Pipeline

- [ ] Connect AI avatar generator
- [ ] Connect voice narration
- [ ] Connect video generation
- [ ] Connect slide generation
- [ ] Connect workbook generation
- [ ] Connect instructor guide generation

### Phase 3: Monitoring & Licensing

- [ ] Implement blueprint monitor
- [ ] Connect notification system
- [ ] Build licensing portal
- [ ] Add version management
- [ ] Build school dashboard
- [ ] Add renewal tracking

### Phase 4: Productionize

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Logging
- [ ] Monitoring
- [ ] Documentation

---

## Final Mission

**Stop building new infrastructure.**

**Start connecting what exists.**

The platform is 90% built. The work is integration, orchestration, and productionizing.

```
PARIS → Orchestrate everything

CREDENTIAL ENGINE → Provide context

EXISTING AI SERVICES → Generate content

COURSE FACTORY DASHBOARD → Visual progress

CURRICULUM READINESS REPORT → Quality gate

LICENSING PLATFORM → Revenue ready
```
