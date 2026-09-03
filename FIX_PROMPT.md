# Elevate LMS - Systematic Fix Prompt

Use this prompt to systematically audit and fix issues.

---

## THE PROMPT

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

- Static pages at `app/programs/[slug]/page.tsx` that duplicate the dynamic `[program]` route
- Pages that exist in navigation/sitemap but not in `app/`
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

- Document the exact file and line number
- Explain the root cause
- Provide the fix
- Verify the fix works
- Commit with clear message

---

## VERIFICATION

After ANY fix:

```bash
grep -n "resolveSiteImagePath\|resolveHeroPosterSrc\|from 'fs'" components/**/*.tsx
```

Verify NO client components call server-only functions

Navigate to affected pages and check browser console for errors

Test the specific error from the browser console

---

## OUTPUT FORMAT

For each fix:

```
FILE: [path]
ISSUE: [description]
LINE: [line numbers]
ROOT CAUSE: [why it's broken]
FIX: [what to do]
VERIFY: [how to confirm it's fixed]
```

---

## EXAMPLE ERRORS TO LOOK FOR

### Error: "(0, i.existsSync) is not a function"

- **Cause**: `fs.existsSync` called in client-side code
- **Fix**: Pre-resolve paths in server component, pass as prop

### Error: "Cannot read properties of undefined"

- **Cause**: Client component trying to access server-only data
- **Fix**: Pass data as props from server component

### Error: "useSearchParams needs a Suspense boundary"

- **Cause**: Using useSearchParams without wrapping in Suspense
- **Fix**: Wrap component or the usage in `<Suspense>`

### Error: "(0, r.shouldHideMarketingHeader) is not a function"

- **Cause**: Function exported but not defined, or circular dependency
- **Fix**: Verify function is properly defined and exported, check barrel files

---

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

---

## QUICK FIX COMMANDS

### Remove 'use client' if unnecessary

```bash
# First line is 'use client', remove it
sed -i '1d' components/path/ComponentName.tsx
# Then manually clean up empty line at top
```

### Add heroPosterSrc prop passing

In server page:

```tsx
import { resolveHeroPosterSrc } from '@/lib/images/hero-banner-media';

// Before render:
const heroPosterSrc = resolveHeroPosterSrc(slug, { banner, heroImage });

// In component:
<MyClientComponent heroPosterSrc={heroPosterSrc} />
```

In client component:

```tsx
interface Props {
  heroPosterSrc?: string;
  // ... other props
}

export default function MyClientComponent({ heroPosterSrc, ... }: Props) {
  // Use heroPosterSrc directly, NOT call resolveHeroPosterSrc()
}
```

---

## TESTING

After any fix:

```bash
grep -rn "resolveSiteImagePath\|existsSync" components/**/*.tsx | grep -v "// \|/\*"
```

Check browser console on affected pages

Verify page renders without errors

---

## CURRENT KNOWN ISSUES

### VersionGuard getAppVersion Import Error (July 8, 2026)

**Error**: `getAppVersion is not a function` or similar import error

**Root Cause**: `components/VersionGuard.tsx` imports `getAppVersion` from `@/lib/version-check` but this function is NOT exported from that module - it exists in `@/lib/version/getAppVersion.ts`. Additionally, `checkVersionMismatch()` takes 0 parameters but is called with 2.

**Affected File**: `components/VersionGuard.tsx`

**Line 3**: `import { checkVersionMismatch, getAppVersion } from '@/lib/version-check';`

**Fix Options**:

**Option 1 - Fix imports (Recommended)**:
```tsx
// Line 3 - Change TO:
import { checkVersionMismatch } from '@/lib/version-check';
import { getAppVersion } from '@/lib/version/getAppVersion';

// Lines 11-12 - Change TO:
const version = getAppVersion();
checkVersionMismatch();
```

**Option 2 - Use APP_VERSION from version-check**:
```tsx
// Line 3 - Change TO:
import { checkVersionMismatch, APP_VERSION } from '@/lib/version-check';

// Lines 11-12 - Change TO:
const version = APP_VERSION;
checkVersionMismatch();
```

---

### shouldHideMarketingHeader Runtime Error

**Error**: `(0, r.shouldHideMarketingHeader) is not a function`

**Root Cause**: Function was imported in `components/layout/MarketingChromeGuard.tsx` but never exported from `lib/layout/app-routes.ts`

**Fix**: Add the function to `lib/layout/app-routes.ts`:

```ts
export function shouldHideMarketingHeader(pathname: string): boolean {
  const customHeaderPrefixes = [
    '/contact',
    '/about',
    '/blog',
    '/faq',
    '/privacy',
    '/terms',
    '/accessibility',
    '/support',
    '/careers',
  ] as const;

  return customHeaderPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  );
}
```

---

### dynamic-imports.tsx ssr:false Error

**Error**: `ssr: false is not allowed with next/dynamic in Server Components`

**Fix**: Add `'use client'` directive at the top of `lib/dynamic-imports.tsx`

---

## WORKFLOWS

### Deploy LMS Workflow

- File: `.github/workflows/deploy-lms.yml`
- Service: Northflank `elevate-lms`
- Triggers: Push to main with paths affecting `app/`, `components/`, `lib/`, etc.

### Deploy Marketing Workflow

- File: `.github/workflows/deploy-marketing.yml`
- Service: Northflank `elevate-lms-build` (marketing)
- Triggers: Push to main with same paths
- Note: Waits for LMS deploy to complete first

### Build Checkpoints

| Service | Workflow | Northflank Service |
|---------|----------|-------------------|
| LMS | deploy-lms.yml | elevate-lms |
| Marketing (www) | deploy-marketing.yml | elevate-lms-build |
| Admin | deploy-admin.yml | elevate-admin |
