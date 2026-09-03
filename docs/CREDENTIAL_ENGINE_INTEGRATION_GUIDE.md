# Credential Engine Integration Guide

## Overview

The Credential Intelligence Engine (`lib/course-builder/credential-engine/`) connects to existing AI services.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXISTING INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│  lib/ai/                    │  lib/industry/                    │
│  ├── course-generator.ts    │  ├── standards-loader.ts          │
│  ├── lesson-compiler.ts    │  ├── onet/                       │
│  ├── course-gap-detection   │  └── soc-map.ts                  │
│  └── prompts/              │                                   │
│      └── course-blueprint.ts│  app/api/ai-instructor/          │
│                            │  └── hvac-instructor-prompt.ts   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
                    ┌───────────────────────┐
                    │  NEW CREDENTIAL ENGINE │
                    ├───────────────────────┤
                    │  credential-engine/    │
                    │  ├── registry (30+)   │
                    │  ├── exam-blueprints   │
                    │  ├── rag-engine        │
                    │  ├── prompt-selector   │
                    │  └── quality-validator │
                    └───────────────────────┘
```

## Integration Points

### 1. Wire to Course Generator

**File:** `lib/ai/course-generator.ts`

**Before:**
```typescript
function buildSystemPrompt(): string {
  return `You are an expert instructional designer...`;
}
```

**After:**
```typescript
import { 
  buildGenerationContext,
  getPrompts 
} from '@/lib/course-builder/credential-engine';

function buildSystemPrompt(credentialSlug?: string): string {
  if (credentialSlug) {
    const context = buildGenerationContext({
      userRequest: '',
      credentialSlug,
    });
    return context.systemPrompt;
  }
  return `You are an expert instructional designer...`;
}
```

### 2. Wire to AI Instructor

**File:** `lib/ai-instructor/hvac-instructor-prompt.ts`

**Before:**
```typescript
export function buildMarcusSystemPrompt(ctx: LessonContext): string {
  // Existing prompt building
}
```

**After:**
```typescript
import { enhanceWithRag } from '@/lib/course-builder/credential-engine';

export function buildMarcusSystemPrompt(ctx: LessonContext): string {
  // Existing prompt building...
  
  const basePrompt = /* existing prompt */;
  
  // Add RAG context for EPA 608
  const enhancedPrompt = enhanceWithRag(
    basePrompt,
    'epa-608-universal',
    ctx.lessonTitle
  );
  
  return enhancedPrompt;
}
```

### 3. Wire to Blueprint Prompts

**File:** `lib/ai/prompts/course-blueprint.ts`

**Before:**
```typescript
export function buildBlueprintPrompt(args) {
  return `
SOURCE TYPE: ${args.sourceType}
...
`;
}
```

**After:**
```typescript
import { buildBlueprintContext } from '@/lib/course-builder/credential-engine';

export function buildBlueprintPrompt(args) {
  const credentialContext = args.credentialSlug 
    ? buildBlueprintContext(args.credentialSlug)
    : '';

  return `
${credentialContext}
SOURCE TYPE: ${args.sourceType}
...
`;
}
```

### 4. Wire Quality Validation

**File:** `lib/ai/course-generator.ts`

**After generation:**
```typescript
import { validateGeneratedCourse } from '@/lib/course-builder/credential-engine';

async function generateAndValidateCourse(opts) {
  const course = await generateCourse(opts);
  
  const context = buildGenerationContext({
    userRequest: opts.prompt,
    credentialSlug: opts.credentialSlug,
  });

  const validation = validateGeneratedCourse(course.modules, context);

  if (!validation.passed) {
    console.log('Quality issues:', validation.issues);
    // Optionally regenerate weak sections
  }

  return { course, qualityScore: validation.scores };
}
```

### 5. Wire to PARIS AI

**File:** `lib/paris/index.ts`

```typescript
import { buildGenerationContext } from '@/lib/course-builder/credential-engine';

