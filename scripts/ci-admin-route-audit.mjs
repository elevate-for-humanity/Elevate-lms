// scripts/ci-admin-route-audit.mjs
// Targeted audit for app/admin, app/api/admin, components/admin, lib/admin.
// Errors block CI. Warnings are reported only.
import fs from "node:fs";
import path from "node:path";

// ── createAdminClient() cold-start guard ─────────────────────────────────────
// createAdminClient() is synchronous and throws on cold serverless starts when
// SUPABASE_SERVICE_ROLE_KEY is not yet hydrated. All request-time code in app/
// must use getAdminClient() instead. This check enforces that at CI time.
//
// Allowed locations (not in app/): lib/, scripts/, instrumentation.ts
// ─────────────────────────────────────────────────────────────────────────────
{
  const APP_DIR = path.join(process.cwd(), "app");
  // app/api/ routes are tracked separately — many use withRuntime/withApiAudit wrappers.
  // Scope this guard to server components, layouts, and server actions only.
  const API_DIR = path.join(process.cwd(), "app/api");
  const EXTS = new Set([".ts", ".tsx"]);
  const IGNORE = new Set(["node_modules", ".git", ".next", "dist", "build"]);

  function walkApp(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      // Skip app/api — covered by a separate audit pass
      if (full === API_DIR) continue;
      if (entry.isDirectory()) out.push(...walkApp(full));
      else if (EXTS.has(path.extname(entry.name))) out.push(full);
    }
    return out;
  }

  let coldStartViolations = 0;
  for (const file of walkApp(APP_DIR)) {
    const text = fs.readFileSync(file, "utf8");
    // Match call sites only — not import declarations or comments
    const callRe = /(?<!\/\/.*)\bcreateAdminClient\(\)/g;
    for (const m of text.matchAll(callRe)) {
      // Skip if the match is on an import line
      const lineStart = text.lastIndexOf("\n", m.index) + 1;
      const lineEnd = text.indexOf("\n", m.index);
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
      if (line.trimStart().startsWith("import ")) continue;
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;

      let lineNum = 1;
      for (let i = 0; i < m.index; i++) if (text[i] === "\n") lineNum++;
      const rel = path.relative(process.cwd(), file);
      console.log(`ERROR [createAdminClient() in app/] ${rel}:${lineNum}`);
      console.log(`  ${line.trim()}`);
      console.log(`  → Replace with: const db = await getAdminClient()`);
      coldStartViolations++;
    }
  }

  if (coldStartViolations > 0) {
    console.log(`\n${coldStartViolations} createAdminClient() call(s) found in app/. These cause 500s on cold starts.`);
    console.log("Use getAdminClient() (async, hydrates secrets first) in all request-time code.\n");
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
