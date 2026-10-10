import { execFileSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { components, domains, evaluateRevision, evaluateApplication, result } from './verify-cutover-state.mjs';
import { verifyDns, verifyTls, verifyGoogleRouting } from './verify-production-dns.mjs';

const project = 'elegant-racer-299721';
const read = args => JSON.parse(execFileSync('gcloud', [...args, '--project=' + project, '--format=json'], {
  encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
}));
const safeFailure = name => ({ name, status: 'BLOCKED', evidence: { reason: 'required_runtime_read_unavailable' } });

async function probe(base, path, surface, token) {
  let url = new URL(path, base);
  url.searchParams.set('acceptance', String(Date.now()));
  for (let hop = 0; hop < 5; hop++) {
    const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache, no-store', ...(token ? { 'X-Serverless-Authorization': 'Bearer ' + token } : {}) }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = new URL(response.headers.get('location') || '', url);
      const canonicalApex = url.hostname === 'elevateforhumanity.org' && next.hostname === 'www.elevateforhumanity.org' && [301, 308].includes(response.status);
      const pageRedirect = (path === '/' || path === '/store') && next.origin === url.origin;
      if (next.protocol !== 'https:' || next.username || next.password || (!canonicalApex && !pageRedirect)) return { surface, path, status: response.status, body: {} };
      // An apex canonical redirect must preserve health endpoint identity.
      if (canonicalApex && next.pathname !== url.pathname) return { surface, path, status: response.status, body: {} };
      await response.body?.cancel(); url = next; continue;
    }
    const body = path.startsWith('/api/') ? await response.json().catch(() => ({})) : {};
    if (!path.startsWith('/api/')) await response.body?.cancel();
    return { surface, path, status: response.status, body };
  }
  return { surface, path, status: 0, body: {} };
}

export async function main() {
  const component = process.env.COMPONENT;
  if (!components.includes(component)) throw new Error('Unknown component');
  const expectedCommit = process.env.EXPECTED_COMPONENT === component ? process.env.EXPECTED_COMMIT : '';
  if (expectedCommit && !/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error('Invalid expected commit');
  const report = { component, checkedAt: new Date().toISOString(), checks: [] };
  const add = check => { report.checks.push(check); console.log(JSON.stringify({ component, ...check })); };
  const serviceName = `elevate-${component}-migration`;
  let service, revision;
  try {
    service = read(['run', 'services', 'describe', serviceName, '--region=us-central1']);
    const selected = service.status?.latestCreatedRevisionName;
    if (!selected?.startsWith(serviceName + '-') || !/^[a-z0-9-]+$/.test(selected)) throw new Error('Selected revision missing');
    revision = read(['run', 'revisions', 'describe', selected, '--region=us-central1']);
    evaluateRevision(component, service, revision).forEach(add);
  } catch {
    for (const name of ['SERVICE_READY', 'REVISION_READY', 'DEPLOYMENT_CURRENT', 'TRAFFIC_CORRECT', 'STARTUP_HEALTHY', 'IMAGE_DIGEST_VERIFIED', 'REVISION_IDENTITY_VERIFIED']) if (!report.checks.some(c => c.name === name)) add(safeFailure(name));
  }

  const probes = [];
  // Inspect public behavior even when revision metadata is unavailable or failed.
  const googleBase = `https://${serviceName}-aabnh2y32a-uc.a.run.app`;
  const targets = [{ surface: 'google', base: googleBase, token: process.env.TOKEN }, ...domains[component].map(host => ({ surface: host, base: 'https://' + host }))];
  for (const target of targets) {
    for (const path of ['/api/health', '/api/ready', component === 'store' ? '/store' : '/']) {
      try { probes.push(await probe(target.base, path, target.surface, target.token)); }
      catch { probes.push({ surface: target.surface, path, status: 0, body: {} }); }
    }
  }
  let commitImage;
  const commit = probes.find(p => p.surface === 'google' && p.path === '/api/health')?.body?.commit;
  if (/^[a-f0-9]{40}$/.test(commit ?? '')) {
    try { commitImage = read(['artifacts', 'docker', 'images', 'describe', `us-central1-docker.pkg.dev/${project}/elevate/${component}:${commit}`]).image_summary?.fully_qualified_digest; }
    catch { /* Missing provenance fails DEPLOYED_COMMIT_VERIFIED below. */ }
  }
  evaluateApplication(component, probes, revision?.spec?.containers?.[0]?.image, commitImage, expectedCommit).forEach(add);

  let routing;
  try { routing = verifyGoogleRouting(component, domains[component], read); add(result('DOMAIN_ROUTING_VERIFIED', routing.passed, routing)); }
  catch { add(safeFailure('DOMAIN_ROUTING_VERIFIED')); }
  const dns = [], tlsResults = [];
  for (const host of domains[component]) {
    try { dns.push(verifyDns(host, routing?.addresses ?? [])); } catch { dns.push({ host, passed: false, unavailable: true }); }
    tlsResults.push(await verifyTls(host));
  }
  add({ ...result('DNS_VERIFIED', dns.every(d => d.passed), { domains: dns }), ...(dns.some(d => d.unavailable) ? { status: 'BLOCKED' } : {}) });
  add(result('TLS_VERIFIED', tlsResults.every(t => t.passed), { domains: tlsResults }));
  if (service && revision) {
    try {
      const after = read(['run', 'services', 'describe', serviceName, '--region=us-central1']);
      add(result('SNAPSHOT_CURRENT', after.status?.latestCreatedRevisionName === revision.metadata.name &&
        after.metadata?.generation === service.metadata?.generation && JSON.stringify(after.status?.traffic) === JSON.stringify(service.status?.traffic),
      { startGeneration: service.metadata?.generation, endGeneration: after.metadata?.generation, endCreated: after.status?.latestCreatedRevisionName }));
    } catch { add(safeFailure('SNAPSHOT_CURRENT')); }
  } else add(safeFailure('SNAPSHOT_CURRENT'));
  report.status = report.checks.some(c => c.status === 'FAIL') ? 'FAIL' : report.checks.some(c => c.status !== 'PASS') ? 'BLOCKED' : 'PASS';
  writeFileSync(`google-cutover-${component}.json`, JSON.stringify(report, null, 2), { mode: 0o600 });
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `\n### ${component}: ${report.status}\n\n| Check | Result |\n|---|---|\n` + report.checks.map(c => `| ${c.name} | ${c.status} |`).join('\n') + '\n');
  if (report.status !== 'PASS') process.exitCode = 1;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error('Cutover verifier could not complete; production readiness is BLOCKED.'); process.exitCode = 1; });
