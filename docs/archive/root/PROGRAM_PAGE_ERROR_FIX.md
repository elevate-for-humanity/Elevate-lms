# Elevate LMS - Program Page Error Debug & Fix Prompt

**ROLE**: You are a Senior Next.js Developer debugging "Program Page Error" on program detail pages.

---

## THE PROMPT (Copy and Paste)

```
DEBUG AND FIX ALL "Program Page Error" ERRORS on program detail pages.

## ERROR TO FIX
Error: An error occurred in the Server Components render.
This error appears on: https://www.elevateforhumanity.org/programs/{slug}

## PHASE 1: FIND THE EXACT ERROR SOURCE

### Step 1.1: Check the page that renders programs
cat app/programs/[program]/page.tsx
Look for:
- Missing imports
- Type errors
- Server-only code being called
- Missing null checks

### Step 1.2: Check ProgramDetailPage component
cat components/programs/ProgramDetailPage.tsx | head -100
Look for:
- 'use client' without hooks (causes SSR issues)
- Missing props
- Type mismatches
- Undefined access

### Step 1.3: Check all imports in the page chain
grep -n "import" app/programs/\[program\]/page.tsx | head -30
Verify each import exists and is correct.

### Step 1.4: Check data loading
grep -n "getStaticProgram\|loadProgram\|createPublicClient" app/programs/\[program\]/page.tsx
Verify the data loading function exists and returns correct type.

### Step 1.5: Check for runtime errors in components
grep -rn "throw new Error\|throw Error\|console.error" components/programs/*.tsx | grep -v "// "

---

## PHASE 2: CHECK EACH COMPONENT FOR ISSUES

### Step 2.1: Check HeroVideo
head -30 components/marketing/HeroVideo.tsx
Verify it handles missing props gracefully.

### Step 2.2: Check HeroPicture
grep -n "imageSrcDesktop\|src=" components/marketing/HeroPicture.tsx
Verify it uses src prop directly, not resolveSiteImagePath().

### Step 2.3: Check ProgramCredentialsSection
head -20 components/programs/ProgramCredentialsSection.tsx
Verify props are correctly typed and handled.

### Step 2.4: Check ProgramAtAGlance
head -30 components/programs/ProgramAtAGlance.tsx
Verify it handles null/undefined props.

### Step 2.5: Check ProgramEmploymentPathway
head -30 components/programs/ProgramEmploymentPathway.tsx
Verify data access is safe.

### Step 2.6: Check OnetLaborData
head -40 components/programs/onet/OnetLaborData.tsx
This often causes SSR errors - verify it handles missing SOC codes.

---

## PHASE 3: CHECK DATA LOADING

### Step 3.1: Check getStaticProgram
grep -n "export.*getStaticProgram" data/programs/index.ts
Verify it returns correct type.

### Step 3.2: Check program data files exist
ls data/programs/*.ts | head -10

### Step 3.3: Check for missing slug mappings
grep -n "phlebotomy\|home-health-aide\|bookkeeping" data/programs/index.ts | head -10

### Step 3.4: Check heroBanners
cat content/heroBanners.json | jq '.[] | keys' 2>/dev/null | head -20
Verify banners exist for all programs.

---

## PHASE 4: CHECK TYPE DEFINITIONS

### Step 4.1: Check ProgramSchema
grep -n "interface ProgramSchema\|type ProgramSchema" lib/programs/program-schema.ts | head -5
Verify all required fields are defined.

### Step 4.2: Check for optional vs required fields
grep -n "?:\|!:" lib/programs/program-schema.ts | head -20
Make sure fields used without checks are required or optional with defaults.

### Step 4.3: Check CourseStructuredData
cat components/seo/CourseStructuredData.tsx | head -50
This often has type mismatches.

---

## PHASE 5: FIX EACH ISSUE

### Fix Pattern 1: Missing Prop with Default
BEFORE (crashes if program is undefined):
const title = program.title;

AFTER (safe):
const title = program?.title ?? 'Program';

### Fix Pattern 2: Missing Banner Check
BEFORE (crashes if banner is undefined):
banner.videoSrcDesktop

AFTER (safe):
banner?.videoSrcDesktop ?? DEFAULT_HERO_VIDEO

### Fix Pattern 3: Missing Array Check
BEFORE (crashes if credentials is undefined):
program.credentials.map(...)

AFTER (safe):
(program.credentials ?? []).map(...)

### Fix Pattern 4: Optional Chaining for Objects
BEFORE (crashes if nested object is undefined):
program.metadata.industry

AFTER (safe):
program?.metadata?.industry

---

## PHASE 6: VERIFY FIXES

### Step 6.1: Run TypeScript check
cd /workspace/project/Elevate-lms && npx tsc --noEmit 2>&1 | head -50

### Step 6.2: Check for any remaining issues
grep -rn "undefined\.\|null\." components/programs/*.tsx | grep -v "// \|/\*\|\?\." | head -20

### Step 6.3: Test specific program pages
curl -s "http://localhost:3000/programs/cna" 2>&1 | grep -i "error\|undefined\|null" | head -10

---

## PHASE 7: BUILD AND PUSH

### Step 7.1: Build locally
cd /workspace/project/Elevate-lms && pnpm build 2>&1 | tail -30

### Step 7.2: Commit fixes
git add -A && git commit -m "fix: Resolve program page server component errors"

### Step 7.3: Push
git push origin main

---

## COMMON CAUSES OF THIS ERROR

1. Missing null checks - Accessing properties on undefined objects
2. Type mismatches - Expected type doesn't match actual data
3. Missing imports - Import path doesn't exist
4. Server-only code in client - fs/path calls in client components
5. Missing props - Component expects prop but parent doesn't pass it
6. Circular dependencies - Import loops cause SSR failures
7. Missing environment variables - Server-side env vars not set
8. Database connection issues - Supabase client failing on server

---

## VERIFICATION CHECKLIST

After fixes, verify:
- TypeScript compiles without errors
- Build succeeds
- Program pages load without error
- Hero renders correctly
- All sections display
```

---

## HOW TO USE

1. Copy the prompt above
2. Paste into OpenHands conversation
3. Let it run systematically
4. It will find and fix all errors

---

## TEST PAGES

After fixes, verify these pages work:
- https://www.elevateforhumanity.org/programs/phlebotomy (original error)
- https://www.elevateforhumanity.org/programs/cna
- https://www.elevateforhumanity.org/programs/hvac-technician
- https://www.elevateforhumanity.org/programs/bookkeeping

---

## ERROR MESSAGE DECODER

"Server Components render" error = Problem in server-side code during SSR
- Check all imports and data access
- Look for undefined/null access
- Verify all props are passed correctly
