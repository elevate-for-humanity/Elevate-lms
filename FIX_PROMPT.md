# Elevate LMS - COMPREHENSIVE FIX PROMPT

**ROLE**: You are a Senior Next.js Developer. Fix ALL issues systematically. Do NOT skip anything.

---

## THE FIX PROMPT (Copy and Paste)

```
FIX THIS CODEBASE COMPLETELY. Follow these steps IN ORDER. Report each fix.

## PHASE 1: FIND AND FIX SERVER-ONLY CODE IN CLIENT COMPONENTS

### Step 1.1: Find all files importing fs/path
```bash
grep -rn "from 'fs'\|from \"fs\"\|from 'path'\|from \"path\"\|existsSync\|process.cwd" --include="*.tsx" components/ --include="*.ts" . | grep -v node_modules | grep -v ".next" | grep -v "tests/" | grep -v "app/api/" | grep -v "scripts/" | grep -v "lib/images/site-image-paths.ts" | head -50
```

### Step 1.2: For each result, check if it's in a 'use client' component
```bash
for f in $(grep -rl "'use client'" --include="*.tsx" components/ 2>/dev/null); do
  for imp in "from 'fs'" "from \"fs\"" "from 'path'" "from \"path\""; do
    if grep -q "$imp" "$f" 2>/dev/null; then
      echo "❌ SERVER IN CLIENT: $f"
    fi
  done
done
```

### Step 1.3: Fix Pattern for resolveSiteImagePath in Client Components
IF a client component calls resolveSiteImagePath():
1. REMOVE the import of resolveSiteImagePath
2. ADD a prop parameter for the pre-resolved path
3. USE the prop directly instead of calling the function
4. UPDATE the server component that renders this client component to pass the pre-resolved path

Example:
```typescript
// BEFORE (client component)
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';
const src = resolveSiteImagePath(props.imageUrl);

// AFTER (client component)
interface Props {
  imageUrl: string; // Pre-resolved by server
  // ...
}
const src = props.imageUrl; // Use directly, no function call
```

### Step 1.4: Verify HeroPicture.tsx is fixed
```bash
grep -n "imageSrcDesktop = src\|imageSrcDesktop = resolveSiteImagePath" components/marketing/HeroPicture.tsx
```
MUST show: imageSrcDesktop = src

### Step 1.5: Verify ProgramDetailPage.tsx passes heroPosterSrc
```bash
grep -n "heroPosterSrc=" app/programs/\[program\]/page.tsx
```
MUST show: heroPosterSrc={heroPosterSrc}

---

## PHASE 2: FIX UNNECESSARY 'use client' DIRECTIVES

### Step 2.1: Find all 'use client' components
```bash
grep -rl "'use client'" --include="*.tsx" components/ 2>/dev/null | wc -l
```

### Step 2.2: Check each for actual need of 'use client'
```bash
for f in $(grep -rl "'use client'" --include="*.tsx" components/ 2>/dev/null | head -50); do
  has_hooks=$(grep -c "useState\|useEffect\|useCallback\|useRef\|useTransition\|useOptimistic" "$f" 2>/dev/null || echo 0)
  has_handlers=$(grep -c "onClick\|onChange\|onSubmit\|onKeyDown" "$f" 2>/dev/null || echo 0)
  has_dynamic=$(grep -c "ssr:false" "$f" 2>/dev/null || echo 0)
  has_search=$(grep -c "useSearchParams" "$f" 2>/dev/null || echo 0)
  
  if [ "$has_hooks" -eq 0 ] && [ "$has_handlers" -eq 0 ] && [ "$has_dynamic" -eq 0 ] && [ "$has_search" -eq 0 ]; then
    echo "⚠️ UNNECESSARY 'use client': $f (hooks=$has_hooks handlers=$has_handlers)"
  fi
