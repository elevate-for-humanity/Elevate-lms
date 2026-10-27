import { google } from './runtime-config.mjs';
import { pathToFileURL } from 'node:url';

export async function waitForReadyRevision({ revision, read = google, attempts = 40,
  pause = () => new Promise(resolve => setTimeout(resolve, 15000)) }) {
  if (!/^elevate-marketing-migration-[a-z0-9-]+$/.test(revision || '')) {
    throw new Error('Exact Marketing revision required');
  }
  let state = 'not_created';
  for (let attempt = 0; attempt < attempts; attempt++) {
    let metadata;
    try {
      metadata = JSON.parse(read(['run', 'revisions', 'describe', revision,
        '--project=elegant-racer-299721', '--region=us-central1', '--format=json']));
    } catch (error) {
      if (error.code !== 'not_found') throw error;
    }
    if (metadata) {
      state = metadata.status?.conditions?.find(condition => condition.type === 'Ready')?.status || 'Unknown';
      if (state === 'True') return { revision, ready: true };
    }
    if (attempt + 1 < attempts) await pause();
  }
  throw new Error(`Exact Marketing revision readiness timed out: ${revision} (${state})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await waitForReadyRevision({ revision: process.env.CANDIDATE_REVISION })));
}
