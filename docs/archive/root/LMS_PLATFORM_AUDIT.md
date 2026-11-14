# Elevate LMS - Complete Platform Audit & Verification Prompt

**ROLE**: You are a Senior Full-Stack Developer and System Architect. Audit and verify the ENTIRE Elevate LMS platform including Admin Dashboard, Dev Studio, Course Builder, and Container capabilities.

---

## THE PROMPT (Copy and Paste)

```
AUDIT AND FIX THE ENTIRE ELEVATE LMS PLATFORM. Verify all components work together as a unified system.

## PLATFORM COMPONENTS TO AUDIT

1. Admin Dashboard - Central control system (brain)
2. Dev Studio - Interactive coding environment (like Replit)
3. Course Builder - SOP-based, credentialed, interactive courses
4. Container System - Unified development environment
5. Auto-Pilot Virtual Assistant
6. Template System - AI-powered, cross-device
7. Program Auto-Detection and Course Generation
8. Lazy Loading System - Memory efficient

---

## SECTION 1: ADMIN DASHBOARD AUDIT

### Step 1.1: List all admin routes
```bash
find app -type d -name "admin*" 2>/dev/null | head -20
```

### Step 1.2: Check admin dashboard entry point
```bash
cat app/admin/page.tsx 2>/dev/null | head -50
```

### Step 1.3: List all admin pages
```bash
find app -path "*admin*" -name "page.tsx" 2>/dev/null | sort
```

### Step 1.4: Check admin API routes
```bash
find app/api -path "*admin*" -name "route.ts" 2>/dev/null | head -20
```

### Step 1.5: Verify admin layout
```bash
cat app/admin/layout.tsx 2>/dev/null | head -30
```

### Step 1.6: Check admin components
```bash
ls -la components/admin/ 2>/dev/null | head -20
```

---

## SECTION 2: DEV STUDIO AUDIT

### Step 2.1: List Dev Studio routes
```bash
find app -path "*devstudio*" -name "page.tsx" 2>/dev/null | sort
```

### Step 2.2: Check Dev Studio main page
```bash
cat app/devstudio/page.tsx 2>/dev/null | head -50
```

### Step 2.3: Check Dev Studio layout
```bash
cat app/devstudio/layout.tsx 2>/dev/null | head -30
```

### Step 2.4: List Dev Studio components
```bash
ls -la components/studio/ 2>/dev/null | head -30
```

### Step 2.5: Check for code editor component
```bash
grep -rn "CodeEditor\|Monaco\|CodeMirror\|code-input" components/studio/ 2>/dev/null | head -10
```

### Step 2.6: Check for terminal component
```bash
grep -rn "Terminal\|xterm\|shell" components/studio/ 2>/dev/null | head -10
```

### Step 2.7: Check Dev Studio API routes
```bash
find app/api -path "*devstudio*" -name "route.ts" 2>/dev/null | head -20
```

---

## SECTION 3: COURSE BUILDER AUDIT

### Step 3.1: List course builder routes
```bash
find app -path "*course*" -name "page.tsx" 2>/dev/null | sort
```

### Step 3.2: Check course builder main page
```bash
cat app/courses/page.tsx 2>/dev/null | head -50
```

### Step 3.3: List course components
```bash
ls -la components/courses/ 2>/dev/null | head -30
```

### Step 3.4: Check course data structure
```bash
cat lib/courses/course-schema.ts 2>/dev/null | head -50
```

### Step 3.5: Check for interactive elements
```bash
grep -rn "quiz\|assessment\|hands-on\|interactive\|simulation" components/courses/ 2>/dev/null | head -20
```

### Step 3.6: Check for credential integration
```bash
grep -rn "credential\|certificate\|certification\|NHA" components/courses/ 2>/dev/null | head -20
```

### Step 3.7: Check for SOP (Standard Operating Procedure) structure
```bash
grep -rn "step\|module\|lesson\|procedure\|sop" lib/courses/ 2>/dev/null | head -20
```

---

## SECTION 4: CONTAINER SYSTEM AUDIT

### Step 4.1: Check for Docker/devcontainer config
```bash
find . -name "devcontainer.json" -o -name "docker-compose.yml" 2>/dev/null | head -10
```

### Step 4.2: Check for workspace container
```bash
cat .devcontainer/devcontainer.json 2>/dev/null | head -50
```

### Step 4.3: Check for container API routes
```bash
find app/api -path "*container*" -name "route.ts" 2>/dev/null | head -10
```

### Step 4.4: Check for execution sandbox
```bash
grep -rn "sandbox\|execute\|run-code\|runtime" components/studio/ 2>/dev/null | head -20
```

### Step 4.5: Check for file system operations
```bash
grep -rn "fs\|writeFile\|readFile\|mkdir" app/api/devstudio/ 2>/dev/null | head -20
```

---

## SECTION 5: AUTO-PILOT VIRTUAL ASSISTANT AUDIT

### Step 5.1: Check for AI/assistant routes
```bash
find app -path "*ai*" -o -path "*assistant*" -o -path "*autopilot*" 2>/dev/null | grep "page.tsx" | head -20
```

### Step 5.2: Check for chatbot component
```bash
ls -la components/chatbot/ 2>/dev/null | head -20
```

### Step 5.3: Check for autopilot route
```bash
cat app/api/autopilot/route.ts 2>/dev/null | head -50
```

### Step 5.4: Check for AI service integration
```bash
grep -rn "openai\|anthropic\|gemini\|llm\|ai" lib/ 2>/dev/null | head -20
```

---

## SECTION 6: TEMPLATE SYSTEM AUDIT

### Step 6.1: Check for template routes
```bash
find app -path "*template*" -name "page.tsx" 2>/dev/null | head -20
```

### Step 6.2: Check for template components
```bash
ls -la components/templates/ 2>/dev/null | head -30
```

### Step 6.3: Check for video/image templates
```bash
grep -rn "video\|image\|template" lib/ 2>/dev/null | head -20
```

### Step 6.4: Check for prompt templates
```bash
find lib -name "*prompt*" -o -name "*template*" 2>/dev/null | head -20
```

---

## SECTION 7: PROGRAM AUTO-DETECTION AUDIT

### Step 7.1: Check for program registry
```bash
cat lib/programs/PROGRAM_REGISTRY.ts 2>/dev/null | head -50
```

### Step 7.2: Check for auto-generation routes
```bash
find app -path "*generate*" -name "route.ts" 2>/dev/null | head -20
```

### Step 7.3: Check for course generator
```bash
grep -rn "generateCourse\|createCourse\|buildCourse" lib/ 2>/dev/null | head -20
```

### Step 7.4: Check for lazy loading of courses
```bash
grep -rn "dynamic\|lazy\|suspense\|on-demand" components/courses/ 2>/dev/null | head -20
```

---

## SECTION 8: UNIFIED SYSTEM VERIFICATION

### Step 8.1: Check for shared utilities
```bash
ls -la lib/shared/ 2>/dev/null | head -20
```

### Step 8.2: Check for platform config
```bash
cat lib/config/platform-config.ts 2>/dev/null | head -50
```

### Step 8.3: Check for system health check
```bash
cat app/api/health/route.ts 2>/dev/null | head -30
```

### Step 8.4: Check for route registry
```bash
cat lib/routes/canonical-routes.json 2>/dev/null | jq '. | keys' 2>/dev/null
```

---

## COMMON ISSUES TO FIND AND FIX

### Issue 1: Missing Routes
IF a component exists but no route:
1. Create the route file
2. Import the component
3. Export properly

### Issue 2: Missing API Routes
IF a feature needs backend:
1. Create API route at app/api/[feature]/route.ts
2. Implement CRUD operations
3. Connect to database

### Issue 3: Missing Components
IF a feature needs UI:
1. Create component at components/[feature]/
2. Export properly
3. Import in parent

### Issue 4: Memory/Performance Issues
IF courses load eagerly:
1. Use dynamic() with ssr:false
2. Wrap in Suspense
3. Lazy load on navigation

---

## FIX PATTERNS

### Pattern 1: Create Admin Dashboard Page
```typescript
// app/admin/[section]/page.tsx
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminSectionPage() {
  return (
    <AdminShell>
      <SectionComponent />
    </AdminShell>
  );
}
```

### Pattern 2: Create Dev Studio Route
```typescript
// app/devstudio/[tool]/page.tsx
import { DevStudioShell } from '@/components/studio/DevStudioShell';

