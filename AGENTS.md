# OpenHands Agent Memory - Elevate LMS

## AUDIT SYSTEM FOR ERRORS

### ⚠️ CRITICAL RULE: Always do LINE-BY-LINE audits when investigating issues

When investigating ANY build failure, memory spike, or system error:

---

### PROMPT TEMPLATE FOR FILES COMPARISON

```
AUDIT LINE BY LINE - Side by side comparison of [FILE_A] and [FILE_B]

1. Use `diff -y` or `paste` to show BOTH files side by side, line by line
2. For EVERY line that differs (EVEN comments), report:
   - Exact line numbers in each file
   - Exact content of both lines  
   - Flag as ⚠️ ISSUE if different
   - Flag as ✅ EXPECTED if intentionally different (e.g., different app names, URLs, paths)
3. Do NOT skip ANY differences - even 1 character matters
4. After showing all differences, provide a FIXED summary table
5. Ask before making any fixes

Example format:
| Line | FILE_A | FILE_B | Status |
|------|--------|--------|--------|
| 40 | comment A | comment B | ⚠️ |
| 41 | ENV X=1 | ENV X=1 | ✅ |

COMMON MISTAKES TO AVOID:
- Don't say "nothing is wrong" without running the comparison
- Don't skip comments - they often indicate bugs
- Don't assume similar = same - verify EVERY character
- When in doubt, run the diff
```

---

### PROMPT TEMPLATE FOR SINGLE FILE AUDIT

```
AUDIT [FILENAME] LINE BY LINE

1. Show all lines with `cat -n`
2. For EVERY line, identify:
   - Line number
   - Exact content
   - Potential issues
3. Check for:
   - Typos in commands
   - Wrong versions (check lockfile vs Dockerfile)
   - Missing dependencies
   - Incorrect paths
   - Environment variable mismatches
   - Port conflicts
4. Report line-by-line in table format
5. Ask before fixing
```

---

### BUILD FAILURE CHECKLIST

When a build fails, run these checks in order:

```bash
# 1. Lockfile version vs pnpm version
grep "lockfileVersion" pnpm-lock.yaml
grep "pnpm@" Dockerfile.*  # Should match lockfile

# 2. Environment variable consistency
grep "ENV" Dockerfile.* | sort

# 3. Dependency installation
grep "pnpm install" Dockerfile.*

# 4. Port conflicts
grep -E "PORT|EXPOSE|8080|3000" Dockerfile.*

# 5. Cache settings
grep -i "cache" Dockerfile.*

# 6. Memory settings
grep "max-old-space-size" Dockerfile.*
```

---

### VERSION MATCHING RULES

| Lockfile | pnpm Version |
|----------|--------------|
| lockfileVersion: '6.0' | pnpm@9.x |
| lockfileVersion: '9.0' | pnpm@10.x |

**NEVER use pnpm@10.x with lockfileVersion '6.0'**

---

### COMMON BUILD ISSUES & ROOT CAUSES

| Issue | Check | Fix |
|-------|-------|-----|
| Memory spike | NODE_OPTIONS vs requirements | Match memory to app size |
| Lockfile error | pnpm version vs lockfileVersion | Match versions |
| Module not found | @ alias in standalone | Inline dependencies |
| Cache miss | Cache invalidation marker | Add RUN echo after FROM |
| Build timeout | Single worker vs parallel | CI=true, single worker |

---

### MEMORY SPIKE ROOT CAUSE CHECKLIST

1. ❌ DISABLE_WEBPACK_FILESYSTEM_CACHE=1 (REMOVE THIS)
2. ❌ pnpm version mismatch with lockfile
3. ❌ NODE_OPTIONS too low for page count
4. ❌ @ alias in standalone not resolved

---

### FILES TO ALWAYS CHECK FOR SYNC

- Dockerfile.northflank-lms
- Dockerfile.northflank-admin
- package.json (workspace structure)
- pnpm-lock.yaml
- apps/admin/server.js
- apps/server.js

---

### REMEMBER

**You are too fast. Slow down and audit line by line.**

Every character matters. A misplaced `#` or wrong version number can cause hours of debugging.

---

### ITERATIVE AUDIT UNTIL FIXED

When an issue is found, do NOT stop. Continue auditing line by line until:

1. ✅ ALL issues are identified
2. ✅ ALL issues are fixed  
3. ✅ System is as expected (matches, consistent, working)

**Process:**
```
FIND ISSUE → FIX IT → AUDIT AGAIN → VERIFY FIXED → CHECK FOR MORE ISSUES → REPEAT
```

**Never assume "nothing else is wrong" without re-auditing after each fix.**
