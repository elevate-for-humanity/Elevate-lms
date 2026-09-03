# Side-by-Side Gap Analysis: Credential Intelligence Platform

## Overview

This document shows EXISTING vs MISSING vs PARTIAL for every component.

---

## 1. CREDENTIAL ENGINE

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| Course type detection | ✅ `course-types.ts` | - | COMPLETE |
| Credential registry (code) | ✅ `credential-registry-universal.ts` | - | COMPLETE |
| **Credential registry (config)** | - | ❌ Need YAML/JSON config | **GAP** |
| Exam blueprints | ✅ `exam-blueprints.ts` | - | COMPLETE |
| Prompt selector | ✅ `prompt-selector.ts` | - | COMPLETE |
| RAG engine | ✅ `rag-engine.ts` | - | COMPLETE |
| Quality validator | ✅ `quality-validator.ts` | - | COMPLETE |
| Blueprint loader | - | ❌ Generic loader needed | **GAP** |

---

## 2. COURSE GENERATOR

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| AI Course Generator | ✅ `lib/ai/course-generator.ts` | - | COMPLETE |
| Blueprint prompts | ✅ `lib/ai/prompts/course-blueprint.ts` | - | COMPLETE |
| Lesson compiler | ✅ `lib/ai/lesson-compiler.ts` | - | COMPLETE |
| Quiz generation | ✅ Built into generator | - | COMPLETE |
| Course seeder | ✅ `lib/ai/course-seeder.ts` | - | COMPLETE |
| **Credential-aware generation** | ⚠️ Partial | Need integration | PARTIAL |
| **Practice exam generator** | ⚠️ Basic | Expand to 100 Q | PARTIAL |
| **Gap detection** | ✅ `lib/ai/course-gap-detection.ts` | - | COMPLETE |

---

## 3. AI INSTRUCTOR

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| HVAC Instructor (Marcus) | ✅ `lib/ai-instructor/hvac-instructor-prompt.ts` | - | COMPLETE |
| Course builder instructor | - | ❌ Not built | **GAP** |
| Barber instructor | - | ❌ Not built | **GAP** |
| Generic instructor | - | ❌ Not built | **GAP** |
| **RAG enhancement** | ⚠️ Manual | Need automated | PARTIAL |

---

## 4. MEDIA PIPELINE

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| Image generator | ✅ `lib/ai/image-generator.ts` | - | COMPLETE |
| Video generator | ✅ `server/video-generator/` | - | COMPLETE |
| Voice commands | ✅ `lib/paris/voice-commands.tsx` | - | COMPLETE |
| PARIS Media Studio | ✅ `lib/paris/media-studio/` | - | COMPLETE |
| **AI Avatar** | - | ❌ Not connected | **GAP** |
| **AI Narration** | - | ❌ Not connected | **GAP** |
| **Video captions** | - | ❌ Not built | **GAP** |
| **Slide generator** | - | ❌ Not built | **GAP** |
| **Workbook generator** | - | ❌ Not built | **GAP** |
| **Instructor guide generator** | - | ❌ Not built | **GAP** |

---

## 5. PARIS ORCHESTRATION

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| PARIS AI | ✅ `lib/paris/index.ts` | - | COMPLETE |
| Dev Studio | ✅ `lib/paris/dev-studio.ts` | - | COMPLETE |
| Workforce | ✅ `lib/paris/workforce/` | - | COMPLETE |
| **Course orchestration** | - | ❌ Not wired | **GAP** |
| **Credential orchestration** | - | ❌ Not wired | **GAP** |
| **User intent detection** | - | ❌ Not built | **GAP** |

---

## 6. BLUEPRINT MONITORING

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| O*NET loader | ✅ `lib/industry/standards-loader.ts` | - | COMPLETE |
| Industry standards | ✅ Full data | - | COMPLETE |
| SOC code mapping | ✅ `lib/onet/soc-map.ts` | - | COMPLETE |
| **Blueprint change detector** | - | ❌ Not built | **GAP** |
| **Update notification** | - | ❌ Not built | **GAP** |
| **Auto-regeneration** | - | ❌ Not built | **GAP** |
| **Version management** | - | ❌ Not built | **GAP** |

---

