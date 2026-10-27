import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const shaPattern = /^[a-f0-9]{40}$/;
export function resolveMainRelease({ ref, current, requested, latest }) {
  if (ref !== 'refs/heads/main') throw new Error('Production releases require main');
  if (
    ![current, latest].every((value) => shaPattern.test(value || '')) ||
    (requested && !shaPattern.test(requested))
  )
    throw new Error('Invalid release SHA');
  // A queued dispatch may start after main has advanced. Hand off once using
  // the observed main SHA; never build a mismatched or superseded revision.
  const ready = current === latest && (!requested || requested === current);
  return { ready, successor: ready ? null : latest };
}

export function run(env = process.env) {
  const repository = env.GITHUB_REPOSITORY;
  const workflow = env.RELEASE_WORKFLOW;
  if (
    repository !== 'elevate-for-humanity/Elevate-lms' ||
    !['deploy-google-lms-trigger.yml', 'deploy-google-store-runtime.yml'].includes(workflow)
  ) {
    throw new Error('Unsupported release handoff');
  }
  const api = (args) =>
    execFileSync('gh', ['api', ...args], { encoding: 'utf8', timeout: 20000 }).trim();
  const latest = api([`repos/${repository}/git/ref/heads/main`, '--jq', '.object.sha']);
  const result = resolveMainRelease({
    ref: env.GITHUB_REF,
    current: env.GITHUB_SHA,
    requested: env.REQUESTED_SHA,
    latest,
  });
  if (result.successor) {
    // A docs-only main update may not trigger a replacement build. Explicitly
    // hand off to current main rather than failing or deploying the old SHA.
    api([
      '--method',
      'POST',
      `repos/${repository}/actions/workflows/${workflow}/dispatches`,
      '-f',
      'ref=main',
      '-f',
      `inputs[requested_sha]=${result.successor}`,
    ]);
    console.log(
      `Superseded release handed off to main ${result.successor}; this run will not deploy.`,
    );
  }
  appendFileSync(env.GITHUB_OUTPUT, `ready=${result.ready}\n`);
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
