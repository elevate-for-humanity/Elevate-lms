# Production Audit: Credential Intelligence Platform

## Executive Summary

**Audit Date:** 2026-07-11  
**Repository:** Elevate LMS  
**Status:** Infrastructure EXISTS - Integration Needed

---

## 1. EXISTING INFRASTRUCTURE

### ✅ AI Services (Already Exist)

| Service | Location | Status |
|---------|----------|--------|
| **PARIS AI** | `lib/paris/` | ✅ Implemented |
| **AI Instructor** | `app/api/ai-instructor/` | ✅ Implemented |
| **Course Generator** | `lib/ai/course-generator.ts` | ✅ Implemented |
| **Course Blueprint Prompt** | `lib/ai/prompts/course-blueprint.ts` | ✅ Implemented |
| **Industry Standards** | `lib/industry/standards-loader.ts` | ✅ Implemented |
| **O*NET Integration** | `lib/onet/` | ✅ Full API |
| **Lesson Compiler** | `lib/ai/lesson-compiler.ts` | ✅ Implemented |
| **Image Generator** | `lib/ai/image-generator.ts` | ✅ Implemented |
| **Course Gap Detection** | `lib/ai/course-gap-detection.ts` | ✅ Implemented |
| **Workforce Gap Scanner** | `lib/ai/workforce-gap-scanner.ts` | ✅ Implemented |

### ✅ Credential Infrastructure (Already Exist)

| Component | Location | Status |
|-----------|----------|--------|
| **Credential Engine API** | `apps/app/api/credentialing/route.ts` | ✅ Credential Engine |
| **EPA 608 Prep JSON** | `public/data/hvac-epa608-prep.json` | ✅ 107KB |
| **Barber Blueprint JSON** | `public/data/barber-apprenticeship-blueprint.json` | ✅ 234KB |
| **Course Definitions** | `public/data/course-definitions.json` | ✅ 72KB |
| **O*NET SOC Maps** | `lib/onet/soc-map.ts` | ✅ 50+ programs |
| **Industry Standards Loader** | `lib/industry/standards-loader.ts` | ✅ Full |
| **Credential Registry** | `lib/courses/*` | ✅ Programs exist |

### ✅ Course Content (Already Exist)

| Course | Files | Status |
|--------|-------|--------|
| **HVAC** | `courses/hvac/` | ✅ 10 modules + content |
| **Barber Apprenticeship** | `lms-data/courses/barber-apprenticeship/` | ✅ Complete |
| **Healthcare Programs** | `lms-data/courses/*` | ✅ Multiple |
| **Testing Center** | `courses/testing/` | ✅ EPA 608, etc. |

### ✅ Media Infrastructure (Already Exist)

| Service | Location | Status |
|---------|----------|--------|
| **PARIS Media Studio** | `lib/paris/media-studio/` | ✅ Implemented |
| **Video Generator** | `server/video-generator/` | ✅ Implemented |
| **Voice Commands** | `lib/paris/voice-commands.tsx` | ✅ Implemented |
| **Image Generator** | `lib/ai/image-generator.ts` | ✅ Implemented |

---

## 2. NEW INFRASTRUCTURE CREATED

### Credential Intelligence Engine (New)

```
lib/course-builder/credential-engine/
├── index.ts                         ✅ Main exports
├── course-types.ts                   ✅ Course type detection
├── credential-registry-universal.ts   ✅ 30+ credentials
├── credential-registry.ts            ✅ EPA 608 specific
├── exam-blueprints.ts                ✅ Exam specs
├── prompt-selector.ts                ✅ Credential prompts
├── rag-engine.ts                    ✅ RAG knowledge retrieval
├── quality-validator.ts              ✅ Quality scoring
└── universal-platform.ts             ✅ Course factory
```

### API Route (New)

```
apps/app/api/course-builder/credential/route.ts  ✅ Implemented
```

---

## 3. WHAT WAS ALREADY IMPLEMENTED

### Course Builder Prompts (Already Exist)

```typescript
// lib/ai/prompts/course-blueprint.ts

export const BLUEPRINT_SYSTEM = `
You are a senior instructional designer creating workforce 
and professional training courses.

