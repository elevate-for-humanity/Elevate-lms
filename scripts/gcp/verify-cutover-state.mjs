import { healthPassed } from './audit-runtime-parity.mjs';

export const components = ['marketing', 'admin', 'lms', 'store'];
export const domains = {
  marketing: ['www.elevateforhumanity.org', 'elevateforhumanity.org'],
  admin: ['admin.elevateforhumanity.org'], lms: ['app.elevateforhumanity.org'],
  store: ['store.elevateforhumanity.org'],
};
export const condition = (resource, name) => resource?.status?.conditions?.find(c => c.type === name)?.status === 'True';
const currentGeneration = r => Number.isInteger(Number(r?.metadata?.generation)) &&
  Number(r?.metadata?.generation) > 0 && Number(r?.status?.observedGeneration) >= Number(r.metadata.generation);
const digestPattern = /@sha256:[a-f0-9]{64}$/;
export const result = (name, ok, evidence) => ({ name, status: ok ? 'PASS' : 'FAIL', evidence });

// This evaluator never substitutes service Ready for revision Ready. The selected
// revision is latestCreated, including when it failed and an older image serves.
export function evaluateRevision(component, service, revision) {
  if (!components.includes(component)) throw new Error('Unknown component');
  const selected = service?.status?.latestCreatedRevisionName;
  const ready = service?.status?.latestReadyRevisionName;
  const name = revision?.metadata?.name;
  const expectedService = `elevate-${component}-migration`;
  const container = revision?.spec?.containers?.[0];
  const image = container?.image ?? '';
  const resolvedImage = revision?.status?.imageDigest ?? '';
  const traffic = (service?.status?.traffic ?? []).filter(t => Number(t.percent) > 0);
  const selectedTraffic = traffic.filter(t => t.revisionName === selected).reduce((n, t) => n + Number(t.percent), 0);
  const conditions = (revision?.status?.conditions ?? []).map(({ type, status, reason }) => ({ type, status, reason }));
  return [
    result('SERVICE_READY', condition(service, 'Ready') && currentGeneration(service), { service: service?.metadata?.name, observedGeneration: service?.status?.observedGeneration, generation: service?.metadata?.generation }),
    result('REVISION_READY', name === selected && condition(revision, 'Ready') && currentGeneration(revision), { selected, conditions }),
    result('DEPLOYMENT_CURRENT', Boolean(selected) && selected === ready && name === selected, { latestCreated: selected, latestReady: ready }),
    result('TRAFFIC_CORRECT', Boolean(selected) && selectedTraffic === 100 && traffic.every(t => t.revisionName === selected) && condition(revision, 'Active'), { selected, traffic, selectedTraffic }),
    result('STARTUP_HEALTHY', condition(revision, 'ContainerHealthy') && condition(revision, 'ResourcesAvailable') &&
      container?.startupProbe?.httpGet?.path === '/api/ping' && container?.livenessProbe?.httpGet?.path === '/api/ping',
    { conditions, startupProbe: container?.startupProbe, livenessProbe: container?.livenessProbe }),
    result('IMAGE_DIGEST_VERIFIED', digestPattern.test(image) && image.startsWith(`us-central1-docker.pkg.dev/elegant-racer-299721/elevate/${component}@`) && image === resolvedImage,
      { image, resolvedImage }),
    result('REVISION_IDENTITY_VERIFIED', service?.metadata?.name === expectedService &&
      revision?.metadata?.labels?.['serving.knative.dev/service'] === expectedService && revision?.spec?.containers?.length === 1,
    { service: service?.metadata?.name, revisionService: revision?.metadata?.labels?.['serving.knative.dev/service'], runtimeIdentity: revision?.spec?.serviceAccountName }),
  ];
}

export function evaluateApplication(component, probes, revisionImage, commitImage, expectedCommit = '') {
  const direct = probes.find(p => p.surface === 'google' && p.path === '/api/health');
  const health = probes.filter(p => p.path === '/api/health');
  const readiness = probes.filter(p => p.path === '/api/ready');
  const commit = direct?.body?.commit;
  const shaValid = /^[a-f0-9]{40}$/.test(commit ?? '');
  const expectedCount = domains[component].length + 1; // Google URL and each public host (apex checked through canonical redirect).
  const allPresent = health.length === expectedCount && readiness.length === expectedCount;
  return [
    result('APPLICATION_IDENTITY_VERIFIED', allPresent && [...health, ...readiness].every(p => p.body?.service === component),
      { expected: component, observed: [...health, ...readiness].map(p => ({ surface: p.surface, service: p.body?.service })) }),
    result('SUPABASE_CONNECTED', health.length === expectedCount && health.every(p => p.status === 200 && p.body?.dependencies?.supabase?.ok === true),
      { results: health.map(p => ({ surface: p.surface, connected: p.body?.dependencies?.supabase?.ok === true })) }),
    result('PUBLIC_HEALTHY', allPresent && probes.every(p => p.path === '/' || p.path === '/store'
      ? p.status === 200 : healthPassed(component, p.path, p.status, p.body)),
    { results: probes.map(p => ({ surface: p.surface, path: p.path, status: p.status })) }),
    result('DEPLOYED_COMMIT_VERIFIED', allPresent && shaValid && digestPattern.test(revisionImage ?? '') &&
      commitImage === revisionImage && health.every(p => p.body?.commit === commit) && readiness.every(p => p.body?.commit === commit) && (!expectedCommit || commit === expectedCommit),
    { directCommit: commit, expectedCommit: expectedCommit || undefined, publicCommits: health.filter(p => p.surface !== 'google').map(p => ({ surface: p.surface, commit: p.body?.commit })), revisionImage, commitImage }),
  ];
}
