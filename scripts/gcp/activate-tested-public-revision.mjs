import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const project = 'elegant-racer-299721';
const region = process.env.CANDIDATE_REGION || 'us-central1';
if (!['us-central1', 'us-east1'].includes(region)) throw Error('Unsupported public runtime region');

function gcloud(args) {
  const result = execFileSync('gcloud', [...args, '--project=' + project, '--format=json'], {
    encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.trim() ? JSON.parse(result) : {};
}

function trafficRows(state) {
  return [...(state.spec?.traffic || []), ...(state.status?.traffic || [])].map(item => ({
    ...item, revisionName: item.revisionName || (item.latestRevision ? state.status?.latestCreatedRevisionName : undefined),
  }));
}

export function unusedCandidateTags(state, exceptTag, protectedRevisions = []) {
  const rows = trafficRows(state);
  const serving = new Set(rows.filter(item => item.percent > 0).map(item => item.revisionName));
  const protectedNames = new Set(protectedRevisions);
  const tags = new Map();
  // startup-gen2 is the temporary test tag created by recover-startup-runtime.mjs.
  for (const item of rows) {
    if ((!/^c-[a-f0-9]{12}$/.test(item.tag || '') && item.tag !== 'startup-gen2') || !item.revisionName) continue;
    const revisions = tags.get(item.tag) || new Set();
    revisions.add(item.revisionName);
    tags.set(item.tag, revisions);
  }
  return [...tags].filter(([tag, revisions]) => tag !== exceptTag && revisions.size === 1 &&
    ![...revisions].some(name => serving.has(name) || protectedNames.has(name)),
  ).map(([tag]) => tag);
}

function servingTraffic(state) {
  const totals = new Map();
  for (const item of state.status?.traffic || []) {
    if (item.percent > 0) totals.set(item.revisionName, (totals.get(item.revisionName) || 0) + item.percent);
  }
  return [...totals].sort(([a], [b]) => a.localeCompare(b));
}

function assertTrafficUnchanged(before, after) {
  if (JSON.stringify(servingTraffic(before)) !== JSON.stringify(servingTraffic(after))) {
    throw Error('Serving traffic changed concurrently; activation stopped');
  }
}

export async function activateTestedRevision({
  service, revision, commit, read = gcloud, fetcher = fetch, attempts = 12,
  pause = () => new Promise(resolve => setTimeout(resolve, 2000)),
}) {
  const services = {
    'elevate-marketing-migration': 'marketing',
    'elevate-store-migration': 'store',
    'elevate-admin-migration': 'admin',
    'elevate-lms-migration': 'lms',
  };
  if (!Object.hasOwn(services, service) || !new RegExp('^' + service + '-[a-z0-9-]+$').test(revision || '') || !/^[a-f0-9]{40}$/.test(commit || '')) {
    throw Error('Exact service, revision and immutable commit required');
  }
  const metadata = read(['run', 'revisions', 'describe', revision, '--region=' + region]);
  if (!/@sha256:[a-f0-9]{64}$/.test(metadata.spec?.containers?.[0]?.image || '')) throw Error('Candidate image must be immutable');
  const describe = () => read(['run', 'services', 'describe', service, '--region=' + region]);
  const update = (...flags) => read(['run', 'services', 'update-traffic', service, '--region=' + region, ...flags, '--quiet']);
  const before = describe();
  if (servingTraffic(before).reduce((sum, [, percent]) => sum + percent, 0) !== 100) {
    throw Error('Existing serving traffic must be fully resolved before activation');
  }
  const tag = 'c-' + commit.slice(0, 12);
  // Revision-level minimum instances also run for zero-percent tagged revisions.
  // Keep images for rollback, custom tags, serving/requested traffic, and a newer
  // release's latest revision. Ambiguous spec/status mappings are never removed.
  const obsoleteTags = unusedCandidateTags(before, tag, [revision, before.status?.latestCreatedRevisionName]);
  const releaseFailedTag = () => {
    const current = describe();
    const mappings = trafficRows(current).filter(item => item.tag === tag);
    if (mappings.length && mappings.every(item => item.revisionName === revision) && unusedCandidateTags(current).includes(tag)) {
      update('--remove-tags=' + tag);
      assertTrafficUnchanged(current, describe());
    }
  };
  try {
    // A pinned latest-ready revision is not proof that this exact candidate works.
    update(...(obsoleteTags.length ? ['--remove-tags=' + obsoleteTags.join(',')] : []), '--update-tags=' + tag + '=' + revision);
    const tagged = describe();
    assertTrafficUnchanged(before, tagged);
    const candidate = tagged.status?.traffic?.find(item => item.tag === tag && item.revisionName === revision);
    if (!candidate?.url || new URL(candidate.url).protocol !== 'https:' || !new URL(candidate.url).hostname.endsWith('.run.app')) {
      throw Error('Google candidate URL unavailable; public traffic unchanged');
    }
    let passed = false;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await fetcher(candidate.url + '/api/health', {
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        });
        const state = await response.json();
        if (response.ok && state && typeof state === 'object') {
          const actual = state.commitSha || state.commit || state.sha;
          if (actual !== commit) throw Error('Candidate served wrong immutable commit');
          if (state.revision === revision && state.service === services[service] && state.healthy === true && state.ready === true &&
              state.configuration?.ok === true && state.dependencies?.supabase?.ok === true) {
            passed = true;
            break;
          }
        }
      } catch (error) {
        if (error.message === 'Candidate served wrong immutable commit') throw error;
      }
      if (attempt + 1 < attempts) await pause();
    }
    if (!passed) throw Error('Exact candidate failed runtime health; public traffic unchanged');
    const current = describe();
    assertTrafficUnchanged(before, current);
    if (current.status?.latestCreatedRevisionName !== before.status?.latestCreatedRevisionName) {
      throw Error('Newer revision created concurrently; activation stopped');
    }
    update('--to-revisions=' + revision + '=100');
    const after = describe();
    if (JSON.stringify(servingTraffic(after)) !== JSON.stringify([[revision, 100]])) {
      throw Error('Exact candidate traffic assignment not confirmed');
    }
    // After verified promotion, the formerly serving generated/startup test tag
    // can be released without deleting its rollback revision.
    const retiredTags = unusedCandidateTags(after, tag, [after.status?.latestCreatedRevisionName]);
    if (retiredTags.length) {
      update('--remove-tags=' + retiredTags.join(','));
      assertTrafficUnchanged(after, describe());
    }
    return { service, revision, commit, candidateUrl: candidate.url, candidateHealthy: true, traffic: 100,
      retiredCandidateTags: [...new Set([...obsoleteTags, ...retiredTags])] };
  } catch (error) {
    // Cloud Run can apply the tag even when the command subsequently reports a
    // startup/quota failure. Read it back and release only our non-serving tag.
    try { releaseFailedTag(); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], error.message + '; candidate tag cleanup also needs retry');
    }
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await activateTestedRevision({
    service: process.env.CANDIDATE_SERVICE || 'elevate-marketing-migration',
    revision: process.env.CANDIDATE_REVISION,
    commit: process.env.IMAGE_SHA || process.env.GITHUB_SHA,
  })));
}
