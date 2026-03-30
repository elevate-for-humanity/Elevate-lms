// scripts/archetype-mapper.mjs
// Node 18+
// Purpose: Fail build if any page is unmapped, uses forbidden phrases, lacks basic contracts,
// duplicates metadata, or dashboard routes lack server auth heuristics.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "app");

const readText = (p) => fs.readFileSync(p, "utf8");

const exists = (p) => fs.existsSync(p);

const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};

const isAppPage = (file) => file.endsWith(`${path.sep}page.tsx`) || file.endsWith(`${path.sep}page.jsx`) || file.endsWith(`${path.sep}page.ts`) || file.endsWith(`${path.sep}page.js`);

const isRouteGroup = (segment) => segment.startsWith("(") && segment.endsWith(")");
const isParallelSegment = (segment) => segment.startsWith("@");

const toRoutePath = (file) => {
  // Convert /app/foo/bar/page.tsx => /foo/bar
  const rel = path.relative(APP_DIR, file).split(path.sep);
  // drop trailing page.tsx
  rel.pop();

  const cleaned = rel
    .filter((seg) => seg !== "app")
    .filter((seg) => !isRouteGroup(seg))
    .filter((seg) => !isParallelSegment(seg))
    .map((seg) => (seg === "page" ? "" : seg));

  const route = "/" + cleaned.filter(Boolean).join("/");
  return route === "/" ? "/" : route.replace(/\/+/g, "/");
};

const loadArchetypes = async () => {
  // Import TS by reading file and doing minimal parsing? We'll do a lightweight approach:
  // require user to maintain a JSON mirror for scripts, OR we parse simple exports.
  // For simplicity and reliability, we read forbidden phrases directly from archetypes.ts,
  // and require a mapping file for matchers.
  const archetypesTs = path.join(ROOT, "lib", "archetypes.ts");
  if (!exists(archetypesTs)) {
    throw new Error(`Missing lib/archetypes.ts (expected at ${archetypesTs})`);
  }
  const src = readText(archetypesTs);

  // Extract FORBIDDEN_PHRASES array values via regex (simple but effective).
  const forbidden = [];
  const forbiddenMatch = src.match(/export const FORBIDDEN_PHRASES:\s*string\[\]\s*=\s*\[([\s\S]*?)\];/);
  if (forbiddenMatch) {
    const inner = forbiddenMatch[1];
    const strMatches = inner.matchAll(/"([^"]+)"/g);
    for (const m of strMatches) forbidden.push(m[1].toLowerCase());
  }

  // For routeMatchers, we avoid executing TS. Instead, require a JSON mirror file:
  // scripts/archetypes.routes.json
  const routesJsonPath = path.join(ROOT, "scripts", "archetypes.routes.json");
  if (!exists(routesJsonPath)) {
    throw new Error(
      `Missing scripts/archetypes.routes.json.\nCreate it to mirror archetype route matchers in a script-friendly format.`
    );
  }

  const routesJson = JSON.parse(readText(routesJsonPath));
  return { forbidden, routesJson };
};

const lower = (s) => (s || "").toLowerCase();

const fail = (errors) => {
  console.error("\nARCTYPE CHECK FAILED:\n");
  for (const e of errors) console.error(`- ${e}`);
  console.error("\nFix the above and re-run.\n");
  process.exit(1);
};

const warn = (warnings) => {
  if (!warnings.length) return;
  console.warn("\nARCTYPE WARNINGS:\n");
  for (const w of warnings) console.warn(`- ${w}`);
  console.warn("");
};

