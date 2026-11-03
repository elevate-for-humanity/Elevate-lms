export function infrastructureRepairPath(path) {
  return /^(?:\.github\/workflows\/[\w-]+\.ya?ml|Dockerfile\.(?:admin|lms|marketing)|scripts\/gcp\/[\w-]+\.(?:mjs|py))$/.test(path);
}

export const STORE_REPAIR_DEPLOYMENT = {
  name: 'Deploy Google Store runtime identity',
  workflow: 'deploy-google-store-runtime.yml',
};

export function assertDeploymentInvariants(before, after) {
  const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  for (const key of ['on', 'permissions']) {
    if (!equal(before[key], after[key])) throw Error('Protected workflow ' + key + ' changed');
  }
  const steps = Object.values(after.jobs ?? {}).flatMap(job => job.steps ?? []);
  for (const [name, job] of Object.entries(before.jobs ?? {})) {
    const next = after.jobs?.[name];
    if (!next) throw Error('Existing deployment job removed: ' + name);
    if (job.name === 'CI Required Gate' && !equal(job, next)) throw Error('CI Required Gate must remain independently enforced');
    for (const key of ['permissions', 'environment', 'if', 'concurrency']) {
      if (!equal(job[key], next[key])) throw Error('Protected job ' + key + ' changed: ' + name);
    }
    const needs = value => value ? (Array.isArray(value) ? value : [value]) : [];
    if (needs(job.needs).some(value => !needs(next.needs).includes(value))) throw Error('Required deployment dependency removed');
    for (const step of job.steps ?? []) {
      const command = step.run ?? '';
      const protectedStep = !/docker build/.test(command) || /docker push|preflight-|smoke-|verify-|activate-|gcloud/.test(command);
      if (protectedStep && !steps.some(candidate => equal(step, candidate))) throw Error('Required release check changed: ' + (step.name ?? step.uses));
    }
  }
}

export async function openInfrastructureRepair({ candidate, repairId, github, graphql }) {
  const head = await github('/git/ref/heads/' + encodeURIComponent(candidate.branch.name));
  if (head.object?.sha !== candidate.branch.sha) throw Error('REPAIR_CANDIDATE_CHANGED_AFTER_VALIDATION');
  const existing = await github('/pulls?state=all&head=elevate-for-humanity:' + encodeURIComponent(candidate.branch.name));
  let pr = existing.find(item => item.base?.ref === 'main' && item.head?.sha === candidate.branch.sha);
  if (!pr) pr = await github('/pulls', {
    method: 'POST',
    body: JSON.stringify({
      base: 'main', head: candidate.branch.name,
      title: 'PARIS deployment repair ' + repairId.slice(0, 8),
      body: candidate.summary || 'Owner-authorized infrastructure repair. Independent repair validation passed. Require protected repository CI and verified Google deployment before completion.',
    }),
  });
  if (pr.state !== 'open' && !pr.merged_at) throw Error('REPAIR_PULL_REQUEST_CLOSED');
  if (pr.state === 'open') await graphql({
    query: 'mutation($id:ID!){enablePullRequestAutoMerge(input:{pullRequestId:$id,mergeMethod:SQUASH}){pullRequest{number}}}',
    variables: { id: pr.node_id },
  });
  return { number: pr.number, url: pr.html_url, headSha: candidate.branch.sha };
}

export function infrastructureMergeEvidence(pr, expectedHead) {
  if (pr.base?.ref !== 'main' || pr.head?.sha !== expectedHead) throw Error('REPAIR_PULL_REQUEST_CHANGED');
  if (pr.merged === true && /^[a-f0-9]{40}$/.test(pr.merge_commit_sha ?? '')) return pr.merge_commit_sha;
  if (pr.state === 'closed') throw Error('REPAIR_PULL_REQUEST_CLOSED');
  return null;
}