export default function DevStudioToolPage() {
  return <DevStudioShell tool="tool-name" />;
}
```

### Pattern 3: Create Course Builder Route
```typescript
// app/courses/builder/[courseId]/page.tsx
import { CourseBuilder } from '@/components/courses/CourseBuilder';

export default function CourseBuilderPage({ params }) {
  return <CourseBuilder courseId={params.courseId} />;
}
```

### Pattern 4: Lazy Load Course Component
```typescript
// In parent component
const InteractiveQuiz = dynamic(() => import('@/components/courses/InteractiveQuiz'), {
  ssr: false,
  loading: () => <QuizSkeleton />
});
```

---

## VERIFICATION CHECKLIST

After all fixes:
- [ ] Admin Dashboard has all sections
- [ ] Dev Studio can execute code
- [ ] Course Builder creates credentialed courses
- [ ] Container runs isolated environments
- [ ] Auto-pilot responds to commands
- [ ] Templates work across devices
- [ ] Programs auto-generate courses
- [ ] Courses lazy load (no runtime heap issues)
- [ ] All routes are accessible
- [ ] Build passes

---

## OUTPUT FORMAT

For each missing component:
```
MISSING: [Component Name]
LOCATION: app/[path]/page.tsx
FIX: Create the file with proper imports and exports
PRIORITY: HIGH/MEDIUM/LOW
```

For each fix applied:
```
FIXED: [What was fixed]
FILE: [path]
COMMIT: [message]
```
```

