#!/usr/bin/env node
/**
 * Audit lazy dashboard panel API dependencies.
 * Usage: node scripts/audit-dashboard-panels.mjs [baseUrl]
 * Default baseUrl: http://localhost:3001 (admin dev server)
 */
const base = (process.argv[2] || process.env.ADMIN_BASE_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

const panels = [
  {
    panel: 'PublishWebsitePanel',
    method: 'GET',
    path: '/api/admin/publish-website',
    expectUnauth: [307, 401, 403],
  },
  {
    panel: 'ProgramIntegrityPanel',
    method: 'GET',
    path: '/api/admin/program-integrity?limit=12&min=60',
    expectUnauth: [307, 401, 403],
  },
  {
    panel: 'JobBoardPanel',
    method: 'GET',
    path: '/api/jobs/government-feed',
    expectUnauth: [200, 307, 401, 403],
    note: 'Must exist on admin host (not 404)',
  },
  {
    panel: 'LizzyContainer',
    method: 'GET',
    path: '/api/admin/dev-studio/config',
    expectUnauth: [307, 401, 403],
  },
  {
    panel: 'LizzyWorkspace health',
    method: 'GET',
    path: '/api/admin/dev-studio/health',
    expectUnauth: [200, 307, 401, 403],
  },
];

async function probe({ panel, method, path, expectUnauth, note }) {
  const url = `${base}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method, redirect: 'manual' });
    const ms = Date.now() - t0;
    const ok =
      expectUnauth.includes(res.status) ||
      (res.status === 404 && panel === 'JobBoardPanel' ? false : res.ok);
    const flag = ok ? 'ok ' : 'FAIL';
    console.log(
      `${String(ms).padStart(5)}ms  ${flag}  ${panel.padEnd(22)}  ${res.status}  ${path}${note ? `  (${note})` : ''}`,
    );
    return ok;
  } catch (e) {
    console.log(`${String(Date.now() - t0).padStart(5)}ms  ERR   ${panel.padEnd(22)}  ${e.message}`);
    return false;
  }
}

console.log(`Dashboard panel API audit — ${base}\n`);
let passed = 0;
for (const p of panels) {
  if (await probe(p)) passed++;
}
console.log(`\n${passed}/${panels.length} panels reachable (unauthenticated probe)`);
