// scripts/ci-admin-route-audit.mjs
// Targeted audit for app/admin, app/api/admin, components/admin, lib/admin.
// Errors block CI. Warnings are reported only.
import fs from "node:fs";
import path from "node:path";

// ── createAdminClient() cold-start guard ─────────────────────────────────────
// Two rules enforced:
//
// Rule 1 — app/ (banned entirely):
//   createAdminClient() throws on cold starts before env hydration.
//   All app/ code must use getAdminClient() instead.
//
// Rule 2 — lib/auth/, lib/api/, lib/middleware/ (require SAFE: annotation):
//   These lib/ dirs are directly called from request handlers. Any
//   createAdminClient() call there must have a preceding line comment:
//     // SAFE: <reason why hydration is guaranteed>
//   Without it, the call is presumed unsafe and blocks CI.
//
// Remaining lib/ call sites outside these dirs are not checked here.
// They carry accepted risk documented in the migration notes.
// ─────────────────────────────────────────────────────────────────────────────
{
  const _ROOT = process.cwd();
  const APP_DIR = path.join(_ROOT, "app");
  const REQUEST_TIME_LIB_DIRS = ["lib/auth", "lib/api", "lib/middleware"]
    .map((d) => path.join(_ROOT, d))
    .filter((d) => fs.existsSync(d));
  const _EXTS = new Set([".ts", ".tsx"]);
  const _IGNORE = new Set(["node_modules", ".git", ".next", "dist", "build"]);

  function walkGuard(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (_IGNORE.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walkGuard(full));
      else if (_EXTS.has(path.extname(entry.name))) out.push(full);
    }
    return out;
  }

  function findViolations(file, requireSafeAnnotation) {
    const text = fs.readFileSync(file, "utf8");
    const lines = text.split("\n");
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trimStart();
      if (stripped.startsWith("import ") || stripped.startsWith("//") || stripped.startsWith("*")) continue;
      if (!line.includes("createAdminClient()")) continue;
      if (requireSafeAnnotation) {
        let prev = i - 1;
        while (prev >= 0 && lines[prev].trim() === "") prev--;
        if (prev < 0 || !lines[prev].includes("SAFE:")) {
          out.push({ lineNum: i + 1, line: line.trim() });
        }
      } else {
        out.push({ lineNum: i + 1, line: line.trim() });
      }
    }
    return out;
  }

  let coldStartViolations = 0;

  // Rule 1: app/ — banned entirely
  for (const file of walkGuard(APP_DIR)) {
    for (const v of findViolations(file, false)) {
      const rel = path.relative(_ROOT, file);
      console.log(`ERROR [createAdminClient() in app/] ${rel}:${v.lineNum}`);
      console.log(`  ${v.line}`);
      console.log(`  → Replace with: const db = await getAdminClient()`);
      coldStartViolations++;
    }
  }

  // Rule 2: request-time lib/ dirs — require SAFE: annotation
  for (const libDir of REQUEST_TIME_LIB_DIRS) {
    for (const file of walkGuard(libDir)) {
      for (const v of findViolations(file, true)) {
        const rel = path.relative(_ROOT, file);
        const dirLabel = path.relative(_ROOT, libDir);
        console.log(`ERROR [createAdminClient() without SAFE: in ${dirLabel}/] ${rel}:${v.lineNum}`);
        console.log(`  ${v.line}`);
        console.log(`  → Add '// SAFE: <reason>' above, or replace with getAdminClient()`);
        coldStartViolations++;
      }
    }
  }

  // Rule 3: getAdminClient must not be imported from '@/lib/supabase/server'
  // server.ts does not export getAdminClient — only '@/lib/supabase/admin' does.
  const allFiles = [...walkGuard(APP_DIR), ...walkGuard(path.join(_ROOT, "lib"))];
  for (const file of allFiles) {
    const text = fs.readFileSync(file, "utf8");
    if (text.includes("getAdminClient") && text.includes("from '@/lib/supabase/server'")) {
      const lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("getAdminClient") && lines[i].includes("supabase/server")) {
          const rel = path.relative(_ROOT, file);
          console.log(`ERROR [getAdminClient imported from wrong module] ${rel}:${i + 1}`);
          console.log(`  ${lines[i].trim()}`);
          console.log(`  → Change to: import { getAdminClient } from '@/lib/supabase/admin'`);
          coldStartViolations++;
        }
      }
    }
  }

  if (coldStartViolations > 0) {
    console.log(`\n${coldStartViolations} createAdminClient() violation(s). See above.\n`);
    process.exit(1);
  }
}

