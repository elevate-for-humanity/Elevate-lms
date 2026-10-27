import { google } from './runtime-config.mjs';
import { cleanupUnusedCandidateTags } from './activate-tested-public-revision.mjs';

const service = process.env.CANDIDATE_SERVICE || 'elevate-admin-migration';
const result = await cleanupUnusedCandidateTags({
  service,
  read: args => {
    const output = google([...args, '--project=elegant-racer-299721', '--format=json']);
    return output.trim() ? JSON.parse(output) : {};
  },
});
console.log(JSON.stringify({ ...result, revisionArtifactsPreserved: true }));
