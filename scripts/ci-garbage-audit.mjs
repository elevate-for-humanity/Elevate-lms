// scripts/ci-garbage-audit.mjs
// Catches broken JSX props and placeholder garbage before the build runs.
// Errors (empty props, broken routes) exit 1 and block CI.
// Warnings (console.log, TODOs) are reported but do not block.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "pages", "src"].filter((d) =>
  fs.existsSync(path.join(ROOT, d))
);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const checks = [
  {
    name: "Empty href/src/action prop",
    severity: "error",
    regex: /\b(href|src|action|formAction)=\{\}/g,
  },
  {
    name: "Empty event handler",
    severity: "error",
    regex: /\bon[A-Z][A-Za-z0-9]*=\{\}/g,
  },
  {
    name: "Empty core prop",
    severity: "error",
    regex: /\b(className|style|id|value|defaultValue|role|title|alt)=\{\}/g,
  },
  {
    name: "Undefined/null route target",
    severity: "error",
    regex: /\bhref=\{[^}]*\b(undefined|null)\b[^}]*\}/g,
  },
  {
    name: "Broken Link tag",
    severity: "error",
    regex: /<Link[^>]*href=\{\}/g,
  },
  {
    name: "Broken Image tag",
    severity: "error",
    regex: /<Image[^>]*src=\{\}/g,
  },
  {
    name: "Explicit debug statement",
    severity: "warn",
    regex: /\b(console\.(log|debug)\(|debugger;)/g,
  },
  {
    name: "AI/refactor placeholder",
    severity: "warn",
    // 'coming soon' excluded — appears in schema comments and banned-token definitions (false positives)
    regex: /\b(TODO|FIXME|TBD|HACK|BROKEN|REVISIT|temporary fix)\b/g,
  },
  {
    name: "Dead boolean branch",
    severity: "warn",
    regex: /\bif\s*\(\s*(true|false)\s*\)|(&&\s*false)|(\|\|\s*true)/g,
  },
];

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
]);

const IGNORE_FILES = [
  /\.generated\./,
  /database\.generated\./,
  /\.d\.ts$/,
  /lib\/banned-tokens\.ts$/,   // defines the banned token list itself
  /scripts\/ci-garbage-audit/, // the audit script itself
];

function shouldIgnoreFile(file) {
  return IGNORE_FILES.some((r) => r.test(file));
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (EXTENSIONS.has(path.extname(entry.name)) && !shouldIgnoreFile(full)) {
      out.push(full);
    }
  }
  return out;
}

function getLineCol(text, index) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < index; i++) {
    if (text[i] === "\n") { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

function getLineSnippet(text, index) {
  const start = text.lastIndexOf("\n", index) + 1;
  const endPos = text.indexOf("\n", index);
  const end = endPos === -1 ? text.length : endPos;
  return text.slice(start, end).trim();
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
let errorCount = 0;
let warnCount = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const check of checks) {
    for (const match of text.matchAll(check.regex)) {
      const { line, col } = getLineCol(text, match.index);
      const snippet = getLineSnippet(text, match.index);
      const rel = path.relative(ROOT, file);
      const prefix = check.severity === "error" ? "ERROR" : "WARN ";
      console.log(`${prefix} [${check.name}] ${rel}:${line}:${col}`);
      console.log(`  ${snippet}`);
      if (check.severity === "error") errorCount++;
      else warnCount++;
    }
  }
}

console.log(`\nSummary: ${errorCount} error(s), ${warnCount} warning(s)`);
if (errorCount > 0) {
  console.log("\nFix all errors above before pushing.");
  process.exit(1);
}