export async function parisGenerateCourse(request) {
  // Detect credential from user request
  const context = buildGenerationContext({
    userRequest: request.userRequest,
  });

  if (context.credential) {
    // Use credential-aware generation
    return generateCredentialCourse(context, request);
  }

  // Fall back to generic generation
  return generateGenericCourse(request);
}
```

### 6. Wire to Admin API

**File:** `apps/app/api/admin/lms/courses/route.ts`

```typescript
import { buildGenerationContext } from '@/lib/course-builder/credential-engine';

export async function POST(request) {
  const body = await request.json();

  if (body.credentialSlug) {
    const context = buildGenerationContext({
      userRequest: '',
      credentialSlug: body.credentialSlug,
    });

    return NextResponse.json({
      context: {
        credential: context.credential.name,
        examSections: context.credential.examSections,
        blueprintLoaded: !!context.blueprint,
      },
    });
  }

  // Existing logic...
}
```

## API Usage

### List All Credentials

```bash
GET /api/course-builder/credential/list
```

Response:
```json
{
  "ok": true,
  "credentials": [
    { "slug": "epa-608-universal", "name": "EPA 608 Universal", "provider": "ESCO Institute" },
    { "slug": "nha-ccma", "name": "Certified Medical Assistant", "provider": "NHA" },
    ...
  ]
}
```

### Analyze Request

```bash
POST /api/course-builder/credential/analyze
{
  "userRequest": "Build EPA 608 course"
}
```

Response:
```json
{
  "ok": true,
  "detected": {
    "courseType": "credential",
    "credential": {
      "slug": "epa-608-universal",
      "name": "EPA 608 Universal",
      "examFormat": "100 questions, closed book",
      "passingScore": "70%"
    },
    "blueprintLoaded": true,
    "ragTopics": 17,
    "criticalNumbers": 11
  }
}
```

### Generate Prompt

```bash
POST /api/course-builder/credential/generate-prompt
{
  "userRequest": "Build EPA 608 course",
  "lessonTitle": "Ozone Depletion",
  "examDomain": "Core",
  "type": "lesson"
}
```

## Migration Path

### Phase 1: Zero Impact
- Add credential engine to codebase
- No changes to existing code
- Test in isolation

### Phase 2: Feature Flag
- Add optional credentialSlug parameter to existing functions
- Toggle between old and new prompts

### Phase 3: Gradual Migration
- Migrate one credential at a time
- Validate quality scores
- Roll back if issues

### Phase 4: Full Replacement
- Remove legacy prompts
- Use credential engine exclusively

## Testing

### Unit Test
```typescript
import { buildGenerationContext } from '@/lib/course-builder/credential-engine';

test('detects EPA 608 credential', () => {
  const context = buildGenerationContext({
    userRequest: 'Build EPA 608 course',
  });

  expect(context.credential?.slug).toBe('epa-608-universal');
  expect(context.blueprint).toBeDefined();
});
```

### Integration Test
```typescript
test('generates credential-aware content', async () => {
  const context = buildGenerationContext({
    userRequest: 'Build EPA 608 course',
    credentialSlug: 'epa-608-universal',
  });

  const prompts = getPrompts(context);
  
  expect(prompts.lesson).toContain('EPA 608');
  expect(prompts.quiz).toContain('recovery');
});
```

## Files Reference

### Existing (Do Not Modify)
- `lib/ai/course-generator.ts` - Add optional credential parameter
- `lib/ai/prompts/course-blueprint.ts` - Add credential context
- `lib/ai-instructor/hvac-instructor-prompt.ts` - Add RAG enhancement
- `lib/paris/index.ts` - Add credential detection

### New (Ready to Use)
- `lib/course-builder/credential-engine/*` - All exports
- `apps/app/api/course-builder/credential/route.ts` - API endpoint

## Checklist

- [ ] Import credential engine into course-generator.ts
- [ ] Add credentialSlug optional parameter
- [ ] Import into ai-instructor prompts
- [ ] Add RAG enhancement to instructor
- [ ] Wire quality validation to generation
- [ ] Test with EPA 608 credential
- [ ] Test with NHA credentials
- [ ] Verify quality scores meet threshold
- [ ] Update admin UI with credential selector
