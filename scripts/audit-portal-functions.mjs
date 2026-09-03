#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const APPS = { marketing: 'apps/marketing/app', lms: 'apps/lms/app', admin: 'apps/admin/app' };
const PORTALS = [
  ['lms','lms','/lms'], ['lms','apprentice','/apprentice'], ['lms','employer','/employer'],
  ['lms','host-shop','/host-shop'], ['lms','parent-portal','/parent-portal'], ['lms','workforce','/workforce'],
  ['lms','program-holder','/program-holder'], ['lms','creator','/creator'], ['marketing','provider','/provider'],
  ['marketing','case-manager','/case-manager'], ['marketing','workforce-board','/workforce-board'],
  ['admin','instructor','/instructor'], ['admin','staff-portal','/staff-portal'],
  ['admin','testing-center','/testing-center'], ['admin','studio','/studio'],
];
let failures = 0;
const fail = (m) => { console.error(`❌ ${m}`); failures++; };
const pass = (m) => console.log(`✅ ${m}`);
const warn = (m) => console.warn(`⚠️ ${m}`);

function walk(dir, out = []) {
  let names = [];
  try { names = readdirSync(dir); } catch { return out; }
  for (const name of names) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(name)) out.push(full);
  }
  return out;
}

function routeFromFile(appRoot, file, kind) {
  let rel = relative(appRoot, file).split(sep).join('/');
  rel = rel.replace(new RegExp(`/${kind}\\.(tsx?|jsx?|ts|js)$`), '').replace(new RegExp(`^${kind}\\.(tsx?|jsx?|ts|js)$`), '');
  rel = rel.replace(/\/(page|route)$/, '');
  rel = rel.split('/').filter((part) => !(part.startsWith('(') && part.endsWith(')'))).join('/');
  return '/' + rel.replace(/^\/+|\/+$/g, '');
}

function pattern(route) {
  const escaped = route.split('/').map((part) => {
    if (!part) return '';
    if (/^\[\.\.\..+\]$/.test(part)) return '.*';
    if (/^\[\[\.\.\..+\]\]$/.test(part)) return '.*';
    if (/^\[.+\]$/.test(part)) return '[^/]+';
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('/');
  return new RegExp(`^${escaped}/?$`);
}

const routeIndex = {};
const apiIndex = {};
for (const [app, relRoot] of Object.entries(APPS)) {
  const appRoot = join(ROOT, relRoot);
  const pages = walk(appRoot).filter((f) => /\/page\.(tsx?|jsx?|js)$/.test(f));
  const apis = walk(appRoot).filter((f) => /\/route\.(tsx?|jsx?|js)$/.test(f));
  routeIndex[app] = pages.map((file) => ({ file, route: routeFromFile(appRoot, file, 'page') }));
  apiIndex[app] = apis.map((file) => ({ file, route: routeFromFile(appRoot, file, 'route') }));
}

function normalizeDynamicTarget(target) {
  return target
    .replace(/\/\$\{[^}]+\}/g, '/__dynamic__')
    .replace(/\$\{[^}]+\}/g, '');
}

function existsRoute(app, target, api = false) {
  const pathname = normalizeDynamicTarget(target.split(/[?#]/)[0] || '/');
  return (api ? apiIndex[app] : routeIndex[app]).some((entry) => pattern(entry.route).test(pathname));
}

function hasBalancedInterpolation(ref) {
  let depth = 0;
  for (let i = 0; i < ref.length; i++) {
    if (ref[i] === '$' && ref[i + 1] === '{') {
      depth++;
      i++;
    } else if (ref[i] === '}' && depth > 0) {
      depth--;
    }
  }
  return depth === 0;
}

function extract(source) {
  const refs = [];
  const regexes = [
    /(?:href|action)\s*=\s*["'`]([^"'`]+)["'`]/g,
    /(?:redirect|router\.(?:push|replace)|fetch)\(\s*["'`]([^"'`]+)["'`]/g,
  ];
  for (const re of regexes) { let m; while ((m = re.exec(source))) refs.push(m[1]); }
  return refs.filter((ref) => ref.startsWith('/') && !ref.startsWith('//') && hasBalancedInterpolation(ref));
}

console.log('\n── Portal child-route/function integrity ──');
for (const [app, name, prefix] of PORTALS) {
  const portalDir = join(ROOT, APPS[app], name);
  const files = walk(portalDir).filter((f) => /\.(tsx?|jsx?)$/.test(f));
  if (!files.length) { fail(`${app}:${prefix} has no implementation files`); continue; }
  let checked = 0;
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const refs = extract(source);
    for (const ref of refs) {
      const target = ref.split(/[?#]/)[0];
      if (target.startsWith('/api/')) {
        if (!existsRoute(app, target, true)) fail(`${relative(ROOT,file)} → missing API ${target} on ${app}`);
        checked++;
        continue;
      }
      if (target === prefix || target.startsWith(prefix + '/')) {
        if (!existsRoute(app, target, false)) fail(`${relative(ROOT,file)} → missing portal route ${target} on ${app}`);
        checked++;
      }
    }

    const redirectOnly = /export\s+default[\s\S]{0,300}redirect\(\s*['"`]/.test(source) && !/return\s*\(|return\s*</.test(source);
    if (redirectOnly && /\/(dashboard|new|create|submit)\/page\.(tsx?|jsx?)$/.test(file)) {
      warn(`${relative(ROOT,file)} is redirect-only; verify this is intentional compatibility behavior`);
    }
  }
  pass(`${app}:${prefix} scanned (${files.length} implementation files, ${checked} internal actions checked)`);
}

console.log('\n── Canonical scoped-portal guard invariants ──');
const requiredHelpers = [
  ['apps/marketing/app/provider/dashboard/page.tsx', 'requireProviderPortal'],
  ['apps/marketing/app/provider/programs/page.tsx', 'requireProviderPortal'],
  ['apps/marketing/app/provider/compliance/page.tsx', 'requireProviderPortal'],
  ['apps/marketing/app/provider/settings/page.tsx', 'requireProviderPortal'],
  ['apps/lms/app/parent-portal/dashboard/page.tsx', 'requireParentPortal'],
  ['apps/lms/app/parent-portal/student/[id]/page.tsx', 'requireParentStudentAccess'],
  ['apps/lms/app/program-holder/dashboard/page.tsx', 'requireProgramHolder'],
];
for (const [rel, helper] of requiredHelpers) {
  try {
    const source = readFileSync(join(ROOT, rel), 'utf8');
    if (!source.includes(helper)) fail(`${rel} bypasses canonical ${helper}`); else pass(`${rel} uses ${helper}`);
  } catch { fail(`${rel} missing`); }
}

if (failures) {
  console.error(`\n❌ Portal function audit FAILED — ${failures} issue(s).`);
  process.exit(1);
}
console.log('\n✅ Portal function audit PASSED.');