## 7. LICENSING PORTAL

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| Curriculum versioning | - | ❌ Not built | **GAP** |
| License management | - | ❌ Not built | **GAP** |
| Annual renewals | - | ❌ Not built | **GAP** |
| School dashboard | - | ❌ Not built | **GAP** |
| Update delivery | - | ❌ Not built | **GAP** |
| Maintenance tracking | - | ❌ Not built | **GAP** |
| Curriculum marketplace | - | ❌ Not built | **GAP** |

---

## 8. COURSE FACTORY DASHBOARD

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| Admin dashboard | ✅ Built | - | COMPLETE |
| Course builder UI | ✅ Built | - | COMPLETE |
| Dev Studio panels | ✅ Built | - | COMPLETE |
| **Generation progress UI** | - | ❌ Not built | **GAP** |
| **Blueprint viewer** | - | ❌ Not built | **GAP** |
| **Quality score display** | - | ❌ Not built | **GAP** |
| **Video generation status** | - | ❌ Not built | **GAP** |
| **Publishing workflow** | ⚠️ Basic | Need full | PARTIAL |

---

## 9. CREDENTIALS SUPPORTED

| Credential | Registry | Blueprint | Generation | Status |
|-----------|----------|---------|-----------|--------|
| EPA 608 | ✅ | ✅ | ⚠️ Basic | PARTIAL |
| NHA CCMA | ✅ | - | - | **GAP** |
| NHA CPT | ✅ | - | - | **GAP** |
| NHA EKG | ✅ | - | - | **GAP** |
| OSHA 10 | ✅ | - | - | **GAP** |
| OSHA 30 | ✅ | - | - | **GAP** |
| Barber | ✅ | ✅ | ⚠️ Basic | PARTIAL |
| CNA | ✅ | - | - | **GAP** |
| CDL | ✅ | - | - | **GAP** |
| ServSafe | ✅ | - | - | **GAP** |
| NCCER | ✅ | - | - | **GAP** |

---

## 10. EXAM ALIGNMENT

| Component | Existing | Missing | Status |
|-----------|----------|---------|--------|
| Core exam questions | ✅ Built | - | COMPLETE |
| Type I questions | ✅ Built | - | COMPLETE |
| Type II questions | ✅ Built | - | COMPLETE |
| Type III questions | ✅ Built | - | COMPLETE |
| 100-question exam | ⚠️ 48 Q | Need 52 more | PARTIAL |
| Timed exam simulation | - | ❌ Not built | **GAP** |
| Adaptive review | - | ❌ Not built | **GAP** |
| Readiness scoring | - | ❌ Not built | **GAP** |

---

## PRIORITY MATRIX

| Priority | Gap | Impact | Effort |
|----------|-----|--------|--------|
| **P0** | Wire credential engine to AI generator | HIGH | MEDIUM |
| **P0** | Build credential registry (config-based) | HIGH | HIGH |
| **P0** | Paris orchestration layer | HIGH | HIGH |
| **P1** | Blueprint monitoring service | HIGH | MEDIUM |
| **P1** | Video pipeline integration | HIGH | HIGH |
| **P1** | 100-question practice exam | HIGH | LOW |
| **P2** | Licensing portal | MEDIUM | HIGH |
| **P2** | Course factory dashboard | MEDIUM | MEDIUM |
| **P2** | More credential blueprints | MEDIUM | MEDIUM |
| **P3** | Instructor guide generator | LOW | HIGH |
| **P3** | Workbook generator | LOW | HIGH |
| **P3** | Slide generator | LOW | MEDIUM |

---

## THE ARCHITECTURE WE NEED