done
```

### Step 2.3: Fix - Remove 'use client' ONLY IF:
- Component has NO hooks (useState, useEffect, useCallback, useRef, useTransition, useOptimistic)
- Component has NO event handlers (onClick, onChange, onSubmit, onKeyDown)
- Component does NOT use dynamic() with ssr:false
- Component does NOT use useSearchParams
- Component does NOT use browser APIs (window, document, localStorage, sessionStorage)

### Step 2.4: To remove 'use client'
1. Open the file
2. Delete the line containing "'use client';"
3. Remove any empty line at the top
4. Save

### Step 2.5: DO NOT remove 'use client' from:
- HeroVideo.tsx (uses useState, useEffect, useCallback)
- CanonicalVideo.tsx (uses useState, useEffect)
- ClientWidgets.tsx (uses useState, useEffect, usePathname)
- Any component using dynamic() with ssr:false
- Any component using useSearchParams

---

## PHASE 3: FIX DUPLICATE ROUTES AND MISSING PAGES

### Step 3.1: List all static program pages
```bash
ls app/programs/*/page.tsx 2>/dev/null | sed 's|app/programs/||;s|/page.tsx||' | grep -v "\[program\]" | sort
```

### Step 3.2: List canonical routes
```bash
cat lib/routes/canonical-routes.json | jq -r '.canonicalRoutes.programs | to_entries[] | .value' 2>/dev/null | sed 's|/programs/||' | sort
```

### Step 3.3: Find missing pages (in canonical but not in app/)
```bash
canonical=$(cat lib/routes/canonical-routes.json | jq -r '.canonicalRoutes.programs | to_entries[] | .value' 2>/dev/null | sed 's|/programs/||')
for slug in $canonical; do
  if [ ! -d "app/programs/$slug" ] && [ "$slug" != "[program]" ]; then
    echo "MISSING: /programs/$slug"
  fi
done
```

### Step 3.4: Verify dynamic route exists
```bash
test -f "app/programs/[program]/page.tsx" && echo "✅ Dynamic route exists" || echo "❌ Dynamic route MISSING"
```

### Step 3.5: Verify dynamic route loads programs correctly
```bash
grep -n "getStaticProgram\|loadProgram\|resolveSlug" app/programs/\[program\]/page.tsx | head -10
```

---

## PHASE 4: VERIFY ALL FIXES

### Step 4.1: No server-only calls in client components
```bash
grep -rn "resolveSiteImagePath(" components/**/*.tsx 2>/dev/null | grep -v "// \|\/\* " | head -5
```
Should return: (empty or comments only)

### Step 4.2: HeroPicture uses src prop directly
```bash
grep -A1 "const imageSrcDesktop" components/marketing/HeroPicture.tsx
```
Should show: const imageSrcDesktop = src;

### Step 4.3: ProgramDetailPage has heroPosterSrc prop
```bash
grep "heroPosterSrc?" components/programs/ProgramDetailPage.tsx
```
Should show the interface with heroPosterSrc?: string

### Step 4.4: All program pages pass heroPosterSrc
```bash
grep -l "ProgramMarketingPage\|ProgramDetailPage" app/programs/*/page.tsx 2>/dev/null | while read f; do
  if ! grep -q "heroPosterSrc" "$f"; then
    echo "❌ MISSING heroPosterSrc: $f"
  fi
done
```

---

## PHASE 5: COMMIT AND PUSH

### Step 5.1: Check git status
```bash
git status
```

### Step 5.2: Commit with clear message
```bash
git add -A
git commit -m "fix: [brief description of all fixes]"
```

### Step 5.3: Push
```bash
git push origin main
```

---

## COMMON ERRORS AND FIXES

### Error: "(0, i.existsSync) is not a function"
CAUSE: fs.existsSync called in browser
FIX: Move fs calls to server, pass result as prop

### Error: "BAILOUT_TO_CLIENT_SIDE_RENDERING"
CAUSE: Client component without proper SSR
FIX: Remove unnecessary 'use client' or wrap in Suspense

### Error: "Hydration failed"
CAUSE: Server/client mismatch
FIX: Ensure client components don't use server-only code

### Error: "useSearchParams needs a Suspense boundary"
CAUSE: useSearchParams without Suspense
FIX: Wrap component using useSearchParams in <Suspense fallback={...}>

---

## RULES

1. ALWAYS verify each fix before moving to the next
2. NEVER leave 'use client' on components that don't need it
3. NEVER call server-only functions (fs, path) in client code
4. ALWAYS pass pre-resolved values as props
5. ALWAYS test after fixing (run grep commands)
6. ALWAYS commit with clear messages
7. If unsure, ASK before making changes
```

---

## HOW TO USE THIS PROMPT

1. Copy everything between the triple backticks (```)
2. Paste into a new OpenHands conversation
3. Let it run - it will fix everything systematically
4. It will report each fix as it goes
5. Verify with git status when done

---

## VERIFICATION CHECKLIST (Run after any fix)

```bash
# 1. No resolveSiteImagePath calls in components (except lib)
grep -rn "resolveSiteImagePath(" components/**/*.tsx 2>/dev/null

# 2. No fs/path imports in client components
for f in $(grep -rl "'use client'" --include="*.tsx" components/ 2>/dev/null); do
  grep -q "from 'fs'\|from \"fs\"" "$f" && echo "❌ $f"
done

# 3. HeroPicture uses src directly
grep "imageSrcDesktop = src" components/marketing/HeroPicture.tsx

# 4. ProgramDetailPage passes heroPosterSrc
grep "heroPosterSrc=" app/programs/\[program\]/page.tsx

# 5. Build passes
pnpm build 2>&1 | tail -20
```

---

## KNOWN ISSUES TO FIX

1. ProgramDetailPage had 'use client' but no hooks - FIXED
2. HeroPicture called resolveSiteImagePath - FIXED  
3. Some pages may be missing heroPosterSrc prop - CHECK AND FIX

---

## BROWSER TESTING

After all fixes, test these pages in browser (F12 → Console):
- https://app.elevateforhumanity.org/programs/cna
- https://app.elevateforhumanity.org/programs/hvac-technician
- https://app.elevateforhumanity.org/programs/phlebotomy

Look for: `(0, i.existsSync) is not a function` - should be GONE.
