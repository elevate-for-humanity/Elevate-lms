#!/usr/bin/env node

/**
 * Inventory privileged write paths touching:
 * - lesson_progress
 * - checkpoint_scores
 * - program_completion_certificates
 *
 * What it does:
 * - walks the repo
 * - finds files containing createAdminClient / service_role / target table names
 * - extracts nearby function context
 * - classifies operations: insert/update/upsert/select/delete/rpc
 * - flags likely actor type
 * - flags likely trigger/audit protection based on known table behavior
 * - emits:
 *   1) human-readable markdown report
 *   2) machine-readable JSON
 *
 * Usage:
 *   node scripts/inventory-privileged-write-paths.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const TARGET_TABLES = [
  "lesson_progress",
  "checkpoint_scores",
  "program_completion_certificates",
];

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".vercel",
  ".netlify",
  "tmp",
  "temp",
]);

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".sql",
  ".md",
  ".json",
]);

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walk(full, out);
      }
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.has(ext)) out.push(full);
  }

  return out;
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function lineNumberFromIndex(text, index) {
  return text.slice(0, index).split("\n").length;
}

function getLine(text, n) {
  const lines = text.split("\n");
  return lines[n - 1] || "";
}

function getContext(text, lineNo, radius = 8) {
  const lines = text.split("\n");
  const start = Math.max(1, lineNo - radius);
  const end = Math.min(lines.length, lineNo + radius);
  const chunk = [];
  for (let i = start; i <= end; i++) {
    chunk.push(`${String(i).padStart(4, " ")} | ${lines[i - 1]}`);
  }
  return chunk.join("\n");
}

function uniq(arr) {
  return [...new Set(arr)];
}

function inferFunctionName(text, lineNo) {
  const lines = text.split("\n");
  const start = Math.max(0, lineNo - 40);
  const end = Math.min(lines.length - 1, lineNo + 5);

  const patterns = [
    /export\s+async\s+function\s+([A-Za-z0-9_]+)/,
    /async\s+function\s+([A-Za-z0-9_]+)/,
    /export\s+function\s+([A-Za-z0-9_]+)/,
    /function\s+([A-Za-z0-9_]+)/,
    /const\s+([A-Za-z0-9_]+)\s*=\s*async\s*\(/,
    /const\s+([A-Za-z0-9_]+)\s*=\s*\(/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*async\s*\(/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\(/,
  ];

  for (let i = lineNo - 1; i >= start; i--) {
    const line = lines[i];
    for (const p of patterns) {
      const m = line.match(p);
      if (m) return m[1];
    }
  }

  for (let i = lineNo - 1; i <= end; i++) {
    const line = lines[i];
    for (const p of patterns) {
      const m = line.match(p);
      if (m) return m[1];
    }
  }

  if (relGuessFromRoute(lines, lineNo)) return relGuessFromRoute(lines, lineNo);
  return "unknown";
}

function relGuessFromRoute(lines, lineNo) {
  const start = Math.max(0, lineNo - 80);
  const end = Math.min(lines.length - 1, lineNo + 10);
  for (let i = start; i <= end; i++) {
    const line = lines[i];
    const m = line.match(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/);
    if (m) return m[1];
  }
  return null;
}

function detectOperations(context) {
  const ops = [];
  if (/\.insert\s*\(/s.test(context)) ops.push("insert");
  if (/\.update\s*\(/s.test(context)) ops.push("update");
  if (/\.upsert\s*\(/s.test(context)) ops.push("upsert");
  if (/\.select\s*\(/s.test(context)) ops.push("select");
  if (/\.delete\s*\(/s.test(context)) ops.push("delete");
  if (/\.rpc\s*\(/s.test(context)) ops.push("rpc");
  return uniq(ops);
}

function detectActorType(fullText, context) {
  if (/createAdminClient\s*\(/.test(context) || /createAdminClient\s*\(/.test(fullText)) {
    return "service_role/admin_client";
  }
  if (/service_role/i.test(context) || /service_role/i.test(fullText)) {
    return "service_role";
  }
  if (/is_super_admin|super_admin|requireAdmin|requireRole|admin/i.test(context)) {
    return "super_admin_or_admin_jwt";
  }
  return "unknown_or_learner";
}

function detectTriggerProtection(table) {
  switch (table) {
    case "lesson_progress":
      return "yes: checkpoint gate trigger; yes: admin override audit trigger";
    case "checkpoint_scores":
      return "yes: checkpoint/audit trigger(s)";
    case "program_completion_certificates":
      return "yes: certificate audit trigger";
    default:
      return "unknown";
  }
}

function detectForceRlsRisk(actorType, operations) {
  if (actorType.includes("service_role")) {
    return "HIGH";
  }
  if (operations.includes("insert") || operations.includes("update") || operations.includes("upsert")) {
    return "MEDIUM";
  }
  return "LOW";
}

function classifyFinding({ fullText, context, table, operations, actorType }) {
  const writes = operations.some((op) => ["insert", "update", "upsert", "delete", "rpc"].includes(op));
  const readsOnly = operations.length > 0 && !writes;

  let likelyBreakage = "unknown";
  if (actorType.includes("service_role") && writes) {
    likelyBreakage = "likely if no explicit policy/RPC replacement exists";
  } else if (readsOnly) {
    likelyBreakage = "unlikely";
  } else if (writes) {
    likelyBreakage = "possible";
  } else {
    likelyBreakage = "unknown";
  }

  let notes = [];
  if (/createAdminClient\s*\(/.test(context) || /createAdminClient\s*\(/.test(fullText)) {
    notes.push("uses createAdminClient()");
  }
  if (/auth\.uid\(\)/.test(context)) {
    notes.push("auth.uid() appears in local context");
  }
  if (/checkpointGateResponse|isCheckpointGateError|CheckpointGateError|23514/.test(context + fullText)) {
    notes.push("gate error normalization present nearby");
  }
  if (/audit/i.test(context)) {
    notes.push("audit-related code nearby");
  }

  return {
    writes,
    readsOnly,
    likelyBreakage,
    notes: notes.join("; ") || "",
    triggerProtection: detectTriggerProtection(table),
    forceRlsRisk: detectForceRlsRisk(actorType, operations),
  };
}

function findTableRefs(fullText, file) {
  const findings = [];

  for (const table of TARGET_TABLES) {
    const re = new RegExp(
      String.raw`(?:from\s*\(\s*['"\`]${table}['"\`]\s*\)|\b${table}\b)`,
      "g"
    );

    let m;
    while ((m = re.exec(fullText)) !== null) {
      const idx = m.index;
      const lineNo = lineNumberFromIndex(fullText, idx);
      const context = getContext(fullText, lineNo, 10);
      const operations = detectOperations(context);
      const actorType = detectActorType(fullText, context);
      const fn = inferFunctionName(fullText, lineNo);
      const classification = classifyFinding({
        fullText,
        context,
        table,
        operations,
        actorType,
      });

      findings.push({
        file: rel(file),
        line: lineNo,
        function: fn,
        table,
        operations,
        actorType,
        triggerProtection: classification.triggerProtection,
        forceRlsRisk: classification.forceRlsRisk,
        likelyBreakageIfForcedRls: classification.likelyBreakage,
        writes: classification.writes,
        readsOnly: classification.readsOnly,
        notes: classification.notes,
        snippet: context,
      });
    }
  }

  return findings;
}

function scoreFinding(f) {
  let score = 0;
  if (f.writes) score += 10;
  if (f.actorType.includes("service_role")) score += 10;
  if (f.operations.includes("upsert")) score += 4;
  if (f.operations.includes("insert")) score += 3;
  if (f.operations.includes("update")) score += 3;
  if (f.file.includes("/api/")) score += 2;
  if (f.file.includes("route.ts")) score += 2;
  return score;
}

function dedupeFindings(findings) {
  const seen = new Set();
  const out = [];

  for (const f of findings.sort((a, b) => scoreFinding(b) - scoreFinding(a))) {
    const key = [
      f.file,
      f.function,
      f.table,
      f.operations.join(","),
      f.actorType,
      f.writes,
    ].join("|");

    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }

  return out;
}

function summarize(findings) {
  const byTable = {};
  const byFile = {};

  for (const f of findings) {
    byTable[f.table] ||= [];
    byTable[f.table].push(f);

    byFile[f.file] ||= [];
    byFile[f.file].push(f);
  }

  return { byTable, byFile };
}

function toMarkdown(findings) {
  const { byTable } = summarize(findings);

  const lines = [];
  lines.push("# Privileged Write Path Inventory");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const table of TARGET_TABLES) {
    const rows = (byTable[table] || []).sort((a, b) => scoreFinding(b) - scoreFinding(a));

    lines.push(`## ${table}`);
    lines.push("");

    if (!rows.length) {
      lines.push("_No references found._");
      lines.push("");
      continue;
    }

    lines.push("| File | Function/Route | Line | Operations | Actor Type | Trigger/Audit Protection | FORCE RLS Risk | Likely Breakage if Forced | Notes |");
    lines.push("|---|---|---:|---|---|---|---|---|---|");

    for (const r of rows) {
      lines.push(
        `| \`${r.file}\` | \`${r.function}\` | ${r.line} | ${r.operations.join(", ") || "unknown"} | ${r.actorType} | ${r.triggerProtection} | ${r.forceRlsRisk} | ${r.likelyBreakageIfForcedRls} | ${escapePipes(r.notes)} |`
      );
    }

    lines.push("");
    lines.push("### Evidence snippets");
    lines.push("");

    rows.slice(0, 20).forEach((r, i) => {
      lines.push(`#### ${i + 1}. \`${r.file}\` — \`${r.function}\` — line ${r.line}`);
      lines.push("");
      lines.push("```text");
      lines.push(r.snippet);
      lines.push("```");
      lines.push("");
    });
  }

  return lines.join("\n");
}

function escapePipes(s) {
  return String(s || "").replace(/\|/g, "\\|");
}

function main() {
  const files = walk(ROOT);
  const findings = [];

  for (const file of files) {
    const text = readText(file);
    if (!text) continue;

    const shouldInspect =
      /createAdminClient\s*\(/.test(text) ||
      /service_role/i.test(text) ||
      TARGET_TABLES.some((t) => text.includes(t));

    if (!shouldInspect) continue;

    findings.push(...findTableRefs(text, file));
  }

  const deduped = dedupeFindings(findings);

  const outputDir = path.join(ROOT, "tmp");
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "privileged-write-path-inventory.json");
  const mdPath = path.join(outputDir, "privileged-write-path-inventory.md");

  fs.writeFileSync(jsonPath, JSON.stringify(deduped, null, 2));
  fs.writeFileSync(mdPath, toMarkdown(deduped));

  const writeFindings = deduped.filter((f) => f.writes);
  const serviceRoleWrites = writeFindings.filter((f) => f.actorType.includes("service_role"));

  console.log("");
  console.log("Inventory complete.");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Findings: ${deduped.length}`);
  console.log(`Write findings: ${writeFindings.length}`);
  console.log(`Service-role/admin-client write findings: ${serviceRoleWrites.length}`);
  console.log("");
  console.log(`Markdown report: ${rel(mdPath)}`);
  console.log(`JSON report: ${rel(jsonPath)}`);
  console.log("");

  if (serviceRoleWrites.length > 0) {
    console.log("VERDICT: DO NOT FORCE RLS YET — service-role/admin-client write paths still exist.");
    process.exitCode = 2;
  } else if (writeFindings.length > 0) {
    console.log("VERDICT: REVIEW REQUIRED — write paths exist, but none clearly service-role.");
    process.exitCode = 1;
  } else {
    console.log("VERDICT: NO OBVIOUS PRIVILEGED WRITE PATHS FOUND.");
    process.exitCode = 0;
  }
}

main();