Rules:
- Return valid JSON only
- Create 4-8 modules
- Each module: 3-6 lessons
- Every lesson: measurable learning objectives
- Credential domains MUST be covered
- Industry standards injected
`;

export function buildIndustryStandardsBlock(standards) {
  // O*NET SOC code
  // Core job tasks
  // Top skills
  // Key knowledge
  // Technology tools
  // Wage context
  // Credential exam domains
  // Available certifications
}
```

### Course Generator (Already Exists)

```typescript
// lib/ai/course-generator.ts

export interface GeneratedCourse {
  title: string;
  course_name: string;
  description: string;
  learning_objectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_hours: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedLesson {
  title: string;
  content: string;
  key_takeaways: string[];
  reflection_prompt: string;
  competency_keys: string[];
  quiz_questions: GeneratedQuizQuestion[];
  duration_minutes: number;
}
```

### Industry Standards (Already Exist)

```typescript
// lib/industry/standards-loader.ts

export interface IndustryStandards {
  occupation_title: string;
  soc_code: string;
  occupation_description: string;
  top_tasks: string[];
  top_skills: string[];
  top_knowledge: string[];
  technology_skills: string[];
  median_annual_wage: number;
  credential_domains: CredentialDomain[];
  exam_blueprint: ExamBlueprint;
  certifications: Certification[];
}
```

---

## 4. GAP ANALYSIS

### What Already Works

| Feature | Status |
|---------|--------|
| O*NET integration | ✅ Full |
| SOC code mapping | ✅ 50+ programs |
| Industry standards loader | ✅ Complete |
| Course generator | ✅ Working |
| Blueprint prompts | ✅ Credential-aware |
| Exam question generation | ✅ Implemented |
| Quiz generation | ✅ Implemented |

### What's Missing / Needs Integration

| Gap | Status | Action |
|-----|--------|--------|
| **Credential detection** | 🆕 Created | Wire to course generator |
| **Universal registry** | 🆕 Created | Connect to existing prompts |
| **RAG integration** | 🆕 Created | Wire to AI calls |
| **Quality validation** | 🆕 Created | Add to generation pipeline |
| **Blueprint monitoring** | 🆕 Created | Add cron job |
| **Practice exam generator** | ⚠️ Partial | Expand existing |

---

## 5. INTEGRATION PLAN

### Step 1: Wire Credential Engine to Course Generator

```typescript
// In lib/ai/course-generator.ts, add:

import { 
  buildGenerationContext,
  getPrompts 
} from '@/lib/course-builder/credential-engine';

export async function generateCredentialCourse(
  credentialSlug: string,
  userPrompt: string
) {
  // 1. Build generation context
  const context = buildGenerationContext({
    userRequest: userPrompt,
    credentialSlug,
  });

  // 2. Get credential-aware prompts
  const prompts = getPrompts(context);

  // 3. Generate with RAG context
  const course = await generateCourseWithPrompts({
    systemPrompt: prompts.lesson,
    userPrompt: context.blueprintPrompt + userPrompt,
  });

  // 4. Validate against blueprint
  const validation = validateGeneratedCourse(course, context);

  // 5. Return with quality score
  return { course, qualityScore: validation.scores };
}
```

### Step 2: Add RAG to Existing AI Instructor

```typescript
// In lib/ai-instructor/hvac-instructor-prompt.ts, modify:

import { enhanceWithRag } from '@/lib/course-builder/credential-engine';

export function buildMarcusSystemPrompt(ctx: LessonContext) {
  // Existing prompt building...
  
  // ADD: RAG context for EPA 608
  const enhancedPrompt = enhanceWithRag(
    basePrompt,
    'epa-608-universal',
    ctx.lessonTitle
  );

  return enhancedPrompt;
}
```

### Step 3: Wire Quality Validation

```typescript
// After course generation in lib/ai/course-generator.ts

import { validateCourse } from '@/lib/course-builder/credential-engine';

export async function generateAndValidateCourse(opts) {
  const course = await generateCourse(opts);
  
  const validation = validateCourse(
    course.modules,
    context.blueprint,
    context.credential
  );

  if (!validation.passed) {
    // Regenerate weak sections
    const improved = await regenerateWeakSections(course, validation);
    return improved;
  }

  return course;
}
```