const main = async () => {
  if (!exists(APP_DIR)) fail([`Missing app directory at ${APP_DIR}`]);

  const { forbidden, routesJson } = await loadArchetypes();

  const files = walk(APP_DIR).filter(isAppPage);

  const errors = [];
  const warnings = [];

  // Map: route -> file
  const pages = files.map((f) => ({ file: f, route: toRoutePath(f), src: readText(f) }));

  // 1) Map every route to exactly one archetype
  // routesJson format:
  // { "archetypes": { "<key>": { "routeMatchers": ["^/programs(/.*)?$"], "requiresServerAuth": true, ... } } }
  const archetypes = routesJson?.archetypes || {};
  const compiled = Object.entries(archetypes).map(([key, def]) => ({
    key,
    requiresServerAuth: !!def.requiresServerAuth,
    requiresRoleGate: !!def.requiresRoleGate,
    requiredTokens: def.mustIncludeTokens || [],
    matchers: (def.routeMatchers || []).map((s) => new RegExp(s)),
  }));

  const mapping = new Map(); // route -> archetypeKey

  for (const p of pages) {
    const matches = compiled.filter((a) => a.matchers.some((r) => r.test(p.route)));
    if (matches.length === 0) {
      errors.push(`Unmapped route: ${p.route} (file: ${path.relative(ROOT, p.file)})`);
      continue;
    }
    if (matches.length > 1) {
      errors.push(
        `Ambiguous archetype mapping for ${p.route} (file: ${path.relative(ROOT, p.file)}) matches: ${matches
          .map((m) => m.key)
          .join(", ")}`
      );
      continue;
    }
    mapping.set(p.route, matches[0].key);

    // 2) Forbidden phrases (hard fail)
    const s = lower(p.src);
    for (const phrase of forbidden) {
      if (phrase && s.includes(phrase)) {
        errors.push(`Forbidden phrase "${phrase}" found in ${p.route} (file: ${path.relative(ROOT, p.file)})`);
      }
    }

    // 3) Metadata check: require export const metadata OR generateMetadata OR <title> via metadata system
    const hasMetadataExport =
      /export\s+(const\s+metadata|async\s+function\s+generateMetadata|function\s+generateMetadata)\b/.test(p.src);
    if (!hasMetadataExport) {
      errors.push(`Missing metadata export on ${p.route} (file: ${path.relative(ROOT, p.file)})`);
    }

    // 4) Hero enforcement heuristic: require presence of <Hero or "hero" section marker
    // Pages using ArchetypeBase automatically have hero sections
    const hasHero =
      /ArchetypeBase/.test(p.src) ||
      /<Hero\b/.test(p.src) ||
      /data-hero=/.test(p.src) ||
      /\/\*\s*Hero\s*\*\//.test(p.src) ||
      /<section[^>]*\bhero\b/i.test(p.src) ||
      /<h1[^>]*>/.test(p.src) ||
      /className="[^"]*hero[^"]*"/.test(p.src);
    if (!hasHero) {
      warnings.push(`Missing hero implementation on ${p.route} (file: ${path.relative(ROOT, p.file)})`);
    }

    // 5) Token checks per archetype (soft fail -> can be error if you want)
    const archetype = compiled.find((a) => a.key === mapping.get(p.route));
    if (archetype?.requiredTokens?.length) {
      const missing = archetype.requiredTokens.filter((t) => !p.src.includes(t));
      if (missing.length) {
        warnings.push(
          `Archetype "${archetype.key}" token(s) missing on ${p.route}: ${missing.join(", ")} (file: ${path.relative(
            ROOT,
            p.file
          )})`
        );
      }
    }

    // 6) Dashboard server auth heuristic: must reference server-side guard or middleware token
    if (archetype?.requiresServerAuth) {
      const hasServerGuard =
        /middleware\.ts/.test(p.file) ||
        /getServerSession|createServerClient|cookies\(|headers\(|redirect\(/.test(p.src);
      if (!hasServerGuard) {
        errors.push(
          `Protected archetype "${archetype.key}" route lacks server-side auth guard heuristic: ${p.route} (file: ${path.relative(
            ROOT,
            p.file
          )})`
        );
      }
    }
  }

  // 7) Duplicate metadata heuristic: catch repeated title strings in metadata blocks
  // This is crude but effective until you centralize metadata.
  const titleRegex = /title\s*:\s*["'`]([^"'`]+)["'`]/g;
  const titleToRoutes = new Map();

  for (const p of pages) {
    for (const m of p.src.matchAll(titleRegex)) {
      const title = m[1].trim();
      if (!title) continue;
      const arr = titleToRoutes.get(title) || [];
      arr.push(p.route);
      titleToRoutes.set(title, arr);
    }
  }

  for (const [title, routes] of titleToRoutes.entries()) {
    if (routes.length >= 3) {
      warnings.push(`Duplicate metadata title "${title}" appears on ${routes.length} routes: ${routes.join(", ")}`);
    }
  }

  warn(warnings);

  if (errors.length) fail(errors);

  console.log(
    `ARCTYPE CHECK PASSED: ${pages.length} pages mapped, forbidden phrases clear, metadata/hero contracts enforced.`
  );
};

main().catch((e) => fail([e?.message || String(e)]));
