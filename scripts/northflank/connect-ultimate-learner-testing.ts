#!/usr/bin/env tsx
/** Extend the existing Studio Browser; never provision a second browser service. */
import { randomBytes } from 'node:crypto';
import { combinedServicePatchPath, nfFetch, projectApiPath, resolveProjectId } from './lib';
const projectId = resolveProjectId();
if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID required');
type Service = { runtimeEnvironment?: Record<string,string>; ports?: Array<{ dns?: string }> };
const ids = ['elevate-studio-browser', 'elevate-lms', 'elevate-ultimate-worker'];
const services = await Promise.all(ids.map(id => nfFetch<Service>(projectApiPath(projectId, `/services/${id}`))));
const domain = services[0].ports?.find(p => p.dns)?.dns;
if (!domain) throw new Error('Existing Studio Browser domain required');
const browserUrl = `https://${domain}`;
// Recover the same credential from an existing connected service if one config is missing.
// Generate only during first setup; never rotate a connected account on redeploy.
const secret = services.map(service => service.runtimeEnvironment?.ULTIMATE_LEARNER_RUNTHROUGH_SECRET)
  .find(value => typeof value === 'string' && value.length > 0) || randomBytes(32).toString('base64url');
const patches = [
  { ULTIMATE_LEARNER_RUNTHROUGH_SECRET: secret, STUDIO_LEARNER_LMS_URL: 'https://app.elevateforhumanity.org' },
  { ULTIMATE_LEARNER_RUNTHROUGH_SECRET: secret },
  { ULTIMATE_LEARNER_RUNTHROUGH_SECRET: secret, ULTIMATE_LEARNER_RUNTHROUGH_URL: `${browserUrl}/learner/runthrough` },
];
for (let i=0;i<ids.length;i++) {
  const current = services[i].runtimeEnvironment ?? {};
  if (Object.entries(patches[i]).every(([key,value]) => current[key]===value)) continue;
  await nfFetch(combinedServicePatchPath(projectId,ids[i]), { method:'PATCH', body:JSON.stringify({ runtimeEnvironment:{...current,...patches[i]} }) });
  console.log(`Learner testing configuration connected to ${ids[i]}; credential kept private`);
}
if (process.argv.includes('--configure-only')) process.exit(0);
const health = await fetch(`${browserUrl}/learner/health`, { headers:{ authorization:`Bearer ${secret}` }, signal:AbortSignal.timeout(20000) });
if (!health.ok) throw new Error(`Learner testing deployment not yet ready: ${health.status}. Configuration retained for deployment verification.`);
console.log('Existing browser authenticated learner-test connection verified');