const ROOT = process.cwd();
const TARGET_DIRS = [
  "app/admin",
  "app/api/admin",
  "components/admin",
  "lib/admin",
].filter((d) => fs.existsSync(path.join(ROOT, d)));

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".turbo"]);

const checks = [
  {
    name: "Broken Link href",
    severity: "error",
    regex: /<Link[^>]*\bhref=\{\}/g,
  },
  {
    name: "Broken Image src",
    severity: "error",
    regex: /<Image[^>]*\bsrc=\{\}/g,
  },
  {
    name: "Empty JSX prop",
    severity: "error",
    regex: /\b(href|src|action|formAction|className|style|id|value|defaultValue|title|alt|role)=\{\}/g,
  },
  {
    name: "Undefined/null href target",
    severity: "error",
    regex: /\bhref=\{[^}]*\b(undefined|null)\b[^}]*\}/g,
  },
  {
    name: "Router push/replace with nullish target",
    severity: "error",
    regex: /\brouter\.(push|replace)\(\s*(undefined|null)\s*\)/g,
  },
  {
    name: "Unclosed NextResponse.json auth return risk",
    severity: "error",
    regex: /return\s+NextResponse\.json\(\s*\{[^)]*error\s*:\s*['"`][^'"`]+['"`]\s*\}\s*$(?!\s*,\s*\{\s*status\s*:)/gm,
  },

  {
    name: "Admin requireAdmin import mismatch risk",
    severity: "warn",
    regex: /import\s+\{\s*requireAdmin\s*\}\s+from\s+['"]@\/lib\/auth\/require-admin['"]/g,
  },
  {
    name: "Empty map href template risk",
    severity: "warn",
    regex: /\.map\([^)]*=>[\s\S]{0,250}<Link[^>]*\bhref=\{`[^`]*\$\{[^}]+\}[^`]*`\}/g,
  },
  {
    name: "Debug leftover",
    severity: "warn",
    regex: /\b(console\.(log|debug)\(|debugger;)/g,
  },
  {
    name: "Admin TODO/HACK",
    severity: "warn",
    // Note: 'placeholder' excluded — it matches HTML input placeholder= attributes (false positive)
    regex: /\b(TODO|FIXME|TBD|HACK|BROKEN|REVISIT|temporary fix)\b/g,
  },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function lineCol(text, index) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

function snippet(text, index) {
  const start = text.lastIndexOf("\n", index) + 1;
  const endIdx = text.indexOf("\n", index);
  const end = endIdx === -1 ? text.length : endIdx;
  return text.slice(start, end).trim();
}

const files = TARGET_DIRS.flatMap(walk);
let errors = 0;
let warns = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const check of checks) {
    for (const match of text.matchAll(check.regex)) {
      const { line, col } = lineCol(text, match.index);
      const rel = path.relative(ROOT, file);
      const s = snippet(text, match.index);
      const tag = check.severity === "error" ? "ERROR" : "WARN ";
      console.log(`${tag} [${check.name}] ${rel}:${line}:${col}`);
      console.log(`  ${s}`);
      if (check.severity === "error") errors++;
      else warns++;
    }
  }
}

console.log(`\nAdmin audit summary: ${errors} error(s), ${warns} warning(s)`);
if (errors > 0) {
  console.log("\nFix all errors above before pushing.");
  process.exit(1);
}