---

## HOW TO USE

1. Copy the entire prompt above
2. Paste into OpenHands conversation
3. Let it systematically audit everything
4. It will report each missing component
5. Fix each issue reported

---

## TEST AFTER FIXES

1. Admin Dashboard: http://localhost:3000/admin
2. Dev Studio: http://localhost:3000/devstudio
3. Course Builder: http://localhost:3000/courses
4. API Health: curl http://localhost:3000/api/health

---

## PLATFORM ARCHITECTURE GOAL

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                            │
│   (Central Control System / Brain)                           │
│   - Program Management                                       │
│   - User Management                                          │
│   - Course Management                                        │
│   - Analytics                                                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       DEV STUDIO                             │
│   (Interactive Coding Environment)                          │
│   - Code Editor (Monaco/CodeMirror)                         │
│   - Terminal                                                 │
│   - File Browser                                             │
│   - Preview                                                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    COURSE BUILDER                            │
│   (SOP-Based, Credentialed, Interactive)                    │
│   - Drag & Drop Builder                                      │
│   - Quiz/Assessment Engine                                   │
│   - Video/Interactive Elements                               │
│   - Credential Integration (NHA-style)                       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   CONTAINER SYSTEM                           │
│   (Unified Development Environment)                          │
│   - Docker/Devcontainer                                     │
│   - Code Execution Sandbox                                   │
│   - File System Operations                                    │
│   - Plugin System                                            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  AUTO-PILOT ASSISTANT                        │
│   (AI-Powered Helper)                                        │
│   - Natural Language Commands                               │
│   - Code Generation                                          │
│   - Debugging Assistance                                      │
│   - Course Generation                                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    TEMPLATE SYSTEM                           │
│   (AI-Powered, Cross-Device)                                │
│   - Video Templates                                          │
│   - Image Templates                                          │
│   - Page Templates                                          │
│   - Course Templates                                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  PROGRAM AUTO-DETECTION                      │
│   (Lazy-Loaded Course Generation)                           │
│   - Detect New Programs                                      │
│   - Auto-Generate Course Outline                             │
│   - Link to LMS                                              │
│   - Only Run When Needed (Lazy)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## MEMORY OPTIMIZATION (LAZY LOADING)

All heavy components should:
1. Use dynamic() import with ssr:false
2. Be wrapped in Suspense
3. Only load when user navigates to them
4. Be stored in storage/, not memory
5. Execute on-demand, not at startup

Example:
```typescript
// GOOD - Lazy loaded
const HeavyComponent = dynamic(() => import('@/components/heavy'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

// GOOD - Only imported when needed
async function generateCourse() {
  const { courseGenerator } = await import('@/lib/course-generator');
  return courseGenerator.detectAndGenerate(program);
}
```
