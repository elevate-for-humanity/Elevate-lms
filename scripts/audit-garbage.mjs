// scripts/audit-garbage.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || ".";
const exts = new Set([".ts", ".tsx"]);
const scanDirs = ["app", "components", "lib"];

const checks = [
  {
    name: "Empty href/src/action props",
    regex: /\b(href|src|action|formAction)=\{\}/g,
  },
  {
    name: "Empty event handlers",
    regex: /\bon[A-Z][A-Za-z0-9]*=\{\}/g,
  },
  {
    name: "Empty common props",
    regex: /\b(className|style|id|value|defaultValue|role)=\{\}/g,
  },
  {
    name: "Placeholder comments/strings",
    regex: /\b(TODO|FIXME|TBD|HACK|REVISIT|BROKEN|placeholder|coming soon|temporary fix)\b/g,
  },
  {
    name: "Debug leftovers",
    regex: /\b(console\.(log|debug|warn|error)\(|debugger;)/g,
  },
  {
    name: "Undefined/null route targets",
    regex: /\bhref=\{[^}]*\b(undefined|null)\b[^}]*\}/g,
  },
  {
    name: "Broken Link tag",
    regex: /<Link[^>]*href=\{\}/g,
  },
  {
    name: "Broken Image tag",
    regex: /<Image[^>]*src=\{\}/g,
  },
  {
    name: "Likely dead constant conditions",
    regex: /\bif\s*\(\s*(true|false)\s*\)|(&&\s*false)|(\|\|\s*true)/g,
  },
];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git"
      ) continue;
      out.push(...walk(full));
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function lineCol(text, index) {
  const upTo = text.slice(0, index);
  const lines = upTo.split("\n");
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

const files = scanDirs.flatMap(d => walk(path.join(ROOT, d)));
let total = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");

  for (const check of checks) {
    for (const match of text.matchAll(check.regex)) {
      total++;
      const { line, col } = lineCol(text, match.index);
      const snippet = text
        .slice(match.index, match.index + 160)
        .split("\n")[0]
        .trim();
      console.log(`[${check.name}] ${file}:${line}:${col}`);
      console.log(`  ${snippet}`);
    }
  }
}

console.log(`\nTotal findings: ${total}`);
if (total > 0) process.exitCode = 1;
