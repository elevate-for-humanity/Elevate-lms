// scripts/ci-dashboard-audit.mjs
// Heuristic audit for admin dashboard files.
// Catches broken JSX (errors) and structural smells (warnings).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "app/admin/dashboard",
  "components/admin",
  "components/dashboard",
  "lib/admin",
].filter((p) => fs.existsSync(path.join(ROOT, p)));

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".turbo"]);

const checks = [
  {
    name: "Broken Link href",
    severity: "error",
    regex: /<Link[^>]*\bhref=\{\}/g,
  },
  {
    name: "Undefined/null href target",
    severity: "error",
    regex: /\bhref=\{[^}]*\b(undefined|null)\b[^}]*\}/g,
  },
  {
    name: "Empty JSX prop",
    severity: "error",
    regex: /\b(href|src|className|style|id|value|defaultValue|title|alt|role)=\{\}/g,
  },
  {
    name: "Client dashboard root",
    severity: "warn",
    regex: /^['"]use client['"];?/gm,
    appliesTo: /Dashboard|dashboard/i,
  },
  {
    name: "Direct fetch in dashboard client",
    severity: "warn",
    regex: /\bfetch\s*\(/g,
    appliesTo: /Dashboard|dashboard/i,
  },
  {
    name: "Multiple Supabase queries in one file",
    severity: "warn",
    regex: /\.from\s*\(\s*['"`][^'"`]+['"`]\s*\)/g,
    aggregate: true,
    threshold: 3,
  },
  {
    name: "Multiple awaited fetches in one file",
    severity: "warn",
    regex: /\bawait\s+fetch\s*\(/g,
    aggregate: true,
    threshold: 3,
  },
  {
    name: "Router push in dashboard list/cards",
    severity: "warn",
    regex: /\brouter\.(push|replace)\(/g,
    appliesTo: /Dashboard|dashboard|Card|Table|List/i,
  },
  {
    name: "Console/debug leftovers",
    severity: "warn",
    regex: /\b(console\.(log|debug|warn|error)\(|debugger;)/g,
  },
  {
    name: "TODO/HACK placeholders",
    severity: "warn",
    // 'placeholder' and 'coming soon' excluded — match HTML attributes and schema comments (false positives)
    regex: /\b(TODO|FIXME|TBD|HACK|BROKEN|REVISIT|temporary fix)\b/g,
  },
  {
    name: "Likely duplicated KPI fetch pattern",
    severity: "warn",
    regex: /\b(useEffect|useSWR)\b[\s\S]{0,500}\b(fetch|axios|get[A-Z])/g,
    appliesTo: /Card|Stats|Metric|KPI|Dashboard/i,
  },
  {
    name: "Suspicious map with unstable key",
    severity: "warn",
    regex: /\.map\([^)]*=>[\s\S]{0,200}key=\{(index|i)\}/g,
  },
  {
    name: "Loading spinner with no empty/error state nearby",
    severity: "warn",
    regex: /\b(isLoading|loading)\b[\s\S]{0,250}(Spinner|Loader|animate-spin)/g,
    appliesTo: /Dashboard|dashboard/i,
  },
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
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

const files = TARGETS.flatMap(walk);
let errors = 0;
let warns = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const basename = path.basename(file);

  for (const check of checks) {
    if (check.appliesTo && !check.appliesTo.test(rel) && !check.appliesTo.test(basename)) {
      continue;
    }

    const matches = [...text.matchAll(check.regex)];

    if (check.aggregate) {
      if (matches.length >= check.threshold) {
        const first = matches[0];
        const { line, col } = lineCol(text, first.index);
        const tag = check.severity === "error" ? "ERROR" : "WARN ";
        console.log(`${tag} [${check.name}] ${rel}:${line}:${col}`);
        console.log(`  Count: ${matches.length} (threshold ${check.threshold})`);
        if (check.severity === "error") errors++;
        else warns++;
      }
      continue;
    }

    for (const match of matches) {
      const { line, col } = lineCol(text, match.index);
      const s = snippet(text, match.index);
      const tag = check.severity === "error" ? "ERROR" : "WARN ";
      console.log(`${tag} [${check.name}] ${rel}:${line}:${col}`);
      console.log(`  ${s}`);
      if (check.severity === "error") errors++;
      else warns++;
    }
  }
}

console.log(`\nDashboard audit summary: ${errors} error(s), ${warns} warning(s)`);
if (errors > 0) {
  console.log("\nFix all errors above before pushing.");
  process.exit(1);
}
