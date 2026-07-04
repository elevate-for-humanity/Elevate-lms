# Elevate LMS - Systematic Fix Prompt

Use this prompt to systematically audit and fix issues.

## THE PROMPT

```
Do a complete line-by-line audit of the Elevate LMS codebase focusing on these three areas:

### 1. SERVER-ONLY CODE IN CLIENT COMPONENTS
Search for ALL files importing 'fs' or 'path' and verify they are NOT in client components.
Run this command and check EVERY result:
```bash
grep -rn "from 'fs'\|from \"fs\"\|from 'path'\|from \"path\"\|existsSync\|process.cwd" --include="*.tsx" components/
```
If a client component (has 'use client' directive) imports any of these, FIX IT:
- Move the server-only code to a Server Component parent
- Pass the resolved value as a prop to the Client Component
- NEVER call fs/path functions in client-side code

### 2. UNNECESSARY 'use client' DIRECTIVES
For EVERY component with 'use client', verify it NEEDS it:
- Does it use useState, useEffect, useCallback, useRef, useTransition, useOptimistic?
- Does it have event handlers (onClick, onChange, onSubmit)?
- Does it use dynamic imports with ssr:false?
- Does it use browser-only APIs (window, document, localStorage)?

If NO to all above, REMOVE 'use client' - it causes unnecessary client-side rendering and hydration issues.

### 3. DUPLICATE ROUTES AND MISSING PAGES
Check for:
- Static pages at app/programs/[slug]/page.tsx that duplicate the dynamic [program] route
- Pages that exist in navigation/sitemap but not in app/
- Pages with stubs/placeholder content instead of real content

Check canonical routes:
```bash
cat lib/routes/canonical-routes.json
```

Compare to actual pages:
```bash
find app/programs -name "page.tsx" | sort
```

For EACH issue found:
1. Document the exact file and line number
2. Explain the root cause
3. Provide the fix
4. Verify the fix works
5. Commit with clear message

### VERIFICATION
After ANY fix:
1. Run: `grep -n "resolveSiteImagePath\|resolveHeroPosterSrc\|from 'fs'" components/**/*.tsx`
2. Verify NO client components call server-only functions
3. Navigate to affected pages and check browser console for errors
4. Test the specific error from the browser console

### OUTPUT FORMAT
For each fix:
```
FILE: [path]
ISSUE: [description]
LINE: [line numbers]
ROOT CAUSE: [why it's broken]
FIX: [what to do]
VERIFY: [how to confirm it's fixed]
```
```

## EXAMPLE ERRORS TO LOOK FOR

### Error: "(0, i.existsSync) is not a function"
- Cause: `fs.existsSync` called in client-side code
- Fix: Pre-resolve paths in server component, pass as prop

### Error: "Cannot read properties of undefined"
- Cause: Client component trying to access server-only data
- Fix: Pass data as props from server component

### Error: "useSearchParams needs a Suspense boundary"
- Cause: Using useSearchParams without wrapping in Suspense
- Fix: Wrap component or the usage in <Suspense>

## AUDIT CHECKLIST

### Step 1: Find all 'use client' components
```bash
grep -rl "'use client'" --include="*.tsx" components/ | head -50
```

### Step 2: Check each for server-only imports
```bash
for f in $(grep -rl "'use client'" --include="*.tsx" components/); do
  for imp in "from 'fs'" "from \"fs\"" "from 'path'" "from \"path\""; do
    if grep -q "$imp" "$f"; then
      echo "❌ SERVER-ONLY IN CLIENT: $f"
    fi
  done
done
```

### Step 3: Check for unnecessary 'use client'
```bash
for f in $(grep -rl "'use client'" --include="*.tsx" components/); do
  if ! grep -q "useState\|useEffect\|useCallback\|useRef\|onClick\|onChange\|ssr:false" "$f"; then
    echo "⚠️ UNNECESSARY 'use client': $f"
  fi
done
```

### Step 4: Check for duplicate routes
```bash
echo "=== Static program pages ===" && ls app/programs/*/page.tsx 2>/dev/null
echo "=== Dynamic route ===" && ls app/programs/\[program\]/page.tsx 2>/dev/null
```

### Step 5: Check browser console for errors
Navigate to affected pages and look for:
- TypeError messages
- ReferenceError messages
- Hydration mismatch warnings

## QUICK FIX COMMANDS

### Remove 'use client' if unnecessary
```bash
sed -i '1d' components/path/ComponentName.tsx  # Removes first line
# Then manually clean up empty line at top
```

### Add heroPosterSrc prop passing
In server page:
```typescript
import { resolveHeroPosterSrc } from '@/lib/images/hero-banner-media';

// Before render:
const heroPosterSrc = resolveHeroPosterSrc(slug, { banner, heroImage });

// In component:
<MyClientComponent heroPosterSrc={heroPosterSrc} />
```

In client component:
```typescript
interface Props {
  heroPosterSrc?: string;
  // ... other props
}

export default function MyClientComponent({ heroPosterSrc, ... }: Props) {
  // Use heroPosterSrc directly, NOT call resolveHeroPosterSrc()
}
```

## HOW TO SEE BROWSER ERRORS

1. Navigate to the problematic page in Chrome/Firefox
2. Press F12 to open Developer Tools
3. Click on the "Console" tab
4. Refresh the page
5. Look for red error messages like:
   - `TypeError: (0, i.existsSync) is not a function`
   - `TypeError: Cannot read properties of undefined`
   - `Error: Hydration failed`

The error stack trace shows which file/chunk is causing the issue.

## TESTING

After any fix:
1. `grep -rn "resolveSiteImagePath\|existsSync" components/**/*.tsx | grep -v "// \|/\*"`
2. Check browser console on affected pages
3. Verify page renders without errors

## TO RUN THE FIX

Copy the prompt above and paste it into a new OpenHands conversation.