---

## 6. CREDENTIALS IN SYSTEM

### Already Mapped (50+ Programs)

```
Healthcare: medical-assistant, cna, phlebotomy, pharmacy-technician, etc.
Trades: hvac-technician, electrical, plumbing, welding, cdl-training
Beauty: barber-apprenticeship, cosmetology-apprenticeship
Technology: cybersecurity, it-help-desk, network-administration
Business: bookkeeping, office-administration, project-management
```

### New Registry (30+ Credentials)

```
Healthcare: NHA CCMA, CPT, EKG, ExCPT, CBCS, CMAA, CEHRS
Trades: EPA 608 Universal, NCCER Core, HVAC, Electrical, Plumbing, Welding
Beauty: Indiana Barber, Cosmetology, Esthetics, Nail Tech + Apprenticeships
Safety: OSHA 10, OSHA 30, Forklift, CPR/AED
Food: ServSafe
Workforce: ACT WorkKeys, CareerSafe
Transportation: CDL Permit
```

---

## 7. RECOMMENDATIONS

### Priority 1: Integration (Don't Rebuild)

1. **Wire credential-registry-universal.ts** → existing course generator
2. **Wire RAG engine** → existing AI instructor prompts  
3. **Add quality validation** → existing generation pipeline
4. **Expand practice exam** → existing quiz generation

### Priority 2: Connect Existing

1. **Connect Credential Engine API** → PARIS AI
2. **Connect quality validator** → course publishing workflow
3. **Connect blueprint monitoring** → admin dashboard
4. **Connect credential registry** → program pages

### Priority 3: Enhance

1. Add more credentials to universal registry
2. Build instructor profile generator
3. Add media generation to course factory
4. Add lab/competency generation

---

## 8. FILES SUMMARY

### Existing (Do Not Modify)

| File | Purpose |
|------|---------|
| `lib/ai/course-generator.ts` | Course generation |
| `lib/ai/prompts/course-blueprint.ts` | Blueprint prompts |
| `lib/industry/standards-loader.ts` | Industry standards |
| `lib/ai/lesson-compiler.ts` | Lesson compilation |
| `lib/onet/soc-map.ts` | SOC code mappings |
| `lib/paris/*` | PARIS AI system |
| `app/api/ai-instructor/*` | AI instructor |
| `public/data/*-blueprint.json` | Course blueprints |
| `public/data/hvac-epa608-prep.json` | EPA 608 content |
| `courses/*/` | Course content |

### New (Integration Required)

| File | Purpose |
|------|---------|
| `lib/course-builder/credential-engine/*` | Credential engine |
| `apps/app/api/course-builder/credential/route.ts` | API endpoint |

---

## 9. CONCLUSION

**The credential intelligence platform already EXISTS in the codebase.**

The infrastructure for generating credential-aligned courses is fully implemented:

✅ O*NET integration  
✅ SOC code mappings  
✅ Industry standards loader  
✅ Course generator  
✅ Blueprint prompts  
✅ Quiz generation  
✅ Lesson compilation  

**What was missing:** A unified credential registry with exam blueprints, RAG context, and quality validation.

**What we built:** The credential intelligence layer that connects to existing infrastructure.

**Next step:** Wire the new credential-engine to the existing AI services.

---

## 10. ACTION ITEMS

| # | Action | Priority | Files |
|---|--------|----------|-------|
| 1 | Wire credential-registry to course generator | HIGH | `lib/ai/course-generator.ts` |
| 2 | Add RAG context to AI instructor | HIGH | `lib/ai-instructor/*` |
| 3 | Add quality validation to pipeline | HIGH | `lib/ai/course-generator.ts` |
| 4 | Connect to PARIS AI | MEDIUM | `lib/paris/*` |
| 5 | Add credential selector UI | MEDIUM | `components/*` |
| 6 | Build blueprint monitoring cron | LOW | `scripts/*` |
| 7 | Add more credentials | LOW | `lib/course-builder/credential-engine/*` |

---

**BOTTOM LINE:** Do not rebuild existing systems. Wire the new credential-engine to existing AI services.