```
User: "Build an OSHA 30 course"
         ↓
┌─────────────────────────────────────────────────────────────┐
│                         PARIS AI                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │           CREDENTIAL ORCHESTRATION LAYER              │ │
│  │  1. Detect: OSHA 30 (Workforce → Safety → OSHA 30  │ │
│  │  2. Load: Credential Registry (CONFIG)               │ │
│  │  3. Load: Blueprint (if exists)                     │ │
│  │  4. Load: Industry Standards (O*NET/BLS)             │ │
│  │  5. Build: RAG Context                             │ │
│  │  6. Select: Prompt Templates                        │ │
│  │  7. Orchestrate: All generation steps              │ │
│  │  8. Monitor: Quality validation                     │ │
│  │  9. Deliver: Complete course package               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXISTING AI SERVICES                     │
├─────────────────────────────────────────────────────────────┤
│  ✅ Course Generator    ✅ Lesson Compiler                 │
│  ✅ Quiz Generator     ✅ Image Generator                │
│  ✅ Video Generator    ✅ O*NET Integration              │
│  ✅ Standards Loader   ✅ Gap Detection                  │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  GENERATION OUTPUT                         │
├─────────────────────────────────────────────────────────────┤
│  ✓ Modules          ✓ Lessons                            │
│  ✓ Quiz Questions   ✓ Practice Exam (100 Q)            │
│  ✓ Flashcards       ✓ Video Scripts                      │
│  ✓ Instructor       ✓ AI Avatar                          │
│  ✓ Voice           ✓ Captions                           │
│  ✓ Slides          ✓ Workbook                          │
│  ✓ Instructor Guide ✓ Competency Checklist               │
│  ✓ Quality Score   ✓ Version Number                    │
│  ✓ License Metadata ✓ Publishing Ready                  │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   PARIS MEDIA STUDIO                       │
├─────────────────────────────────────────────────────────────┤
│  ✓ AI Avatar       ✓ Narration           ✓ Video        │
│  ✓ Animations     ✓ Demonstrations       ✓ Captions     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   COURSE FACTORY DASHBOARD                 │
├─────────────────────────────────────────────────────────────┤
│  Blueprint ✓ Modules ✓ Lessons ✓ Videos ✓ Voice ✓ Quiz    │
│  ✓ Exam ✓ Workbook ✓ Instructor Guide ✓ Quality Score    │
│  ✓ Publish ✓ Version ✓ License Ready                     │
└─────────────────────────────────────────────────────────────┘
```

---

## WHAT'S MISSING (Summary)

### Critical Gaps

1. **Credential Registry Config** - Add credentials via YAML, not code
2. **Blueprint Monitoring** - Auto-detect regulatory changes
3. **PARIS Orchestration** - Paris owns the workflow
4. **Video Pipeline** - Avatar + narration + captions
5. **Licensing Portal** - Version + license + renewals

### Integration Gaps

1. **Wire Credential Engine** → Course Generator
2. **Wire Credential Engine** → AI Instructor
3. **Wire Quality Validator** → Generation Pipeline
4. **Wire Media Studio** → Course Factory
5. **Wire PARIS** → Credential Engine

---

## FILES EXISTING vs NEEDED

### Existing (Don't Touch)

```
lib/ai/
├── course-generator.ts          ✅
├── course-seeder.ts             ✅
├── lesson-compiler.ts           ✅
├── course-gap-detection.ts      ✅
├── image-generator.ts          ✅
└── prompts/
    └── course-blueprint.ts      ✅

lib/paris/
├── index.ts                    ✅
├── dev-studio.ts               ✅
├── media-studio/               ✅
└── workforce/                  ✅

lib/industry/
├── standards-loader.ts          ✅
└── onet/                      ✅
```

### Need to Create

```
lib/course-factory/
├── orchestrator.ts              ← Paris orchestration
├── registry-loader.ts           ← YAML/JSON config loader
├── blueprint-monitor.ts        ← Regulatory change detection
├── license-manager.ts           ← Version + licensing
└── course-publisher.ts          ← Publishing workflow

lib/media-pipeline/
├── avatar-generator.ts          ← AI avatar
├── narration-generator.ts        ← Voice narration
├── caption-generator.ts         ← Video captions
├── slide-generator.ts           ← PowerPoint slides
└── workbook-generator.ts        ← Student workbook

lib/course-factory-dashboard/
├── GenerationProgress.tsx       ← Visual progress
├── BlueprintViewer.tsx          ← Blueprint display
├── QualityScore.tsx            ← Quality display
└── PublishWorkflow.tsx          ← Publishing UI
```

---

## RECOMMENDATION

**Do not build new AI services.**

**Extend existing ones:**

1. Add orchestration layer to `lib/paris/`
2. Add config-based credential registry
3. Add blueprint monitoring service
4. Connect existing media services
5. Build licensing portal on top

**The AI already exists. Orchestrate it.**
